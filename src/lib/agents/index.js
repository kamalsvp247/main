import { ensureSupabase } from '@/lib/supabase/client.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

const TABLE = 'agents';

export async function getAgents() {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAgentById(id) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getAgentByEmail(email) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('email', email).single();
  if (error) return null;
  return data;
}

export async function getSubAgents(parentId) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('parent_id', parentId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAgentTree(rootId) {
  const supabase = await ensureSupabase();
  const root = await getAgentById(rootId);
  if (!root) return null;
  const children = await getSubAgents(rootId);
  const buildTree = async (parentId) => {
    const direct = await getSubAgents(parentId);
    return Promise.all(direct.map(async (agent) => ({
      ...agent,
      children: await buildTree(agent.id)
    })));
  };
  return {
    ...root,
    children: await buildTree(rootId)
  };
}

export async function createAgent({ name, email, phone, parentId, quotaLimit, balance, createdBy }) {
  const supabase = await ensureSupabase();
  if (await getAgentByEmail(email)) {
    throw new Error('Agent with this email already exists');
  }
  const parent = parentId ? await getAgentById(parentId) : null;
  const agent = {
    id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    email,
    phone: phone || null,
    parent_id: parentId || null,
    quota_limit: quotaLimit || 100,
    quota_used: 0,
    balance: balance || 0,
    status: 'active',
    level: parentId ? (parent?.level || 0) + 1 : 0,
    created_by: createdBy || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from(TABLE).insert(agent).select().single();
  if (error) throw new Error(error.message);
  await auditLog({
    actor_id: createdBy,
    action: 'agent.created',
    resource_type: 'agent',
    resource_id: agent.id,
    details: { name, email, parent_id: parentId, quota_limit: quotaLimit }
  });
  return data;
}

export async function updateAgent(id, updates) {
  const supabase = await ensureSupabase();
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAgent(id) {
  const supabase = await ensureSupabase();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function distributeQuota(parentId, childId, amount) {
  const supabase = await ensureSupabase();
  const parent = await getAgentById(parentId);
  const child = await getAgentById(childId);
  if (!parent || !child) throw new Error('Invalid agent IDs');
  if (parent.quota_limit - parent.quota_used < amount) {
    throw new Error('Insufficient quota balance');
  }
  await supabase.from(TABLE).update({ quota_used: parent.quota_used + amount }).eq('id', parentId);
  await supabase.from(TABLE).update({ quota_limit: child.quota_limit + amount }).eq('id', childId);
  await auditLog({
    actor_id: parentId,
    action: 'quota.distributed',
    resource_type: 'agent',
    resource_id: childId,
    details: { amount, from: parentId, to: childId }
  });
  return { parent: { ...parent, quota_used: parent.quota_used + amount }, child: { ...child, quota_limit: child.quota_limit + amount } };
}

export async function getAgentStats(agentId) {
  const agent = await getAgentById(agentId);
  if (!agent) return null;
  const subAgents = await getSubAgents(agentId);
  const totalSubQuota = subAgents.reduce((sum, a) => sum + a.quota_limit, 0);
  const totalSubUsed = subAgents.reduce((sum, a) => sum + a.quota_used, 0);
  return {
    ...agent,
    sub_agents_count: subAgents.length,
    total_sub_quota: totalSubQuota,
    total_sub_used: totalSubUsed,
    available_quota: agent.quota_limit - agent.quota_used
  };
}
