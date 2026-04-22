import React, { useState } from 'react';

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
  handleGenerateVideo, 
  handleGenerateImage, 
  handleAnimateImage,
  mediaFeedback, 
  setMediaFeedback, 
  isMediaRefining, 
  handleRefineMedia,
  imagePromptData,
  setImagePromptData,
  videoPromptData,
  setVideoPromptData,
  isVisualSyncing,
  handleSyncVisualPrompt,
  mediaHistory,
  setMediaHistory,
  aiDetectionLog,
  setAiDetectionLog,
  setGeneratedImage,
  setGeneratedVideo,
  API_BASE_URL,
  handleReset
}) => {
  const [mediaTab, setMediaTab] = useState('image');
  const [isModified, setIsModified] = useState(false);
  const [isSyncSuccess, setIsSyncSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingMediaIdx, setEditingMediaIdx] = useState(null);
  const [animatingMediaIdx, setAnimatingMediaIdx] = useState(null);
  const [animationFeedback, setAnimationFeedback] = useState('');

  // Auto-scroll logic to focus on user action
  React.useEffect(() => {
    if (editingMediaIdx !== null) {
      setTimeout(() => {
        const el = document.getElementById(`edit-panel-${editingMediaIdx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [editingMediaIdx]);

  React.useEffect(() => {
    if (animatingMediaIdx !== null) {
      setTimeout(() => {
        const el = document.getElementById(`animation-panel-${animatingMediaIdx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [animatingMediaIdx]);

  React.useEffect(() => {
    // Scroll to the new prompt description panel as soon as it appears/is ready
    if (isPromptMode && !imageLoading) {
      setTimeout(() => {
        const el = document.getElementById("current-prompt-panel");
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isPromptMode, imageLoading]);

  const onSyncClick = async () => {
    try {
      await handleSyncVisualPrompt();
      setIsSyncSuccess(true);
      setIsModified(false);
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  const handleDownload = (url, type) => {
    // Use backend proxy to bypass CORS and force download
    const proxyUrl = `${API_BASE_URL}/download-proxy?url=${encodeURIComponent(url)}`;
    
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const currentPromptData = mediaTab === 'video' ? videoPromptData : imagePromptData;
  const setCurrentPromptData = mediaTab === 'video' ? setVideoPromptData : setImagePromptData;
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--color-primary)', fontWeight: '700', margin: 0 }}>Wygenerowana Treść</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                {showAdvanced ? 'expand_less' : 'edit'}
              </span>
              {showAdvanced ? 'Zwiń' : 'Edytuj'}
            </button>
            <button onClick={() => copyToClipboard(result)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
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
        
        {/* Text Refinement Field (Hidden under Advanced) */}
        {showAdvanced && (
          <div className="premium-border" style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
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
        )}
      </div>

      {/* Visualization Section */}
      <div className="glass" style={{ padding: '3.5rem 2.5rem', borderRadius: '40px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out 0.2s both', marginTop: '1rem' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'left' }}>
          <h2 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '2.2rem', marginBottom: '0.8rem', letterSpacing: '-0.5px' }}>Utwórz wizualizacje</h2>
          {!currentPromptData && (
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: '400' }}>Wybierz platformę i wygeneruj profesjonalne materiały AI.</p>
          )}
        </div>
        
        {/* Media Tab Bar - Segmented Control Look */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', background: 'var(--bg-app)', padding: '0.4rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setMediaTab('image')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '14px',
              border: 'none',
              background: mediaTab === 'image' ? 'var(--bg-white)' : 'transparent',
              color: mediaTab === 'image' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: mediaTab === 'image' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease'
            }}
          >
            Obraz
          </button>
          <button
            onClick={() => setMediaTab('video')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '14px',
              border: 'none',
              background: mediaTab === 'video' ? 'var(--bg-white)' : 'transparent',
              color: mediaTab === 'video' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: mediaTab === 'video' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem'
            }}
          >
            Wideo
            <span style={{ 
              fontSize: '0.5rem', 
              background: '#f4af45', 
              color: '#000', 
              padding: '0.15rem 0.4rem', 
              borderRadius: '4px', 
              fontWeight: '900',
              textTransform: 'uppercase'
            }}>
              EKSPERYMENTALNA
            </span>
          </button>
        </div>

        {/* Graphic Options */}
        {(!currentPromptData) && (
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              1. Wybierz format {mediaTab === 'image' ? 'obrazu' : 'wideo'}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '3.5rem' }}>
              {(mediaTab === 'image' ? [
                { id: '1:1', label: 'crop_square', tip: 'Post', color: 'var(--color-primary)', desc: 'Idealny na Instagram Feed i Facebook. Klasyczny, uniwersalny kwadrat.', aspect: '1/1' },
                { id: '4:5', label: 'portrait', tip: 'Portret', color: 'var(--color-info)', desc: 'Najlepszy zasięg na Instagramie. Zajmuje więcej miejsca na ekranie.', aspect: '4/5' },
                { id: '9:16', label: 'smartphone', tip: 'Story', color: '#38bdf8', desc: 'Standard dla TikTok, Reels i Instagram Stories. Pełny ekran pionowy.', aspect: '9:16' },
                { id: '16:9', label: 'desktop_windows', tip: 'Poziom', color: '#818cf8', desc: 'Idealny na YouTube, LinkedIn i Twitter (X). Format profesjonalny.', aspect: '16/9' }
              ] : [
                { id: '9:16', label: 'movie', tip: 'Reels / TikTok', color: '#38bdf8', desc: 'Idealny format dla krótkich wideo pionowych. Maksymalizuje zasięg na telefonach.', aspect: '9/16' },
                { id: '9:16', label: 'history', tip: 'Stories', color: 'var(--color-primary)', desc: 'Standardowy format 9:16 dla relacji na Instagramie i Facebooku.', aspect: '9/16' },
                { id: '4:5', label: 'portrait', tip: 'Feed (Pion)', color: 'var(--color-info)', desc: 'Zajmuje więcej miejsca w przewijanym kanale niż kwadrat.', aspect: '4/5' },
                { id: '1:1', label: 'crop_square', tip: 'Feed (Kwadrat)', color: '#818cf8', desc: 'Klasyczny format kwadratowy, bezpieczny wybór dla każdego kanału.', aspect: '1/1' }
              ]).map((format, idx) => {
                const isActive = mediaTab === 'image' ? activeImageLabel === format.tip : activeVideoLabel === format.tip;
                return (
                  <div key={`${format.id}-${idx}`} style={{ position: 'relative' }} className="format-card-container">
                    <button
                      onClick={() => {
                        if (mediaTab === 'image') {
                          setImageAspectRatio(format.id);
                          setActiveImageLabel(format.tip);
                        } else {
                          setVideoAspectRatio(format.id);
                          setActiveVideoLabel(format.tip);
                        }
                      }}
                      style={{
                        width: '100%',
                        minHeight: '220px',
                        padding: '1.5rem 1rem',
                        borderRadius: '24px',
                        border: isActive ? `2px solid ${format.color}` : '1px solid var(--border-color)',
                        background: isActive ? `rgba(${format.color === 'var(--color-primary)' ? '56, 189, 248' : '100, 100, 100'}, 0.03)` : 'var(--bg-app)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1.2rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isActive ? `0 10px 25px rgba(0,0,0,0.08)` : 'none'
                      }}
                    >
                      {/* Frame Preview Visual */}
                      <div style={{ 
                        width: '70px', 
                        height: '90px', 
                        border: `2px dashed ${isActive ? format.color : 'var(--border-color)'}`,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isActive ? 1 : 0.4,
                        background: isActive ? `rgba(${format.color === 'var(--color-primary)' ? '56, 189, 248' : '100, 100, 100'}, 0.05)` : 'transparent'
                      }}>
                        <div style={{ 
                          width: format.aspect === '1/1' ? '45px' : (format.aspect === '16/9' ? '55px' : '35px'),
                          height: format.aspect === '1/1' ? '45px' : (format.aspect === '9:16' || format.aspect === '4/5' ? '65px' : '32px'),
                          background: isActive ? format.color : 'var(--text-muted)',
                          borderRadius: '5px',
                          opacity: 0.25,
                          transition: 'all 0.3s ease'
                        }}></div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.2rem' }}>{format.tip}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{format.id}</div>
                      </div>
                    </button>

                    {/* Info trigger at top right */}
                    <div className="format-info-trigger" style={{ 
                      position: 'absolute', 
                      top: '15px', 
                      right: '15px', 
                      cursor: 'help', 
                      color: isActive ? format.color : 'var(--text-muted)', 
                      opacity: 0.7,
                      zIndex: 10
                    }}>
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>info</span>
                      <div className="format-tooltip" style={{
                        position: 'absolute',
                        bottom: '115%',
                        right: '-5px',
                        width: '220px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        padding: '1.2rem',
                        borderRadius: '18px',
                        fontSize: '0.85rem',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                        border: `1px solid ${format.color}`,
                        pointerEvents: 'none',
                        opacity: 0,
                        transition: 'all 0.3s ease',
                        zIndex: 100,
                        textAlign: 'left',
                        lineHeight: '1.6'
                      }}>
                        <strong style={{ color: format.color, display: 'block', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{format.tip}</strong>
                        {format.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Action Button - Centered and Premium */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
              <button 
                onClick={() => handleGeneratePrompt(mediaTab)}
                disabled={imageLoading || isReadOnly}
                className="btn-primary" 
                style={{ 
                  minWidth: '450px', 
                  padding: '1.4rem 3rem', 
                  borderRadius: '50px', 
                  fontSize: '1.2rem', 
                  fontWeight: '800',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '1rem',
                  boxShadow: '0 20px 40px rgba(56, 189, 248, 0.25)',
                  background: 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
                  border: 'none',
                  color: '#fff',
                  cursor: (imageLoading || isReadOnly) ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!imageLoading && !isReadOnly) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(56, 189, 248, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(56, 189, 248, 0.25)';
                }}
              >
                {imageLoading && visualizationType === mediaTab ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.6rem' }}>{mediaTab === 'video' ? 'movie' : 'auto_fix_high'}</span>
                    <span>{isReadOnly ? 'Brak AI' : `Przygotuj ${mediaTab === 'image' ? 'obraz' : 'wideo'}`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {mediaHistory && mediaHistory.filter(m => m.type === mediaTab).length > 0 && (
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Historia Wygenerowanych Mediów
            </h3>
            
            {mediaHistory.filter(m => m.type === mediaTab && !m.parentUrl).map((media, idx) => (
              <div key={idx} id={`media-item-${idx}`} style={{ textAlign: 'center', background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '30px', border: '1px solid var(--border-color)', position: 'relative' }}>
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
                  <div style={{ position: 'relative' }}>
                    <img src={media.url} alt={`Generated version ${idx + 1}`} style={{ width: '100%', borderRadius: '20px', boxShadow: 'var(--shadow-md)' }} />
                    <button 
                      onClick={() => {
                        setAnimatingMediaIdx(animatingMediaIdx === idx ? null : idx);
                        setAnimationFeedback('');
                      }}
                      disabled={imageLoading || isReadOnly}
                      className="glass"
                      style={{ 
                        position: 'absolute', 
                        bottom: '1rem', 
                        right: '1rem', 
                        padding: '0.6rem 1rem', 
                        borderRadius: '15px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        fontSize: '0.75rem', 
                        fontWeight: '700',
                        color: animatingMediaIdx === idx ? '#fff' : 'var(--text-main)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: 'var(--shadow-lg)',
                        background: animatingMediaIdx === idx ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem', color: animatingMediaIdx === idx ? '#fff' : 'var(--color-primary)' }}>{animatingMediaIdx === idx ? 'close' : 'movie'}</span>
                      {animatingMediaIdx === idx ? 'Anuluj' : 'Ożyw to zdjęcie (wideo)'}
                    </button>
                  </div>
                )}

                {/* Animation Prompt Panel */}
                {media.type === 'image' && animatingMediaIdx === idx && (
                  <div id={`animation-panel-${idx}`} style={{ 
                    marginTop: '1.5rem', 
                    padding: '1.5rem', 
                    background: 'var(--bg-card)', 
                    borderRadius: '20px', 
                    border: '1px solid var(--color-primary)',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.6rem', fontWeight: '800' }}>
                          <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>movie_filter</span>
                          Instrukcja animacji:
                        </label>
                        <textarea 
                          value={animationFeedback}
                          onChange={(e) => setAnimationFeedback(e.target.value)}
                          placeholder="Opisz jak zdjęcie ma zostać ożywione (np. postać się uśmiecha, tło lekko faluje...)"
                          style={{ 
                            width: '100%', 
                            minHeight: '80px', 
                            padding: '1rem', 
                            fontSize: '0.9rem', 
                            borderRadius: '15px', 
                            border: '1px solid var(--border-color)', 
                            background: 'var(--bg-white)', 
                            color: 'var(--text-main)', 
                            resize: 'none' 
                          }}
                          disabled={imageLoading}
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          await handleAnimateImage(media.url, animationFeedback);
                          setAnimatingMediaIdx(null);
                        }}
                        disabled={!animationFeedback.trim() || imageLoading}
                        className="btn-primary"
                        style={{ 
                          width: '120px',
                          height: '80px',
                          borderRadius: '15px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          background: 'linear-gradient(135deg, var(--color-primary), #1d4ed8)'
                        }}
                      >
                        {imageLoading ? <span className="spinner"></span> : (
                          <>
                            <span className="material-icons" style={{ fontSize: '1.4rem' }}>play_circle_filled</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Rozkaż AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Grouped Child Videos */}
                {media.type === 'image' && mediaHistory.some(m => m.parentUrl === media.url) && (
                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-color)' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>auto_videocam</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Ożywione wersje tego zdjęcia</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {mediaHistory.filter(m => m.parentUrl === media.url).map((video, vIdx) => (
                        <div key={vIdx} style={{ background: 'rgba(var(--color-primary-rgb), 0.03)', padding: '1rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                           <video 
                            src={video.url} 
                            controls 
                            style={{ width: '100%', borderRadius: '15px', boxShadow: 'var(--shadow-sm)', background: '#000' }} 
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                            <button 
                              onClick={() => handleDownload(video.url, 'video')} 
                              className="btn-primary" 
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem' }}
                            >
                              Pobierz
                            </button>
                            <button 
                              onClick={() => {
                                const newHistory = [...mediaHistory];
                                const actualIdx = mediaHistory.indexOf(video);
                                newHistory.splice(actualIdx, 1);
                                setMediaHistory(newHistory);
                              }} 
                              className="btn-secondary" 
                              style={{ flex: 0.5, padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem' }}
                            >
                              Usuń
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                  <button 
                    onClick={() => {
                      const newHistory = [...mediaHistory];
                      newHistory.splice(idx, 1);
                      setMediaHistory(newHistory);
                      if (newHistory.length === 0) {
                        setGeneratedImage(null);
                        setGeneratedVideo(null);
                      }
                    }} 
                    className="btn-secondary" 
                    style={{ flex: 1, borderRadius: '15px', fontSize: '0.8rem' }}
                  >
                    Usuń
                  </button>
                  <button 
                    onClick={() => setEditingMediaIdx(editingMediaIdx === idx ? null : idx)}
                    className="btn-secondary"
                    style={{ 
                      flex: 1, 
                      borderRadius: '15px', 
                      fontSize: '0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.4rem',
                      border: editingMediaIdx === idx ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                      color: editingMediaIdx === idx ? 'var(--color-primary)' : 'var(--text-main)'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>edit</span>
                    Edytuj
                  </button>
                  <button 
                    onClick={() => handleDownload(media.url, media.type)} 
                    className="btn-primary" 
                    style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', fontSize: '0.85rem', cursor: 'pointer', border: 'none' }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>download</span>
                    Pobierz
                  </button>
                </div>


                {/* Integrated Refinement Panel */}
                {editingMediaIdx === idx && (
                  <div id={`edit-panel-${idx}`} style={{ 
                    marginTop: '1.5rem', 
                    padding: '1.5rem', 
                    background: 'var(--bg-card)', 
                    borderRadius: '20px', 
                    border: '1px solid var(--color-primary)',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.6rem', fontWeight: '800' }}>
                          <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>auto_fix_high</span>
                          Co chcesz zmienić na tym obrazie?
                        </label>
                        <textarea 
                          value={mediaFeedback}
                          onChange={(e) => setMediaFeedback(e.target.value)}
                          placeholder="np. zmień kolor sukienki na czerwony, dodaj okulary przeciwsłoneczne..."
                          style={{ 
                            width: '100%', 
                            minHeight: '80px', 
                            padding: '1rem', 
                            fontSize: '0.9rem', 
                            borderRadius: '15px', 
                            border: '1px solid var(--border-color)', 
                            background: 'var(--bg-white)', 
                            color: 'var(--text-main)', 
                            resize: 'none' 
                          }}
                          disabled={isMediaRefining}
                        />
                      </div>
                      <button 
                        onClick={() => handleRefineMedia(idx)}
                        disabled={!mediaFeedback.trim() || isMediaRefining}
                        className="btn-primary"
                        style={{ 
                          width: '120px',
                          height: '80px',
                          borderRadius: '15px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          background: 'linear-gradient(135deg, var(--color-primary), #1d4ed8)'
                        }}
                      >
                        {isMediaRefining ? <span className="spinner"></span> : (
                          <>
                            <span className="material-icons" style={{ fontSize: '1.4rem' }}>auto_awesome</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Rozkaż AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAdvanced && mediaHistory.length > 0 && (
              <button 
                onClick={handleReset} 
                className="btn-secondary" 
                style={{ 
                  width: '100%', 
                  padding: '0.8rem', 
                  borderRadius: '15px', 
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'rgba(var(--color-primary-rgb), 0.05)',
                  border: '1px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                  fontWeight: '700'
                }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>save</span>
                Zakończ i zapisz projekt
              </button>
            )}

            {/* Loading Placeholder for new media refinement/generation */}
            {visualizationType === mediaTab && (isMediaRefining || (imageLoading && isPromptMode)) && (
              <div id="media-loading-placeholder" className="glass" style={{ 
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
                    Tworzenie nowej wersji...
                  </h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7, maxWidth: '300px' }}>
                    Nano Banana nakłada poprawki, dbając o spójność z oryginałem.
                  </p>
                </div>

              </div>
            )}
            
          </div>
        )}

        {currentPromptData && (
          <div id="current-prompt-panel" className="glass" style={{ 
            marginTop: '2.5rem', 
            padding: '2rem', 
            borderRadius: '30px', 
            border: isSyncSuccess ? '2px solid #10b981' : '1px solid var(--border-color)',
            animation: 'fadeIn 0.5s ease-out',
            background: 'rgba(var(--color-primary-rgb), 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                background: 'rgba(56, 189, 248, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <span className="material-icons">auto_awesome</span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Projekt wizualny Nano Banana</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI przygotowało opis {visualizationType === 'video' ? 'klipu wideo' : 'grafiki'} na bazie Twojego posta</p>
              </div>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
              <textarea 
                value={currentPromptData.polishDescription || ''}
                onChange={(e) => {
                  setCurrentPromptData(prev => ({ ...prev, polishDescription: e.target.value }));
                  setIsModified(true);
                  setIsSyncSuccess(false);
                }}
                placeholder="Tutaj pojawi się opis obrazu..."
                style={{ 
                  width: '100%',
                  minHeight: '140px', 
                  fontSize: '1.05rem', 
                  lineHeight: '1.7',
                  background: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  padding: '1.5rem',
                  border: isSyncSuccess ? '2px solid #10b981' : (isModified ? '2px solid var(--color-primary)' : '1px solid var(--border-color)'),
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  resize: 'vertical',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
              />
              {isModified && !isSyncSuccess && (
                <div style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px', 
                  fontSize: '0.7rem', 
                  background: 'var(--color-primary)', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: '700'
                }}>
                  ZMIENIONO
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={onSyncClick}
                disabled={isVisualSyncing || isReadOnly || !isModified}
                className="btn-secondary"
                style={{ 
                  width: '100%', 
                  padding: '1.2rem', 
                  borderRadius: '18px', 
                  fontSize: '0.95rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.8rem',
                  border: isSyncSuccess ? '2px solid #10b981' : (isModified ? '2px solid var(--color-primary)' : '1px solid var(--border-color)'),
                  color: isSyncSuccess ? '#10b981' : (isModified ? 'var(--color-primary)' : 'var(--text-muted)'),
                  background: isSyncSuccess ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  cursor: isModified ? 'pointer' : 'default',
                  fontWeight: '800'
                }}
              >
                {isVisualSyncing ? <span className="spinner"></span> : (
                  <>
                    <span className="material-icons">
                      {isSyncSuccess ? 'check_circle' : 'sync'}
                    </span>
                    {isSyncSuccess ? 'Instrukcje zsynchronizowane' : 'Zsynchronizuj zmiany z AI'}
                  </>
                )}
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <button onClick={() => setCurrentPromptData(null)} className="btn-secondary" style={{ padding: '1rem', borderRadius: '18px', fontWeight: '700' }}>
                  Anuluj
                </button>
                <button 
                  onClick={() => mediaTab === 'video' ? handleGenerateVideo() : handleGenerateImage()} 
                  disabled={imageLoading || isReadOnly || isVisualSyncing || (isModified && !isSyncSuccess)} 
                  className="btn-primary" 
                  style={{ 
                    padding: '1.2rem', 
                    borderRadius: '18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.8rem',
                    fontSize: '1rem',
                    boxShadow: '0 10px 20px rgba(56, 189, 248, 0.2)',
                    opacity: (isModified && !isSyncSuccess) ? 0.5 : 1
                  }}
                >
                  {imageLoading ? <span className="spinner"></span> : (
                    <>
                      <span className="material-icons">{mediaTab === 'video' ? 'movie' : 'rocket_launch'}</span>
                      {mediaTab === 'video' ? 'Generuj Klip Wideo' : 'Generuj Grafikę'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultSection;
