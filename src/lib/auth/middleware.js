import { getTokenFromRequest, verifyToken } from './index.js';
import { NextResponse } from 'next/server';

export async function requireAuth(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 }), user: null };
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 }), user: null };
  }
  return { error: null, user: decoded };
}

export function hasRole(user, ...roles) {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}

export function isMasterAgent(user) {
  return user?.role === 'master_agent';
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isStaff(user) {
  return user?.role === 'staff';
}

export function canManageAgents(user) {
  return isMasterAgent(user) || isAdmin(user);
}

export function canViewAudit(user) {
  return isMasterAgent(user) || isAdmin(user);
}

export function canManageQuota(user) {
  return isMasterAgent(user);
}
