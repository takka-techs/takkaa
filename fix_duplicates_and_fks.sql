ALTER TABLE public.installment_audit_logs
  DROP CONSTRAINT IF EXISTS installment_audit_logs_payment_id_fkey;

ALTER TABLE public.installment_audit_logs
  ADD CONSTRAINT installment_audit_logs_payment_id_fkey
  FOREIGN KEY (payment_id)
  REFERENCES public.installment_payments(id)
  ON DELETE SET NULL;
  
ALTER TABLE public.installment_payments
  DROP CONSTRAINT IF EXISTS installment_payments_rescheduled_from_fkey;

ALTER TABLE public.installment_payments
  ADD CONSTRAINT installment_payments_rescheduled_from_fkey
  FOREIGN KEY (rescheduled_from)
  REFERENCES public.installment_payments(id)
  ON DELETE SET NULL;

-- 4. Clean up any existing duplicates
WITH CTE AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY contract_id, installment_no ORDER BY due_date ASC) as rn
  FROM public.installment_payments
)
DELETE FROM public.installment_payments 
WHERE id IN (SELECT id FROM CTE WHERE rn > 1);
