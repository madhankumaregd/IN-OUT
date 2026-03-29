export default function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="glass-card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12, fontSize: 20,
            background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{icon}</div>
        )}
      </div>
    </div>
  );
}
