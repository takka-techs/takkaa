-- 0. Fix constraints to CASCADE
ALTER TABLE public.installment_audit_logs DROP CONSTRAINT IF EXISTS installment_audit_logs_payment_id_fkey;
ALTER TABLE public.installment_audit_logs ADD CONSTRAINT installment_audit_logs_payment_id_fkey 
  FOREIGN KEY (payment_id) REFERENCES public.installment_payments(id) ON DELETE CASCADE;

ALTER TABLE public.installment_payments DROP CONSTRAINT IF EXISTS installment_payments_rescheduled_from_fkey;
ALTER TABLE public.installment_payments ADD CONSTRAINT installment_payments_rescheduled_from_fkey
  FOREIGN KEY (rescheduled_from) REFERENCES public.installment_payments(id) ON DELETE CASCADE;

-- 1. Remove duplicates
WITH CTE AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY contract_id, installment_no ORDER BY due_date ASC) as rn
  FROM public.installment_payments
)
DELETE FROM public.installment_payments WHERE id IN (SELECT id FROM CTE WHERE rn > 1);

-- 2. CREATE CONTRACT RPC
DROP FUNCTION IF EXISTS public.create_installment_contract(BIGINT, BIGINT, BIGINT, INTEGER, NUMERIC, NUMERIC, NUMERIC, INTEGER, DATE, UUID, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.create_installment_contract(
    p_client_id BIGINT,
    p_device_id BIGINT,
    p_invoice_id BIGINT,
    p_wallet_id INTEGER,
    p_total_price NUMERIC,
    p_down_payment NUMERIC,
    p_installment_amount NUMERIC,
    p_installment_count INTEGER,
    p_start_date DATE,
    p_created_by UUID,
    p_payments JSONB
) RETURNS jsonb AS $$
DECLARE
    v_contract_id UUID;
    v_payment RECORD;
    v_inserted_count INTEGER := 0;
BEGIN
    INSERT INTO public.installment_contracts (
        client_id, device_id, invoice_id, wallet_id, total_price, down_payment, 
        installment_amount, installment_count, start_date, due_day,
        penalty_per_day, penalty_grace_days, status, created_by, feature_enabled, cancel_policy, max_reschedules, rescheduled_count
    ) VALUES (
        p_client_id, p_device_id, p_invoice_id, p_wallet_id, p_total_price, p_down_payment,
        p_installment_amount, p_installment_count, p_start_date, EXTRACT(DAY FROM p_start_date),
        0, 0, 'active', p_created_by, true, 'refund_cash', 3, 0
    ) RETURNING id INTO v_contract_id;
    
    DELETE FROM public.installment_payments WHERE contract_id = v_contract_id;

    FOR v_payment IN SELECT * FROM jsonb_to_recordset(p_payments) AS x(installment_no integer, due_amount numeric, due_date date, status text)
    LOOP
        INSERT INTO public.installment_payments (
            contract_id, installment_no, due_amount, due_date, status
        ) VALUES (
            v_contract_id, v_payment.installment_no, v_payment.due_amount, v_payment.due_date, v_payment.status
        );
        v_inserted_count := v_inserted_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object('status', 'success', 'contract_id', v_contract_id, 'inserted_payments', v_inserted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.create_installment_contract(BIGINT, BIGINT, BIGINT, INTEGER, NUMERIC, NUMERIC, NUMERIC, INTEGER, DATE, UUID, JSONB) TO authenticated;

ALTER TABLE public.installment_payments
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS treasury_tx_id INTEGER;

-- 3. PROCESS PAYMENT RPC
DROP FUNCTION IF EXISTS public.process_installment_payment(UUID, NUMERIC, UUID, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.process_installment_payment(UUID, NUMERIC, UUID, INTEGER, TEXT, TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.process_installment_payment(
  p_payment_id UUID,
  p_amount NUMERIC,
  p_employee_id UUID,
  p_wallet_id INTEGER,
  p_idempotency_key TEXT,
  p_notes TEXT
) RETURNS jsonb AS $$
DECLARE
  v_payment RECORD;
  v_contract RECORD;
  v_paid_so_far NUMERIC := 0;
  v_penalty NUMERIC := 0;
  v_target_amount NUMERIC := 0;
  v_new_status TEXT := 'pending';
  v_tx_id INTEGER;
BEGIN
  -- Re-read safely
  SELECT * INTO v_payment FROM public.installment_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment % not found', p_payment_id; END IF;

  SELECT * INTO v_contract FROM public.installment_contracts WHERE id = v_payment.contract_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid_so_far
  FROM public.installment_partial_payments WHERE payment_id = p_payment_id;

  v_penalty := COALESCE(v_payment.penalty_amount, 0);
  v_target_amount := v_payment.due_amount + v_penalty;
  
  -- Insert Partial
  INSERT INTO public.installment_partial_payments
    (payment_id, amount, collected_by, wallet_id, idempotency_key, notes)
  VALUES
    (p_payment_id, p_amount, p_employee_id, p_wallet_id, p_idempotency_key, p_notes)
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Add to Treasury
  INSERT INTO public.treasury_transactions
    (wallet_id, type, amount, category, description, user_id)
  VALUES (
    p_wallet_id, 'in', p_amount,
    CASE WHEN v_penalty > 0 THEN 'installment_penalty' ELSE 'installment_collection' END,
    'تحصيل قسط رقم ' || v_payment.installment_no || ' — عقد ' || v_contract.id,
    COALESCE((SELECT owner_id FROM public.employees WHERE id = p_employee_id), auth.uid(), p_employee_id)
  ) RETURNING id INTO v_tx_id;

  -- Update Wallet Balance
  IF p_wallet_id IS NOT NULL THEN
    UPDATE public.wallets
    SET balance = balance + p_amount
    WHERE id = p_wallet_id;
  END IF;

  -- Recalculate
  v_paid_so_far := v_paid_so_far + p_amount;
  IF v_paid_so_far >= v_target_amount THEN
     v_new_status := 'paid';
  ELSIF v_paid_so_far > 0 THEN
     v_new_status := 'partial';
  END IF;

  UPDATE public.installment_payments
  SET paid_amount = v_paid_so_far, status = v_new_status, last_payment_date = CURRENT_DATE, treasury_tx_id = v_tx_id
  WHERE id = p_payment_id;

  RETURN jsonb_build_object('status', 'success', 'new_status', v_new_status, 'paid_amount', v_paid_so_far);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.process_installment_payment(UUID, NUMERIC, UUID, INTEGER, TEXT, TEXT) TO authenticated;

-- 4. WAIVE PENALTY RPC
DROP FUNCTION IF EXISTS public.waive_installment_penalty(UUID, UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.waive_installment_penalty(
  p_payment_id UUID, p_employee_id UUID, p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.installment_payments SET penalty_amount = 0 WHERE id = p_payment_id;
  INSERT INTO public.installment_audit_logs (contract_id, payment_id, action, employee_id, new_value, notes)
  VALUES (
    (SELECT contract_id FROM public.installment_payments WHERE id = p_payment_id),
    p_payment_id, 'waive_penalty', p_employee_id, '{"penalty_amount":0}'::jsonb, p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.waive_installment_penalty(UUID, UUID, TEXT) TO authenticated;

-- 5. SOFT DELETE CONTRACT RPC
DROP FUNCTION IF EXISTS public.soft_delete_installment_contract(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.soft_delete_installment_contract(
  p_contract_id UUID, p_employee_id UUID
) RETURNS VOID AS $$
BEGIN
  -- We just mark the contract as defaulting or delete its payments
  UPDATE public.installment_contracts SET status = 'defaulted' WHERE id = p_contract_id;
  INSERT INTO public.installment_audit_logs (contract_id, action, employee_id, notes)
  VALUES (p_contract_id, 'soft_delete', p_employee_id, 'تم إيقاف العقد نهائياً');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.soft_delete_installment_contract(UUID, UUID) TO authenticated;

-- 6. RELAX RLS RULES
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.installment_payments;
CREATE POLICY "Enable ALL for authenticated users" ON public.installment_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.installment_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.installment_contracts;
CREATE POLICY "Enable ALL for authenticated users" ON public.installment_contracts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
