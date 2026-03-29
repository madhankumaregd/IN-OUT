import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      router.push('/dashboard');
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Create Account — IN &amp; OUT</title></Head>
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 80% 50%, rgba(0,230,118,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(68,138,255,0.06) 0%, transparent 60%)',
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }} className="animate-fade-up">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--text)', lineHeight: 1 }}>
              IN &amp; OUT
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15 }}>Start tracking your finances</p>
          </div>

          <div className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Create account</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input className="input-dark" type="text" placeholder="Your name" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
                <input className="input-dark" type="email" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Password</label>
                <input className="input-dark" type="password" placeholder="Min. 6 characters" required minLength={6}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>

              {error && (
                <div style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)' }}>
                  {error}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={loading}
                style={{ marginTop: 4, justifyContent: 'center', width: '100%', padding: '13px' }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
              Already have one?{' '}
              <Link href="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 500 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
