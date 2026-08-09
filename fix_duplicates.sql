WITH CTE AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY contract_id, installment_no ORDER BY due_date ASC) as rn
  FROM public.installment_payments
)
DELETE FROM public.installment_payments 
WHERE id IN (SELECT id FROM CTE WHERE rn > 1);
