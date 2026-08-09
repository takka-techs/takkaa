-- هذا الكود هيعدل العلاقات (Foreign Keys) بحيث لما Supabase يحاول يمسح أو يتراجع عن إنشاء الحساب
-- يمسح الإعدادات والمستخدم المرتبطين بيه بشكل تلقائي بدون ما يطلع خطأ
-- وبكده هيظهرلنا الخطأ الحقيقي اللي موقف إنشاء الحساب من الأساس!

DO $$
BEGIN
  -- 1. تعديل Foreign Key في جدول app_settings
  ALTER TABLE public.app_settings 
    DROP CONSTRAINT IF EXISTS app_settings_user_id_fkey;

  ALTER TABLE public.app_settings 
    ADD CONSTRAINT app_settings_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) 
    ON DELETE CASCADE;

  -- 2. تعديل Foreign Key في جدول app_users 
  ALTER TABLE public.app_users 
    DROP CONSTRAINT IF EXISTS app_users_user_id_fkey;

  ALTER TABLE public.app_users 
    ADD CONSTRAINT app_users_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) 
    ON DELETE CASCADE;

  -- 3. تعديل في جدول clients إن وُجد بيرتبط بـ auth.users
  ALTER TABLE public.clients 
    DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

  ALTER TABLE public.clients 
    ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) 
    ON DELETE CASCADE;

END;
$$;
