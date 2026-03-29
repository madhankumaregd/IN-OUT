import { useState, useEffect } from 'react';

export default function TransactionModal({ open, onClose, onSave, transaction, categories }) {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    amount: '', type: 'expense', description: '', date: '', categoryId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date ? transaction.date.split('T')[0] : '',
        categoryId: transaction.categoryId || '',
      });
    } else {
      setForm({ amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0], categoryId: '' });
    }
    setError('');
  }, [transaction, open]);

  if (!open) return null;

  const filteredCats = categories?.filter(c => c.type === form.type) || [];

  const handleSubmit = async () => {
    if (!form.amount || !form.description) { setError('Amount and description are required'); return; }
    setSaving(true); setError('');
    try {
      const url = isEdit ? `/api/transactions/${transaction.id}` : '/api/transactions';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      onSave(data.transaction);
      onClose();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 18 }}>
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t, categoryId: '' }))}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                background: form.type === t ? (t === 'income' ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)') : 'transparent',
                color: form.type === t ? (t === 'income' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
              {t === 'income' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Amount</label>
            <input className="input-dark" type="number" min="0" step="0.01"
              placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Description</label>
            <input className="input-dark" type="text" placeholder="What was this for?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
            <select className="input-dark" value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">No category</option>
              {filteredCats.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date</label>
            <input className="input-dark" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>

        {error && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ flex: 2 }}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
