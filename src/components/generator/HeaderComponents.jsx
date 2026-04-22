import React, { useState, useRef, useEffect } from 'react';

export const StatusPill = ({ perc, activeWorkspace, setActiveTab, setForcePaymentView, showTooltip, setShowTooltip }) => {
  return (
    <div className="glass" style={{ 
      padding: '0.4rem 0.6rem 0.4rem 1.2rem', 
      borderRadius: '40px', 
      fontSize: '0.9rem', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      whiteSpace: 'nowrap'
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
        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Balans: <span style={{ color: '#4ade80', fontWeight: '700' }}>{perc.toFixed(1)}%</span></span>
      </div>

      {activeWorkspace && (
        <>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }}></div>
          <div 
            onClick={() => setActiveTab('workspaces')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              padding: '4px 10px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Przejdź do zarządzania przestrzenią roboczą"
          >
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '8px', 
              background: 'rgba(56, 189, 248, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <span className="material-icons" style={{ fontSize: '1rem' }}>business_center</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', lineHeight: 1 }}>Marka</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '800', lineHeight: 1.2 }}>{activeWorkspace.name}</span>
            </div>
          </div>
        </>
      )}

      {showTooltip && (
        <div className="buy-credits-tooltip" style={{ zIndex: 9999, top: '130%', right: 0 }}>
          <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="material-icons" style={{ color: '#fbbf24', fontSize: '1.1rem' }}>lightbulb</span>
            Twoje kredyty kończą się.
          </p>
          <button onClick={() => setForcePaymentView(true)} className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', borderRadius: '15px' }}>Dokup kredyty</button>
          <button onClick={() => setShowTooltip(false)} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}>Zamknij</button>
        </div>
      )}
    </div>
  );
};

export const ProfileDropdown = ({ user, isDark, setIsDark, onShowHelp, handleLogout, deferredPrompt, setDeferredPrompt }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setIsMenuOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: isMenuOpen ? 'var(--color-primary)' : 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          color: isMenuOpen ? 'white' : 'var(--text-main)',
          boxShadow: isMenuOpen ? '0 0 15px rgba(var(--color-primary-rgb), 0.3)' : 'none'
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.8rem' }}>account_circle</span>
      </button>

      {isMenuOpen && (
        <div className="glass" style={{
          position: 'absolute',
          top: '120%',
          right: 0,
          width: '280px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Zalogowano jako</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', wordBreak: 'break-all' }}>{user?.email}</p>
          </div>

          <button 
            onClick={() => { setIsDark(!isDark); setIsMenuOpen(false); }}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '12px' }}
          >
            <span className="material-icons" style={{ color: isDark ? '#fbbf24' : '#64748b' }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            {isDark ? 'Tryb jasny' : 'Tryb ciemny'}
          </button>

          <button 
            onClick={() => { onShowHelp(); setIsMenuOpen(false); }}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '12px' }}
          >
            <span className="material-icons" style={{ color: 'var(--color-primary)' }}>info</span>
            Pomoc i instrukcja
          </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'flex-start', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}
            >
              <span className="material-icons">download_for_offline</span>
              Zainstaluj aplikację
            </button>
          )}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

          <button 
            onClick={() => { handleLogout(); setIsMenuOpen(false); }}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '12px', color: '#ef4444' }}
          >
            <span className="material-icons">logout</span>
            Wyloguj się
          </button>
        </div>
      )}
    </div>
  );
};
