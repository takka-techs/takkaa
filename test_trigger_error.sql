DO $$
DECLARE
  new_id uuid := gen_random_uuid();
  new_tenant_id uuid := gen_random_uuid();
BEGIN
  -- Insert into app_users first
  INSERT INTO public.app_users (
    id, user_id, tenant_id, name, username, role, status, password, role_level
  ) VALUES (
    gen_random_uuid(), new_id, new_tenant_id, 'المدير', 'admin_123', 'admin', 'نشط', 'admin', 1
  );

  -- Insert into app_settings
  INSERT INTO public.app_settings (
    tenant_id, company_name, has_branches, user_id, defaulted_after_days, blacklist_after_days, is_global_default
  ) VALUES (
    new_tenant_id, 'Test', true, new_id, 30, 60, true
  );

  RAISE EXCEPTION 'TEST_SUCCESS: تمام، الأكواد صحيحة والخطأ مش هنا.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST_FAILED_HERE_IS_THE_ERROR: %', SQLERRM;
END;
$$;
