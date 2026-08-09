-- سكريبت لإصلاح صلاحيات جدول store_inventory_items
-- قم بتشغيله في SQL Editor داخل Supabase

-- تعطيل السياسة القديمة (إن وجدت)
DROP POLICY IF EXISTS "tenant_admin_all" ON public.store_inventory_items;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.store_inventory_items;
DROP POLICY IF EXISTS "Users can manage their tenant items" ON public.store_inventory_items;
DROP POLICY IF EXISTS "store_inventory_items_access" ON public.store_inventory_items;

-- إنشاء سياسة جديدة تسمح بقراءة وكتابة وتعديل الأصناف للمستخدمين المرتبطين بـ tenant_id الخاص بهم
CREATE POLICY "tenant_access_store_inventory_items" ON public.store_inventory_items
FOR ALL
USING ( 
    auth.role() = 'authenticated' AND (
        tenant_id = auth.uid() 
        OR exists (
            select 1 from public.app_users 
            where user_id = auth.uid() 
            and tenant_id = store_inventory_items.tenant_id
        )
    )
)
WITH CHECK ( 
    auth.role() = 'authenticated' AND (
        tenant_id = auth.uid() 
        OR exists (
            select 1 from public.app_users 
            where user_id = auth.uid() 
            and tenant_id = store_inventory_items.tenant_id
        )
    )
);

-- التأكد من تفعيل RLS
ALTER TABLE public.store_inventory_items ENABLE ROW LEVEL SECURITY;
