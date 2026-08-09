-- 1. Fix Foreign Key Constraints to allow deleting duplicate payments
ALTER TABLE public.installment_audit_logs DROP CONSTRAINT IF EXISTS installment_audit_logs_payment_id_fkey;
ALTER TABLE public.installment_audit_logs ADD CONSTRAINT installment_audit_logs_payment_id_fkey 
  FOREIGN KEY (payment_id) REFERENCES public.installment_payments(id) ON DELETE CASCADE;

ALTER TABLE public.installment_payments DROP CONSTRAINT IF EXISTS installment_payments_rescheduled_from_fkey;
ALTER TABLE public.installment_payments ADD CONSTRAINT installment_payments_rescheduled_from_fkey
  FOREIGN KEY (rescheduled_from) REFERENCES public.installment_payments(id) ON DELETE CASCADE;

-- 2. Clean up any existing duplicates in the overall database
WITH CTE AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY contract_id, installment_no ORDER BY due_date ASC) as rn
  FROM public.installment_payments
)
DELETE FROM public.installment_payments 
WHERE id IN (SELECT id FROM CTE WHERE rn > 1);

-- 3. Create the RPC for securely generating a contract and its payments
CREATE OR REPLACE FUNCTION create_installment_contract(
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
    -- 1. Insert contract
    INSERT INTO public.installment_contracts (
        client_id, device_id, invoice_id, wallet_id, total_price, down_payment, 
        installment_amount, installment_count, start_date, due_day,
        penalty_per_day, penalty_grace_days, status, created_by, feature_enabled, cancel_policy, max_reschedules, rescheduled_count
    ) VALUES (
        p_client_id, p_device_id, p_invoice_id, p_wallet_id, p_total_price, p_down_payment,
        p_installment_amount, p_installment_count, p_start_date, EXTRACT(DAY FROM p_start_date),
        0, 0, 'active', p_created_by, true, 'refund_cash', 3, 0
    ) RETURNING id INTO v_contract_id;
    
    -- Wipe out any automatically triggered payments inserted by legacy DB triggers
    DELETE FROM public.installment_payments WHERE contract_id = v_contract_id;

    -- 3. Insert payments from JSON array
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

-- 4. Ensure users have execute permissions on the RPC
GRANT EXECUTE ON FUNCTION create_installment_contract TO authenticated;

-- 5. Fix RLS so the API can read the payments
ALTER TABLE IF EXISTS public.installment_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated" ON public.installment_payments;
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.installment_payments;
CREATE POLICY "Enable ALL for authenticated users" ON public.installment_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
