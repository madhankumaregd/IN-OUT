import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const CURRENCIES = ['USD','EUR','GBP','INR','JPY','CAD','AUD','CHF','SGD','MXN','BRL','KRW'];

export default function Settings() {
  const { user, loading: authLoading, logout, refetch } = useAuth({ required: true });
  const [profile, setProfile] = useState({ name: '', currency: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form from user
  useState(() => { if (user) setProfile({ name: user.name, currency: user.currency }); }, [user]);

  if (authLoading || !user) return null;

  const handleProfileSave = async () => {
    setSaving(true); setProfileErr(''); setProfileMsg('');
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name || user.name, currency: profile.currency || user.currency }),
    });
    const data = await res.json();
    if (!res.ok) { setProfileErr(data.error); } else { setProfileMsg('Profile updated!'); refetch(); }
    setSaving(false);
  };

  const handlePasswordSave = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) { setPwErr('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { setPwErr('New password must be at least 6 characters'); return; }
    setSaving(true); setPwErr(''); setPwMsg('');
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setPwErr(data.error); } else { setPwMsg('Password changed!'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    setSaving(false);
  };

  return (
    <>
      <Head><title>Settings — IN &amp; OUT</title></Head>
      <Layout user={user} onLogout={logout}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your account preferences</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
          {/* Profile */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Profile</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Update your display name and currency</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Display Name</label>
                <input className="input-dark" placeholder={user.name}
                  value={profile.name || user.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email (read-only)</label>
                <input className="input-dark" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Currency</label>
                <select className="input-dark"
                  value={profile.currency || user.currency}
                  onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {profileErr && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 10 }}>{profileErr}</p>}
            {profileMsg && <p style={{ color: 'var(--accent-green)', fontSize: 13, marginTop: 10 }}>✓ {profileMsg}</p>}

            <button className="btn-primary" onClick={handleProfileSave} disabled={saving} style={{ marginTop: 20 }}>
              Save Profile
            </button>
          </div>

          {/* Password */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Change Password</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Use a strong password you don't use elsewhere</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Current Password</label>
                <input className="input-dark" type="password" placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>New Password</label>
                <input className="input-dark" type="password" placeholder="Min. 6 characters"
                  value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
                <input className="input-dark" type="password" placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
            </div>

            {pwErr && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 10 }}>{pwErr}</p>}
            {pwMsg && <p style={{ color: 'var(--accent-green)', fontSize: 13, marginTop: 10 }}>✓ {pwMsg}</p>}

            <button className="btn-primary" onClick={handlePasswordSave} disabled={saving} style={{ marginTop: 20 }}>
              Change Password
            </button>
          </div>

          {/* Account info */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Account Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'User ID', value: user.id },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontFamily: row.label === 'User ID' ? 'monospace' : 'inherit', color: 'var(--text)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="glass-card" style={{ padding: 28, border: '1px solid rgba(255,82,82,0.2)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, color: 'var(--accent-red)' }}>Sign Out</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Sign out from your account on this device</p>
            <button className="btn-danger" onClick={logout} style={{ padding: '10px 20px', fontSize: 14 }}>
              Sign Out
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
}
