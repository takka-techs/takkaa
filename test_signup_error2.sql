DO $$
DECLARE
  new_auth_id uuid := gen_random_uuid();
  new_tenant_id uuid := gen_random_uuid();
  new_app_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert into app_users first
  INSERT INTO public.app_users (
    id, user_id, tenant_id, name, username, role, status, password, role_level
  ) VALUES (
    new_app_user_id, new_auth_id, new_tenant_id, 'المدير', 'admin_123', 'admin', 'نشط', 'admin', 1
  );

  -- Insert into app_settings using new_app_user_id
  INSERT INTO public.app_settings (
    tenant_id, company_name, has_branches, user_id, defaulted_after_days, blacklist_after_days, is_global_default
  ) VALUES (
    new_tenant_id, 'Test', true, new_app_user_id, 30, 60, true
  );

  RAISE EXCEPTION 'TEST_SUCCESS: Used app_user_id for app_settings user_id.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST_FAILED_HERE_IS_THE_ERROR: %', SQLERRM;
END;
$$;
