-- 0. Add RLS Policies for existing tables safely
ALTER TABLE public.installment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_contracts' AND policyname = 'Enable ALL for authenticated users') THEN
    CREATE POLICY "Enable ALL for authenticated users" ON public.installment_contracts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_payments' AND policyname = 'Enable ALL for authenticated users') THEN
    CREATE POLICY "Enable ALL for authenticated users" ON public.installment_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_partial_payments' AND policyname = 'Enable ALL for authenticated users') THEN
    CREATE POLICY "Enable ALL for authenticated users" ON public.installment_partial_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_audit_logs' AND policyname = 'Enable ALL for authenticated users') THEN
    CREATE POLICY "Enable ALL for authenticated users" ON public.installment_audit_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 1. ALTER EXISTING TABLES
-- 1.1 ALTER clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS national_id     TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_name  TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_phone TEXT,
  ADD COLUMN IF NOT EXISTS risk_score      INTEGER NOT NULL DEFAULT 100
    CHECK (risk_score BETWEEN 0 AND 100);

-- 1.2 ALTER Devices
ALTER TABLE public."Devices"
  ADD COLUMN IF NOT EXISTS is_locked_for_installment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_contract_id   UUID; -- Will add FK after contracts if needed, assuming uuid or bigint depending on actual type

-- Assuming installment_contracts has UUID primary key as per your prompt
-- ALTER TABLE public."Devices" ADD CONSTRAINT fk_device_installment FOREIGN KEY (installment_contract_id) REFERENCES public.installment_contracts(id);

-- 1.3 ALTER installment_contracts
ALTER TABLE public.installment_contracts
  ADD COLUMN IF NOT EXISTS invoice_id         BIGINT REFERENCES public."Sales_Invoices"(id),
  ADD COLUMN IF NOT EXISTS wallet_id          INTEGER REFERENCES public.wallets(id),
  ADD COLUMN IF NOT EXISTS rescheduled_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_by       UUID REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS items_snapshot     JSONB,
  ADD COLUMN IF NOT EXISTS feature_enabled    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.installment_contracts DROP CONSTRAINT IF EXISTS installment_contracts_status_check;
ALTER TABLE public.installment_contracts ADD CONSTRAINT installment_contracts_status_check
  CHECK (status IN ('draft','active','overdue','rescheduled','completed','defaulted'));

-- 1.4 ALTER installment_payments
ALTER TABLE public.installment_payments
  ADD COLUMN IF NOT EXISTS idempotency_key       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS treasury_tx_id        INTEGER REFERENCES public.treasury_transactions(id),
  ADD COLUMN IF NOT EXISTS rescheduled_from      UUID REFERENCES public.installment_payments(id),
  ADD COLUMN IF NOT EXISTS wallet_id             INTEGER REFERENCES public.wallets(id);

ALTER TABLE public.installment_payments DROP CONSTRAINT IF EXISTS installment_payments_status_check;
ALTER TABLE public.installment_payments ADD CONSTRAINT installment_payments_status_check
  CHECK (status IN ('pending','partial','paid','overdue','waived'));

-- ============================================================================

-- 2. CREATE NEW TABLES
-- 2.1 installment_partial_payments
CREATE TABLE IF NOT EXISTS public.installment_partial_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       UUID NOT NULL REFERENCES public.installment_payments(id) ON DELETE CASCADE,
  amount           NUMERIC NOT NULL CHECK (amount > 0),
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_by     UUID REFERENCES public.employees(id),
  wallet_id        INTEGER REFERENCES public.wallets(id),
  treasury_tx_id   INTEGER REFERENCES public.treasury_transactions(id),
  receipt_url      TEXT,
  idempotency_key  TEXT UNIQUE NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.installment_partial_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_access" ON public.installment_partial_payments
  FOR ALL USING (auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS idx_partial_payments_payment_id
  ON public.installment_partial_payments(payment_id);

-- 2.2 installment_audit_logs
CREATE TABLE IF NOT EXISTS public.installment_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID REFERENCES public.installment_contracts(id),
  payment_id    UUID REFERENCES public.installment_payments(id),
  performed_by  UUID REFERENCES public.employees(id),
  action        TEXT NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.installment_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_only" ON public.installment_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "read_authenticated" ON public.installment_audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS idx_audit_contract_id
  ON public.installment_audit_logs(contract_id);

-- 2.3 feature_flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key  TEXT NOT NULL,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  scope        TEXT NOT NULL DEFAULT 'global',
  scope_value  TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feature_key, scope, scope_value)
);

