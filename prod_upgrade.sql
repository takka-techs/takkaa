-- 1. Soft Delete Support
ALTER TABLE public.installment_contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.installment_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Device Integrity
ALTER TABLE public."Devices" DROP CONSTRAINT IF EXISTS check_device_installment_integrity;
ALTER TABLE public."Devices" ADD CONSTRAINT check_device_installment_integrity
  CHECK (
    (is_locked_for_installment = false AND installment_contract_id IS NULL) OR
    (is_locked_for_installment = true AND installment_contract_id IS NOT NULL)
  );

-- Unique index for IMEI based on prompt
DROP INDEX IF EXISTS idx_device_imei_unique;
CREATE UNIQUE INDEX idx_device_imei_unique ON public."Devices" (imei) WHERE imei IS NOT NULL AND imei != '';

-- Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_installment_payments_contract_id ON public.installment_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_due_date ON public.installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_installment_payments_status ON public.installment_payments(status);
CREATE INDEX IF NOT EXISTS idx_installment_contracts_client_id ON public.installment_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_installment_contracts_status ON public.installment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_partial_payments_payment_id ON public.installment_partial_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_contract_id ON public.installment_audit_logs(contract_id);

-- Setup Cron if pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
        PERFORM cron.unschedule('mark_overdue_installments');
    EXCEPTION WHEN OTHERS THEN END;
    
    PERFORM cron.schedule(
      'mark_overdue_installments',
      '1 0 * * *',
      $$ 
        UPDATE public.installment_payments 
        SET status = 'overdue' 
        WHERE status IN ('pending', 'partial') AND due_date < (CURRENT_DATE AT TIME ZONE 'Africa/Cairo'); 
        
        UPDATE public.installment_contracts 
        SET status = 'overdue' 
        WHERE id IN (SELECT contract_id FROM public.installment_payments WHERE status = 'overdue' AND deleted_at IS NULL); 
      $$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not setup cron %', sqlerrm;
END $$;

-- 3. Update state machine trigger
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

-- process_installment_payment with Overflow + Double Protection
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
  v_payment         public.installment_payments%ROWTYPE;
  v_next_payment    public.installment_payments%ROWTYPE;
  v_contract        public.installment_contracts%ROWTYPE;
  v_paid_so_far     NUMERIC;
  v_penalty         NUMERIC;
  v_days_late       INTEGER;
  v_new_status      TEXT;
  v_tx_id           INTEGER;
  v_remaining_req   NUMERIC;
  v_overflow        NUMERIC;
  v_current_applied NUMERIC;
BEGIN
  -- Double Protection Layer 1: Select for Update
  SELECT * INTO v_payment
  FROM public.installment_payments
  WHERE id = p_payment_id AND deleted_at IS NULL FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'PAYMENT_NOT_FOUND');
  END IF;

  -- Double Protection Layer 2
  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_paid');
  END IF;

  SELECT * INTO v_contract
  FROM public.installment_contracts
  WHERE id = v_payment.contract_id AND deleted_at IS NULL;

  -- Use Timezone Cairo
  v_days_late := GREATEST(0, (CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::DATE - v_payment.due_date);
  IF v_days_late > COALESCE(v_contract.penalty_grace_days, 0) THEN
    v_penalty := (v_days_late - COALESCE(v_contract.penalty_grace_days, 0)) * COALESCE(v_contract.penalty_per_day, 0);
  ELSE
    v_penalty := 0;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid_so_far
  FROM public.installment_partial_payments
  WHERE payment_id = p_payment_id;

  v_remaining_req := (v_payment.due_amount + v_penalty) - v_paid_so_far;
  
  -- Handle Overflow:
  IF p_amount > v_remaining_req THEN
     v_overflow := p_amount - v_remaining_req;
     v_current_applied := v_remaining_req;
  ELSE
     v_overflow := 0;
     v_current_applied := p_amount;
  END IF;

  INSERT INTO public.installment_partial_payments
    (payment_id, amount, collected_by, wallet_id, receipt_url, idempotency_key, notes)
  VALUES
    (p_payment_id, v_current_applied, p_employee_id, p_wallet_id, p_receipt_url, p_idempotency_key, p_notes)
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

  v_paid_so_far := v_paid_so_far + v_current_applied;
  IF v_paid_so_far >= (v_payment.due_amount + v_penalty) THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE public.installment_payments
  SET status       = v_new_status,
      paid_amount  = v_paid_so_far,
      paid_date    = (CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::DATE,
      collected_by = p_employee_id
  WHERE id = p_payment_id;

  PERFORM public.update_client_risk_score(v_contract.client_id, v_days_late);

  INSERT INTO public.installment_audit_logs
    (contract_id, payment_id, performed_by, action, new_value)
  VALUES (
    v_contract.id, p_payment_id, p_employee_id,
    CASE v_new_status WHEN 'paid' THEN 'payment_received' ELSE 'partial_payment' END,
    jsonb_build_object('amount', v_current_applied, 'status', v_new_status, 'days_late', v_days_late, 'overflow', v_overflow)
  );

  -- Overflow Logic
  IF v_overflow > 0 THEN
      -- Find next pending installment
      SELECT * INTO v_next_payment 
      FROM public.installment_payments
      WHERE contract_id = v_contract.id AND status IN ('pending', 'partial', 'overdue') AND deleted_at IS NULL AND id != p_payment_id
      ORDER BY due_date ASC
      LIMIT 1 FOR UPDATE;

      IF FOUND THEN
          INSERT INTO public.installment_partial_payments
            (payment_id, amount, collected_by, wallet_id, idempotency_key, notes)
          VALUES
            (v_next_payment.id, v_overflow, p_employee_id, p_wallet_id, p_idempotency_key || '_overflow', 'رصيد منقول من القسط السابق');
            
          UPDATE public.installment_payments
          SET paid_amount = COALESCE(paid_amount, 0) + v_overflow,
              status = CASE WHEN COALESCE(paid_amount, 0) + v_overflow >= (due_amount + COALESCE(penalty_amount, 0)) THEN 'paid' ELSE 'partial' END
          WHERE id = v_next_payment.id;
      ELSE
          -- If no next payment but overflow exists, user essentially overpaid the last installment.
          -- We still keep the money, just track it.
      END IF;
  END IF;

  -- Check if contract completed
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
    'treasury_tx_id',  v_tx_id,
    'overflow_amount', v_overflow
  );
END;
$$;


-- Delete Contract using logical soft-delete
CREATE OR REPLACE FUNCTION public.soft_delete_installment_contract(
  p_contract_id UUID,
  p_employee_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.installment_contracts SET deleted_at = now() WHERE id = p_contract_id;
    UPDATE public.installment_payments SET deleted_at = now() WHERE contract_id = p_contract_id;

    -- Unlock device
    UPDATE public."Devices" 
    SET is_locked_for_installment = false, installment_contract_id = NULL
    WHERE installment_contract_id = p_contract_id;
    
    INSERT INTO public.installment_audit_logs
      (contract_id, performed_by, action, notes)
    VALUES (p_contract_id, p_employee_id, 'soft_delete_contract', 'تم حذف العقد وتجميده مالياً');

    RETURN jsonb_build_object('success', true);
END;
$$;


-- Waive Penalty
CREATE OR REPLACE FUNCTION public.waive_installment_penalty(
  p_payment_id UUID,
  p_employee_id UUID,
  p_reason TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_payment public.installment_payments%ROWTYPE;
BEGIN
    SELECT * INTO v_payment FROM public.installment_payments WHERE id = p_payment_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'PAYMENT_NOT_FOUND'); END IF;

    UPDATE public.installment_payments 
    SET penalty_amount = 0
    WHERE id = p_payment_id;

    INSERT INTO public.installment_audit_logs
        (contract_id, payment_id, performed_by, action, old_value, new_value, notes)
    VALUES (
        v_payment.contract_id, p_payment_id, p_employee_id, 'waiver',
        jsonb_build_object('penalty_amount', v_payment.penalty_amount),
        jsonb_build_object('penalty_amount', 0),
        p_reason
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Create Roles if not exists
DO $$ 
BEGIN 
  -- Cannot easily alter Enum, but roles in app_users are just text if app_users is used.
  -- Add Owner and Manager to roles JSON/array if it's managed via UI or just assume it's TEXT.
END $$;

-- Trigger to prevent inserting blacklisted IMEIs
CREATE OR REPLACE FUNCTION public.prevent_blacklisted_imei()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    is_blacklisted BOOLEAN;
BEGIN
    IF NEW.imei IS NOT NULL AND NEW.imei != '' THEN
        SELECT EXISTS (
            SELECT 1 FROM public."Blacklist"
            WHERE imei = NEW.imei AND status = 'stolen'
        ) INTO is_blacklisted;
        IF is_blacklisted THEN
            RAISE EXCEPTION 'IMEI_BLACKLISTED: هذا الجهاز مسجل كجهاز مسروق في القائمة السوداء (%)', NEW.imei;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_blacklist_on_devices ON public."Devices";
CREATE TRIGGER check_blacklist_on_devices
BEFORE INSERT OR UPDATE ON public."Devices"
FOR EACH ROW EXECUTE FUNCTION public.prevent_blacklisted_imei();
