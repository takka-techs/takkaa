-- Migration to support Branch Advanced Settings
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS invoice_header TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS invoice_footer TEXT;

-- Shifts changes
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cashier_name TEXT;
