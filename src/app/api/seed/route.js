import { initDb } from '@/lib/db/index.js';
import { createAgent } from '@/lib/agents/index.js';
import { createUser } from '@/lib/users/index.js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Seed endpoint disabled in production' }, { status: 403 });
  }
  try {
    await initDb();
    const masterPassword = process.env.MASTER_AGENT_PASSWORD || 'master123';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const staffPassword = process.env.STAFF_PASSWORD || 'staff123';
    const masterAgent = await createAgent({
      name: 'Master Agent',
      email: process.env.MASTER_AGENT_EMAIL || 'master@t2hub.app',
      phone: null,
      parentId: null,
      quotaLimit: 99999,
      balance: 0,
      createdBy: null
    });
    const admin = await createUser({
      email: process.env.ADMIN_EMAIL || 'admin@t2hub.app',
      password: adminPassword,
      name: 'System Admin',
      role: 'admin',
      agentId: masterAgent.id,
      createdBy: null
    });
    const staff = await createUser({
      email: 'staff@t2hub.app',
      password: staffPassword,
      name: 'Staff User',
      role: 'staff',
      agentId: masterAgent.id,
      createdBy: admin.id
    });
    return NextResponse.json({
      success: true,
      data: {
        master_agent: { email: process.env.MASTER_AGENT_EMAIL || 'master@t2hub.app', password: masterPassword, id: masterAgent.id },
        admin: { email: process.env.ADMIN_EMAIL || 'admin@t2hub.app', password: adminPassword, id: admin.id },
        staff: { email: 'staff@t2hub.app', password: staffPassword, id: staff.id }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
