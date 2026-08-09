-- Fix RLS Policies for Installments
DO $$ 
BEGIN
  -- ENABLE RLS on all installment tables
  ALTER TABLE IF EXISTS public.installment_contracts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.installment_payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.installment_partial_payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.installment_audit_logs ENABLE ROW LEVEL SECURITY;

  -- Add policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_contracts' AND policyname = 'Enable ALL for authenticated') THEN
    CREATE POLICY "Enable ALL for authenticated" ON public.installment_contracts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_payments' AND policyname = 'Enable ALL for authenticated') THEN
    CREATE POLICY "Enable ALL for authenticated" ON public.installment_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_partial_payments' AND policyname = 'Enable ALL for authenticated') THEN
    CREATE POLICY "Enable ALL for authenticated" ON public.installment_partial_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'installment_audit_logs' AND policyname = 'Enable ALL for authenticated') THEN
    CREATE POLICY "Enable ALL for authenticated" ON public.installment_audit_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Also fix the dashboard summary view which had a typo
CREATE OR REPLACE VIEW public.installment_dashboard_summary AS
SELECT
  COUNT(*) FILTER (WHERE ip.status = 'overdue')                    AS overdue_count,
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'overdue'), 0) AS overdue_amount,

  COUNT(*) FILTER (WHERE ip.status = 'pending' AND ip.due_date = CURRENT_DATE) AS today_count,
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'pending' AND ip.due_date = CURRENT_DATE), 0) AS today_amount,
  
  COUNT(*) FILTER (WHERE ip.status = 'pending' AND ip.due_date <= CURRENT_DATE + INTERVAL '7 days') AS week_count,
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'pending' AND ip.due_date <= CURRENT_DATE + INTERVAL '7 days'), 0) AS week_amount,
  
  COALESCE(SUM(ip.due_amount) FILTER (WHERE ip.status = 'pending' AND EXTRACT(MONTH FROM ip.due_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ip.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS month_expected
FROM public.installment_payments ip;
