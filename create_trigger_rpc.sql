
CREATE OR REPLACE FUNCTION get_triggers_list() RETURNS jsonb AS $$
DECLARE
  res jsonb;
BEGIN
  SELECT jsonb_agg(trigger_name) INTO res FROM information_schema.triggers WHERE event_object_table = 'installment_contracts';
  RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
