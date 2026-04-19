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
  handleSyncVisualPrompt
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

        {(generatedImage || generatedVideo) && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            {generatedVideo ? (
              <video 
                src={generatedVideo} 
                controls 
                autoPlay 
                loop 
                style={{ width: '100%', borderRadius: '25px', boxShadow: 'var(--shadow-md)', background: '#000' }} 
              />
            ) : (
              <img src={generatedImage} alt="Generated" style={{ width: '100%', borderRadius: '25px', boxShadow: 'var(--shadow-md)' }} />
            )}
            
            {/* Media Refinement Field */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', background: 'var(--bg-app)', padding: '1rem', borderRadius: '20px', border: '1px solid var(--border-color)', marginTop: '1.5rem', textAlign: 'left' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: '700' }}>
                  <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.3rem' }}>design_services</span>
                  Popraw to {generatedVideo ? 'wideo' : 'zdjęcie'}:
                </label>
                <textarea 
                  value={mediaFeedback}
                  onChange={(e) => setMediaFeedback(e.target.value)}
                  placeholder="Napisz co zmienić (np. zrób tak aby w tle było morze, zmień kolory na ciemniejsze)..."
                  style={{ width: '100%', minHeight: '60px', padding: '0.8rem', fontSize: '0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-main)', resize: 'vertical' }}
                  disabled={isMediaRefining}
                />
              </div>
              <button 
                onClick={handleRefineMedia}
                disabled={!mediaFeedback.trim() || isMediaRefining}
                className="btn-primary"
                style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minWidth: '120px' }}
              >
                {isMediaRefining ? <span className="spinner"></span> : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.3rem' }}>draw</span>
                    Zastosuj
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setGeneratedImage(null); setGeneratedVideo(null); }} className="btn-secondary" style={{ flex: 1, borderRadius: '15px' }}>Usuń / Nowa</button>
              <a href={generatedVideo || generatedImage} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1.5, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }} download>
                Pobierz {generatedVideo ? 'Wideo' : 'Obraz'}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultSection;
