import { NextResponse } from 'next/server';
import { rechargeQuota } from '@/lib/quota/index.js';
import { auditLog } from '@/lib/audit/index.js';
import { AppError, ValidationError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { agent_id, amount, payment_id, method, status, details } = body;
    if (!agent_id || !amount) {
      throw new ValidationError('agent_id and amount are required');
    }
    if (status !== 'completed' && status !== 'succeeded') {
      return NextResponse.json({ success: true, data: { received: true, ignored: true } });
    }
    const quota = await rechargeQuota({
      agentId: agent_id,
      amount: Number(amount),
      paymentId: payment_id,
      method: method || 'payment_gateway',
      details: details || {},
      createdBy: null
    });
    await auditLog({
      action: 'payment.webhook',
      resource_type: 'payment',
      resource_id: payment_id,
      details: { agent_id, amount, method, status }
    });
    return NextResponse.json({ success: true, data: { quota } });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    console.error('[payments/webhook]', err);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}
