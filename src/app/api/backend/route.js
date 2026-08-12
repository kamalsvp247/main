import { NextResponse } from 'next/server';
import { IS_VERCEL, RAILWAY_BACKEND_URL } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!IS_VERCEL) {
    return NextResponse.json({ success: false, error: 'This endpoint is for Vercel frontend only. Use direct routes on Railway.' }, { status: 400 });
  }
  
  if (!RAILWAY_BACKEND_URL) {
    return NextResponse.json({ success: false, error: 'Railway backend not configured. Set RAILWAY_BACKEND_URL.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json({ success: false, error: 'Missing action or payload' }, { status: 400 });
    }

    // Forward to Railway backend
    const response = await fetch(`${RAILWAY_BACKEND_URL}/api/backend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify({ action, payload })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[backend/proxy] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
