import { getDb } from '@/lib/db/index.js';
import { NextResponse } from 'next/server';

export async function getAuditLogs(filters = {}) {
  const db = await getDb();
  let logs = db.data.auditLogs;
  if (filters.actor_id) logs = logs.filter(l => l.actor_id === filters.actor_id);
  if (filters.action) logs = logs.filter(l => l.action === filters.action);
  if (filters.resource_type) logs = logs.filter(l => l.resource_type === filters.resource_type);
  if (filters.resource_id) logs = logs.filter(l => l.resource_id === filters.resource_id);
  if (filters.start_date) logs = logs.filter(l => new Date(l.created_at) >= new Date(filters.start_date));
  if (filters.end_date) logs = logs.filter(l => new Date(l.created_at) <= new Date(filters.end_date));
  return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getAuditLogById(id) {
  const db = await getDb();
  return db.data.auditLogs.find(l => l.id === id) || null;
}

export async function auditLog({ actor_id, action, resource_type, resource_id, details, ip_address }) {
  const db = await getDb();
  const log = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    actor_id: actor_id || null,
    action,
    resource_type: resource_type || 'system',
    resource_id: resource_id || null,
    details: details || {},
    ip_address: ip_address || null,
    user_agent: null,
    created_at: new Date().toISOString()
  };
  db.data.auditLogs.push(log);
  await db.write();
  return log;
}

export async function exportAuditLogs(format = 'json') {
  const logs = await getAuditLogs();
  if (format === 'csv') {
    const headers = ['ID', 'Timestamp', 'Actor ID', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP'];
    const rows = logs.map(l => [
      l.id,
      l.created_at,
      l.actor_id || '',
      l.action,
      l.resource_type,
      l.resource_id || '',
      JSON.stringify(l.details),
      l.ip_address || ''
    ]);
    return { headers, rows };
  }
  return logs;
}
