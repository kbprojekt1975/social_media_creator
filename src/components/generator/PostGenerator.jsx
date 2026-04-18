import React from 'react';

const PostGenerator = ({ 
  activeWorkspace, 
  topic, 
  setTopic, 
  style, 
  setStyle, 
  platform, 
  setPlatform, 
  isPlanning, 
  handleGeneratePlan, 
  handleGenerate, 
  planActive, 
  plannedPrompt, 
  setPlannedPrompt, 
  handleSyncPrompt, 
  isSyncing, 
  loading, 
  balance, 
  isReadOnly, 
  handleReset 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {activeWorkspace && (
        <div className="glass animate-float" style={{ 
          padding: '0.8rem 1.5rem', 
          background: 'rgba(56, 189, 248, 0.1)', 
          borderRadius: '15px', 
          border: '1px solid rgba(56, 189, 248, 0.2)',
          color: 'var(--color-primary)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '-1rem'
        }}>
          <span className="material-icons" style={{ fontSize: '1.1rem' }}>verified</span>
          Aktywna przestrzeń: <strong>{activeWorkspace.name}</strong>
        </div>
      )}
      
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Nowy Projekt</h2>
          <button 
            onClick={handleReset} 
            className="btn-secondary" 
            style={{ padding: '0.5rem 1rem', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Wyczyść formularz i zacznij od nowa"
          >
            <span className="material-icons" style={{ fontSize: '1.1rem' }}>refresh</span>
            Resetuj
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Temat / O czym ma być post?</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isReadOnly ? "Tryb tylko do odczytu - brak środków" : "Np. Zalety pracy zdalnej w 2024 roku..."}
              readOnly={isReadOnly}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '1rem',
                background: 'var(--bg-app)',
                border: isReadOnly ? '1px solid #ef4444' : '1px solid var(--border-color)',
                borderRadius: '15px',
                color: 'var(--text-main)',
                resize: 'vertical',
                cursor: isReadOnly ? 'not-allowed' : 'text',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>Styl postu</label>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {['Profesjonalny', 'Humorystyczny', 'Entuzjastyczny', 'Nietuzinkowy'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`chip ${style === s ? 'active' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>Platforma docelowa</label>
            <select 
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '15px', fontSize: '1rem' }}
            >
              <option>LinkedIn</option>
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Twitter / X</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Zużywasz tokeny zgodnie z licznikiem Gemini.
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button" 
              onClick={handleGeneratePlan}
              disabled={isPlanning || !topic || isReadOnly}
              className="btn-secondary"
              style={{ flex: 1, padding: '1.2rem', fontSize: '0.95rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isReadOnly ? 0.3 : 1 }}
            >
              {isPlanning ? 'Planowanie...' : (
                <>
                  <span className="material-icons" style={{ fontSize: '1.2rem', marginRight: '0.5rem', color: 'var(--color-primary)' }}>auto_awesome</span>
                  Ulepsz opis
                </>
              )}
              {isPlanning && <span className="spinner"></span>}
            </button>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || balance < 1000 || isReadOnly} 
              style={{ flex: 1.2, padding: '1.2rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? 'Generowanie...' : (
                <>
                  {isReadOnly || balance < 1000 ? (
                    <>Brak środków <span className="material-icons" style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>error_outline</span></>
                  ) : (
                    <>Generuj Treść <span className="material-icons" style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>bolt</span></>
                  )}
                </>
              )}
              {loading && <span className="spinner"></span>}
            </button>
          </div>
        </form>
      </div>

      {planActive && plannedPrompt && (
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '25px', border: '1px dashed var(--color-secondary)' }}>
          <div style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1rem', background: 'var(--bg-white)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-primary)', fontWeight: '700' }}>
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>assignment</span>
              Strategia (PL) - możesz edytować:
            </h4>
            <textarea 
              value={plannedPrompt.polishPlan || ''}
              onChange={(e) => setPlannedPrompt({ ...plannedPrompt, polishPlan: e.target.value })}
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                padding: '1rem',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '0.5rem'
              }}
            />
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1rem', background: 'var(--bg-white)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-primary)', fontWeight: '700' }}>
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>smart_toy</span>
              Techniczny Prompt (EN)
            </h4>
            <textarea 
              value={plannedPrompt.englishPrompt}
              onChange={(e) => setPlannedPrompt({ ...plannedPrompt, englishPrompt: e.target.value })}
              style={{ width: '100%', minHeight: '150px', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}
            />
            <div style={{ marginTop: '1rem' }}>
              <button 
                type="button"
                onClick={handleSyncPrompt}
                disabled={isSyncing || isReadOnly}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isSyncing ? 'Synchronizacja...' : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>sync</span>
                    Aktualizuj instrukcje techniczne (EN)
                  </>
                )}
                {isSyncing && <span className="spinner"></span>}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={handleGenerate}
              disabled={loading || isReadOnly}
              className="btn-primary"
              style={{ padding: '0.8rem 2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? 'Generowanie...' : (
                <>
                  <span className="material-icons" style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>check_circle</span>
                  Zatwierdzam i generuj
                </>
              )}
              {loading && <span className="spinner"></span>}
            </button>
          </div>
        </div>
      )}

      {balance < 1000 && !isReadOnly && (
        <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>
          Wymagane doładowanie konta, aby kontynuować generowanie.
        </p>
      )}
    </div>
  );
};

export default PostGenerator;
