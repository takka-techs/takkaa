-- This updates the soft_delete_installment_contract RPC to accept p_performed_by and p_reason 
-- as requested by the Frontend Enterprise constraints

CREATE OR REPLACE FUNCTION public.soft_delete_installment_contract(
    p_contract_id UUID,
    p_performed_by UUID,
    p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Only allow transition if contract is 'active' or 'overdue' (not already completed/defaulted)
    IF EXISTS (
        SELECT 1 FROM public.installment_contracts 
        WHERE id = p_contract_id AND status NOT IN ('active', 'overdue')
    ) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot delete a contract that is already %', (SELECT status FROM public.installment_contracts WHERE id = p_contract_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.installment_contracts WHERE id = p_contract_id) THEN
        RAISE EXCEPTION 'CONTRACT_NOT_FOUND_OR_ALREADY_DELETED';
    END IF;

    -- Update to defaulted instead of hard delete, and set deleted_at
    UPDATE public.installment_contracts 
    SET status = 'defaulted', deleted_at = now() 
    WHERE id = p_contract_id;

    UPDATE public.installment_payments 
    SET deleted_at = now() 
    WHERE contract_id = p_contract_id;

    -- Unlock device if applicable
    UPDATE public."Devices" 
    SET is_locked_for_installment = false, installment_contract_id = NULL
    WHERE installment_contract_id = p_contract_id;

    -- Log the sensitive action
    INSERT INTO public.installment_audit_logs
        (contract_id, performed_by, action, notes)
    VALUES (p_contract_id, p_performed_by, 'soft_delete_contract', 'سبب الإلغاء: ' || p_reason);
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_installment_contract(UUID, UUID, TEXT) TO authenticated;
