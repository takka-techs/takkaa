-- SQL Statement to fix the Warehouses table RLS policies
-- RUN THIS IN SUPABASE SQL EDITOR

DO $$
BEGIN
    -- 1. Drop existing problematic policies on Warehouses
    DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_insert" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_select" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_update" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_delete" ON public."Warehouses";
    DROP POLICY IF EXISTS "Allow ALL for tenant" ON public."Warehouses";
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."Warehouses";
    DROP POLICY IF EXISTS "Enable all operations for Warehouses" ON public."Warehouses";

    -- 2. Make sure RLS is enabled
    ALTER TABLE public."Warehouses" ENABLE ROW LEVEL SECURITY;

    -- 3. Create a strict policy for Warehouses so each owner ONLY sees their own warehouses
    CREATE POLICY "Enable all operations for Warehouses" ON public."Warehouses"
    AS PERMISSIVE FOR ALL
    USING (
      tenant_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE app_users.user_id = auth.uid() 
        AND app_users.tenant_id = "Warehouses".tenant_id
      )
    )
    WITH CHECK (
      tenant_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE app_users.user_id = auth.uid() 
        AND app_users.tenant_id = "Warehouses".tenant_id
      )
    );

END $$;
