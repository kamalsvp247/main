'use client';
import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('t2hub_token', json.data.token);
        localStorage.setItem('t2hub_refresh', json.data.refreshToken);
        localStorage.setItem('t2hub_user', JSON.stringify(json.data.user));
        window.location.href = '/dashboard';
      } else {
        setError(json.error || 'Registration failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center">T2Hub Register</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" required className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white" />
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white" />
        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" required className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white" />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white">
          <option value="master_agent">Master Agent</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        <p className="text-center text-xs text-slate-500">Already have an account? <a href="/login" className="text-indigo-400">Login</a></p>
      </form>
    </div>
  );
}
