import React from 'react';

const GeneratorTabs = ({ activeTab, setActiveTab, activeWorkspace, showAdvanced, setShowAdvanced }) => {
  return (
    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10, alignItems: 'center' }}>
      <button 
        onClick={() => setActiveTab('generator')}
        className={activeTab === 'generator' ? 'btn-primary' : 'btn-secondary'}
        style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>bolt</span>
        Generator
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', gap: '0.8rem', animation: 'fadeIn 0.3s ease-out' }}>
          <button 
            onClick={() => setActiveTab('workspaces')}
            className={activeTab === 'workspaces' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>business_center</span>
            Przestrzenie robocze
            {activeWorkspace && <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 5px #4ade80' }}></div>}
          </button>
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={activeTab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>event_note</span>
            Planuj kampanię
          </button>
          <button 
            onClick={() => setActiveTab('visual_editor')}
            className={activeTab === 'visual_editor' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>brush</span>
            Edytor Wizualny
          </button>
        </div>
      )}

      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          background: showAdvanced ? 'rgba(var(--color-primary-rgb), 0.1)' : 'none',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          padding: '0.8rem 1.2rem',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginLeft: 'auto',
          transition: 'all 0.3s ease'
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>
          {showAdvanced ? 'expand_less' : 'more_horiz'}
        </span>
        {showAdvanced ? 'Zwiń' : 'Opcje zaawansowane'}
      </button>
    </div>
  );
};

export default GeneratorTabs;
