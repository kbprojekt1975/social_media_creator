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
  handleReset,
  onShowHelp
}) => {
  const [isModified, setIsModified] = React.useState(false);
  const [isSyncSuccess, setIsSyncSuccess] = React.useState(false);

  const onSyncClick = async () => {
    try {
      await handleSyncPrompt();
      setIsSyncSuccess(true);
      setIsModified(false);
    } catch (error) {
      console.error("Sync error:", error);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {activeWorkspace && (
        <div className="glass" style={{ 
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Nowy Projekt</h2>
            <button 
              type="button"
              onClick={onShowHelp}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', opacity: 0.7 }}
              title="Pokaż przewodnik"
            >
              <span className="material-icons" style={{ fontSize: '1.4rem' }}>info</span>
            </button>
          </div>
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
              type={balance < 1000 ? "button" : "submit"} 
              onClick={balance < 1000 ? () => setForcePaymentView(true) : undefined}
              className="btn-primary" 
              disabled={loading || isReadOnly} 
              style={{ flex: 1.2, padding: '1.2rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: balance < 1000 ? 'pulse 2s infinite' : 'none' }}
            >
              {loading ? 'Generowanie...' : (
                <>
                  {isReadOnly || balance < 1000 ? (
                    <>Doładuj portfel <span className="material-icons" style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>payments</span></>
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
              onChange={(e) => {
                setPlannedPrompt({ ...plannedPrompt, polishPlan: e.target.value });
                setIsModified(true);
                setIsSyncSuccess(false);
              }}
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'var(--bg-app)',
                border: isSyncSuccess ? '1px solid #10b981' : '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                padding: '1rem',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '0.5rem',
                transition: 'border 0.3s ease'
              }}
            />
            <button 
              type="button"
              onClick={onSyncClick}
              disabled={isSyncing || isReadOnly || !isModified}
              className="btn-secondary"
              style={{ 
                width: '100%', 
                marginTop: '0.8rem', 
                padding: '0.7rem', 
                borderRadius: '12px', 
                fontSize: '0.85rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                border: isSyncSuccess ? '1px solid #10b981' : (isModified ? '1px solid var(--color-primary)' : '1px solid var(--border-color)'),
                color: isSyncSuccess ? '#10b981' : (isModified ? 'var(--color-primary)' : 'var(--text-muted)'),
                background: isSyncSuccess ? 'rgba(16, 185, 129, 0.05)' : 'none',
                cursor: isModified ? 'pointer' : 'default',
                transition: 'all 0.3s ease'
              }}
            >
              {isSyncing ? <span className="spinner"></span> : (
                <>
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                    {isSyncSuccess ? 'check_circle' : 'refresh'}
                  </span>
                  {isSyncSuccess ? 'Zmiany zapisane' : 'Aktualizuj instrukcje techniczne'}
                </>
              )}
            </button>
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
