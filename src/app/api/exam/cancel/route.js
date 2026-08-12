import { NextResponse } from 'next/server';
import { isLoggedIn, cancelViaAPI } from '@/lib/svp-playwright';
import { IS_VERCEL } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (IS_VERCEL) {
    return NextResponse.json({
      success: false,
      error: 'Browser automation is not available on Vercel serverless. Please use local deployment for SVP operations.'
    }, { status: 501 });
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
