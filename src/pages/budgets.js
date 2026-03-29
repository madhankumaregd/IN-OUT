import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

function fmt(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function Budgets() {
  const { user, loading: authLoading, logout } = useAuth({ required: true });
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const load = useCallback(async () => {
    const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
    if (res.ok) { const d = await res.json(); setBudgets(d.budgets); }
  }, [month, year]);

  const loadCategories = async () => {
    const res = await fetch('/api/categories?type=expense');
    if (res.ok) { const d = await res.json(); setCategories(d.categories); }
  };

  useEffect(() => { if (user) { load(); loadCategories(); } }, [user, load]);

  if (authLoading || !user) return null;
  const currency = user.currency || 'USD';

  const handleSave = async () => {
    if (!form.categoryId || !form.amount) { setError('Category and amount required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, month, year }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setModalOpen(false); setForm({ categoryId: '', amount: '' }); load();
    setSaving(false);
  };

  const handleDelete = async id => {
    if (!confirm('Delete this budget?')) return;
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    load();
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <Head><title>Budgets — IN &amp; OUT</title></Head>
      <Layout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>Budgets</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Set spending limits by category</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={`${year}-${month}`}
              onChange={e => { const [y, m] = e.target.value.split('-'); setYear(+y); setMonth(+m); }}
              className="input-dark" style={{ width: 'auto' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const v = `${d.getFullYear()}-${d.getMonth() + 1}`;
                return <option key={v} value={v}>{months[d.getMonth()]} {d.getFullYear()}</option>;
              })}
            </select>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Budget</button>
          </div>
        </div>

        {/* Summary */}
        {budgets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Budgeted', value: fmt(totalBudgeted, currency), color: 'var(--accent-blue)' },
              { label: 'Total Spent', value: fmt(totalSpent, currency), color: 'var(--accent-red)' },
              { label: 'Remaining', value: fmt(totalBudgeted - totalSpent, currency), color: totalBudgeted - totalSpent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '18px 22px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Budget list */}
        {budgets.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No budgets for this month</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Set spending limits to stay on track</div>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add your first budget</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {budgets.map(b => {
              const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
              const over = b.spent > b.amount;
              const barColor = over ? 'var(--accent-red)' : pct > 75 ? 'var(--accent-yellow)' : 'var(--accent-green)';
              return (
                <div key={b.id} className="glass-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, fontSize: 20,
                        background: `${b.category.color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{b.category.icon}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{b.category.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {fmt(b.spent, currency)} of {fmt(b.amount, currency)} spent
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {over && (
                        <span style={{ fontSize: 11, background: 'rgba(255,82,82,0.15)', color: 'var(--accent-red)', border: '1px solid rgba(255,82,82,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                          Over budget!
                        </span>
                      )}
                      <span style={{ fontSize: 16, fontWeight: 700, color: barColor }}>{pct.toFixed(0)}%</span>
                      <button onClick={() => handleDelete(b.id)} className="btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Remove</button>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Remaining: <strong style={{ color: over ? 'var(--accent-red)' : 'var(--text)' }}>{fmt(b.amount - b.spent, currency)}</strong></span>
                    <span>Budget: {fmt(b.amount, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
            <div className="modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Add Budget</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
                  <select className="input-dark" value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Monthly Budget Amount</label>
                  <input className="input-dark" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              {error && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
                  {saving ? 'Saving…' : 'Set Budget'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
