import React from 'react';
import { Link } from 'react-router-dom';
import { StatusPill, ProfileDropdown } from './HeaderComponents';

const StatusHeader = ({ 
  user, 
  perc, 
  showTooltip, 
  setShowTooltip, 
  setForcePaymentView, 
  isDark, 
  setIsDark, 
  handleLogout,
  onShowHelp,
  deferredPrompt,
  setDeferredPrompt,
  activeWorkspace,
  setActiveTab
}) => {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(var(--bg-app-rgb), 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border-color)',
      margin: '0 -4rem 1.5rem -4rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="logo" style={{ 
          fontSize: '1.4rem', 
          fontWeight: '800', 
          letterSpacing: '-0.5px',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease'
        }}>
          KUŹNIA<span style={{ color: '#2a8ca8' }}>TREŚCI</span>
        </div>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" style={{ 
          textDecoration: 'none', 
          color: 'var(--text-muted)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '0.6rem',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          transition: 'all 0.2s ease',
          border: '1px solid var(--border-color)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        title="Powrót do strony głównej"
        >
          <span className="material-icons" style={{ fontSize: '1.4rem' }}>home</span>
        </Link>

        <StatusPill 
          perc={perc}
          activeWorkspace={activeWorkspace}
          setActiveTab={setActiveTab}
          setForcePaymentView={setForcePaymentView}
          showTooltip={showTooltip}
          setShowTooltip={setShowTooltip}
        />

        <ProfileDropdown 
          user={user}
          isDark={isDark}
          setIsDark={setIsDark}
          onShowHelp={onShowHelp}
          handleLogout={handleLogout}
          deferredPrompt={deferredPrompt}
          setDeferredPrompt={setDeferredPrompt}
        />
      </div>
    </header>
  );
};

export default StatusHeader;
