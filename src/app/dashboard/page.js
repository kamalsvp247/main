'use client';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ candidates: 0, bookings: 0, successRate: '0%' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('t2hub_token');
    const userData = localStorage.getItem('t2hub_user');
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/[0.06] bg-[#0a0f1d]/95 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-sm font-bold">T2Hub Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">{user?.name} ({user?.role})</span>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-xs text-red-400 hover:text-red-300">Logout</button>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Candidates</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.candidates}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Active Bookings</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.bookings}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Success Rate</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.successRate}</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/" className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
                <p className="font-medium text-white">Search Exam Centers</p>
                <p className="text-xs text-slate-500 mt-1">Find available exam centers and dates</p>
              </a>
              <a href="/agents" className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
                <p className="font-medium text-white">Agent Management</p>
                <p className="text-xs text-slate-500 mt-1">Manage agents and sub-agents</p>
              </a>
              {(user?.role === 'master_agent' || user?.role === 'admin') && (
                <>
                  <a href="/admin/agents" className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
                    <p className="font-medium text-white">Admin — Agents</p>
                    <p className="text-xs text-slate-500 mt-1">Full agent administration</p>
                  </a>
                  <a href="/admin/quotas" className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
                    <p className="font-medium text-white">Admin — Quotas</p>
                    <p className="text-xs text-slate-500 mt-1">Quota allocation and monitoring</p>
                  </a>
                  <a href="/admin/audit" className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
                    <p className="font-medium text-white">Admin — Audit Logs</p>
                    <p className="text-xs text-slate-500 mt-1">System activity and compliance</p>
                  </a>
                </>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <p className="text-sm text-slate-500">Activity log will appear here...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
