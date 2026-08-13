import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient;

export function getSupabaseConfig() {
  return { supabaseUrl, hasSupabaseKey: Boolean(supabaseKey) };
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export async function ensureSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    return (...args) => ensureSupabase().then((client) => client[prop](...args));
  },
});
