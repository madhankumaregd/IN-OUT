import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import TransactionModal from '../components/TransactionModal';
import { useAuth } from '../hooks/useAuth';

function fmt(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function Transactions() {
  const { user, loading: authLoading, logout } = useAuth({ required: true });
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ type: '', categoryId: '', month: '', year: '' });
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: LIMIT, offset });
    if (filter.type) params.set('type', filter.type);
    if (filter.categoryId) params.set('categoryId', filter.categoryId);
    if (filter.month) params.set('month', filter.month);
    if (filter.year) params.set('year', filter.year);
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) { const d = await res.json(); setTransactions(d.transactions); setTotal(d.total); }
  }, [filter, offset]);

  const loadCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) { const d = await res.json(); setCategories(d.categories); }
  };

  useEffect(() => { if (user) { load(); loadCategories(); } }, [user, load]);

  if (authLoading || !user) return null;

  const currency = user.currency || 'USD';

  const handleDelete = async id => {
    if (!confirm('Delete this transaction?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    load();
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();

  return (
    <>
      <Head><title>Transactions — IN &amp; OUT</title></Head>
      <Layout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>Transactions</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{total} total records</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Transaction</button>
        </div>

        {/* Filters */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="input-dark" style={{ width: 'auto', flex: '1 1 140px' }}
            value={filter.type} onChange={e => { setFilter(f => ({ ...f, type: e.target.value })); setOffset(0); }}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input-dark" style={{ width: 'auto', flex: '1 1 160px' }}
            value={filter.categoryId} onChange={e => { setFilter(f => ({ ...f, categoryId: e.target.value })); setOffset(0); }}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select className="input-dark" style={{ width: 'auto', flex: '1 1 120px' }}
            value={filter.month} onChange={e => { setFilter(f => ({ ...f, month: e.target.value })); setOffset(0); }}>
            <option value="">All months</option>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-dark" style={{ width: 'auto', flex: '1 1 100px' }}
            value={filter.year} onChange={e => { setFilter(f => ({ ...f, year: e.target.value })); setOffset(0); }}>
            <option value="">All years</option>
            {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
          {(filter.type || filter.categoryId || filter.month || filter.year) && (
            <button className="btn-secondary" style={{ fontSize: 13 }}
              onClick={() => { setFilter({ type: '', categoryId: '', month: '', year: '' }); setOffset(0); }}>
              Clear filters
            </button>
          )}
        </div>

        {/* List */}
        <div className="glass-card">
          {transactions.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15 }}>No transactions found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters or add a new transaction</div>
            </div>
          ) : (
            <div>
              {transactions.map((tx, i) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, fontSize: 20,
                      background: tx.type === 'income' ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {tx.category?.icon || (tx.type === 'income' ? '↑' : '↓')}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span>{tx.category?.name || 'Uncategorized'}</span>
                        <span>·</span>
                        <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditing(tx); setModalOpen(true); }}
                        className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Edit</button>
                      <button onClick={() => handleDelete(tx.id)} className="btn-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" disabled={offset === 0}
              onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>← Prev</button>
            <span style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <button className="btn-secondary" disabled={offset + LIMIT >= total}
              onClick={() => setOffset(o => o + LIMIT)}>Next →</button>
          </div>
        )}

        <TransactionModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          transaction={editing}
          categories={categories}
          onSave={() => load()}
        />
      </Layout>
    </>
  );
}
