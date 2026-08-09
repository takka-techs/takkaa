-- Test script to debug the handle_new_user logic and app_settings constraints

-- 1. Create a dummy user ID to test the logic
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_tenant_id uuid := gen_random_uuid();
    test_company_name text := 'Test Company';
    test_has_branches boolean := false;
BEGIN
    RAISE NOTICE 'Testing insert into app_settings with: TenantID=%, UserID=%', test_tenant_id, test_user_id;

    -- This matches the logic that is failing in the trigger
    INSERT INTO public.app_settings (tenant_id, company_name, has_branches, user_id)
    VALUES (test_tenant_id, test_company_name, test_has_branches, test_user_id);

    RAISE NOTICE 'Insert successful!';

    -- Cleanup
    DELETE FROM public.app_settings WHERE user_id = test_user_id;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Test insert failed with error: %', SQLERRM;
END $$;
