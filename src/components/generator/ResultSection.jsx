import React from 'react';

const ResultSection = ({ 
  result, 
  setResult, 
  copyToClipboard, 
  textFeedback, 
  setTextFeedback, 
  isTextRefining, 
  handleRefineText, 
  isPromptMode, 
  setIsPromptMode, 
  imageAspectRatio, 
  setImageAspectRatio, 
  activeImageLabel, 
  setActiveImageLabel, 
  imageLoading, 
  isReadOnly, 
  visualizationType, 
  handleGeneratePrompt, 
  videoAspectRatio, 
  setVideoAspectRatio, 
  activeVideoLabel, 
  setActiveVideoLabel, 
  imagePrompt, 
  setImagePrompt, 
  handleGenerateVideo, 
  handleGenerateImage, 
  generatedImage, 
  setGeneratedImage, 
  generatedVideo, 
  setGeneratedVideo, 
  mediaFeedback, 
  setMediaFeedback, 
  isMediaRefining, 
  handleRefineMedia,
  visualPlannedPrompt,
  isVisualSyncing,
  handleSyncVisualPrompt,
  mediaHistory,
  setMediaHistory,
  aiDetectionLog,
  setAiDetectionLog
}) => {
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--color-primary)', fontWeight: '700', margin: 0 }}>Wygenerowana Treść</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => copyToClipboard(result)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>
              Kopiuj teraz
            </button>
            <button 
              onClick={() => setResult('')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }} 
              title="Zamknij wygenerowaną treść"
            >
              <span className="material-icons" style={{ fontSize: '1.4rem' }}>close</span>
            </button>
          </div>
        </div>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>{result}</p>
        
        {/* Text Refinement Field */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', background: 'var(--bg-app)', padding: '1rem', borderRadius: '15px', border: '1px solid var(--border-color)' }}>
          <textarea 
            value={textFeedback}
            onChange={(e) => setTextFeedback(e.target.value)}
            placeholder="Co chcesz poprawić w tym poście? (np. skróć do 3 zdań, dodaj więcej dynamiki...)"
            style={{ flex: 1, minHeight: '60px', padding: '0.8rem', fontSize: '0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-main)', resize: 'vertical' }}
            disabled={isTextRefining}
          />
          <button 
            onClick={handleRefineText}
            disabled={!textFeedback.trim() || isTextRefining}
            className="btn-primary"
            style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isTextRefining ? <span className="spinner"></span> : (
              <>
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>auto_fix_high</span>
                Rozkaż AI
              </>
            )}
          </button>
        </div>
        
        {/* Graphic Options */}
        {!isPromptMode && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            
            {/* Image Generation Block */}
            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Wybierz format obrazu
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
                {[
                  { id: '1:1', label: 'crop_square', tip: 'Post' },
                  { id: '4:5', label: 'portrait', tip: 'Portret' },
                  { id: '9:16', label: 'smartphone', tip: 'Story' },
                  { id: '16:9', label: 'desktop_windows', tip: 'Poziom' }
                ].map(format => (
                  <button
                    key={format.id}
                    onClick={() => {
                      setImageAspectRatio(format.id);
                      setActiveImageLabel(format.tip);
                    }}
                    style={{
                      padding: '0.8rem 0.4rem',
                      borderRadius: '15px',
                      border: activeImageLabel === format.tip ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      background: activeImageLabel === format.tip ? 'var(--bg-white)' : 'var(--bg-app)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.3rem', color: activeImageLabel === format.tip ? 'var(--color-primary)' : 'var(--text-muted)' }}>{format.label}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>{format.tip}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handleGeneratePrompt('image')}
                disabled={imageLoading || isReadOnly}
                className="btn-secondary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', borderRadius: '20px' }}
              >
                {imageLoading && visualizationType === 'image' ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.2rem', color: '#1d6e8a' }}>image</span>
                    <span>{isReadOnly ? 'Brak AI' : 'Przygotuj obraz (10k)'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Generation Block */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Wybierz format wideo (Reels/TikTok)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
                {[
                  { id: '9:16', label: 'movie', tip: 'Reels / TikTok 9:16' },
                  { id: '9:16', label: 'history', tip: 'Stories 9:16' },
                  { id: '4:5', label: 'portrait', tip: 'Feed (Post) 4:5' },
                  { id: '1:1', label: 'crop_square', tip: 'Feed (Post) 1:1' }
                ].map((format, idx) => (
                  <button
                    key={`${format.id}-${idx}`}
                    onClick={() => {
                      setVideoAspectRatio(format.id);
                      setActiveVideoLabel(format.tip);
                    }}
                    style={{
                      padding: '0.8rem 0.4rem',
                      borderRadius: '15px',
                      border: activeVideoLabel === format.tip ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      background: activeVideoLabel === format.tip ? 'var(--bg-white)' : 'var(--bg-app)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.3rem', color: activeVideoLabel === format.tip ? 'var(--color-primary)' : 'var(--text-muted)' }}>{format.label}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>{format.tip}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handleGeneratePrompt('video')}
                disabled={imageLoading || isReadOnly}
                className="btn-secondary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', borderRadius: '20px' }}
              >
                {imageLoading && visualizationType === 'video' ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.2rem', color: '#8c84a9' }}>movie</span>
                    <span>{isReadOnly ? 'Brak AI' : 'Przygotuj wideo (400k)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isPromptMode && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '25px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: '600' }}>
              <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>auto_awesome</span>
              Nano Banana przygotował opis {visualizationType === 'video' ? 'klipu wideo' : 'grafiki'}:
            </p>
            
            {/* Polish Description (Editable) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700' }}>OPIS (PL) - Możesz edytować:</label>
              <textarea 
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                style={{ 
                  width: '100%',
                  minHeight: '100px', 
                  fontSize: '0.9rem', 
                  background: 'var(--bg-white)',
                  color: 'var(--text-main)',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '15px'
                }}
              />
            </div>

            {/* English Technical Prompt (View/Sync) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700' }}>TECHNICZNY PROMPT (EN):</label>
              <textarea 
                value={visualPlannedPrompt?.englishPrompt || ''}
                readOnly
                style={{ 
                  width: '100%',
                  minHeight: '120px', 
                  fontSize: '0.85rem', 
                  background: 'rgba(0,0,0,0.05)',
                  color: 'var(--text-main)',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '15px',
                  fontFamily: 'monospace'
                }}
              />
              <button 
                onClick={handleSyncVisualPrompt}
                disabled={isVisualSyncing || isReadOnly}
                className="btn-secondary"
                style={{ width: '100%', marginTop: '0.8rem', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isVisualSyncing ? <span className="spinner"></span> : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>sync</span>
                    Dostosuj instrukcje techniczne (EN) do moich zmian
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={() => setIsPromptMode(false)} className="btn-secondary" style={{ padding: '0.8rem', borderRadius: '15px' }}>
                Anuluj
              </button>
              <button 
                onClick={() => visualizationType === 'video' ? handleGenerateVideo() : handleGenerateImage()} 
                disabled={imageLoading || isReadOnly || isVisualSyncing} 
                className="btn-primary" 
                style={{ padding: '0.8rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {imageLoading ? 'Generowanie...' : (
                  <>
                    <span className="material-icons" style={{ marginRight: '0.5rem' }}>{visualizationType === 'video' ? 'movie' : 'rocket_launch'}</span>
                    {visualizationType === 'video' ? 'Generuj Klip (400k)' : 'Generuj obraz (10k)'}
                  </>
                )}
                {imageLoading && <span className="spinner"></span>}
              </button>
            </div>
          </div>
        )}

        {mediaHistory && mediaHistory.length > 0 && (
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Historia Wygenerowanych Mediów
            </h3>
            
            {mediaHistory.map((media, idx) => (
              <div key={idx} style={{ textAlign: 'center', background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '30px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--text-muted)' }}>
                  <span className="material-icons" style={{ fontSize: '1.2rem' }}>{media.type === 'video' ? 'movie' : 'image'}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                    Wersja {idx + 1} ({media.type === 'video' ? 'Wideo' : 'Grafika'})
                  </span>
                </div>

                {media.type === 'video' ? (
                  <video 
                    src={media.url} 
                    controls 
                    style={{ width: '100%', borderRadius: '20px', boxShadow: 'var(--shadow-md)', background: '#000' }} 
                  />
                ) : (
                  <img src={media.url} alt={`Generated version ${idx + 1}`} style={{ width: '100%', borderRadius: '20px', boxShadow: 'var(--shadow-md)' }} />
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                  <button 
                    onClick={() => {
                      const newHistory = [...mediaHistory];
                      newHistory.splice(idx, 1);
                      setMediaHistory(newHistory);
                      // Also clear current states if it was the last one
                      if (newHistory.length === 0) {
                        setGeneratedImage(null);
                        setGeneratedVideo(null);
                      }
                    }} 
                    className="btn-secondary" 
                    style={{ flex: 1, borderRadius: '15px', fontSize: '0.8rem' }}
                  >
                    Usuń tę wersję
                  </button>
                  <a href={media.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1.5, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', fontSize: '0.85rem' }} download>
                    Pobierz {media.type === 'video' ? 'Wideo' : 'Obraz'}
                  </a>
                </div>
              </div>
            ))}

            {/* Loading Placeholder for new media refinement/generation */}
            {(isMediaRefining || imageLoading) && (
              <div className="glass" style={{ 
                padding: '3rem 2rem', 
                borderRadius: '25px', 
                border: '2px dashed var(--color-primary)', 
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                background: 'rgba(var(--color-primary-rgb), 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                animation: 'pulse 2s infinite ease-in-out'
              }}>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <div className="spinner" style={{ width: '60px', height: '60px', borderTopColor: 'var(--color-primary)', borderWidth: '4px' }}></div>
                  <span className="material-icons" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--color-primary)', fontSize: '2rem', animation: 'bounce 1s infinite' }}>
                    {isMediaRefining ? 'psychology' : 'brush'}
                  </span>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: '800' }}>
                    {isMediaRefining ? 'Analizowanie kompozycji...' : 'Tworzenie nowej wersji...'}
                  </h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7, maxWidth: '300px' }}>
                    {isMediaRefining 
                      ? 'Gemini 2.0 Flash bada relacje przestrzenne i oświetlenie Twojego obrazu.' 
                      : 'Nano Banana nakłada poprawki, dbając o spójność z oryginałem.'}
                  </p>
                </div>

                {aiDetectionLog && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1rem', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', opacity: 0.6 }}>
                      <span className="material-icons" style={{ fontSize: '0.8rem' }}>terminal</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>Otrzymano raport audytu:</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#4ade80', fontFamily: 'monospace', lineHeight: '1.4' }}>
                      {aiDetectionLog}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* AI Detection Log (Technical Feedback) */}
            {aiDetectionLog && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '3px solid var(--color-primary)', padding: '0.8rem 1.2rem', borderRadius: '10px', marginTop: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', opacity: 0.7 }}>
                  <span className="material-icons" style={{ fontSize: '0.9rem' }}>terminal</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raport Analizy Wizualnej</span>
                  <button onClick={() => setAiDetectionLog("")} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                    <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'monospace', lineHeight: '1.4' }}>
                  {aiDetectionLog}
                </p>
              </div>
            )}
            
            {/* Media Refinement Field (Sticky at the bottom of the list) */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '25px', border: '1px solid var(--color-primary)', marginTop: '1rem', textAlign: 'left', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.6rem', fontWeight: '800' }}>
                  <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>auto_fix_high</span>
                  Zaproponuj poprawki do ostatniej wersji:
                </label>
                <textarea 
                  value={mediaFeedback}
                  onChange={(e) => setMediaFeedback(e.target.value)}
                  placeholder="np. zmień postać na kobietę, niech tło będzie bardziej słoneczne..."
                  style={{ width: '100%', minHeight: '80px', padding: '1rem', fontSize: '0.95rem', borderRadius: '15px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-main)', resize: 'vertical' }}
                  disabled={isMediaRefining}
                />
              </div>
              <button 
                onClick={handleRefineMedia}
                disabled={!mediaFeedback.trim() || isMediaRefining}
                className="btn-primary"
                style={{ padding: '1rem 2rem', borderRadius: '15px', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minWidth: '130px' }}
              >
                {isMediaRefining ? <span className="spinner"></span> : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.5rem' }}>draw</span>
                    Zastosuj
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultSection;
