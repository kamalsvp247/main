import { NextResponse } from 'next/server';
import { login } from '@/lib/svp-playwright';
import { IS_VERCEL } from '@/lib/config.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (IS_VERCEL) {
    return NextResponse.json({
      success: false,
      error: 'Browser automation is not available on Vercel serverless. Please use the local deployment for SVP login automation, or use direct API credentials.'
    }, { status: 501 });
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
