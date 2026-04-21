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
      </div>

      {/* Visualization Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out 0.2s both' }}>
        <h3 style={{ color: 'var(--color-primary)', fontWeight: '700', marginBottom: '1.5rem' }}>Utwórz wizualizacje</h3>
        
        {/* Media Tab Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setMediaTab('image')}
              style={{
                flex: 1,
                padding: '0.6rem 0.4rem',
                borderRadius: '12px',
                border: mediaTab === 'image' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: mediaTab === 'image' ? 'var(--bg-white)' : 'var(--bg-app)',
                color: mediaTab === 'image' ? 'var(--color-primary)' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: mediaTab === 'image' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Obraz
            </button>
            <button
              onClick={() => setMediaTab('video')}
              style={{
                flex: 1,
                padding: '0.6rem 0.4rem',
                borderRadius: '12px',
                border: mediaTab === 'video' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: mediaTab === 'video' ? 'var(--bg-white)' : 'var(--bg-app)',
                color: mediaTab === 'video' ? 'var(--color-primary)' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: mediaTab === 'video' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Wideo
            </button>
          </div>
          {/* Graphic Options */}
        {(!currentPromptData) && (
          <div style={{ marginTop: '1rem' }}>
            
            {/* Image Generation Block */}
            {mediaTab === 'image' && ( <> <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Wybierz format obrazu
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
                {[
                  { id: '1:1', label: 'crop_square', tip: 'Post', color: 'var(--color-primary)', desc: 'Idealny na Instagram Feed i Facebook. Klasyczny, uniwersalny kwadrat.' },
                  { id: '4:5', label: 'portrait', tip: 'Portret', color: 'var(--color-info)', desc: 'Najlepszy zasięg na Instagramie. Zajmuje więcej miejsca na ekranie.' },
                  { id: '9:16', label: 'smartphone', tip: 'Story', color: '#38bdf8', desc: 'Standard dla TikTok, Reels i Instagram Stories. Pełny ekran pionowy.' },
                  { id: '16:9', label: 'desktop_windows', tip: 'Poziom', color: '#818cf8', desc: 'Idealny na YouTube, LinkedIn i Twitter (X). Format profesjonalny.' }
                ].map(format => (
                  <div key={format.id} style={{ position: 'relative' }} className="format-container">
                    <button
                      onClick={() => {
                        setImageAspectRatio(format.id);
                        setActiveImageLabel(format.tip);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.8rem 0.4rem',
                        borderRadius: '15px',
                        border: activeImageLabel === format.tip ? `2px solid ${format.color}` : '1px solid var(--border-color)',
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
                      <span className="material-icons" style={{ fontSize: '1.3rem', color: activeImageLabel === format.tip ? format.color : 'var(--text-muted)' }}>{format.label}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>{format.tip}</span>
                    </button>
                    <div className="format-info-trigger" style={{ position: 'absolute', top: '8px', right: '8px', cursor: 'help', color: format.color, opacity: 0.8 }}>
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>info</span>
                      <div className="format-tooltip" style={{
                        position: 'absolute',
                        bottom: '130%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '240px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        padding: '1rem',
                        borderRadius: '16px',
                        fontSize: '0.9rem',
                        boxShadow: 'var(--shadow-lg)',
                        border: `1px solid ${format.color}`,
                        pointerEvents: 'none',
                        opacity: 0,
                        transition: 'all 0.3s ease',
                        zIndex: 100,
                        textAlign: 'center',
                        lineHeight: '1.5'
                      }}>
                        <strong style={{ color: format.color, display: 'block', marginBottom: '0.3rem' }}>{format.tip}</strong>
                        {format.desc}
                      </div>
                    </div>
                  </div>
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
      </> )}

            {/* Video Generation Block */}
            {mediaTab === 'video' && ( <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Wybierz format wideo (Reels/TikTok)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
                {[
                  { id: '9:16', label: 'movie', tip: 'Reels / TikTok', color: '#38bdf8', desc: 'Idealny format dla krótkich wideo pionowych. Maksymalizuje zasięg na telefonach.' },
                  { id: '9:16', label: 'history', tip: 'Stories', color: 'var(--color-primary)', desc: 'Standardowy format 9:16 dla relacji na Instagramie i Facebooku.' },
                  { id: '4:5', label: 'portrait', tip: 'Feed (Pion)', color: 'var(--color-info)', desc: 'Zajmuje więcej miejsca w przewijanym kanale niż kwadrat.' },
                  { id: '1:1', label: 'crop_square', tip: 'Feed (Kwadrat)', color: '#818cf8', desc: 'Klasyczny format kwadratowy, bezpieczny wybór dla każdego kanału.' }
                ].map((format, idx) => (
                  <div key={`${format.id}-${idx}`} style={{ position: 'relative' }} className="format-container">
                    <button
                      onClick={() => {
                        setVideoAspectRatio(format.id);
                        setActiveVideoLabel(format.tip);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.8rem 0.4rem',
                        borderRadius: '15px',
                        border: activeVideoLabel === format.tip ? `2px solid ${format.color}` : '1px solid var(--border-color)',
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
                      <span className="material-icons" style={{ fontSize: '1.3rem', color: activeVideoLabel === format.tip ? format.color : 'var(--text-muted)' }}>{format.label}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>{format.tip}</span>
                    </button>
                    <div className="format-info-trigger" style={{ position: 'absolute', top: '8px', right: '8px', cursor: 'help', color: format.color, opacity: 0.8 }}>
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>info</span>
                      <div className="format-tooltip" style={{
                        position: 'absolute',
                        bottom: '130%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '240px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        padding: '1rem',
                        borderRadius: '16px',
                        fontSize: '0.9rem',
                        boxShadow: 'var(--shadow-lg)',
                        border: `1px solid ${format.color}`,
                        pointerEvents: 'none',
                        opacity: 0,
                        transition: 'all 0.3s ease',
                        zIndex: 100,
                        textAlign: 'center',
                        lineHeight: '1.5'
                      }}>
                        <strong style={{ color: format.color, display: 'block', marginBottom: '0.3rem' }}>{format.tip}</strong>
                        {format.desc}
                      </div>
                    </div>
                  </div>
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
    )}
          </div>
        )}

        {currentPromptData && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '25px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: '600' }}>
              <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>auto_awesome</span>
              Nano Banana przygotował opis {visualizationType === 'video' ? 'klipu wideo' : 'grafiki'}:
            </p>
            
            {/* Polish Description (Editable) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700' }}>OPIS (PL) - Możesz edytować:</label>
              <textarea 
                value={currentPromptData.polishDescription || ''}
                onChange={(e) => {
                  setCurrentPromptData(prev => ({ ...prev, polishDescription: e.target.value }));
                  setIsModified(true);
                  setIsSyncSuccess(false);
                }}
                style={{ 
                  width: '100%',
                  minHeight: '100px', 
                  fontSize: '0.9rem', 
                  background: 'var(--bg-white)',
                  color: 'var(--text-main)',
                  padding: '1rem',
                  border: isSyncSuccess ? '1px solid #10b981' : '1px solid var(--border-color)',
                  borderRadius: '15px',
                  transition: 'border 0.3s ease'
                }}
              />
              <button 
                onClick={onSyncClick}
                disabled={isVisualSyncing || isReadOnly || !isModified}
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
                {isVisualSyncing ? <span className="spinner"></span> : (
                  <>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                      {isSyncSuccess ? 'check_circle' : 'auto_fix_high'}
                    </span>
                    {isSyncSuccess ? 'Zmiany zapisane' : 'Zastosuj zmiany w opisie'}
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setCurrentPromptData(null)} className="btn-secondary" style={{ padding: '0.8rem', borderRadius: '15px' }}>
                Anuluj
              </button>
              <button 
                onClick={() => mediaTab === 'video' ? handleGenerateVideo() : handleGenerateImage()} 
                disabled={imageLoading || isReadOnly || isVisualSyncing} 
                className="btn-primary" 
                style={{ padding: '0.8rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {imageLoading ? 'Generowanie...' : (
                  <>
                    <span className="material-icons" style={{ marginRight: '0.5rem' }}>{mediaTab === 'video' ? 'movie' : 'rocket_launch'}</span>
                    {mediaTab === 'video' ? 'Generuj Klip (400k)' : 'Generuj obraz (10k)'}
                  </>
                )}
                {imageLoading && <span className="spinner"></span>}
              </button>
            </div>
          </div>
        )}

        {mediaHistory && mediaHistory.filter(m => m.type === mediaTab).length > 0 && (
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Historia Wygenerowanych Mediów
            </h3>
            
            {mediaHistory.filter(m => m.type === mediaTab).map((media, idx) => (
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
                  <div style={{ position: 'relative' }}>
                    <img src={media.url} alt={`Generated version ${idx + 1}`} style={{ width: '100%', borderRadius: '20px', boxShadow: 'var(--shadow-md)' }} />
                    <button 
                      onClick={() => handleGenerateVideo(null, media.url)}
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
                        color: 'var(--text-main)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: 'var(--shadow-lg)'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>movie</span>
                      Ożyw to zdjęcie (wideo)
                    </button>
                  </div>
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
                  <button 
                    onClick={() => handleDownload(media.url, media.type)} 
                    className="btn-primary" 
                    style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', fontSize: '0.85rem', cursor: 'pointer', border: 'none' }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>download</span>
                    Pobierz {media.type === 'video' ? 'Wideo' : 'Obraz'}
                  </button>
                </div>

                {/* Integrated Refinement Panel (Only for the latest version) */}
                {idx === mediaHistory.filter(m => m.type === mediaTab).length - 1 && visualizationType === mediaTab && currentPromptData && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    paddingTop: '1.5rem', 
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.6rem', fontWeight: '800' }}>
                          <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>auto_fix_high</span>
                          Udoskonal ten projekt:
                        </label>
                        <textarea 
                          value={mediaFeedback}
                          onChange={(e) => setMediaFeedback(e.target.value)}
                          placeholder="np. zmień kolorystykę, dodaj więcej detali, zmień postać..."
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
                          background: 'linear-gradient(135deg, var(--color-primary), #00d2ff)'
                        }}
                      >
                        {isMediaRefining ? <span className="spinner"></span> : (
                          <>
                            <span className="material-icons" style={{ fontSize: '1.4rem' }}>auto_awesome</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Zastosuj</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button onClick={handleReset} className="btn-secondary" style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', marginTop: '1rem' }}>
              Zapisz projekt
            </button>

            {/* Loading Placeholder for new media refinement/generation */}
            {visualizationType === mediaTab && (isMediaRefining || imageLoading) && (
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

              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultSection;
