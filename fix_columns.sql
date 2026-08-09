ALTER TABLE public.installment_payments
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS treasury_tx_id INTEGER;
