ALTER TABLE public.installment_payments
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS treasury_tx_id INTEGER;

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

  -- Add to Treasury (FIX: user_id is now correctly mapped to the auth user ID from the owner_id of the employee)
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
