'use client';
import { useState, useEffect } from 'react';

export default function AgentsPage() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', parentId: '', quotaLimit: 100, balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('t2hub_token');
    const userData = localStorage.getItem('t2hub_user');
    if (!token || !userData) { window.location.href = '/login'; return; }
    setUser(JSON.parse(userData));
    fetchAgents();
  }, []);

  async function fetchAgents() {
    const token = localStorage.getItem('t2hub_token');
    const res = await fetch('/api/agents', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setAgents(json.data.agents);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('t2hub_token');
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    if (json.success) {
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', parentId: '', quotaLimit: 100, balance: 0 });
      fetchAgents();
    } else {
      alert(json.error);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/[0.06] bg-[#0a0f1d]/95 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-sm font-bold">Agent Management</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-xs text-slate-400 hover:text-white">Dashboard</a>
          <span className="text-xs text-slate-400">{user?.name} ({user?.role})</span>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-xs text-red-400">Logout</button>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Agents</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400">
            {showForm ? 'Cancel' : 'Add Agent'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" required className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white" />
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white" />
              <input type="text" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} placeholder="Parent Agent ID (optional)" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white" />
              <input type="number" value={form.quotaLimit} onChange={e => setForm({ ...form, quotaLimit: Number(e.target.value) })} placeholder="Quota Limit" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white" />
              <input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: Number(e.target.value) })} placeholder="Balance" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white" />
            </div>
            <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-2 text-sm font-semibold text-white">Create Agent</button>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{agent.email}</p>
              <p className="text-xs text-slate-400 mt-2">Quota: {agent.quota_limit - agent.quota_used} / {agent.quota_limit}</p>
              <p className="text-xs text-slate-400">Balance: {agent.balance}</p>
              <p className="text-xs text-slate-500 mt-1">Level: {agent.level}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
