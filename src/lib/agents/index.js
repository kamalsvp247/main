import { getDb } from '@/lib/db/index.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

export async function getAgents() {
  const db = await getDb();
  return db.data.agents;
}

export async function getAgentById(id) {
  const db = await getDb();
  return db.data.agents.find(a => a.id === id) || null;
}

export async function getAgentByEmail(email) {
  const db = await getDb();
  return db.data.agents.find(a => a.email === email) || null;
}

export async function getSubAgents(parentId) {
  const db = await getDb();
  return db.data.agents.filter(a => a.parent_id === parentId);
}

export async function getAgentTree(rootId) {
  const db = await getDb();
  const root = db.data.agents.find(a => a.id === rootId);
  if (!root) return null;
  const children = db.data.agents.filter(a => a.parent_id === rootId);
  const buildTree = async (parentId) => {
    const direct = db.data.agents.filter(a => a.parent_id === parentId);
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
  const db = await getDb();
  if (await getAgentByEmail(email)) {
    throw new Error('Agent with this email already exists');
  }
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
    level: parentId ? (await getAgentById(parentId))?.level + 1 || 1 : 0,
    created_by: createdBy || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.data.agents.push(agent);
  await db.write();
  await auditLog({
    actor_id: createdBy,
    action: 'agent.created',
    resource_type: 'agent',
    resource_id: agent.id,
    details: { name, email, parent_id: parentId, quota_limit: quotaLimit }
  });
  return agent;
}

export async function updateAgent(id, updates) {
  const db = await getDb();
  const idx = db.data.agents.findIndex(a => a.id === id);
  if (idx === -1) return null;
  db.data.agents[idx] = { ...db.data.agents[idx], ...updates, updated_at: new Date().toISOString() };
  await db.write();
  return db.data.agents[idx];
}

export async function deleteAgent(id) {
  const db = await getDb();
  const idx = db.data.agents.findIndex(a => a.id === id);
  if (idx === -1) return false;
  db.data.agents.splice(idx, 1);
  await db.write();
  return true;
}

export async function distributeQuota(parentId, childId, amount) {
  const db = await getDb();
  const parent = db.data.agents.find(a => a.id === parentId);
  const child = db.data.agents.find(a => a.id === childId);
  if (!parent || !child) throw new Error('Invalid agent IDs');
  if (parent.quota_limit - parent.quota_used < amount) {
    throw new Error('Insufficient quota balance');
  }
  parent.quota_used += amount;
  child.quota_limit += amount;
  await db.write();
  await auditLog({
    actor_id: parentId,
    action: 'quota.distributed',
    resource_type: 'agent',
    resource_id: childId,
    details: { amount, from: parentId, to: childId }
  });
  return { parent, child };
}

export async function getAgentStats(agentId) {
  const db = await getDb();
  const agent = db.data.agents.find(a => a.id === agentId);
  if (!agent) return null;
  const subAgents = db.data.agents.filter(a => a.parent_id === agentId);
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
