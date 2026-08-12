import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/users/index.js';
import { generateToken, generateRefreshToken, hashPassword } from '@/lib/auth/index.js';
import { auditLog } from '@/lib/audit/index.js';
import { AppError, ValidationError, ConflictError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const user = await createUser({
      email,
      password,
      name: name || email.split('@')[0],
      role: role || 'staff',
      createdBy: null
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });

    await auditLog({
      actor_id: user.id,
      action: 'user.registered',
      resource_type: 'user',
      resource_id: user.id,
      details: { email, role }
    });

    return NextResponse.json({
      success: true,
      data: { user, token, refreshToken }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[auth/register] Error:', error);
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
  }
}