INSERT INTO public.feature_flags (feature_key, is_enabled, scope, description)
VALUES ('installment_system', true, 'global', 'نظام التقسيط — مفعّل لكل المستخدمين')
ON CONFLICT (feature_key, scope, scope_value) DO NOTHING;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_authenticated" ON public.feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "owner_manage" ON public.feature_flags
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================

-- 3. CREATE FUNCTIONS & TRIGGERS
-- 3.1 get_installment_remaining
CREATE OR REPLACE FUNCTION public.get_installment_remaining(p_contract_id UUID)
RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    c.total_price
    - c.down_payment
    - COALESCE((
        SELECT SUM(pp.amount)
        FROM public.installment_partial_payments pp
        JOIN public.installment_payments ip ON ip.id = pp.payment_id
        WHERE ip.contract_id = p_contract_id
      ), 0)
  FROM public.installment_contracts c
  WHERE c.id = p_contract_id
$$;

-- 3.2 check_installment_feature_enabled
CREATE OR REPLACE FUNCTION public.check_installment_feature_enabled(
  p_user_id UUID DEFAULT NULL,
  p_role    TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.feature_flags
     WHERE feature_key = 'installment_system' AND scope = 'user' AND scope_value = p_user_id::TEXT
     LIMIT 1),
    (SELECT is_enabled FROM public.feature_flags
     WHERE feature_key = 'installment_system' AND scope = 'role' AND scope_value = p_role
     LIMIT 1),
    (SELECT is_enabled FROM public.feature_flags
     WHERE feature_key = 'installment_system' AND scope = 'global'
     LIMIT 1),
    true
  )
$$;

-- 3.3 enforce_installment_state_machine
CREATE OR REPLACE FUNCTION public.enforce_installment_state_machine()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'completed' THEN
    RAISE EXCEPTION 'CONTRACT_LOCKED: لا يمكن تعديل عقد مكتمل [%]', OLD.id;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND NOT (
    (OLD.status = 'draft'       AND NEW.status IN ('active','defaulted'))     OR
    (OLD.status = 'active'      AND NEW.status IN ('overdue','completed','defaulted')) OR
    (OLD.status = 'overdue'     AND NEW.status IN ('active','rescheduled','defaulted','completed')) OR
    (OLD.status = 'rescheduled' AND NEW.status IN ('active','overdue','completed')) OR
    (OLD.status = 'defaulted'   AND NEW.status = 'active')
  ) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: % → % غير مسموح للعقد [%]',
      OLD.status, NEW.status, OLD.id;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_state_machine_guard ON public.installment_contracts;
CREATE TRIGGER contract_state_machine_guard
  BEFORE UPDATE ON public.installment_contracts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_installment_state_machine();

