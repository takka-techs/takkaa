DROP FUNCTION IF EXISTS public.create_installment_contract(bigint, bigint, bigint, bigint, bigint, integer, numeric, numeric, numeric, integer, date, uuid, jsonb, uuid, uuid);

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
    p_branch_id bigint
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
    
    -- We'll just disable the trigger manually or let it run, but delete its payments anyway.
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

-- Update trigger to DO NOTHING so we don't unnecessarily generate payments just to delete them
CREATE OR REPLACE FUNCTION public.generate_installment_payments()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- We now rely on 'create_installment_contract' RPC, so do nothing.
  RETURN NEW;
END;
$function$;

