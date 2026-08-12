import { NextResponse } from 'next/server';
import { isLoggedIn, cancelViaAPI } from '@/lib/svp-playwright';
import { IS_VERCEL, RAILWAY_BACKEND_URL } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

async function callRailwayBackend(action, payload = {}) {
  const response = await fetch(`${RAILWAY_BACKEND_URL}/api/backend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  return response.json();
}

export async function POST(request) {
  if (IS_VERCEL) {
    if (!RAILWAY_BACKEND_URL) {
      return NextResponse.json({ success: false, error: 'Railway backend not configured. Set RAILWAY_BACKEND_URL.' }, { status: 501 });
    }
    try {
      const body = await request.json();
      const result = await callRailwayBackend('cancel', body);
      return NextResponse.json(result);
    } catch (error) {
      console.error('[exam/cancel] Railway proxy error:', error.message);
      return NextResponse.json({ success: false, error: `Backend error: ${error.message}` }, { status: 502 });
    }
  }
  try {
    if (!isLoggedIn()) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated. Please login first.' },
        { status: 401 }
      );
    }

    const { sessionId, reason } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`[exam/cancel] Starting cancel: session=${sessionId}`);

    const result = await cancelViaAPI(sessionId, reason);

    if (result && result.ok) {
      console.log('[exam/cancel] Cancel succeeded:', result.status);
      return NextResponse.json({ success: true, data: result.data });
    }

    const errorMsg = (result?.data && result.data.message) || result?.error || `Cancel failed`;
    console.error('[exam/cancel] Cancel failed:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  } catch (error) {
    console.error('[exam/cancel] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
