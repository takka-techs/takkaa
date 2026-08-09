
CREATE OR REPLACE FUNCTION get_func_src(p_name text) RETURNS text AS $$
DECLARE
  src text;
BEGIN
  SELECT prosrc INTO src FROM pg_proc WHERE proname = p_name LIMIT 1;
  RETURN src;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
