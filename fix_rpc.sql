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
  v_contract        public.installment_contracts%ROWTYPE;
  v_paid_so_far     NUMERIC;
  v_penalty         NUMERIC;
  v_days_late       INTEGER;
  v_new_status      TEXT;
  v_tx_id           INTEGER;
  v_remaining_req   NUMERIC;
  v_current_applied NUMERIC;
  v_real_employee_id UUID;
BEGIN
  -- Resolve real employee ID (UI often sends auth.users ID which is owner_id in employees table)
  SELECT id INTO v_real_employee_id
  FROM public.employees
  WHERE id = p_employee_id OR owner_id = p_employee_id
  LIMIT 1;

  -- Default to NULL if not found, to avoid FK violation
  -- (assuming collected_by and user_id can be null)

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
  
  IF p_amount > v_remaining_req THEN
     v_current_applied := v_remaining_req;
  ELSE
     v_current_applied := p_amount;
  END IF;

  INSERT INTO public.installment_partial_payments
    (payment_id, amount, collected_by, wallet_id, receipt_url, idempotency_key, notes)
  VALUES
    (p_payment_id, v_current_applied, v_real_employee_id, p_wallet_id, p_receipt_url, p_idempotency_key, p_notes)
  ON CONFLICT (idempotency_key) DO NOTHING;

  INSERT INTO public.treasury_transactions
    (wallet_id, type, amount, category, description, user_id)
  VALUES (
    p_wallet_id, 'in', p_amount,
    CASE WHEN v_penalty > 0 THEN 'installment_penalty' ELSE 'installment_collection' END,
    'تحصيل قسط رقم ' || v_payment.installment_no || ' — عقد ' || v_contract.id,
    v_real_employee_id
  )
  RETURNING id INTO v_tx_id;

  -- Update Wallet Balance
  UPDATE public.wallets
  SET balance = balance + p_amount
  WHERE id = p_wallet_id;

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
      collected_by = v_real_employee_id
  WHERE id = p_payment_id;

  IF v_contract.client_id IS NOT NULL THEN
    UPDATE public.clients
    SET initial_balance = COALESCE(initial_balance, 0) - v_current_applied
    WHERE id = v_contract.client_id;
  END IF;

  RETURN jsonb_build_object('status', 'success', 'new_status', v_new_status, 'paid_amount', v_paid_so_far);
END;
$$;