-- 3.4 process_installment_payment
CREATE OR REPLACE FUNCTION public.process_installment_payment(
  p_payment_id       UUID,
  p_amount           NUMERIC,
  p_employee_id      UUID,
  p_wallet_id        INTEGER,
  p_idempotency_key  TEXT,
  p_receipt_url      TEXT DEFAULT NULL,
  p_notes            TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_payment     public.installment_payments%ROWTYPE;
  v_contract    public.installment_contracts%ROWTYPE;
  v_paid_so_far NUMERIC;
  v_penalty     NUMERIC;
  v_days_late   INTEGER;
  v_new_status  TEXT;
  v_tx_id       INTEGER;
BEGIN
  SELECT * INTO v_payment
  FROM public.installment_payments
  WHERE id = p_payment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'PAYMENT_NOT_FOUND');
  END IF;

  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_paid');
  END IF;

  SELECT * INTO v_contract
  FROM public.installment_contracts
  WHERE id = v_payment.contract_id;

  v_days_late := GREATEST(0, CURRENT_DATE - v_payment.due_date);
  IF v_days_late > COALESCE(v_contract.penalty_grace_days, 0) THEN
    v_penalty := (v_days_late - COALESCE(v_contract.penalty_grace_days, 0)) * COALESCE(v_contract.penalty_per_day, 0);
  ELSE
    v_penalty := 0;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid_so_far
  FROM public.installment_partial_payments
  WHERE payment_id = p_payment_id;

  INSERT INTO public.installment_partial_payments
    (payment_id, amount, collected_by, wallet_id, receipt_url, idempotency_key, notes)
  VALUES
    (p_payment_id, p_amount, p_employee_id, p_wallet_id, p_receipt_url, p_idempotency_key, p_notes)
  ON CONFLICT (idempotency_key) DO NOTHING;

  INSERT INTO public.treasury_transactions
    (wallet_id, type, amount, category, description, user_id)
  VALUES (
    p_wallet_id, 'in', p_amount,
    CASE WHEN v_penalty > 0 THEN 'installment_penalty' ELSE 'installment_collection' END,
    'تحصيل قسط رقم ' || v_payment.installment_no || ' — عقد ' || v_contract.id,
    p_employee_id
  )
  RETURNING id INTO v_tx_id;

  UPDATE public.installment_payments
  SET penalty_amount   = v_penalty,
      treasury_tx_id   = v_tx_id,
      wallet_id        = p_wallet_id
  WHERE id = p_payment_id;

  v_paid_so_far := v_paid_so_far + p_amount;
  IF v_paid_so_far >= (v_payment.due_amount + v_penalty) THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE public.installment_payments
  SET status       = v_new_status,
      paid_amount  = v_paid_so_far,
      paid_date    = CURRENT_DATE,
      collected_by = p_employee_id
  WHERE id = p_payment_id;

  PERFORM public.update_client_risk_score(v_contract.client_id, v_days_late);

  INSERT INTO public.installment_audit_logs
    (contract_id, payment_id, performed_by, action, new_value)
  VALUES (
    v_contract.id, p_payment_id, p_employee_id,
    CASE v_new_status WHEN 'paid' THEN 'payment_received' ELSE 'partial_payment' END,
    jsonb_build_object('amount', p_amount, 'status', v_new_status, 'days_late', v_days_late)
  );

  IF public.get_installment_remaining(v_contract.id) <= 0 THEN
    UPDATE public.installment_contracts
    SET status       = 'completed',
        closed_at    = now(),
        completed_by = p_employee_id
    WHERE id = v_contract.id;

    UPDATE public."Devices"
    SET is_locked_for_installment  = false,
        installment_contract_id    = NULL,
        status                     = 'available'
    WHERE installment_contract_id = v_contract.id;
  END IF;

  RETURN jsonb_build_object(
    'status',          v_new_status,
    'paid_amount',     v_paid_so_far,
    'remaining_contract', public.get_installment_remaining(v_contract.id),
    'treasury_tx_id',  v_tx_id
  );
END;
$$;

