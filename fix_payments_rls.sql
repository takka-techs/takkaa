-- Fix RLS for installment_payments
ALTER TABLE IF EXISTS public.installment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated" ON public.installment_payments;
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.installment_payments;

CREATE POLICY "Enable ALL for authenticated users" 
ON public.installment_payments 
FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');
