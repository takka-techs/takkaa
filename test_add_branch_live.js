import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);

    const email = `test.branch.${Date.now()}@example.com`;
    console.log("Signing up", email);
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: 'Password@123456',
        options: {
            data: { full_name: 'Test Boss' }
        }
    });

    if (authErr) {
        console.log("Signup error:", authErr.message);
        return;
    }

    const token = authData.session.access_token;
    const userId = authData.user.id;
    console.log("User id:", userId);

    const headers = {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: "return=representation"
    };

    const payload = {
        name: "Test Branch Payload",
        address: "Address",
        phone: "123",
        logo_url: "",
        invoice_header: "",
        invoice_footer: "",
        is_active: true,
        tenant_id: userId
    };

    let res = await fetch(`${SUPABASE_URL}/rest/v1/branches`, {
        method: "POST",
        headers,
        body: JSON.stringify([payload])
    });

    if (!res.ok) {
        const errorData = await res.clone().json().catch(() => null);
        console.log("Error 1:", errorData);
        if (errorData && (errorData.code === 'PGRST204' || errorData.code === 'PGRST205' || errorData.message?.includes('column'))) {
            const safePayload = {
               name: payload.name,
               address: payload.address,
               is_active: payload.is_active,
               tenant_id: userId
            };
            res = await fetch(`${SUPABASE_URL}/rest/v1/branches`, {
              method: "POST",
              headers,
              body: JSON.stringify([safePayload]),
            });
            console.log("Safe payload response:", res.status);
            if (!res.ok) {
                console.log("Safe payload error:", await res.text());
            } else {
                console.log("Safe payload SUCCESS:", await res.json());
            }
        }
    } else {
        console.log("SUCCESS:", await res.json());
    }
}
main();
