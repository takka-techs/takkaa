ALTER TABLE public.installment_contracts ADD COLUMN IF NOT EXISTS accessory_id BIGINT REFERENCES public.accessories(id);
ALTER TABLE public.installment_contracts ADD COLUMN IF NOT EXISTS spare_part_id BIGINT REFERENCES public.spare_parts(id);

DROP FUNCTION IF EXISTS create_installment_contract(BIGINT,BIGINT,BIGINT,INTEGER,NUMERIC,NUMERIC,NUMERIC,INTEGER,DATE,UUID,JSONB);
DROP FUNCTION IF EXISTS create_installment_contract(BIGINT,BIGINT,BIGINT,BIGINT,BIGINT,INTEGER,NUMERIC,NUMERIC,NUMERIC,INTEGER,DATE,UUID,JSONB);

CREATE OR REPLACE FUNCTION create_installment_contract(
    p_client_id BIGINT,
    p_device_id BIGINT,
    p_accessory_id BIGINT,
    p_spare_part_id BIGINT,
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
        client_id, device_id, accessory_id, spare_part_id, invoice_id, wallet_id, total_price, down_payment, 
        installment_amount, installment_count, start_date, due_day,
        penalty_per_day, penalty_grace_days, status, created_by, feature_enabled, cancel_policy, max_reschedules, rescheduled_count
    ) VALUES (
        p_client_id, p_device_id, p_accessory_id, p_spare_part_id, p_invoice_id, p_wallet_id, p_total_price, p_down_payment,
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
    
    IF p_device_id IS NOT NULL THEN
        UPDATE public."Devices" SET status = 'مباع', updated_at = NOW() WHERE id = p_device_id;
    END IF;
    
    RETURN jsonb_build_object('success', true, 'contract_id', v_contract_id, 'inserted_payments', v_inserted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_installment_contract TO authenticated;
