-- Get function definition for fn_current_tenant_id
SELECT prosrc 
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE proname = 'fn_current_tenant_id' 
AND nspname = 'public';
