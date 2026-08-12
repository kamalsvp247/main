'use client';
import { useState, useEffect } from 'react';

export default function AdminAuditPage() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('t2hub_user');
    if (!userData) { window.location.href = '/login'; return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'master_agent' && parsed.role !== 'admin') { window.location.href = '/dashboard'; return; }
    setUser(parsed);
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const token = localStorage.getItem('t2hub_token');
    const res = await fetch('/api/audit', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setLogs(json.data.logs);
    setLoading(false);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/[0.06] bg-[#0a0f1d]/95 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-sm font-bold">Admin — Audit Logs</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/admin" className="text-xs text-slate-400 hover:text-white">Back to Admin</a>
          <span className="text-xs text-slate-400">{user?.name}</span>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{log.action}</h3>
                <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Resource: {log.resource_type} / {log.resource_id}</p>
              <p className="text-xs text-slate-500">Actor: {log.actor_id || 'system'}</p>
              <pre className="mt-2 text-xs text-slate-400 bg-black/20 rounded-lg p-3 overflow-auto max-h-40">{JSON.stringify(log.details, null, 2)}</pre>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
