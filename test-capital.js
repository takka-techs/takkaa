import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const supabaseKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
// Use the shared REST api without user_id auth for this quick test script, or we can just bypass it
// Actually, I can't easily query without access_token since RLS is enabled...
// Wait, is RLS enabled? We passed `user_id=eq.${userId}` so maybe?
