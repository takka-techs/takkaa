const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(`${SUPABASE_URL}/rest/v1/Repairs?order=created_at.desc&branch_id=eq.1`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(r => r.text())
.then(t => console.log("branch_id:", t))
.catch(console.error);

fetch(`${SUPABASE_URL}/rest/v1/Repairs?order=created_at.desc&receiving_branch_id=eq.1`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(r => r.text())
.then(t => console.log("receiving_branch_id:", t))
.catch(console.error);
