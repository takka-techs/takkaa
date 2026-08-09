import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
// Can't run raw SQL from client easily unless there's a stored proc.
// But we can check how branches are structured.
