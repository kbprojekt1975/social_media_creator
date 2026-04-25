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
  setActiveTab,
  subscriptionData
}) => {
  return (
    <header className="status-header">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="logo" style={{ 
          fontSize: '1.4rem', 
          fontWeight: '800', 
          letterSpacing: '-0.5px',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease'
        }}>
          KUŹNIA<span className="logo-suffix" style={{ color: '#2a8ca8' }}>TREŚCI</span>
        </div>
      </Link>
      
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flexShrink: 1 }}>
        <Link to="/" className="home-link" style={{ 
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
          subscriptionData={subscriptionData}
        />
      </div>
    </header>
  );
};

export default StatusHeader;
