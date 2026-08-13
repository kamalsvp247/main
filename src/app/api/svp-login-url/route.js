import { NextResponse } from 'next/server';
import { IS_RAILWAY } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!IS_RAILWAY) {
    return NextResponse.json({ success: false, error: 'Remote browser is only available on Railway backend' }, { status: 400 });
  }

  const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'localhost';
  const protocol = 'https';
  const novncUrl = `${protocol}://${host}:6080/vnc.html`;

  return NextResponse.json({
    success: true,
    data: {
      novncUrl,
      host,
      port: 6080,
      vncPort: 5900,
      display: ':99',
      message: 'Remote browser is ready. Use the URL below to access the virtual desktop.'
    }
  });
}
