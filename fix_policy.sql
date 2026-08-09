-- تنفيذ هذا الأمر في نافذة SQL Editor في Supabase لحل مشكلة حفظ الفروع وصلاحياتها بالكامل
-- المشكلة تحدث لأن جدول الفروع يحتاج إلى سياسة إدخال للسماح بإضافة السجلات الجديدة

-- سياسات جدول الفروع (branches)
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

-- سياسات جدول المستخدمين (app_users) لتفعيل عمل الموظفين والمديرين بشكل صحيح
DROP POLICY IF EXISTS "Enable all operations for app_users" ON public.app_users;
CREATE POLICY "Enable all operations for app_users" ON public.app_users
AS PERMISSIVE FOR ALL
USING (
  tenant_id = auth.uid() OR
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.user_id = auth.uid() 
    AND au.tenant_id = app_users.tenant_id
  )
)
WITH CHECK (
  tenant_id = auth.uid() OR
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.user_id = auth.uid() 
    AND au.tenant_id = app_users.tenant_id
    AND au.role_level <= 2
  )
);
