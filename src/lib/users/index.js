import { ensureSupabase } from '@/lib/supabase/client.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

const TABLE = 'users';
const SERVICE_ROLE = 'service_role';

export async function getUsers() {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('id,email,name,role,agent_id,created_by,status,created_at,updated_at,last_login');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUserById(id) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('id,email,name,role,agent_id,created_by,status,created_at,updated_at,last_login').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getUserByEmail(email) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('email', email).single();
  if (error) return null;
  return data;
}

export async function getUserWithPassword(email) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('email', email).single();
  if (error) return null;
  return data;
}

export async function createUser({ email, password, name, role, agentId, createdBy }) {
  const supabase = await ensureSupabase();
  const password_hash = await hashPassword(password);
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    email,
    password_hash,
    name: name || email.split('@')[0],
    role: role || 'staff',
    agent_id: agentId || null,
    created_by: createdBy || null,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null
  };
  const { data, error } = await supabase.from(TABLE).insert(user).select().single();
  if (error) throw new Error(error.message);
  await auditLog({
    actor_id: createdBy,
    action: 'user.created',
    resource_type: 'user',
    resource_id: user.id,
    details: { email, role, agent_id: agentId }
  });
  return data;
}

export async function updateUser(id, updates) {
  const supabase = await ensureSupabase();
  if (updates.password) {
    updates.password_hash = await hashPassword(updates.password);
    delete updates.password;
  }
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteUser(id) {
  const supabase = await ensureSupabase();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function authenticateUser(email, password) {
  const supabase = await ensureSupabase();
  const user = await getUserWithPassword(email);
  if (!user) return null;
  if (user.status !== 'active') return null;
  if (!await comparePassword(password, user.password_hash)) return null;
  const token = generateToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, agent_id: user.agent_id });
  await supabase.from(TABLE).update({ last_login: new Date().toISOString() }).eq('id', user.id);
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

async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hashSync(password, 12);
}

async function comparePassword(password, hash) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compareSync(password, hash);
}

function generateToken(payload) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 't2hub-jwt-secret-change-in-production', { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

function generateRefreshToken(payload) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.REFRESH_SECRET || 't2hub-refresh-secret-change-in-production', { expiresIn: process.env.REFRESH_EXPIRES || '30d' });
}

function requireRefreshToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.REFRESH_SECRET || 't2hub-refresh-secret-change-in-production');
  } catch {
    return null;
  }
}
