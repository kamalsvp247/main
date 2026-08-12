import { getDb } from '@/lib/db/index.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

export async function getQuotas(filters = {}) {
  const db = await getDb();
  let quotas = db.data.quotas;
  if (filters.agent_id) quotas = quotas.filter(q => q.agent_id === filters.agent_id);
  if (filters.type) quotas = quotas.filter(q => q.type === filters.type);
  if (filters.status) quotas = quotas.filter(q => q.status === filters.status);
  return quotas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getQuotaById(id) {
  const db = await getDb();
  return db.data.quotas.find(q => q.id === id) || null;
}

export async function getAgentQuota(agentId) {
  const db = await getDb();
  const quotas = db.data.quotas.filter(q => q.agent_id === agentId);
  const totalAllocated = quotas
    .filter(q => q.type === 'allocated')
    .reduce((sum, q) => sum + q.amount, 0);
  const totalConsumed = quotas
    .filter(q => q.type === 'consumed')
    .reduce((sum, q) => sum + q.amount, 0);
  const totalRecharged = quotas
    .filter(q => q.type === 'recharged')
    .reduce((sum, q) => sum + q.amount, 0);
  return {
    agent_id: agentId,
    allocated: totalAllocated,
    consumed: totalConsumed,
    recharged: totalRecharged,
    balance: totalAllocated + totalRecharged - totalConsumed
  };
}

export async function allocateQuota({ agentId, amount, referenceId, details, createdBy }) {
  const db = await getDb();
  const agent = db.data.agents.find(a => a.id === agentId);
  if (!agent) throw new Error('Agent not found');
  const quota = {
    id: `quota_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    agent_id: agentId,
    type: 'allocated',
    amount,
    status: 'active',
    reference_id: referenceId || null,
    details: details || {},
    created_by: createdBy || null,
    created_at: new Date().toISOString()
  };
  db.data.quotas.push(quota);
  agent.quota_limit += amount;
  await db.write();
  await auditLog({
    actor_id: createdBy,
    action: 'quota.allocated',
    resource_type: 'quota',
    resource_id: quota.id,
    details: { agent_id: agentId, amount, reference_id: referenceId }
  });
  return quota;
}

export async function consumeQuota({ agentId, amount, referenceId, details, createdBy }) {
  const db = await getDb();
  const agent = db.data.agents.find(a => a.id === agentId);
  if (!agent) throw new Error('Agent not found');
  if (agent.quota_limit - agent.quota_used < amount) {
    throw new Error('Insufficient quota');
  }
  const quota = {
    id: `quota_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    agent_id: agentId,
    type: 'consumed',
    amount,
    status: 'active',
    reference_id: referenceId || null,
    details: details || {},
    created_by: createdBy || null,
    created_at: new Date().toISOString()
  };
  db.data.quotas.push(quota);
  agent.quota_used += amount;
  await db.write();
  await auditLog({
    actor_id: createdBy,
    action: 'quota.consumed',
    resource_type: 'quota',
    resource_id: quota.id,
    details: { agent_id: agentId, amount, reference_id: referenceId }
  });
  return quota;
}

export async function rechargeQuota({ agentId, amount, paymentId, method, details, createdBy }) {
  const db = await getDb();
  const agent = db.data.agents.find(a => a.id === agentId);
  if (!agent) throw new Error('Agent not found');
  const quota = {
    id: `quota_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    agent_id: agentId,
    type: 'recharged',
    amount,
    status: 'active',
    reference_id: paymentId || null,
    details: { ...details, method },
    created_by: createdBy || null,
    created_at: new Date().toISOString()
  };
  db.data.quotas.push(quota);
  agent.quota_limit += amount;
  await db.write();
  await auditLog({
    actor_id: createdBy,
    action: 'quota.recharged',
    resource_type: 'quota',
    resource_id: quota.id,
    details: { agent_id: agentId, amount, payment_id: paymentId, method }
  });
  return quota;
}

export async function getQuotaUsageReport(agentId, startDate, endDate) {
  const db = await getDb();
  let logs = db.data.quotas.filter(q => q.agent_id === agentId);
  if (startDate) logs = logs.filter(q => new Date(q.created_at) >= new Date(startDate));
  if (endDate) logs = logs.filter(q => new Date(q.created_at) <= new Date(endDate));
  const allocated = logs.filter(q => q.type === 'allocated').reduce((s, q) => s + q.amount, 0);
  const consumed = logs.filter(q => q.type === 'consumed').reduce((s, q) => s + q.amount, 0);
  const recharged = logs.filter(q => q.type === 'recharged').reduce((s, q) => s + q.amount, 0);
  return { allocated, consumed, recharged, balance: allocated + recharged - consumed, logs };
}
