const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
      },
      body: JSON.stringify({ email, password })
  });
  console.log(email, password, res.status, await res.text().then(t => t.slice(0,100)));
}

login('takka@gmail.com', 'takka');
login('takka@gmail.com', 'takka@gmail.com');
login('takka@gmail.com', '123456');
login('takka@gmail.com', 'password');
login('takka@gmail.com', 'Password123!');
login('admin@takka.com', '123456');
login('admin@gmail.com', '123456');
