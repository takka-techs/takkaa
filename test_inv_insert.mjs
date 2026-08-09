const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function testInsert() {
  const email = `test_inv_${Date.now()}@example.com`;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', data: { company_name: 'Test Co' } })
  });
  const data = await res.json();
  const token = data.access_token;
  const user_id = data.user.id;
  
  // Create inventory
  const invRes = await fetch(`${SUPABASE_URL}/rest/v1/store_inventories`, {
      method: 'POST',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ name: 'Test Inv', status: 'draft', user_id, tenant_id: user_id })
  });
  
  let inv_id = null;
  if(invRes.ok) {
     const invRows = await invRes.json();
     inv_id = invRows[0].id;
  } else {
     console.log("Inventories insert failed", await invRes.text());
     return;
  }
  console.log("Created inventory:", inv_id);

  // Create item with full columns
  const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/store_inventory_items`, {
      method: 'POST',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ 
         inventory_id: inv_id, 
         item_id: 'test_item', 
         item_type: 'devices', 
         item_name: 'Test', 
         expected_quantity: 1, 
         actual_quantity: 1, 
         cost_price: 100, 
         tenant_id: user_id 
      })
  });
  
  console.log("Item insert status:", itemRes.status);
  console.log("Item insert result:", await itemRes.text());
}
testInsert();
