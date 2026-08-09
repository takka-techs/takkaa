
CREATE OR REPLACE FUNCTION test_count_payments() RETURNS integer AS $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c FROM public.installment_payments;
  RETURN c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
