import React from 'react';

const GeneratorTabs = ({ activeTab, setActiveTab, activeWorkspace, showAdvanced, setShowAdvanced }) => {
  return (
    <div className="generator-tabs" style={{ maxWidth: '50%', margin: '0 auto', width: '100%' }}>
      <div className="tabs-inner-container" style={{ 
        display: 'flex', 
        gap: '0', 
        marginBottom: '5px', 
        maxWidth: 'fit-content', 
        background: 'linear-gradient(var(--bg-app), var(--bg-app)) padding-box, linear-gradient(135deg, #4285f4, #9b72cb, #d96570, #f4af45) border-box',
        border: '1px solid transparent',
        borderRadius: '10px',
        padding: '4px',
        position: 'relative', 
        zIndex: 10, 
        alignItems: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
      <button 
        onClick={() => setActiveTab('generator')}
        style={{ 
          padding: '0.8rem 1.8rem', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          flexShrink: 0,
          border: 'none',
          background: activeTab === 'generator' ? 'rgba(66, 133, 244, 0.2)' : 'transparent',
          color: activeTab === 'generator' ? 'var(--color-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontWeight: '700',
          transition: 'all 0.3s ease'
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>bolt</span>
        <span className="tab-label">Generator</span>
      </button>

      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        overflow: 'hidden',
        width: showAdvanced ? 'auto' : '0',
        opacity: showAdvanced ? 1 : 0,
        transform: showAdvanced ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        paddingLeft: showAdvanced ? '8px' : '0',
        whiteSpace: 'nowrap'
      }}>
        <button 
          onClick={() => setActiveTab('workspaces')}
          style={{ 
            padding: '0.8rem 1.4rem', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            border: 'none',
            background: activeTab === 'workspaces' ? 'rgba(66, 133, 244, 0.2)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'workspaces' ? 'var(--color-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
        >
          <span className="material-icons" style={{ fontSize: '1.1rem' }}>business_center</span>
          <span className="tab-label">Przestrzenie</span>
          {activeWorkspace && <div style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></div>}
        </button>
        <button 
          onClick={() => setActiveTab('campaigns')}
          style={{ 
            padding: '0.8rem 1.4rem', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            border: 'none',
            background: activeTab === 'campaigns' ? 'rgba(66, 133, 244, 0.2)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'campaigns' ? 'var(--color-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
        >
          <span className="material-icons" style={{ fontSize: '1.1rem' }}>event_note</span>
          <span className="tab-label">Kampanie</span>
        </button>
        <button 
          onClick={() => setActiveTab('visual_editor')}
          style={{ 
            padding: '0.8rem 1.4rem', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            border: 'none',
            background: activeTab === 'visual_editor' ? 'rgba(66, 133, 244, 0.2)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'visual_editor' ? 'var(--color-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
        >
          <span className="material-icons" style={{ fontSize: '1.1rem' }}>brush</span>
          <span className="tab-label">Edytor</span>
        </button>
      </div>

      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          background: showAdvanced ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none',
          color: showAdvanced ? 'var(--text-main)' : 'var(--text-muted)',
          padding: '0.8rem 1.5rem',
          borderRadius: '100px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginLeft: '4px',
          transition: 'all 0.3s ease'
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>
          {showAdvanced ? 'close' : 'more_horiz'}
        </span>
        <span className="tab-label">{showAdvanced ? 'Zwiń' : 'Zaawansowane'}</span>
      </button>
    </div>
    </div>
  );
};

export default GeneratorTabs;
