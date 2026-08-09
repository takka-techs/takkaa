-- Get function definition
SELECT prosrc 
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE proname = 'fn_set_tenant_id_on_insert' 
AND nspname = 'public';
