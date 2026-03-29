import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

function fmt(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

const EMOJIS = ['🎯','🏠','🚗','✈️','💻','🎓','💍','🏖️','🏋️','📱','💰','🎸','🐶','🌍','🛒'];

export default function Goals() {
  const { user, loading: authLoading, logout } = useAuth({ required: true });
  const [goals, setGoals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [depositModal, setDepositModal] = useState(null);
  const [form, setForm] = useState({ name: '', targetAmount: '', savedAmount: '', deadline: '', icon: '🎯' });
  const [depositAmount, setDepositAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/goals');
    if (res.ok) { const d = await res.json(); setGoals(d.goals); }
  };

  useEffect(() => { if (user) load(); }, [user]);
  if (authLoading || !user) return null;
  const currency = user.currency || 'USD';

  const handleSave = async () => {
    if (!form.name || !form.targetAmount) { setError('Name and target amount required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setModalOpen(false); setForm({ name: '', targetAmount: '', savedAmount: '', deadline: '', icon: '🎯' });
    load(); setSaving(false);
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount)) return;
    const goal = depositModal;
    const newSaved = goal.savedAmount + parseFloat(depositAmount);
    await fetch(`/api/goals/${goal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedAmount: newSaved }),
    });
    setDepositModal(null); setDepositAmount(''); load();
  };

  const handleDelete = async id => {
    if (!confirm('Delete this goal?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    load();
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <>
      <Head><title>Goals — IN &amp; OUT</title></Head>
      <Layout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>Savings Goals</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track your progress toward financial goals</p>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New Goal</button>
        </div>

        {/* Summary */}
        {goals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Goals', value: goals.length, color: 'var(--accent-blue)' },
              { label: 'Total Target', value: fmt(totalTarget, currency), color: 'var(--text)' },
              { label: 'Total Saved', value: fmt(totalSaved, currency), color: 'var(--accent-green)' },
              { label: 'Completed', value: goals.filter(g => g.savedAmount >= g.targetAmount).length, color: 'var(--accent-yellow)' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '18px 22px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {goals.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No goals yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Set a savings goal to stay motivated</div>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Create your first goal</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {goals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
              const done = g.savedAmount >= g.targetAmount;
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
              return (
                <div key={g.id} className="glass-card" style={{ padding: '22px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div>
                        {daysLeft !== null && (
                          <div style={{ fontSize: 12, color: daysLeft < 30 ? 'var(--accent-red)' : 'var(--text-muted)', marginTop: 2 }}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                          </div>
                        )}
                      </div>
                    </div>
                    {done && (
                      <span style={{ fontSize: 11, background: 'rgba(0,230,118,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Saved: <strong style={{ color: 'var(--text)' }}>{fmt(g.savedAmount, currency)}</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>Goal: <strong style={{ color: 'var(--text)' }}>{fmt(g.targetAmount, currency)}</strong></span>
                    </div>
                    <div className="progress-bar" style={{ height: 10 }}>
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: done ? 'var(--accent-green)' : `linear-gradient(90deg, var(--accent-blue), var(--accent-green))`,
                      }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{pct.toFixed(1)}%</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {!done && (
                      <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '8px 12px' }}
                        onClick={() => setDepositModal(g)}>
                        + Add funds
                      </button>
                    )}
                    <button onClick={() => handleDelete(g.id)} className="btn-danger" style={{ flex: done ? 1 : 0, padding: '8px 12px', fontSize: 13 }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Goal Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
            <div className="modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>New Goal</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>

              {/* Emoji picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Icon</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))}
                      style={{
                        width: 38, height: 38, borderRadius: 8, border: form.icon === e ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                        background: form.icon === e ? 'rgba(0,230,118,0.1)' : 'var(--bg)',
                        cursor: 'pointer', fontSize: 18,
                      }}>{e}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Goal Name</label>
                  <input className="input-dark" placeholder="e.g. Emergency Fund" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Amount</label>
                  <input className="input-dark" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Already Saved (optional)</label>
                  <input className="input-dark" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.savedAmount} onChange={e => setForm(f => ({ ...f, savedAmount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Date (optional)</label>
                  <input className="input-dark" type="date" value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              {error && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
                  {saving ? 'Saving…' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {depositModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDepositModal(null)}>
            <div className="modal-box" style={{ maxWidth: 360 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Add Funds</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Adding to: <strong style={{ color: 'var(--text)' }}>{depositModal.name}</strong>
              </p>
              <input className="input-dark" type="number" min="0" step="0.01" placeholder="Amount to add"
                value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                style={{ marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={() => setDepositModal(null)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleDeposit} style={{ flex: 2 }}>Add Funds</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
