import { NextResponse } from 'next/server';
import { IS_RAILWAY } from '@/lib/config.js';
import { proxyToRailway, shouldProxyToRailway } from '@/lib/backend/proxy.js';

export const dynamic = 'force-dynamic';

function buildNoVncUrl() {
  const explicit = process.env.NOVNC_PUBLIC_URL;
  if (explicit) {
    const url = new URL(explicit);
    if (!url.pathname || url.pathname === '/') url.pathname = '/vnc.html';
    url.searchParams.set('autoconnect', 'true');
    return { novncUrl: url.toString(), host: url.host, port: url.port || 443 };
  }

  const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'localhost';
  const protocol = host === 'localhost' ? 'http' : 'https';
  const port = host === 'localhost' ? ':6080' : '';
  return {
    novncUrl: `${protocol}://${host}${port}/vnc.html?autoconnect=true`,
    host,
    port: host === 'localhost' ? 6080 : 443,
  };
}

export async function GET() {
  if (shouldProxyToRailway()) {
    return proxyToRailway('/api/svp-login-url');
  }

  const { novncUrl, host, port } = buildNoVncUrl();

  return NextResponse.json({
    success: true,
    data: {
      novncUrl,
      host,
      port,
      vncPort: 5900,
      display: process.env.DISPLAY || ':99',
      supported: IS_RAILWAY,
      message: 'Remote browser is ready. Use the URL below to access the virtual desktop.'
    }
  });
}
