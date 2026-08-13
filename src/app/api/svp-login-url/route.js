import { NextResponse } from 'next/server';
import { IS_RAILWAY } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Allow an explicit override (e.g. a Railway-generated 6080 domain).
  const explicit = process.env.NOVNC_PUBLIC_URL;
  const host = explicit
    ? explicit.replace(/^https?:\/\//, '').split('/')[0]
    : (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'localhost');
  const protocol = explicit ? (explicit.startsWith('http://') ? 'http' : 'https') : 'https';
  const novncUrl = `${protocol}://${host}:6080/vnc.html?autoconnect=true`;

  return NextResponse.json({
    success: true,
    data: {
      novncUrl,
      host,
      port: 6080,
      vncPort: 5900,
      display: process.env.DISPLAY || ':99',
      supported: IS_RAILWAY,
      message: 'Remote browser is ready. Use the URL below to access the virtual desktop.'
    }
  });
}
