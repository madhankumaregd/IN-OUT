import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#00e676','#448aff','#ff5252','#ffca28','#7c4dff','#00bcd4','#ff9100','#e040fb','#f97316','#10b981','#ec4899','#14b8a6'];
const EMOJIS = ['💰','🍔','🚗','🛍️','🎬','💊','🏠','💡','📚','💼','💻','📈','🎁','✈️','🎮','🍕','☕','🏋️','🎵','📱','🛡️','🧴','🐾','🌿'];

export default function Categories() {
  const { user, loading: authLoading, logout } = useAuth({ required: true });
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '💰', color: '#00e676', type: 'expense' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) { const d = await res.json(); setCategories(d.categories); }
  };

  useEffect(() => { if (user) load(); }, [user]);
  if (authLoading || !user) return null;

  const filtered = categories.filter(c => c.type === tab);

  const handleSave = async () => {
    if (!form.name) { setError('Name is required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: tab }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setModalOpen(false); setForm({ name: '', icon: '💰', color: '#00e676', type: tab });
    load(); setSaving(false);
  };

  const handleDelete = async id => {
    if (!confirm('Delete this category? Existing transactions will be uncategorized.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <Head><title>Categories — IN &amp; OUT</title></Head>
      <Layout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>Categories</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your transaction categories</p>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Category</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content', border: '1px solid var(--border)' }}>
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 24px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              background: tab === t ? (t === 'income' ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)') : 'transparent',
              color: tab === t ? (t === 'income' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>
              {t === 'expense' ? '↓ Expenses' : '↑ Income'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⊞</div>
            <div style={{ fontSize: 15, marginBottom: 6 }}>No {tab} categories yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Create categories to organize your transactions</div>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Category</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {filtered.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, fontSize: 22,
                  background: `${c.color}22`, border: `1px solid ${c.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.color}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="btn-danger" style={{ padding: '4px 8px', fontSize: 12, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
            <div className="modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Add Category</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                {['expense', 'income'].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                    background: form.type === t ? (t === 'income' ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)') : 'transparent',
                    color: form.type === t ? (t === 'income' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-muted)',
                  }}>
                    {t === 'income' ? '↑ Income' : '↓ Expense'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name</label>
                  <input className="input-dark" placeholder="Category name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Icon</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))} style={{
                        width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 17,
                        border: form.icon === e ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                        background: form.icon === e ? 'rgba(0,230,118,0.1)' : 'var(--bg)',
                      }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                        width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: form.color === c ? '3px solid white' : '2px solid transparent',
                        boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                        transition: 'all 0.15s',
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {error && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
                  {saving ? 'Saving…' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
