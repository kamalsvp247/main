import { NextResponse } from 'next/server';
import { loadSessionFromSupabase, getToken, isLoggedIn, hasSupabaseSession } from '@/lib/svp-auth.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await loadSessionFromSupabase();
    const token = getToken();
    const loggedIn = isLoggedIn();
    const hasSession = hasSupabaseSession();
    
    return NextResponse.json({
      success: true,
      data: {
        sessionLoaded: !!session,
        sessionId: session?.id || null,
        token: token ? `${token.substring(0, 20)}...` : null,
        loggedIn,
        hasSupabaseSession: hasSession,
        isRailway: process.env.RAILWAY_ENVIRONMENT === 'production'
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
