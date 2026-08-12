import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 't2hub-backend',
    timestamp: new Date().toISOString(),
    node: process.version,
    platform: process.platform
  });
}
