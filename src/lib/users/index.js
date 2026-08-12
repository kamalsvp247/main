import { getDb } from '@/lib/db/index.js';
import { comparePassword, generateToken, generateRefreshToken, hashPassword } from '@/lib/auth/index.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

const ROLES = ['master_agent', 'admin', 'staff'];

export async function getUsers() {
  const db = await getDb();
  return db.data.users.map(({ password_hash, ...u }) => u);
}

export async function getUserById(id) {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === id);
  if (!user) return null;
  const { password_hash, ...u } = user;
  return u;
}

export async function getUserByEmail(email) {
  const db = await getDb();
  return db.data.users.find(u => u.email === email) || null;
}

export async function getUserWithPassword(email) {
  const db = await getDb();
  return db.data.users.find(u => u.email === email) || null;
}

export async function createUser({ email, password, name, role, agentId, createdBy }) {
  const db = await getDb();
  if (!ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${ROLES.join(', ')}`);
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('User with this email already exists');
  }
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    email,
    password_hash: hashPassword(password),
    name: name || email.split('@')[0],
    role,
    agent_id: agentId || null,
    created_by: createdBy || null,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null
  };
  db.data.users.push(user);
  await db.write();
  await auditLog({
    actor_id: createdBy,
    action: 'user.created',
    resource_type: 'user',
    resource_id: user.id,
    details: { email, role, agent_id: agentId }
  });
  const { password_hash, ...u } = user;
  return u;
}

export async function updateUser(id, updates) {
  const db = await getDb();
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  if (updates.password) {
    updates.password_hash = hashPassword(updates.password);
    delete updates.password;
  }
  db.data.users[idx] = { ...db.data.users[idx], ...updates, updated_at: new Date().toISOString() };
  await db.write();
  const { password_hash, ...u } = db.data.users[idx];
  return u;
}

export async function deleteUser(id) {
  const db = await getDb();
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  db.data.users.splice(idx, 1);
  await db.write();
  return true;
}

export async function authenticateUser(email, password) {
  const user = await getUserWithPassword(email);
  if (!user) return null;
  if (user.status !== 'active') return null;
  if (!comparePassword(password, user.password_hash)) return null;
  const token = generateToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
  const db = await getDb();
  const idx = db.data.users.findIndex(u => u.id === user.id);
  db.data.users[idx].last_login = new Date().toISOString();
  await db.write();
  await auditLog({
    actor_id: user.id,
    action: 'user.login',
    resource_type: 'user',
    resource_id: user.id,
    details: { email }
  });
  const { password_hash, ...u } = user;
  return { user: u, token, refreshToken };
}

export async function refreshUserToken(refreshToken) {
  const decoded = requireRefreshToken(refreshToken);
  if (!decoded) return null;
  const user = await getUserById(decoded.id);
  if (!user || user.status !== 'active') return null;
  const token = generateToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
  const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
  return { token, refreshToken: newRefreshToken, user };
}

async function requireRefreshToken(token) {
  try {
    const { REFRESH_SECRET } = await import('@/lib/config.js');
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}
