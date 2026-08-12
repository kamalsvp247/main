import { NextResponse } from 'next/server';
import { getAuditLogs, exportAuditLogs } from '@/lib/audit/index.js';
import { requireAuth, canViewAudit } from '@/lib/auth/middleware.js';
import { AuthorizationError } from '@/lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;
    if (!canViewAudit(user)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const url = new URL(request.url);
    const actorId = url.searchParams.get('actor_id');
    const action = url.searchParams.get('action');
    const resourceType = url.searchParams.get('resource_type');
    const resourceId = url.searchParams.get('resource_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const format = url.searchParams.get('format') || 'json';
    if (format === 'csv') {
      const exportData = await exportAuditLogs('csv');
      const csvContent = [exportData.headers, ...exportData.rows].map(r => r.join(',')).join('\n');
      return new NextResponse(csvContent, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="audit_logs.csv"' }
      });
    }
    const logs = await getAuditLogs({ actor_id: actorId || undefined, action: action || undefined, resource_type: resourceType || undefined, resource_id: resourceId || undefined, start_date: startDate || undefined, end_date: endDate || undefined });
    return NextResponse.json({ success: true, data: { logs } });
  } catch (err) {
    console.error('[audit GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
