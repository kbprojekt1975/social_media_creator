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
  handleDeleteWorkspace,
  handleGenerateBrandDirectives,
  handleGenerateMarketTrends
}) => {
  const [isGeneratingContent, setIsGeneratingContent] = React.useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = React.useState(false);
  const [isGeneratingTrends, setIsGeneratingTrends] = React.useState(false);
  const [contentError, setContentError] = React.useState(false);
  const [visualError, setVisualError] = React.useState(false);
  const [showBrandHelp, setShowBrandHelp] = React.useState(false);

  const handleAIContent = async () => {
    if (!newWorkspace.contentDirectives || !newWorkspace.contentDirectives.trim() || newWorkspace.contentDirectives === 'Wypełnij to pole') {
      setContentError(true);
      setNewWorkspace(prev => ({ ...prev, contentDirectives: 'Wypełnij to pole' }));
      return;
    }
    setContentError(false);
    setIsGeneratingContent(true);
    const result = await handleGenerateBrandDirectives(newWorkspace.name, 'content', newWorkspace.contentDirectives);
    if (result) {
      setNewWorkspace(prev => ({ ...prev, contentDirectives: result }));
    }
    setIsGeneratingContent(false);
  };

  const handleAIVisual = async () => {
    if (!newWorkspace.visualStyle || !newWorkspace.visualStyle.trim() || newWorkspace.visualStyle === 'Wypełnij to pole') {
      setVisualError(true);
      setNewWorkspace(prev => ({ ...prev, visualStyle: 'Wypełnij to pole' }));
      return;
    }
    setVisualError(false);
    setIsGeneratingVisual(true);
    const result = await handleGenerateBrandDirectives(newWorkspace.name, 'visual', newWorkspace.visualStyle);
    if (result) {
      setNewWorkspace(prev => ({ ...prev, visualStyle: result }));
    }
    setIsGeneratingVisual(false);
  };

  const handleAITrends = async () => {
    setIsGeneratingTrends(true);
    const result = await handleGenerateMarketTrends(newWorkspace.name, newWorkspace.contentDirectives, newWorkspace.visualStyle);
    if (result) {
      setNewWorkspace(prev => ({ ...prev, marketTrends: result }));
    }
    setIsGeneratingTrends(false);
  };

  const handleToggleForm = () => {
    if (showWorkspaceForm) {
      // User clicked "Anuluj" - clear the form
      setNewWorkspace({ name: '', contentDirectives: '', visualStyle: '', marketTrends: '' });
    }
    setShowWorkspaceForm(!showWorkspaceForm);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0 5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Przestrzenie robocze</h2>
          <p style={{ color: 'var(--text-muted)' }}>Zdefiniuj profile swoich marek dla spójnej komunikacji AI.</p>
        </div>
        <button 
          onClick={handleToggleForm}
          className="btn-primary"
          style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span className="material-icons">{showWorkspaceForm ? 'close' : 'add'}</span>
          {showWorkspaceForm ? 'Anuluj' : 'Nowa marka'}
        </button>
      </div>

      {showWorkspaceForm && (
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '6px', background: 'var(--bg-white)', border: 'none', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: '700' }}>Dodaj nową markę</h3>
            <button
              type="button"
              onClick={() => setShowBrandHelp(!showBrandHelp)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
              title="Jak działa ten panel?"
            >
              <span className="material-icons" style={{ fontSize: '1.6rem' }}>info</span>
            </button>
          </div>

          {showBrandHelp && (
            <div style={{ padding: '1.5rem', background: 'rgba(66, 133, 244, 0.05)', borderRadius: '8px', border: '1px solid rgba(66, 133, 244, 0.2)', marginBottom: '1.5rem', fontSize: '1.125rem', color: 'var(--text-main)', lineHeight: '1.6', animation: 'fadeIn 0.3s ease-out' }}>
              <h4 style={{ color: 'var(--color-primary)', marginTop: 0, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
                <span className="material-icons" style={{ fontSize: '1.5rem' }}>lightbulb</span>
                Jak działa ten panel?
              </h4>
              <p style={{ marginBottom: '0.5rem' }}>Wyobraź sobie, że zatrudniasz profesjonalnego asystenta. Aby mógł pracować skutecznie, musisz mu powiedzieć <strong>kim jesteś i czego oczekujesz</strong>. Ten panel to odprawa dla Twojej Sztucznej Inteligencji (AI).</p>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Osobista baza wiedzy:</strong> Raz dodajesz markę, a AI zapamiętuje Twój styl. Koniec z pisaniem sztampowych, "robotycznych" postów! Twoje treści zyskają charakter.</li>
                <li><strong><span style={{color: '#8b5cf6'}}>✨ AI Write</span> (Wytyczne tekstowe):</strong> Nie wiesz, jak opisać swój ton? Wpisz luźne myśli (np. <i>"pisz luksusowo i bez emoji"</i>), a ten przycisk rozbuduje je w profesjonalne, szczegółowe instrukcje copywriterskie.</li>
                <li><strong><span style={{color: '#d946ef'}}>✨ AI Design</span> (Styl wizualny):</strong> Masz w głowie tylko zarys wyglądu? Napisz np. <i>"minimalizm, pastelowe kolory"</i>, a ten przycisk przetłumaczy Twój pomysł na fachowy język zrozumiały dla generatorów obrazu.</li>
                <li><strong>Wyszukaj trendy AI:</strong> System przeanalizuje to, co wpisałeś, i automatycznie znajdzie aktualne trendy na rynku, dzięki czemu Twoje posty będą zawsze na czasie i zyskają większe zasięgi.</li>
              </ul>
            </div>
          )}

          <form onSubmit={handleAddWorkspace}>
            <div className="input-group" style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nazwa przestrzeni / Klienta</label>
              <input 
                type="text"
                placeholder="np. Moja Marka Osobista"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                required
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-main)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Wytyczne tekstowe (Co pisać? Czego unikać?)</label>
                <button 
                  type="button"
                  onClick={handleAIContent}
                  disabled={isGeneratingContent}
                  className="btn-animate"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.75rem', 
                    padding: '0.4rem 0.8rem', 
                    background: 'rgba(66, 133, 244, 0.1)', 
                    color: '#4285f4', 
                    border: '1px solid rgba(66, 133, 244, 0.2)', 
                    borderRadius: '4px',
                    cursor: isGeneratingContent ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className={`material-icons ${isGeneratingContent ? 'spin' : ''}`} style={{ fontSize: '1rem' }}>
                    {isGeneratingContent ? 'sync' : 'auto_awesome'}
                  </span>
                  {isGeneratingContent ? 'Generowanie...' : 'AI Write'}
                </button>
              </div>
              <textarea 
                placeholder="np. Pisz luksusowym językiem, unikaj emoji, zawsze dodawaj link do sklepu..."
                value={newWorkspace.contentDirectives}
                onChange={(e) => {
                  setNewWorkspace({ ...newWorkspace, contentDirectives: e.target.value });
                  if (contentError) setContentError(false);
                }}
                onFocus={() => {
                  if (newWorkspace.contentDirectives === 'Wypełnij to pole') {
                    setNewWorkspace({ ...newWorkspace, contentDirectives: '' });
                    setContentError(false);
                  }
                }}
                style={{ width: '100%', minHeight: '150px', padding: '1.2rem', background: 'var(--bg-app)', border: contentError ? '1px solid #ef4444' : '1px solid var(--border-color)', borderRadius: '12px', color: contentError ? '#ef4444' : 'var(--text-main)', resize: 'vertical', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Styl wizualny (Jak mają wyglądać grafiki?)</label>
                <button 
                  type="button"
                  onClick={handleAIVisual}
                  disabled={isGeneratingVisual}
                  className="btn-animate"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.75rem', 
                    padding: '0.4rem 0.8rem', 
                    background: 'rgba(155, 114, 203, 0.1)', 
                    color: '#9b72cb', 
                    border: '1px solid rgba(155, 114, 203, 0.2)', 
                    borderRadius: '4px',
                    cursor: isGeneratingVisual ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className={`material-icons ${isGeneratingVisual ? 'spin' : ''}`} style={{ fontSize: '1rem' }}>
                    {isGeneratingVisual ? 'sync' : 'auto_awesome'}
                  </span>
                  {isGeneratingVisual ? 'Generowanie...' : 'AI Design'}
                </button>
              </div>
              <textarea 
                placeholder="np. Minimalistyczne zdjęcia produktowe, pastelowe kolory, dużo wolnej przestrzeni..."
                value={newWorkspace.visualStyle}
                onChange={(e) => {
                  setNewWorkspace({ ...newWorkspace, visualStyle: e.target.value });
                  if (visualError) setVisualError(false);
                }}
                onFocus={() => {
                  if (newWorkspace.visualStyle === 'Wypełnij to pole') {
                    setNewWorkspace({ ...newWorkspace, visualStyle: '' });
                    setVisualError(false);
                  }
                }}
                style={{ width: '100%', minHeight: '150px', padding: '1.2rem', background: 'var(--bg-app)', border: visualError ? '1px solid #ef4444' : '1px solid var(--border-color)', borderRadius: '12px', color: visualError ? '#ef4444' : 'var(--text-main)', resize: 'vertical', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Aktualne trendy rynkowe</label>
              </div>
              <textarea 
                placeholder="Kliknij przycisk poniżej, aby AI wyszukało trendy dla tej marki, lub wpisz je ręcznie..."
                value={newWorkspace.marketTrends || ''}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, marketTrends: e.target.value })}
                style={{ width: '100%', minHeight: '150px', padding: '1.2rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', resize: 'vertical', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'inherit' }}
              />
            </div>
            
            <button 
              type="button"
              onClick={handleAITrends}
              disabled={isGeneratingTrends}
              className="btn-animate"
              style={{ 
                width: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem', 
                padding: '0.8rem', 
                background: 'rgba(244, 175, 69, 0.1)', 
                color: '#f4af45', 
                border: '1px solid rgba(244, 175, 69, 0.3)', 
                borderRadius: '4px',
                cursor: isGeneratingTrends ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              <span className={`material-icons ${isGeneratingTrends ? 'spin' : ''}`} style={{ fontSize: '1.2rem' }}>
                {isGeneratingTrends ? 'sync' : 'trending_up'}
              </span>
              {isGeneratingTrends ? 'Wyszukiwanie trendów...' : 'Wyszukaj trendy AI'}
            </button>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '4px' }}>Zapisz przestrzeń</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {workspaces.map(ws => (
          <div key={ws.id} className={`glass ${activeWorkspace?.id === ws.id ? 'format-card-active' : ''}`} style={{ 
            padding: '5px', 
            borderRadius: '6px', 
            background: activeWorkspace?.id === ws.id
              ? `linear-gradient(var(--bg-card), var(--bg-card)) padding-box, linear-gradient(135deg, #4285f4, #9b72cb, #d96570, #f4af45) border-box`
              : 'var(--bg-card)', 
            border: activeWorkspace?.id === ws.id ? '2px solid transparent' : '1px solid var(--border-color)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeWorkspace?.id === ws.id ? '0 15px 35px rgba(0,0,0,0.15)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span className="material-icons" style={{ color: 'var(--color-primary)' }}>folder</span>
                <h4 style={{ margin: 0, fontWeight: '700' }}>{ws.name}</h4>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleActivateWorkspace(ws.id, activeWorkspace?.id === ws.id)}
                  className={activeWorkspace?.id === ws.id ? 'btn-secondary' : 'btn-primary'}
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.75rem', 
                    borderRadius: '3px',
                    minWidth: '80px'
                  }}
                >
                  {activeWorkspace?.id === ws.id ? 'Wyłącz' : 'Aktywuj'}
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
            {ws.marketTrends && (
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#f4af45', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Trendy Rynkowe</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ws.marketTrends}
                </p>
              </div>
            )}
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
