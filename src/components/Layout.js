import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { href: '/transactions', icon: '↕', label: 'Transactions' },
  { href: '/budgets', icon: '◎', label: 'Budgets' },
  { href: '/goals', icon: '◈', label: 'Goals' },
  { href: '/categories', icon: '⊞', label: 'Categories' },
  { href: '/settings', icon: '⚙', label: 'Settings' },
];

export default function Layout({ children, user, onLogout }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s',
      }} className="sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent-green)', letterSpacing: '-0.5px' }}>
            IN &amp; OUT
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Finance Tracker</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`sidebar-link${router.pathname.startsWith(n.href) ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#0f1117', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={onLogout} className="btn-secondary" style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="main-content">
        {/* Mobile header */}
        <div className="mobile-header" style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent-green)' }}>IN &amp; OUT</span>
          <button onClick={() => setMobileOpen(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, cursor: 'pointer' }}>☰</button>
        </div>

        <div style={{ flex: 1, padding: '32px 32px' }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
