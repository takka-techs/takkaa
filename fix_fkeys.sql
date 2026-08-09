DO $$
BEGIN
  -- أول حاجة هنحذف أي بيانات قديمة أو تجريبية ملهاش حساب حقيقي في جدول الدخول 
  -- عشان نعرف نعدل العلاقات بدون أخطاء
  DELETE FROM public.app_settings 
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.app_users 
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.clients 
  WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM auth.users);

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

  -- 3. تعديل في جدول clients
  ALTER TABLE public.clients 
    DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

  ALTER TABLE public.clients 
    ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) 
    ON DELETE CASCADE;

END;
$$;
