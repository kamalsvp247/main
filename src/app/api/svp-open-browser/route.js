import { NextResponse } from 'next/server';
import {
  isLiveBrowserSupported,
  isLiveBrowserOpen,
  openLiveBrowser
} from '@/lib/svp-live-browser.js';
import { proxyToRailway, shouldProxyToRailway } from '@/lib/backend/proxy.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (shouldProxyToRailway()) {
    return proxyToRailway('/api/svp-open-browser', { method: 'POST' });
  }
  if (!isLiveBrowserSupported()) {
    return NextResponse.json(
      { success: false, error: 'Live browser requires the Railway Linux backend with Xvfb.' },
      { status: 400 }
    );
  }
  if (isLiveBrowserOpen()) {
    return NextResponse.json({ success: true, message: 'Live browser is already open.', open: true });
  }
  const result = await openLiveBrowser();
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: result.message, open: true });
}
