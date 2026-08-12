import { NextResponse } from 'next/server';
import { getQuotas, getAgentQuota, allocateQuota, consumeQuota, rechargeQuota, getQuotaUsageReport } from '@/lib/quota/index.js';
import { requireAuth, canManageQuota, isMasterAgent } from '@/lib/auth/middleware.js';
import { getUserById } from '@/lib/users/index.js';
import { AuthorizationError, ValidationError, AppError, QuotaExceededError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agent_id');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const reportFor = url.searchParams.get('report_for');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    if (reportFor) {
      if (!canManageQuota(user)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      const report = await getQuotaUsageReport(reportFor, startDate, endDate);
      return NextResponse.json({ success: true, data: { report } });
    }
    if (agentId && !isMasterAgent(user) && user.agent_id !== agentId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const quotas = await getQuotas({ agent_id: agentId || undefined, type: type || undefined, status: status || undefined });
    if (agentId && quotas.length === 0) {
      const balance = await getAgentQuota(agentId);
      return NextResponse.json({ success: true, data: { quotas: [], balance } });
    }
    return NextResponse.json({ success: true, data: { quotas } });
  } catch (err) {
    console.error('[quota GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    const body = await request.json();
    const { action, agentId, amount, referenceId, details } = body;
    if (!canManageQuota(user) && !isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    switch (action) {
      case 'allocate':
        const allocated = await allocateQuota({ agentId, amount: Number(amount), referenceId, details, createdBy: user.id });
        return NextResponse.json({ success: true, data: { quota: allocated } }, { status: 201 });
      case 'consume': {
        const consumed = await consumeQuota({ agentId, amount: Number(amount), referenceId, details, createdBy: user.id });
        return NextResponse.json({ success: true, data: { quota: consumed } });
      }
      case 'recharge': {
        const recharged = await rechargeQuota({ agentId, amount: Number(amount), paymentId: referenceId, details, createdBy: user.id });
        return NextResponse.json({ success: true, data: { quota: recharged } });
      }
      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    console.error('[quota POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
