select
       polname,
       polcmd,
       pg_get_expr(polqual, polrelid) as qual,
       pg_get_expr(polwithcheck, polrelid) as with_check
from pg_policy
where polrelid = 'employees'::regclass;
