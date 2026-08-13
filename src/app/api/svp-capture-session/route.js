import { NextResponse } from 'next/server';
import {
  isLiveBrowserOpen,
  getLiveBrowserStorage,
  persistLiveBrowserSession
} from '@/lib/svp-live-browser.js';
import { IS_RAILWAY } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isLiveBrowserOpen()) {
    return NextResponse.json(
      { success: false, error: 'Live browser is not open. Open it first, then log in to SVP.' },
      { status: 400 }
    );
  }
  try {
    const storage = await getLiveBrowserStorage();
    if (!storage) {
      return NextResponse.json(
        { success: false, error: 'Could not read browser storage. Make sure you are logged in.' },
        { status: 400 }
      );
    }

    const token = persistLiveBrowserSession(storage);

    let supabaseSaved = false;
    if (IS_RAILWAY) {
      try {
        const { ensureSupabase } = await import('@/lib/supabase/client.js');
        const supabase = await ensureSupabase();
        await supabase.from('sessions').upsert({
          id: 'svp_session_primary',
          token: token || null,
          storage,
          expires_at: null,
          updated_at: new Date().toISOString()
        }).select().single();
        supabaseSaved = true;
      } catch (e) {
        console.error('[capture-session] Supabase save failed:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasToken: !!token,
        supabaseSaved,
        cookies: storage.cookies?.length || 0
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
