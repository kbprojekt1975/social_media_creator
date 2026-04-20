import React from 'react';

const WorkspaceManager = ({ 
  activeWorkspace, 
  workspaces, 
  showWorkspaceForm, 
  setShowWorkspaceForm, 
  handleAddWorkspace, 
  newWorkspace, 
  setNewWorkspace, 
  handleActivateWorkspace, 
  handleDeleteWorkspace 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Przestrzenie robocze</h2>
          <p style={{ color: 'var(--text-muted)' }}>Zdefiniuj profile swoich marek dla spójnej komunikacji AI.</p>
        </div>
        <button 
          onClick={() => setShowWorkspaceForm(!showWorkspaceForm)}
          className="btn-primary"
          style={{ padding: '0.8rem 1.5rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span className="material-icons">{showWorkspaceForm ? 'close' : 'add'}</span>
          {showWorkspaceForm ? 'Anuluj' : 'Nowa marka'}
        </button>
      </div>

      {showWorkspaceForm && (
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '25px', background: 'var(--bg-white)', border: 'none' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Dodaj nową markę</h3>
          <form onSubmit={handleAddWorkspace}>
            <div className="input-group" style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nazwa przestrzeni / Klienta</label>
              <input 
                type="text"
                placeholder="np. Moja Marka Osobista"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                required
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Wytyczne tekstowe (Co pisać? Czego unikać?)</label>
              <textarea 
                placeholder="np. Pisz luksusowym językiem, unikaj emoji, zawsze dodawaj link do sklepu..."
                value={newWorkspace.contentDirectives}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, contentDirectives: e.target.value })}
                style={{ width: '100%', minHeight: '100px', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', resize: 'vertical' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Styl wizualny (Jak mają wyglądać grafiki?)</label>
              <textarea 
                placeholder="np. Minimalistyczne zdjęcia produktowe, pastelowe kolory, dużo wolnej przestrzeni..."
                value={newWorkspace.visualStyle}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, visualStyle: e.target.value })}
                style={{ width: '100%', minHeight: '100px', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px' }}>Zapisz przestrzeń</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {workspaces.map(ws => (
          <div key={ws.id} className="glass" style={{ 
            padding: '1.8rem', 
            borderRadius: '25px', 
            background: 'var(--bg-white)', 
            border: activeWorkspace?.id === ws.id ? '2px solid #4ade80' : '1px solid var(--border-color)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span className="material-icons" style={{ color: 'var(--color-primary)' }}>folder</span>
                <h4 style={{ margin: 0, fontWeight: '700' }}>{ws.name}</h4>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleActivateWorkspace(ws.id, activeWorkspace?.id === ws.id)}
                  className={activeWorkspace?.id === ws.id ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  {activeWorkspace?.id === ws.id ? 'Aktywna' : 'Aktywuj'}
                </button>
                <button 
                  onClick={() => handleDeleteWorkspace(ws.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                >
                  <span className="material-icons" style={{ fontSize: '1.3rem' }}>delete_outline</span>
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Wytyczne tekstowe</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ws.contentDirectives || 'Brak specyficznych wytycznych.'}
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Styl wizualny</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ws.visualStyle || 'Brak specyficznych wytycznych.'}
              </p>
            </div>
          </div>
        ))}
        {workspaces.length === 0 && !showWorkspaceForm && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '30px', border: '1px dashed var(--border-color)' }}>
            <span className="material-icons" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>business_center</span>
            <p>Nie masz jeszcze żadnych przestrzeni roboczych.<br/>Dodaj pierwszą, aby spersonalizować swoje posty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceManager;
