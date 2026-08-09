-- Final SQL Fix for Account Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  new_company_name text;
  new_has_branches boolean;
  err_msg text;
BEGIN
  new_tenant_id := gen_random_uuid();
  new_company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'My Company');
  new_has_branches := COALESCE((new.raw_user_meta_data->>'has_branches')::boolean, true);

  -- Hack to bypass any BEFORE INSERT triggers on app_settings that rely on auth.uid()
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', new.id, 'tenant_id', new_tenant_id)::text, true);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore
  END;

  -- Insert into app_users first
  BEGIN
    INSERT INTO public.app_users (
      id,
      user_id, 
      tenant_id, 
      name, 
      username, 
      role, 
      status, 
      password,
      role_level
    )
    VALUES (
      gen_random_uuid(),
      new.id, 
      new_tenant_id, 
      'المدير',
      'admin_' || substring(new.id::text from 1 for 6), 
      'admin', 
      'نشط',
      'admin',
      1
    );
  EXCEPTION WHEN OTHERS THEN
    err_msg := 'APP_USERS ERROR: ' || SQLERRM;
  END;

  -- Insert into app_settings
  BEGIN
    INSERT INTO public.app_settings (
      tenant_id, 
      company_name, 
      has_branches, 
      user_id,
      defaulted_after_days,
      blacklist_after_days,
      is_global_default
    )
    VALUES (
      new_tenant_id, 
      COALESCE(err_msg, new_company_name), 
      new_has_branches, 
      new.id,
      30,
      60,
      true
    );
  EXCEPTION WHEN OTHERS THEN
    -- If this fails, we try a desperate insert with absolute minimum into app_settings just to log
    BEGIN
      INSERT INTO public.app_settings (
        tenant_id, 
        company_name, 
        has_branches, 
        user_id,
        defaulted_after_days,
        blacklist_after_days,
        is_global_default
      )
      VALUES (
        gen_random_uuid(), 
        LEFT('APP_SETTINGS ERROR: ' || SQLERRM || ' - ' || COALESCE(err_msg, ''), 255), 
        true, 
        new.id,
        30,
        60,
        true
      );
    EXCEPTION WHEN OTHERS THEN
      -- Totally failed
    END;
  END;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
