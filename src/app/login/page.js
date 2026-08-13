'use client';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    document.title = 'Login — T2Hub';
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('t2hub_token', json.data.token);
        localStorage.setItem('t2hub_refresh', json.data.refreshToken);
        localStorage.setItem('t2hub_user', JSON.stringify(json.data.user));
        window.location.href = '/dashboard';
      } else {
        setError(json.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  async function openRemoteBrowser() {
    setLoadingRemote(true);
    setError('');
    try {
      const res = await fetch('/api/svp-login-url');
      const json = await res.json();
      if (json.success) {
        const url = json.data.novncUrl;
        setRemoteUrl(url);
        window.open(url, '_blank', 'width=1280,height=800');
      } else {
        setError(json.error || 'Failed to load remote browser');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoadingRemote(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl space-y-4">
          <h1 className="text-2xl font-bold text-white text-center">T2Hub Login</h1>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white" />
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl space-y-3">
          <h2 className="text-lg font-semibold text-white text-center">SVP Browser</h2>
          <p className="text-xs text-slate-400 text-center">Open the remote SVP browser to complete OTP login manually.</p>
          <button type="button" onClick={openRemoteBrowser} disabled={loadingRemote} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loadingRemote ? 'Loading...' : 'Open Live Browser'}
          </button>
          {remoteUrl && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-2">
              <iframe src={remoteUrl} className="w-full h-[360px] rounded-lg border border-white/10" title="SVP Remote Browser" />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">Don&apos;t have an account? <a href="/register" className="text-indigo-400">Register</a></p>
      </div>
    </div>
  );
}
