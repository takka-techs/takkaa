CREATE OR REPLACE FUNCTION public.update_active_shift_from_txn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shift RECORD;
BEGIN
    -- Only handle IN and OUT types.
    IF NEW.type NOT IN ('in', 'out', 'income', 'expense') THEN
        RETURN NEW;
    END IF;

    -- Find the open shift for this user in the exact same branch
    SELECT * INTO v_shift
    FROM public.shifts
    WHERE user_id = NEW.user_id 
      AND status = 'open'
      AND branch_id IS NOT DISTINCT FROM NEW.branch_id
    ORDER BY created_at DESC
    LIMIT 1 FOR UPDATE;

    IF FOUND THEN
        IF NEW.type IN ('in', 'income') THEN
            UPDATE public.shifts
            SET expected_amount = expected_amount + NEW.amount,
                deposits_count = COALESCE(deposits_count, 0) + 1
            WHERE id = v_shift.id;
        ELSIF NEW.type IN ('out', 'expense') THEN
            UPDATE public.shifts
            SET expected_amount = expected_amount - NEW.amount,
                withdrawals_count = COALESCE(withdrawals_count, 0) + 1
            WHERE id = v_shift.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
