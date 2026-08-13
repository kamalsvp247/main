import { NextResponse } from 'next/server';
import { IS_RAILWAY } from '@/lib/config.js';
import { proxyToRailway, shouldProxyToRailway } from '@/lib/backend/proxy.js';

export const dynamic = 'force-dynamic';

function buildNoVncUrl() {
  // Preferred: an explicit public noVNC URL (e.g. a dedicated Railway domain
  // that fronts the websockify port directly). We only honor this when it is
  // actually set, so the default same-origin proxy path below is used on the
  // Railway app host where noVNC is reached through our own /vnc proxy.
  const explicit = process.env.NOVNC_PUBLIC_URL;
  if (explicit) {
    const url = new URL(explicit);
    if (!url.pathname || url.pathname === '/') url.pathname = '/vnc.html';
    url.searchParams.set('autoconnect', 'true');
    return { novncUrl: url.toString(), host: url.host, port: url.port || 443 };
  }

  // Default: same-origin proxy. server.js reverse-proxies /vnc/* and
  // /websockify to the internal websockify (localhost:6080). Because Railway
  // only exposes the single injected PORT, this is the only reliable way to
  // reach noVNC from the browser — it rides on the very host/port Next.js is
  // already served from.
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'localhost';
  const protocol = host === 'localhost' ? 'http' : 'https';
  const base = host === 'localhost' ? `${protocol}://${host}:${process.env.PORT || 3000}` : `${protocol}://${host}`;
  const novncPath = `/vnc/vnc.html?path=websockify&autoconnect=true&reconnect=true`;
  return {
    novncUrl: `${base}${novncPath}`,
    host,
    port: host === 'localhost' ? Number(process.env.PORT || 3000) : 443,
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
