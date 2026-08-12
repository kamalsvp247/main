import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/index.js';
import { getUserById } from '@/lib/users/index.js';
import { auditLog } from '@/lib/audit/index.js';
import { AuthenticationError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: true, data: { authenticated: false, user: null } });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: true, data: { authenticated: false, user: null } });
    }
    const user = await getUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ success: true, data: { authenticated: false, user: null } });
    }
    return NextResponse.json({ success: true, data: { authenticated: true, user } });
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ success: true, data: { authenticated: false, user: null } });
  }
}
