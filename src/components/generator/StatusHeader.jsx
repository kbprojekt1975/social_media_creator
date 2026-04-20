import React from 'react';

const StatusHeader = ({ 
  user, 
  perc, 
  showTooltip, 
  setShowTooltip, 
  setForcePaymentView, 
  isDark, 
  setIsDark, 
  handleLogout,
  onShowHelp
}) => {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem 0',
      marginBottom: '1rem',
      position: 'relative',
      zIndex: 50
    }}>
      <div className="logo" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
        SOCIAL<span style={{ color: '#2a8ca8' }}>CREATOR</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Status Pill */}
        <div className="glass" style={{ 
          padding: '0.4rem 0.6rem 0.4rem 1.2rem', 
          borderRadius: '40px', 
          fontSize: '0.9rem', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#e0e4e8" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="10" fill="none" stroke={perc > 50 ? '#4ade80' : perc > 25 ? '#fb923c' : '#ef4444'} strokeWidth="2.5" 
                  strokeDasharray={2 * Math.PI * 10} 
                  strokeDashoffset={2 * Math.PI * 10 * (1 - perc / 100)} 
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                />
              </svg>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>Status konta: <span style={{ fontWeight: '600', color: '#4ade80' }}>{perc.toFixed(0)}%</span></span>
          </div>

          {showTooltip && (
            <div className="buy-credits-tooltip" style={{ zIndex: 9999, top: '130%' }}>
              <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="material-icons" style={{ color: '#fbbf24', fontSize: '1.1rem' }}>lightbulb</span>
                Twoje kredyty kończą się.
              </p>
              <button onClick={() => setForcePaymentView(true)} className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', borderRadius: '15px' }}>Dokup kredyty</button>
              <button onClick={() => setShowTooltip(false)} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}>Zamknij</button>
            </div>
          )}
        </div>

        <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500' }}>{user?.email}</span>
        
        <button 
          onClick={onShowHelp}
          className="btn-secondary"
          style={{ 
            padding: '0.6rem', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            color: 'var(--color-primary)'
          }}
          title="Pomoc i Przewodnik"
        >
          <span className="material-icons" style={{ fontSize: '1.4rem' }}>info</span>
        </button>

        <button 
          onClick={() => setIsDark(!isDark)}
          className="btn-secondary"
          style={{ 
            padding: '0.6rem', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}
          title={isDark ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"}
        >
          <span className="material-icons" style={{ fontSize: '1.4rem', color: isDark ? '#fbbf24' : '#64748b' }}>
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.6rem 1.4rem' }}>
          Wyloguj
        </button>
      </div>
    </header>
  );
};

export default StatusHeader;
