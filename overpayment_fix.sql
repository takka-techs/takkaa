-- 1. إصلاح مشكلة التحصيل الحر عن طريق حذف النسخة المكررة والغلط من قاعدة البيانات
DROP FUNCTION IF EXISTS public.process_contract_bulk_payment(uuid, numeric, uuid, bigint, text, text);

-- 2. تحديث نظام التحصيل العادي ليدعم نظام الشلال (Waterfall) في حالة الدفع بزيادة
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
  v_contract    public.installment_contracts%ROWTYPE;
  v_payment     public.installment_payments%ROWTYPE;
  v_target_pay  public.installment_payments%ROWTYPE;
  v_remaining_payment NUMERIC := p_amount;
  v_penalty     NUMERIC;
  v_days_late   INTEGER;
  v_needed      NUMERIC;
  v_apply       NUMERIC;
  v_tx_id       INTEGER;
  v_paid_so_far NUMERIC;
BEGIN
  -- 1. الحصول على القسط المراد دفعه
  SELECT * INTO v_payment FROM public.installment_payments WHERE id = p_payment_id FOR UPDATE;
  
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'PAYMENT_NOT_FOUND'); END IF;
  IF v_payment.status = 'paid' THEN RETURN jsonb_build_object('status', 'already_paid'); END IF;

  SELECT * INTO v_contract FROM public.installment_contracts WHERE id = v_payment.contract_id;

  -- 2. إدخال الإجمالي في الخزنة كعملية واحدة منعاً للتكرار
  IF p_wallet_id IS NOT NULL THEN
     INSERT INTO public.treasury_transactions (wallet_id, type, amount, category, description, user_id)
     VALUES (
       p_wallet_id, 'in', p_amount, 'installment_collection',
       COALESCE(p_notes, 'تحصيل قسط رقم ' || v_payment.installment_no),
       p_employee_id
     ) RETURNING id INTO v_tx_id;
  END IF;

  -- 3. حلقة تكرارية بنظام الشلال (تغطية الحاضر ثم القادم)
  FOR v_target_pay IN
    SELECT * FROM public.installment_payments 
    WHERE contract_id = v_contract.id 
      AND status != 'paid' 
      AND deleted_at IS NULL
      AND due_date >= v_payment.due_date 
    ORDER BY due_date ASC, installment_no ASC
    FOR UPDATE
  LOOP
      v_days_late := GREATEST(0, CURRENT_DATE - v_target_pay.due_date);
      IF v_days_late > COALESCE(v_contract.penalty_grace_days, 0) THEN
        v_penalty := (v_days_late - COALESCE(v_contract.penalty_grace_days, 0)) * COALESCE(v_contract.penalty_per_day, 0);
      ELSE
        v_penalty := 0;
      END IF;

      SELECT COALESCE(SUM(amount), 0) INTO v_paid_so_far
      FROM public.installment_partial_payments WHERE payment_id = v_target_pay.id;

      v_needed := (v_target_pay.due_amount + v_penalty) - v_paid_so_far;

      IF v_needed <= 0 THEN CONTINUE; END IF;

      IF v_remaining_payment >= v_needed THEN
        v_apply := v_needed;
      ELSE
        v_apply := v_remaining_payment;
      END IF;

      -- إنشاء حركة التسديد الجزئية/الكلية للقسط الحالي
      INSERT INTO public.installment_partial_payments
        (payment_id, amount, collected_by, wallet_id, receipt_url, idempotency_key, treasury_tx_id, notes)
      VALUES
        (v_target_pay.id, v_apply, p_employee_id, p_wallet_id, p_receipt_url, p_idempotency_key || '_' || v_target_pay.id, v_tx_id, COALESCE(p_notes, 'نظام الشلال'))
      ON CONFLICT (idempotency_key) DO NOTHING;

      v_paid_so_far := v_paid_so_far + v_apply;
      
      -- تحديث حالة القسط المستهدف
      UPDATE public.installment_payments
      SET penalty_amount   = v_penalty,
          treasury_tx_id   = v_tx_id,
          wallet_id        = p_wallet_id,
          status           = CASE WHEN v_paid_so_far >= (v_target_pay.due_amount + v_penalty) THEN 'paid' ELSE 'partial' END,
          paid_amount      = v_paid_so_far,
          paid_date        = CURRENT_DATE,
          collected_by     = p_employee_id
      WHERE id = v_target_pay.id;

      INSERT INTO public.installment_audit_logs (contract_id, payment_id, performed_by, action, new_value)
      VALUES (v_contract.id, v_target_pay.id, p_employee_id, 'payment_cascade', jsonb_build_object('amount', v_apply, 'status', CASE WHEN v_paid_so_far >= (v_target_pay.due_amount + v_penalty) THEN 'paid' ELSE 'partial' END));

      v_remaining_payment := v_remaining_payment - v_apply;
      
      EXIT WHEN v_remaining_payment <= 0;
  END LOOP;

  -- 4. لو اتبقى فلوس بعد تسديد كل العقد تضاف في آخر قسط
  IF v_remaining_payment > 0 THEN
      INSERT INTO public.installment_partial_payments
        (payment_id, amount, collected_by, wallet_id, receipt_url, idempotency_key, treasury_tx_id, notes)
      VALUES
        (p_payment_id, v_remaining_payment, p_employee_id, p_wallet_id, p_receipt_url, p_idempotency_key || '_overpay', v_tx_id, 'مبلغ إضافي كدفع مقدم / رصيد زائد')
      ON CONFLICT (idempotency_key) DO NOTHING;
        
      UPDATE public.installment_payments
      SET paid_amount = paid_amount + v_remaining_payment
      WHERE id = p_payment_id;
  END IF;

  RETURN jsonb_build_object('status', 'success', 'applied', p_amount);
END;
$$;
