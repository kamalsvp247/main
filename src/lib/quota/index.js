import { ensureSupabase } from '@/lib/supabase/client.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

const TABLE = 'quotas';

export async function getQuotas(filters = {}) {
  const supabase = await ensureSupabase();
  let query = supabase.from(TABLE).select('*');
  if (filters.agent_id) query = query.eq('agent_id', filters.agent_id);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getQuotaById(id) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getAgentQuota(agentId) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('agent_id', agentId);
  if (error) throw new Error(error.message);
  const quotas = data || [];
  const allocated = quotas.filter(q => q.type === 'allocated').reduce((sum, q) => sum + Number(q.amount), 0);
  const consumed = quotas.filter(q => q.type === 'consumed').reduce((sum, q) => sum + Number(q.amount), 0);
  const recharged = quotas.filter(q => q.type === 'recharged').reduce((sum, q) => sum + Number(q.amount), 0);
  return {
    agent_id: agentId,
    allocated,
    consumed,
    recharged,
    balance: allocated + recharged - consumed
  };
}

export async function allocateQuota({ agentId, amount, referenceId, details, createdBy }) {
  const supabase = await ensureSupabase();
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
  const { data, error } = await supabase.from(TABLE).insert(quota).select().single();
  if (error) throw new Error(error.message);
  await auditLog({
    actor_id: createdBy,
    action: 'quota.allocated',
    resource_type: 'quota',
    resource_id: quota.id,
    details: { agent_id: agentId, amount, reference_id: referenceId }
  });
  return data;
}

export async function consumeQuota({ agentId, amount, referenceId, details, createdBy }) {
  const supabase = await ensureSupabase();
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
  const { data, error } = await supabase.from(TABLE).insert(quota).select().single();
  if (error) throw new Error(error.message);
  await auditLog({
    actor_id: createdBy,
    action: 'quota.consumed',
    resource_type: 'quota',
    resource_id: quota.id,
    details: { agent_id: agentId, amount, reference_id: referenceId }
  });
  return data;
}

export async function rechargeQuota({ agentId, amount, paymentId, method, details, createdBy }) {
  const supabase = await ensureSupabase();
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
  const { data, error } = await supabase.from(TABLE).insert(quota).select().single();
  if (error) throw new Error(error.message);
  await auditLog({
    actor_id: createdBy,
    action: 'quota.recharged',
    resource_type: 'quota',
    resource_id: quota.id,
    details: { agent_id: agentId, amount, payment_id: paymentId, method }
  });
  return data;
}

export async function getQuotaUsageReport(agentId, startDate, endDate) {
  const supabase = await ensureSupabase();
  let query = supabase.from(TABLE).select('*').eq('agent_id', agentId);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const logs = data || [];
  const allocated = logs.filter(q => q.type === 'allocated').reduce((s, q) => s + Number(q.amount), 0);
  const consumed = logs.filter(q => q.type === 'consumed').reduce((s, q) => s + Number(q.amount), 0);
  const recharged = logs.filter(q => q.type === 'recharged').reduce((s, q) => s + Number(q.amount), 0);
  return { allocated, consumed, recharged, balance: allocated + recharged - consumed, logs };
}
