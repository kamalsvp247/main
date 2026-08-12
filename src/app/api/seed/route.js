import { initDb } from '@/lib/db/index.js';
import { hashPassword } from '@/lib/auth/index.js';
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
    const masterAgent = await createAgent({
      name: 'Master Agent',
      email: 'master@t2hub.app',
      phone: null,
      parentId: null,
      quotaLimit: 99999,
      balance: 0,
      createdBy: null
    });
    const admin = await createUser({
      email: 'admin@t2hub.app',
      password: 'admin123',
      name: 'System Admin',
      role: 'admin',
      agentId: masterAgent.id,
      createdBy: null
    });
    const staff = await createUser({
      email: 'staff@t2hub.app',
      password: 'staff123',
      name: 'Staff User',
      role: 'staff',
      agentId: masterAgent.id,
      createdBy: admin.id
    });
    return NextResponse.json({
      success: true,
      data: {
        master_agent: { email: 'master@t2hub.app', password: 'master123', id: masterAgent.id },
        admin: { email: 'admin@t2hub.app', password: 'admin123', id: admin.id },
        staff: { email: 'staff@t2hub.app', password: 'staff123', id: staff.id }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
