import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, verifyRefreshToken } from '@/lib/auth/index.js';
import { refreshUserToken, getUserById } from '@/lib/users/index.js';
import { auditLog } from '@/lib/audit/index.js';
import { AuthenticationError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'Refresh token required' }, { status: 400 });
    }
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }
    const result = await refreshUserToken(refreshToken);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Token refresh failed' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      data: { token: result.token, refreshToken: result.refreshToken, user: result.user }
    });
  } catch (error) {
    console.error('[auth/refresh] Error:', error);
    return NextResponse.json({ success: false, error: 'Token refresh failed' }, { status: 500 });
  }
}
