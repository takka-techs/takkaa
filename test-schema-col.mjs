import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// read from .env
const env = fs.readFileSync('.env.example', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key] = value;
  return acc;
}, {});

const supabaseUrl = env['VITE_SUPABASE_URL'] || 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || env['SUPABASE_SERVICE_ROLE_KEY']; // Or another key if we have it in .env.example
// Or we can just read from swagger

async function run() {
    const res = await fetch(`${supabaseUrl}/rest/v1/installment_contracts?limit=1`, {
        // pass apikey
        headers: { 'apikey': env['VITE_SUPABASE_ANON_KEY'] }
    });
    const c = await res.json();
    console.log(c);
}
run();
