
-- 1. كإجراء احترازي، سنجعل حقل contract_id يقبل قيماً فارغة إذا أمكن
ALTER TABLE IF EXISTS public.payment_requests ALTER COLUMN contract_id DROP NOT NULL;

-- 2. تحديث دالة معالجة الدفع لتمرير القيم بشكل سليم لجدول installment_partial_payments (أو إصلاح الخلل)
-- نؤكد على إعادة الدالة للوضع القياسي السليم:
CREATE OR REPLACE FUNCTION public.process_installment_payment(
  p_payment_id       UUID,
  p_amount           NUMERIC,
  p_employee_id      UUID,
  p_wallet_id        INTEGER,
  p_idempotency_key  TEXT,
  p_receipt_url      TEXT DEFAULT NULL,
  p_notes            TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
... (to be filled below)
