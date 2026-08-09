const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function runSql() {
  const sql = `
    ALTER TABLE public.installment_partial_payments 
    DROP CONSTRAINT IF EXISTS installment_partial_payments_collected_by_fkey;
    
    ALTER TABLE public.installment_partial_payments
    ADD CONSTRAINT installment_partial_payments_collected_by_fkey
    FOREIGN KEY (collected_by) REFERENCES public.app_users(user_id) ON DELETE SET NULL;
    
    ALTER TABLE public.installment_payments
    DROP CONSTRAINT IF EXISTS installment_payments_collected_by_fkey;
    
    ALTER TABLE public.installment_payments
    ADD CONSTRAINT installment_payments_collected_by_fkey
    FOREIGN KEY (collected_by) REFERENCES public.app_users(user_id) ON DELETE SET NULL;
    
    ALTER TABLE public.installment_audit_logs 
    DROP CONSTRAINT IF EXISTS installment_audit_logs_performed_by_fkey;
    
    ALTER TABLE public.installment_audit_logs
    ADD CONSTRAINT installment_audit_logs_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES public.app_users(user_id) ON DELETE SET NULL;
  `;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_str: sql })
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
runSql();
