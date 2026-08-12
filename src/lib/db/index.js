import { ensureSupabase } from '@/lib/supabase/client.js';

export async function getDb() {
  return await ensureSupabase();
}

export async function initDb() {
  const supabase = await ensureSupabase();
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.warn('[db] Supabase tables may not be initialized. Run supabase/schema.sql in the Supabase SQL Editor.');
  }
  return supabase;
}