-- 3.5 update_client_risk_score
CREATE OR REPLACE FUNCTION public.update_client_risk_score(
  p_client_id BIGINT,
  p_days_late INTEGER
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v_delta INTEGER;
BEGIN
  IF    p_days_late = 0   THEN v_delta :=  2;
  ELSIF p_days_late <= 7  THEN v_delta := -3;
  ELSIF p_days_late <= 30 THEN v_delta := -8;
  ELSE                         v_delta := -15;
  END IF;

  UPDATE public.clients
  SET risk_score = GREATEST(0, LEAST(100, risk_score + v_delta))
  WHERE id = p_client_id;
END;
$$;

-- 3.6 reschedule_installment_contract
CREATE OR REPLACE FUNCTION public.reschedule_installment_contract(
  p_contract_id  UUID,
  p_new_count    INTEGER,
  p_employee_id  UUID,
  p_reason       TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_remaining   NUMERIC;
  v_new_amount  NUMERIC;
  v_contract    public.installment_contracts%ROWTYPE;
  v_i           INTEGER;
  v_due_date    DATE;
BEGIN
  SELECT * INTO v_contract FROM public.installment_contracts
  WHERE id = p_contract_id FOR UPDATE;

  IF v_contract.status NOT IN ('active','overdue') THEN
    RAISE EXCEPTION 'CANNOT_RESCHEDULE: الحالة الحالية [%] لا تسمح بإعادة الجدولة', v_contract.status;
  END IF;

  v_remaining  := public.get_installment_remaining(p_contract_id);
  v_new_amount := CEIL(v_remaining / p_new_count);

  DELETE FROM public.installment_payments
  WHERE contract_id = p_contract_id AND status IN ('pending','overdue');

  FOR v_i IN 1..p_new_count LOOP
    v_due_date := (CURRENT_DATE + (v_i || ' months')::INTERVAL)::DATE;
    v_due_date := DATE_TRUNC('month', v_due_date) +
                  (LEAST(v_contract.due_day, DATE_PART('days',
                    DATE_TRUNC('month', v_due_date) + INTERVAL '1 month - 1 day')::INTEGER) - 1) * INTERVAL '1 day';

    INSERT INTO public.installment_payments
      (contract_id, installment_no, due_amount, due_date, status)
    VALUES
      (p_contract_id, v_i, v_new_amount, v_due_date, 'pending');
  END LOOP;

  UPDATE public.installment_contracts
  SET installment_count  = p_new_count,
      installment_amount = v_new_amount,
      rescheduled_count  = rescheduled_count + 1,
      status             = 'active'
  WHERE id = p_contract_id;

  INSERT INTO public.installment_audit_logs
    (contract_id, performed_by, action, old_value, new_value, notes)
  VALUES (
    p_contract_id, p_employee_id, 'reschedule',
    jsonb_build_object('old_count', v_contract.installment_count, 'old_amount', v_contract.installment_amount),
    jsonb_build_object('new_count', p_new_count, 'new_amount', v_new_amount, 'remaining', v_remaining),
    p_reason
  );

  RETURN jsonb_build_object(
    'status',       'rescheduled',
    'new_count',    p_new_count,
    'new_amount',   v_new_amount,
    'remaining',    v_remaining
  );
END;
$$;

-- 3.7 check_imei_blacklist
CREATE OR REPLACE FUNCTION public.check_imei_blacklist(p_imei TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public."Blacklist"
      WHERE imei = p_imei AND status = 'stolen'
    )
    THEN jsonb_build_object(
      'is_blacklisted', true,
      'warning', 'تحذير: هذا الجهاز موجود في القائمة السوداء كجهاز مسروق!'
    )
    ELSE jsonb_build_object('is_blacklisted', false)
  END
$$;

-- ============================================================================

-- 4. CREATE VIEWS
-- 4.1 installment_dashboard_summary
CREATE OR REPLACE VIEW public.installment_dashboard_summary AS
SELECT
  COUNT(*) FILTER (WHERE ip.status = 'overdue')                    AS overdue_count,
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'overdue'), 0) AS overdue_amount,

  COUNT(*) FILTER (WHERE ip.status = 'pending' AND ip.due_date = CURRENT_DATE) AS today_count,
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'pending' AND ip.due_date = CURRENT_DATE), 0) AS today_amount,

  COUNT(*) FILTER (WHERE ip.status = 'pending' AND ip.due_date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7) AS week_count,
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'pending' AND ip.due_date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7), 0) AS week_amount,

  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'pending' AND DATE_TRUNC('month', ip.due_date) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS month_expected
FROM public.installment_payments ip
JOIN public.installment_contracts ic ON ic.id = ip.contract_id
WHERE ic.status IN ('active','overdue');

-- 4.2 cash_flow_forecast_view
CREATE OR REPLACE VIEW public.cash_flow_forecast_view AS
SELECT
  DATE_TRUNC('month', ip.due_date)::DATE                              AS month,
  COUNT(*)                                                            AS installment_count,
  COALESCE(SUM(ip.due_amount + ip.penalty_amount), 0)                AS expected_amount,
  COALESCE(SUM(ip.paid_amount) FILTER (WHERE ip.status = 'paid'), 0) AS collected_amount,
  COALESCE(SUM(ip.due_amount)  FILTER (WHERE ip.status IN ('pending','partial','overdue')), 0) AS pending_amount
FROM public.installment_payments ip
JOIN public.installment_contracts ic ON ic.id = ip.contract_id
WHERE ic.status != 'defaulted'
  AND ip.status  != 'waived'
GROUP BY DATE_TRUNC('month', ip.due_date)
ORDER BY month;
