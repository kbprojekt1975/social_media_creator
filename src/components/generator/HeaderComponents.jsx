import React, { useState, useRef, useEffect } from 'react';

export const StatusPill = ({ perc, activeWorkspace, setActiveTab, setForcePaymentView, showTooltip, setShowTooltip }) => {
  return (
    <div className="status-pill" style={{ 
      padding: '0.4rem 1rem', 
      borderRadius: '40px', 
      fontSize: '0.85rem', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      whiteSpace: 'nowrap',
      minWidth: 0,
      flexShrink: 1
    }}>
      <div style={{ position: 'relative', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="38" height="38" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="17" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <circle cx="19" cy="19" r="17" fill="none" stroke={perc > 50 ? '#4ade80' : perc > 25 ? '#fb923c' : '#ef4444'} strokeWidth="3" 
            strokeDasharray={2 * Math.PI * 17} 
            strokeDashoffset={2 * Math.PI * 17 * (1 - perc / 100)} 
            strokeLinecap="round"
            transform="rotate(-90 19 19)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{ 
          position: 'absolute', 
          fontSize: '0.65rem', 
          fontWeight: '800', 
          color: perc > 50 ? '#4ade80' : perc > 25 ? '#fb923c' : '#ef4444' 
        }}>
          {Math.round(perc)}%
        </div>
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
              <span className="workspace-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', lineHeight: 1 }}>Marka</span>
              <span className="workspace-name" style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '800', lineHeight: 1.2 }}>{activeWorkspace.name}</span>
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

export const ProfileDropdown = ({ user, isDark, setIsDark, onShowHelp, handleLogout, deferredPrompt, setDeferredPrompt, subscriptionData, hideMobileExtra = false }) => {
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
        className="profile-dropdown-trigger"
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

          {subscriptionData?.current_period_end && (
            <div style={{ padding: '0.2rem 0.5rem 0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Konto ważne do</p>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                {new Date(subscriptionData.current_period_end * 1000).toLocaleDateString('pl-PL')}
              </p>
            </div>
          )}

          {!hideMobileExtra && (
            <>
              <button 
                className="btn-secondary mobile-only-dropdown-btn"
                onClick={() => { window.dispatchEvent(new CustomEvent('toggleHistory')); setIsMenuOpen(false); }}
                style={{ width: '100%', justifyContent: 'flex-start', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '12px' }}
              >
                <span className="material-icons" style={{ color: 'var(--color-primary)' }}>history</span>
                Historia
              </button>

              <button 
                className="btn-secondary mobile-only-dropdown-btn"
                onClick={() => { window.dispatchEvent(new CustomEvent('toggleChat')); setIsMenuOpen(false); }}
                style={{ width: '100%', justifyContent: 'flex-start', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '12px' }}
              >
                <span className="material-icons" style={{ color: '#8b5cf6' }}>chat_bubble</span>
                Asystent AI
              </button>
            </>
          )}

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
