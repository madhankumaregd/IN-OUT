import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import TransactionModal from '../components/TransactionModal';
import { useAuth } from '../hooks/useAuth';

function fmt(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth({ required: true });
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const loadStats = async () => {
    const res = await fetch(`/api/stats/dashboard?month=${month}&year=${year}`);
    if (res.ok) setStats(await res.json());
  };

  const loadCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) { const d = await res.json(); setCategories(d.categories); }
  };

  useEffect(() => {
    if (user) { loadStats(); loadCategories(); }
  }, [user, month, year]);

  if (authLoading || !user) return null;

  const currency = user.currency || 'USD';

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const PIE_COLORS = ['#00e676','#448aff','#ff5252','#ffca28','#7c4dff','#00bcd4','#ff9100','#e040fb'];

  return (
    <>
      <Head><title>Dashboard — IN &amp; OUT</title></Head>
      <Layout user={user} onLogout={logout}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1 }}>
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'},{' '}
              <span style={{ color: 'var(--accent-green)' }}>{user.name.split(' ')[0]}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Here's your financial overview</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={`${year}-${month}`}
              onChange={e => { const [y, m] = e.target.value.split('-'); setYear(+y); setMonth(+m); }}
              className="input-dark" style={{ width: 'auto', padding: '8px 12px' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const v = `${d.getFullYear()}-${d.getMonth() + 1}`;
                return <option key={v} value={v}>{months[d.getMonth()]} {d.getFullYear()}</option>;
              })}
            </select>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Transaction</button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard label="Net Worth" icon="🏦"
            value={stats ? fmt(stats.netWorth, currency) : '—'}
            color={stats?.netWorth >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
            sub="All-time balance" />
          <StatCard label="Income" icon="↑"
            value={stats ? fmt(stats.totalIncome, currency) : '—'}
            color="var(--accent-green)" sub="This month" />
          <StatCard label="Expenses" icon="↓"
            value={stats ? fmt(stats.totalExpense, currency) : '—'}
            color="var(--accent-red)" sub="This month" />
          <StatCard label="Saved" icon="💎"
            value={stats ? fmt(stats.balance, currency) : '—'}
            color={stats?.balance >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)'}
            sub="This month" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 28 }} className="charts-grid">
          {/* Trend chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>6-Month Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats?.trend || []}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5252" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff5252" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8b8fa8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b8fa8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
                  formatter={v => fmt(v, currency)} />
                <Area type="monotone" dataKey="income" stroke="#00e676" strokeWidth={2} fill="url(#incGrad)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ff5252" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Expenses by Category</h3>
            {stats?.breakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.breakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {stats.breakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
                    formatter={v => fmt(v, currency)} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No expenses this month
              </div>
            )}
          </div>
        </div>

        {/* Category breakdown list */}
        {stats?.breakdown?.length > 0 && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Spending Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.breakdown.slice(0, 6).map((cat, i) => {
                const pct = stats.totalExpense > 0 ? (cat.amount / stats.totalExpense) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{cat.icon}</span> {cat.name}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{fmt(cat.amount, currency)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: cat.color || 'var(--accent-blue)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
            <a href="/transactions" style={{ fontSize: 13, color: 'var(--accent-green)', textDecoration: 'none' }}>View all →</a>
          </div>
          {stats?.recent?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stats.recent.map((tx, i) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < stats.recent.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, fontSize: 18,
                      background: tx.type === 'income' ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {tx.category?.icon || (tx.type === 'income' ? '↑' : '↓')}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {tx.category?.name || 'Uncategorized'} · {new Date(tx.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No transactions yet. Add one to get started!
            </div>
          )}
        </div>

        <TransactionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          categories={categories}
          onSave={() => loadStats()}
        />
      </Layout>

      <style>{`
        @media (max-width: 900px) {
          .charts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
