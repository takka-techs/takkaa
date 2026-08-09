-- Fix RLS Policies for Warehouses and Wallets
DO $$ 
BEGIN
  -- ENABLE RLS
  ALTER TABLE IF EXISTS public."Warehouses" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;

  -- Create policies for Warehouses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Warehouses' AND policyname = 'Enable ALL for authenticated users') THEN
    CREATE POLICY "Enable ALL for authenticated users" ON public."Warehouses" FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Create policies for wallets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Enable ALL for authenticated users') THEN
    CREATE POLICY "Enable ALL for authenticated users" ON public.wallets FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

END $$;
