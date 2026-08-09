-- Updated SQL Fix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  new_company_name text;
  new_has_branches boolean;
BEGIN
  new_tenant_id := gen_random_uuid();
  new_company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'My Company');
  new_has_branches := COALESCE((new.raw_user_meta_data->>'has_branches')::boolean, true);

  -- Insert the settings for this new tenant. Some versions have user_id.
  INSERT INTO public.app_settings (tenant_id, company_name, has_branches, user_id)
  VALUES (new_tenant_id, new_company_name, new_has_branches, new.id);

  -- Insert the admin user into app_users 
  INSERT INTO public.app_users (
    user_id, 
    tenant_id, 
    name, 
    username, 
    role, 
    status, 
    password
  )
  VALUES (
    new.id, 
    new_tenant_id, 
    'المدير',
    'admin', 
    'admin', 
    'نشط',
    'admin'
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  -- If we fail here, let's at least raise an actual exception that auth can see 
  -- or we can return new but the signup transaction might commit depending on context.
  -- Supabase auth.users triggers might silently fail if caught.
  RAISE EXCEPTION 'Failed to setup user environment: %', SQLERRM;
END;
$$;
