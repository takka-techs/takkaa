
CREATE OR REPLACE FUNCTION dev_temp_get_indexes(p_table text) RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(jsonb_build_object('conname', conname, 'contype', contype, 'condef', pg_get_constraintdef(oid)))
    FROM pg_constraint
    WHERE conrelid = p_table::regclass::oid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
