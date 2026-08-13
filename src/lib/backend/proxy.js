import { NextResponse } from 'next/server';
import { IS_RAILWAY, RAILWAY_BACKEND_URL } from '@/lib/config.js';

function normalizeBackendUrl() {
  const value = RAILWAY_BACKEND_URL.replace(/\/$/, '');
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return '';
  }
}

export function shouldProxyToRailway() {
  return !IS_RAILWAY && Boolean(normalizeBackendUrl());
}

export async function proxyToRailway(path, init = {}) {
  const backendUrl = normalizeBackendUrl();
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, error: 'Railway backend is not configured. Set RAILWAY_BACKEND_URL on Vercel.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Could not reach Railway backend: ${error.message}` },
      { status: 502 }
    );
  }
}
