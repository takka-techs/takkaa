-- 1. Fix the trigger that generates payments to include tenant_id and branch_id
CREATE OR REPLACE FUNCTION public.generate_installment_payments()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  i INT;
  due DATE;
BEGIN
  FOR i IN 1..NEW.installment_count LOOP
    due := (NEW.start_date + ((i) * INTERVAL '1 month'))::DATE;
    -- اضبط الـ due_day
    due := DATE_TRUNC('month', due) + (NEW.due_day - 1) * INTERVAL '1 day';

    INSERT INTO installment_payments (
      contract_id,
      installment_no,
      due_date,
      due_amount,
      status,
      tenant_id,
      branch_id
    ) VALUES (
      NEW.id,
      i,
      due,
      NEW.installment_amount,
      'pending',
      NEW.tenant_id,
      NEW.branch_id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2. Update the main contract creation RPC to accept and write tenant_id and branch_id
DROP FUNCTION IF EXISTS public.create_installment_contract;
CREATE OR REPLACE FUNCTION public.create_installment_contract(
    p_client_id bigint, 
    p_device_id bigint, 
    p_accessory_id bigint, 
    p_spare_part_id bigint, 
    p_invoice_id bigint, 
    p_wallet_id integer, 
    p_total_price numeric, 
    p_down_payment numeric, 
    p_installment_amount numeric, 
    p_installment_count integer, 
    p_start_date date, 
    p_created_by uuid, 
    p_payments jsonb,
    p_tenant_id uuid,
    p_branch_id uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_contract_id UUID;
    v_payment RECORD;
    v_inserted_count INTEGER := 0;
BEGIN
    INSERT INTO public.installment_contracts (
        tenant_id, branch_id,
        client_id, device_id, accessory_id, spare_part_id, invoice_id, wallet_id, total_price, down_payment, 
        installment_amount, installment_count, start_date, due_day,
        penalty_per_day, penalty_grace_days, status, created_by, feature_enabled, cancel_policy, max_reschedules, rescheduled_count
    ) VALUES (
        p_tenant_id, p_branch_id,
        p_client_id, p_device_id, p_accessory_id, p_spare_part_id, p_invoice_id, p_wallet_id, p_total_price, p_down_payment,
        p_installment_amount, p_installment_count, p_start_date, EXTRACT(DAY FROM p_start_date),
        0, 0, 'active', p_created_by, true, 'refund_cash', 3, 0
    ) RETURNING id INTO v_contract_id;
    
    -- The trigger already generated some empty payments, so we delete them and insert the custom ones (if applicable)
    DELETE FROM public.installment_payments WHERE contract_id = v_contract_id;

    FOR v_payment IN SELECT * FROM jsonb_to_recordset(p_payments) AS x(installment_no integer, due_amount numeric, due_date date, status text)
    LOOP
        INSERT INTO public.installment_payments (
            contract_id, installment_no, due_amount, due_date, status, tenant_id, branch_id
        ) VALUES (
            v_contract_id, v_payment.installment_no, v_payment.due_amount, v_payment.due_date, v_payment.status, p_tenant_id, p_branch_id
        );
        v_inserted_count := v_inserted_count + 1;
    END LOOP;
    
    IF p_device_id IS NOT NULL THEN
        UPDATE public."Devices" SET status = 'مباع', updated_at = NOW() WHERE id = p_device_id;
    END IF;
    
    RETURN jsonb_build_object('success', true, 'contract_id', v_contract_id, 'inserted_payments', v_inserted_count);
END;
$function$;

-- 3. Reschedule function must also add tenant_id and branch_id to new payments
CREATE OR REPLACE FUNCTION public.reschedule_installment_contract(p_contract_id uuid, p_new_count integer, p_employee_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_remaining   NUMERIC;
  v_new_amount  NUMERIC;
  v_contract    public.installment_contracts%ROWTYPE;
  v_i           INTEGER;
  v_due_date    DATE;
BEGIN
  SELECT * INTO v_contract FROM public.installment_contracts
  WHERE id = p_contract_id AND deleted_at IS NULL FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'CONTRACT_NOT_FOUND');
  END IF;

  IF v_contract.status NOT IN ('active', 'overdue') THEN
    RAISE EXCEPTION 'CANNOT_RESCHEDULE: الحالة الحالية [%] لا تسمح بإعادة الجدولة', v_contract.status;
  END IF;

  v_remaining  := public.get_installment_remaining(p_contract_id);
  v_new_amount := CEIL(v_remaining / p_new_count);

  UPDATE public.installment_payments
  SET deleted_at = now()
  WHERE contract_id = p_contract_id
    AND status IN ('pending', 'overdue')
    AND deleted_at IS NULL;

  FOR v_i IN 1..p_new_count LOOP
    v_due_date := (CURRENT_DATE + (v_i || ' months')::INTERVAL)::DATE;
    v_due_date := DATE_TRUNC('month', v_due_date) +
                  (LEAST(COALESCE(v_contract.due_day, 1), DATE_PART('days',
                    DATE_TRUNC('month', v_due_date) + INTERVAL '1 month - 1 day')::INTEGER) - 1) * INTERVAL '1 day';

    INSERT INTO public.installment_payments
      (contract_id, installment_no, due_amount, due_date, status, tenant_id, branch_id)
    VALUES
      (p_contract_id, v_i, v_new_amount, v_due_date, 'pending', v_contract.tenant_id, v_contract.branch_id);
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
    'status',     'rescheduled',
    'new_count',  p_new_count,
    'new_amount', v_new_amount,
    'remaining',  v_remaining
  );
END;
$function$;
