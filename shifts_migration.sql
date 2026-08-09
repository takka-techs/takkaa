-- Migration to add branch_id to shifts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'branch_id') THEN
    ALTER TABLE public.shifts ADD COLUMN branch_id UUID REFERENCES public.branches(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'cashier_name') THEN
    ALTER TABLE public.shifts ADD COLUMN cashier_name TEXT;
  END IF;
END $$;
