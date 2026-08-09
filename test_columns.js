import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const SUPABASE_KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.from("installment_payments").select("*").limit(1);
  console.log(error || data);
}
test();
