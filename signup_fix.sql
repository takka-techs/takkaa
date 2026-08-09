-- SQL Fix for Account Creation
-- Copy this into the Supabase SQL Editor and run it

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
  -- Generate a unique tenant_id for the new workspace
  new_tenant_id := gen_random_uuid();
  
  -- Extract company name and has_branches from the metadata sent during signup
  new_company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'My Company');
  -- Handle boolean extraction properly
  new_has_branches := COALESCE((new.raw_user_meta_data->>'has_branches')::boolean, true);

  -- Insert the settings for this new tenant
  INSERT INTO public.app_settings (tenant_id, company_name, has_branches)
  VALUES (new_tenant_id, new_company_name, new_has_branches);

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
    'admin' -- Since password column exists and is used for employee fallback
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
