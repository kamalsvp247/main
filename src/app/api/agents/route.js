import { NextResponse } from 'next/server';
import { getAgents, createAgent } from '@/lib/agents/index.js';
import { requireAuth, canManageAgents } from '@/lib/auth/middleware.js';
import { auditLog } from '@/lib/audit/index.js';
import { AuthorizationError, ValidationError, AppError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    if (!canManageAgents(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const agents = await getAgents();
    return NextResponse.json({ success: true, data: { agents } });
  } catch (err) {
    console.error('[agents GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    if (!canManageAgents(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { name, email, phone, parentId, quotaLimit, balance } = body;
    if (!name || !email) throw new ValidationError('Name and email are required');
    const agent = await createAgent({
      name, email, phone, parentId, quotaLimit, balance,
      createdBy: user.id
    });
    return NextResponse.json({ success: true, data: { agent } }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    console.error('[agents POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
