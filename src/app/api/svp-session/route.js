import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ensureSupabase } from '@/lib/supabase/client.js';
import { IS_RAILWAY } from '@/lib/config.js';

const STORAGE_FILE = join(process.cwd(), '.svp-storage.json');
const TOKEN_FILE = join(process.cwd(), '.svp-token.json');

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!IS_RAILWAY) {
    return NextResponse.json({ success: false, error: 'SVP session sync is for Railway backend only' }, { status: 400 });
  }
  try {
    const supabase = await ensureSupabase();
    const { data, error } = await supabase.from('sessions').select('*').limit(1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'No SVP session stored. Upload session from local machine first.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!IS_RAILWAY) {
    return NextResponse.json({ success: false, error: 'SVP session sync is for Railway backend only' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { storage, token } = body;
    if (!storage && !token) {
      return NextResponse.json({ success: false, error: 'Missing storage or token' }, { status: 400 });
    }
    const supabase = await ensureSupabase();
    const session = {
      id: 'svp_session_primary',
      token: token || null,
      storage: storage || {},
      expires_at: null,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('sessions').upsert(session).select().single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!IS_RAILWAY) {
    return NextResponse.json({ success: false, error: 'SVP session sync is for Railway backend only' }, { status: 400 });
  }
  try {
    const supabase = await ensureSupabase();
    const { error } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
