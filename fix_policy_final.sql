-- إصلاح مشكلة اختفاء الفروع والـ Infinite Recursion

-- 1. إصلاح جدول الفروع
DROP POLICY IF EXISTS "Enable all operations for branches" ON public.branches;
CREATE POLICY "Enable all operations for branches" ON public.branches
AS PERMISSIVE FOR ALL
USING (
  tenant_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.tenant_id = branches.tenant_id
  )
)
WITH CHECK (
  tenant_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.tenant_id = branches.tenant_id
  )
);

-- 2. إصلاح جدول المستخدمين (app_users) ومنع اللفة اللانهائية (Infinite Recursion)
DROP POLICY IF EXISTS "Enable all operations for app_users" ON public.app_users;
CREATE POLICY "Enable all operations for app_users" ON public.app_users
AS PERMISSIVE FOR ALL
USING (
  tenant_id = auth.uid() OR
  user_id = auth.uid()
)
WITH CHECK (
  tenant_id = auth.uid() OR
  user_id = auth.uid()
);
