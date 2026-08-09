DO $$
BEGIN
    -- Drop the bad overly permissive policy
    DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_insert" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_select" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_update" ON public."Warehouses";
    DROP POLICY IF EXISTS "warehouses_delete" ON public."Warehouses";
    DROP POLICY IF EXISTS "Allow ALL for tenant" ON public."Warehouses";
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."Warehouses";
    DROP POLICY IF EXISTS "Enable all operations for Warehouses" ON public."Warehouses";

    -- Create accurate policy for Warehouses
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

    -- Also check wallets if we applied it there:
    DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.wallets;
    DROP POLICY IF EXISTS "Enable all operations for wallets" ON public.wallets;
    CREATE POLICY "Enable all operations for wallets" ON public.wallets
    AS PERMISSIVE FOR ALL
    USING (
      tenant_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE app_users.user_id = auth.uid() 
        AND app_users.tenant_id = wallets.tenant_id
      )
    )
    WITH CHECK (
      tenant_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM app_users 
        WHERE app_users.user_id = auth.uid() 
        AND app_users.tenant_id = wallets.tenant_id
      )
    );
END $$;
