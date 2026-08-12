import { NextResponse } from 'next/server';
import { getAgentById, updateAgent, deleteAgent, getAgentStats, getSubAgents, distributeQuota } from '@/lib/agents/index.js';
import { requireAuth, canManageAgents } from '@/lib/auth/middleware.js';
import { auditLog } from '@/lib/audit/index.js';
import { AuthorizationError, ValidationError, AppError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    const agent = await getAgentById(params.id);
    if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    const isOwn = user.agent_id === agent.id;
    const isAdmin = canManageAgents(user);
    if (!isOwn && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const stats = await getAgentStats(params.id);
    const subAgents = await getSubAgents(params.id);
    return NextResponse.json({ success: true, data: { agent: stats, sub_agents: subAgents } });
  } catch (err) {
    console.error('[agents/:id GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    if (!canManageAgents(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const agent = await updateAgent(params.id, body);
    if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { agent } });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    console.error('[agents/:id PUT]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    if (!canManageAgents(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const ok = await deleteAgent(params.id);
    if (!ok) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('[agents/:id DELETE]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    if (!canManageAgents(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { childId, amount } = body;
    if (!childId || !amount) throw new ValidationError('childId and amount are required');
    const result = await distributeQuota(params.id, childId, Number(amount));
    return NextResponse.json({ success: true, data: { parent: result.parent, child: result.child } });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    console.error('[agents/:id/distribute POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
