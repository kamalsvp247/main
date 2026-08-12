import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/users/index.js';
import { generateToken, generateRefreshToken } from '@/lib/auth/index.js';
import { auditLog } from '@/lib/audit/index.js';
import { AuthenticationError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }
    const result = await authenticateUser(email, password);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      data: { user: result.user, token: result.token, refreshToken: result.refreshToken }
    });
  } catch (error) {
    console.error('[auth/login] Error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
