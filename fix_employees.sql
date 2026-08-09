DROP POLICY IF EXISTS "Enable all operations for employees" ON public.employees;

CREATE POLICY "Enable all operations for employees" ON public.employees
AS PERMISSIVE FOR ALL
USING (
  owner_id = auth.uid() OR
  tenant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.user_id = auth.uid()
    AND (app_users.tenant_id = employees.tenant_id OR app_users.tenant_id = employees.owner_id)
  )
)
WITH CHECK (
  owner_id = auth.uid() OR
  tenant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.user_id = auth.uid()
    AND (app_users.tenant_id = employees.tenant_id OR app_users.tenant_id = employees.owner_id)
  )
);
