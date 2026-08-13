import { NextResponse } from 'next/server';
import { login } from '@/lib/svp-playwright';
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

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This is an API endpoint. Use POST to initiate SVP login. For the T2Hub login page, visit /login.'
  }, { status: 405 });
}

export async function POST() {
  if (IS_VERCEL) {
    if (!RAILWAY_BACKEND_URL) {
      return NextResponse.json({
        success: false,
        error: 'Browser automation backend not configured. Set RAILWAY_BACKEND_URL in Vercel environment variables.'
      }, { status: 501 });
    }
    try {
      const result = await callRailwayBackend('login');
      return NextResponse.json(result);
    } catch (error) {
      console.error('[auth/login] Railway proxy error:', error.message);
      return NextResponse.json({ success: false, error: `Backend error: ${error.message}` }, { status: 502 });
    }
  }
  try {
    const result = await login();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[auth/login] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
