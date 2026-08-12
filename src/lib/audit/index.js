import { ensureSupabase } from '@/lib/supabase/client.js';
import { NextResponse } from 'next/server';

const TABLE = 'audit_logs';

export async function getAuditLogs(filters = {}) {
  const supabase = await ensureSupabase();
  let query = supabase.from(TABLE).select('*');
  if (filters.actor_id) query = query.eq('actor_id', filters.actor_id);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.resource_type) query = query.eq('resource_type', filters.resource_type);
  if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
  if (filters.start_date) query = query.gte('created_at', filters.start_date);
  if (filters.end_date) query = query.lte('created_at', filters.end_date);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAuditLogById(id) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function auditLog({ actor_id, action, resource_type, resource_id, details, ip_address }) {
  const supabase = await ensureSupabase();
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
  const { data, error } = await supabase.from(TABLE).insert(log).select().single();
  if (error) throw new Error(error.message);
  return data;
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
