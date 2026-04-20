import React from 'react';

const GeneratorTabs = ({ activeTab, setActiveTab, activeWorkspace }) => {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      <button 
        onClick={() => setActiveTab('generator')}
        className={activeTab === 'generator' ? 'btn-primary' : 'btn-secondary'}
        style={{ padding: '0.8rem 2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>bolt</span>
        Generator
      </button>
      <button 
        onClick={() => setActiveTab('workspaces')}
        className={activeTab === 'workspaces' ? 'btn-primary' : 'btn-secondary'}
        style={{ padding: '0.8rem 2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>business_center</span>
        Przestrzenie robocze
        {activeWorkspace && <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 5px #4ade80' }}></div>}
      </button>
      <button 
        onClick={() => setActiveTab('campaigns')}
        className={activeTab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}
        style={{ padding: '0.8rem 2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>event_note</span>
        Planuj kampanię
      </button>
    </div>
  );
};

export default GeneratorTabs;
