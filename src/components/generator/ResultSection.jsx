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
  setVisualizationType, 
  handleGeneratePrompt, 
  isAutoGenerating,
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
  handleReset,
  handleOptimizePrompt,
  isOptimizing,
  handleGetPostSchedule,
  postSchedule,
  setPostSchedule,
  topic,
  platform,
  productDescription
}) => {
  const [isModified, setIsModified] = useState(false);
  const [isSyncSuccess, setIsSyncSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingMediaIdx, setEditingMediaIdx] = useState(null);
  const [animatingMediaIdx, setAnimatingMediaIdx] = useState(null);
  const [animationFeedback, setAnimationFeedback] = useState('');
  const [mediaError, setMediaError] = useState(false);
  const [animationError, setAnimationError] = useState(false);
  const [isVisualPanelOpen, setIsVisualPanelOpen] = useState(false);
  
  const [isGeneratingPostSchedule, setIsGeneratingPostSchedule] = useState(false);
  const [isScheduleCollapsed, setIsScheduleCollapsed] = useState(false);

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let content = line;
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('### ')) {
        return <h3 key={i} style={{ margin: '1rem 0 0.5rem 0', color: 'var(--color-primary)' }} dangerouslySetInnerHTML={{ __html: content.substring(4) }} />;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.4rem' }} dangerouslySetInnerHTML={{ __html: content.substring(2) }} />;
      }
      return <p key={i} style={{ margin: '0.4rem 0' }} dangerouslySetInnerHTML={{ __html: content }} />;
    });
  };

  const onGetScheduleClick = async () => {
    if (isGeneratingPostSchedule) return;
    setIsGeneratingPostSchedule(true);
    const result = await handleGetPostSchedule();
    if (result) {
      setPostSchedule(result);
    }
    setIsGeneratingPostSchedule(false);
  };

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
  const currentPromptData = visualizationType === 'video' ? videoPromptData : imagePromptData;
  const setCurrentPromptData = visualizationType === 'video' ? setVideoPromptData : setImagePromptData;
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '2px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out' }}>
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
                borderRadius: '1.5px',
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
        
        {/* Action Buttons Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button 
            onClick={onGetScheduleClick}
            disabled={isGeneratingPostSchedule}
            style={{
              background: 'none',
              border: 'none',
              color: postSchedule ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            className="hover-opacity"
            title="Sprawdź kiedy najlepiej opublikować ten post"
          >
            {isGeneratingPostSchedule ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : <span className="material-icons" style={{ fontSize: '1.2rem' }}>schedule</span>}
            {postSchedule ? 'Rekomendacja czasu aktywna' : 'Kiedy opublikować?'}
          </button>
        </div>

        {postSchedule && (
          <div style={{ 
            marginTop: '1rem', 
            padding: isScheduleCollapsed ? '0.8rem 1.2rem' : '1.2rem', 
            background: 'rgba(66, 133, 244, 0.03)', 
            borderRadius: '8px', 
            borderLeft: '4px solid var(--color-primary)',
            animation: 'fadeIn 0.3s ease-out',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                onClick={() => setIsScheduleCollapsed(!isScheduleCollapsed)}
              >
                <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
                  AI: Sugerowany czas publikacji
                </h4>
                <span className="material-icons" style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--color-primary)',
                  transform: isScheduleCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s'
                }}>
                  expand_more
                </span>
              </div>
              <button 
                onClick={() => setPostSchedule(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                title="Usuń rekomendację"
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
            
            {!isScheduleCollapsed && (
              <div style={{ 
                marginTop: '1rem', 
                fontSize: '0.95rem', 
                color: 'var(--text-main)', 
                lineHeight: '1.6',
                borderTop: '1px solid rgba(66, 133, 244, 0.1)',
                paddingTop: '1rem'
              }}>
                {renderMarkdown(postSchedule)}
              </div>
            )}
          </div>
        )}

        {/* Text Refinement Field (Hidden under Advanced) */}
        {showAdvanced && (
          <div className="premium-border" style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '1rem', animation: 'fadeIn 0.3s ease-out', marginTop: '1.5rem' }}>
            <textarea 
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              placeholder="Co chcesz poprawić w tym poście? (np. skróć do 3 zdań, dodaj więcej dynamiki...)"
              style={{ flex: 1, minHeight: '60px', padding: '0.8rem', fontSize: '0.9rem', borderRadius: '1px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-main)', resize: 'vertical' }}
              disabled={isTextRefining}
            />
            <button 
              onClick={handleRefineText}
              disabled={!textFeedback.trim() || isTextRefining}
              className="btn-primary"
              style={{ padding: '0.8rem 1.5rem', borderRadius: '1px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
      {(!isVisualPanelOpen && !isPromptMode && !imageLoading && (!mediaHistory || mediaHistory.length === 0)) ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          animation: 'fadeIn 0.8s ease-out 0.2s both' 
        }}>
          <button 
            onClick={() => setIsVisualPanelOpen(true)}
            className="premium-button"
            style={{ 
              padding: '1.5rem 4rem', 
              borderRadius: '25px', 
              fontSize: '1.2rem', 
              gap: '1rem',
              boxShadow: '0 20px 40px rgba(56, 189, 248, 0.25)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '1.8rem', animation: 'float 3s ease-in-out infinite' }}>rocket_launch</span>
            Utwórz wizualizację AI
          </button>
        </div>
      ) : (
        <div className="glass" style={{ padding: '3.5rem 2.5rem', borderRadius: '2.5px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out 0.2s both' }}>
          <div style={{ marginBottom: '3rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '2.2rem', marginBottom: '0.8rem', letterSpacing: '-0.5px' }}>Utwórz wizualizacje</h2>
              {!isPromptMode && (
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: '400' }}>Wybierz platformę i wygeneruj profesjonalne materiały AI.</p>
              )}
            </div>
            {isVisualPanelOpen && !isPromptMode && !imageLoading && (!mediaHistory || mediaHistory.length === 0) && (
              <button 
                onClick={() => setIsVisualPanelOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        
        {/* Media Tab Bar - Segmented Control Look */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', background: 'var(--bg-app)', padding: '0.4rem', borderRadius: '1.5px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setVisualizationType('image')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '1px',
              border: 'none',
              background: visualizationType === 'image' ? 'var(--bg-white)' : 'transparent',
              color: visualizationType === 'image' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: visualizationType === 'image' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease'
            }}
          >
            Obraz
          </button>
          <button
            onClick={() => setVisualizationType('video')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '1px',
              border: 'none',
              background: visualizationType === 'video' ? 'var(--bg-white)' : 'transparent',
              color: visualizationType === 'video' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: visualizationType === 'video' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
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
              borderRadius: '1px', 
              fontWeight: '900',
              textTransform: 'uppercase'
            }}>
              EKSPERYMENTALNA
            </span>
          </button>
        </div>

        {/* Graphic Options */}
        {(!isPromptMode) && (
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              1. Wybierz format {visualizationType === 'image' ? 'obrazu' : 'wideo'}
            </label>

            <div className="visualization-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '3.5rem' }}>
              {(visualizationType === 'image' ? [
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
                const isActive = visualizationType === 'image' ? activeImageLabel === format.tip : activeVideoLabel === format.tip;
                return (
                  <div key={`${format.id}-${idx}`} style={{ position: 'relative' }} className="format-card-container">
                    <button 
                      className={`format-card ${isActive ? 'format-card-active' : ''}`}
                      onClick={() => {
                        if (visualizationType === 'image') {
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
                        borderRadius: '1.5px',
                        border: isActive ? '2px solid transparent' : '1px solid var(--border-color)',
                        background: isActive 
                          ? `linear-gradient(var(--bg-app), var(--bg-app)) padding-box, linear-gradient(135deg, #4285f4, #9b72cb, #d96570, #f4af45) border-box`
                          : 'var(--bg-app)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1.2rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isActive ? `0 15px 35px rgba(0,0,0,0.15)` : 'none',
                        outline: 'none'
                      }}
                    >
                      {/* Frame Preview Visual */}
                      <div style={{ 
                        width: '70px', 
                        height: '90px', 
                        border: `2px dashed ${isActive ? format.color : 'var(--border-color)'}`,
                        borderRadius: '2.5px',
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
                          borderRadius: '1.5px',
                          opacity: 0.25,
                          transition: 'all 0.3s ease'
                        }}></div>
                      </div>
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.2rem' }}>{format.tip}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.8rem' }}>{format.id}</div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-muted)', 
                          lineHeight: '1.5', 
                          opacity: 0.8,
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.8rem',
                          marginTop: '0.4rem',
                          fontWeight: '400'
                        }}>
                          {format.desc}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Main Action Buttons - Grid Layout */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '2rem', 
              marginTop: '3rem',
              maxWidth: '1000px',
              margin: '3rem auto 0 auto'
            }}>
              {/* Option 1: Prepare/Edit Prompt (The current way) */}
              <button 
                onClick={() => handleGeneratePrompt(visualizationType, false)}
                disabled={imageLoading || isReadOnly}
                className="btn-secondary" 
                style={{ 
                  padding: '1.4rem 2rem', 
                  borderRadius: '12.5px', 
                  fontSize: '1.1rem', 
                  fontWeight: '800',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '1rem',
                  border: '2px solid var(--border-color)',
                  color: 'var(--text-main)',
                  cursor: (imageLoading || isReadOnly) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {imageLoading && visualizationType === visualizationType && !isAutoGenerating ? (
                  <span className="spinner"></span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span className="material-icons" style={{ fontSize: '1.6rem', color: 'var(--color-primary)' }}>{visualizationType === 'video' ? 'movie_filter' : 'auto_fix_high'}</span>
                      <span>Przygotuj {visualizationType === 'image' ? 'obraz' : 'wideo'}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '400', opacity: 0.8, lineHeight: '1.4', maxWidth: '350px', textAlign: 'center' }}>
                      AI przygotuje opis (prompt), który będziesz mógł edytować przed generacją.
                    </span>
                  </div>
                )}
              </button>

              {/* Option 2: Quick Generate (The new way) */}
              <button 
                onClick={() => handleGeneratePrompt(visualizationType, true)}
                disabled={imageLoading || isReadOnly}
                className="btn-primary" 
                style={{ 
                  padding: '1.4rem 2rem', 
                  borderRadius: '3px', 
                  fontSize: '1.1rem', 
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
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {imageLoading && visualizationType === visualizationType && isAutoGenerating ? (
                  <span className="spinner"></span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span className="material-icons" style={{ fontSize: '1.6rem' }}>{visualizationType === 'video' ? 'movie' : 'rocket_launch'}</span>
                      <span>Wygeneruj {visualizationType === 'image' ? 'obraz' : 'wideo'}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '400', opacity: 0.9, lineHeight: '1.4', maxWidth: '350px', textAlign: 'center' }}>
                      Najszybsza droga. AI automatycznie stworzy opis i obraz na bazie posta.
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {mediaHistory && mediaHistory.filter(m => m.type === visualizationType).length > 0 && (
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Historia Wygenerowanych Mediów
            </h3>
            
            {mediaHistory.filter(m => m.type === visualizationType && !m.parentUrl).map((media, idx) => (
              <div key={idx} id={`media-item-${idx}`} style={{ textAlign: 'center', background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '2px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-icons" style={{ fontSize: '1.2rem' }}>{media.type === 'video' ? 'movie' : 'image'}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                      Wersja {idx + 1} ({media.type === 'video' ? 'Wideo' : 'Grafika'})
                    </span>
                  </div>
                  
                  {/* Action Icons moved to Header */}
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button 
                      onClick={() => handleDownload(media.url, media.type)}
                      title="Pobierz"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>download</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie/wideo? Tej operacji nie można cofnąć.')) {
                          const newHistory = [...mediaHistory];
                          newHistory.splice(idx, 1);
                          setMediaHistory(newHistory);
                          if (newHistory.length === 0) {
                            setGeneratedImage(null);
                            setGeneratedVideo(null);
                          }
                        }
                      }}
                      title="Usuń"
                      style={{
                        background: 'rgba(255, 68, 68, 0.1)',
                        border: '1px solid rgba(255, 68, 68, 0.2)',
                        color: '#ff4444',
                        width: '32px',
                        height: '32px',
                        borderRadius: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#ff4444'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'; e.currentTarget.style.color = '#ff4444'; }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>delete</span>
                    </button>
                  </div>
                </div>
                <div style={{ position: 'relative', width: '100%' }}>
                  {media.type === 'image' ? (
                    <img src={media.url} alt={`Generated version ${idx + 1}`} style={{ width: '100%', borderRadius: '1px', boxShadow: 'var(--shadow-md)' }} />
                  ) : (
                    <video 
                      src={media.url} 
                      controls 
                      style={{ width: '100%', borderRadius: '1px', boxShadow: 'var(--shadow-md)', background: '#000' }} 
                    />
                  )}
                </div>

                {/* Bottom Action Bar below image, centered within the black background */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.2rem' }}>
                  <div className="media-action-bar" style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    zIndex: 20,
                    animation: 'fadeIn 0.3s ease-out',
                    background: 'linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03)) padding-box, linear-gradient(135deg, #4285f4, #9b72cb, #d96570, #f4af45) border-box',
                    backdropFilter: 'blur(12px)',
                    padding: '8px 20px',
                    borderRadius: '1px',
                    border: '1px solid transparent',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                  }}>
                    {media.type === 'image' && (
                      <button 
                        onClick={() => {
                          setAnimatingMediaIdx(animatingMediaIdx === idx ? null : idx);
                          setEditingMediaIdx(null);
                          setAnimationFeedback('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: animatingMediaIdx === idx ? 'var(--color-primary)' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => { if (animatingMediaIdx !== idx) e.currentTarget.style.color = 'var(--color-primary)'; }}
                        onMouseOut={(e) => { if (animatingMediaIdx !== idx) e.currentTarget.style.color = 'var(--text-main)'; }}
                      >
                        <span className="material-icons" style={{ fontSize: '1.1rem' }}>{animatingMediaIdx === idx ? 'close' : 'movie'}</span>
                        {animatingMediaIdx === idx ? 'Anuluj' : 'Ożyw to zdjęcie'}
                      </button>
                    )}
                    
                    {media.type === 'image' && (
                      <span style={{ color: 'rgba(255,255,255,0.1)', fontWeight: '300', fontSize: '1rem', alignSelf: 'center' }}>|</span>
                    )}

                    <button 
                      onClick={() => {
                        setEditingMediaIdx(editingMediaIdx === idx ? null : idx);
                        setAnimatingMediaIdx(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: editingMediaIdx === idx ? 'var(--color-primary)' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => { if (editingMediaIdx !== idx) e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseOut={(e) => { if (editingMediaIdx !== idx) e.currentTarget.style.color = 'var(--text-main)'; }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>edit</span>
                      {editingMediaIdx === idx ? 'Zwiń edycję' : 'Edytuj grafikę'}
                    </button>
                  </div>
                </div>

                {/* Integrated Refinement Panel for Image */}
                {editingMediaIdx === idx && (
                  <div id={`edit-panel-${idx}`} style={{ 
                    marginTop: '5px', 
                    padding: '5px', 
                    background: 'var(--bg-card)', 
                    borderRadius: '5px', 
                    border: '1px solid var(--color-primary)',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ width: '100%' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '5px', fontWeight: '800' }}>
                          <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>auto_fix_high</span>
                          Co chcesz zmienić na tym obrazie?
                        </label>
                        <div style={{ position: 'relative' }}>
                          <textarea 
                            value={mediaFeedback}
                            onChange={(e) => setMediaFeedback(e.target.value)}
                            placeholder="np. zmień kolor sukienki na czerwony, dodaj okulary przeciwsłoneczne..."
                            style={{ 
                              width: '100%', 
                              minHeight: '60px', 
                              padding: '0.8rem', 
                              paddingRight: '3.5rem',
                              fontSize: '0.9rem', 
                              borderRadius: '4px', 
                              border: mediaError && !mediaFeedback.trim() ? '2px solid #ef4444' : '1px solid var(--border-color)', 
                              background: 'var(--bg-white)', 
                              color: 'var(--text-main)', 
                              resize: 'none' 
                            }}
                            disabled={isMediaRefining}
                          />
                          <button 
                            onClick={() => handleOptimizePrompt(mediaFeedback, setMediaFeedback)}
                            disabled={isOptimizing || !mediaFeedback.trim()}
                            title="Ulepsz instrukcję za pomocą AI"
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'rgba(var(--color-primary-rgb), 0.1)',
                              border: 'none',
                              borderRadius: '3px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--color-primary)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isOptimizing ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : <span className="material-icons" style={{ fontSize: '1.2rem' }}>auto_awesome</span>}
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (!mediaFeedback.trim()) {
                            setMediaError(true);
                            return;
                          }
                          setMediaError(false);
                          handleRefineMedia(idx);
                        }}
                        disabled={isMediaRefining}
                        className="btn-primary"
                        style={{ 
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: 'linear-gradient(135deg, var(--color-primary), #1d4ed8)',
                          border: 'none',
                          color: 'white',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {isMediaRefining ? <span className="spinner"></span> : (
                          <>
                            <span className="material-icons" style={{ fontSize: '1.2rem' }}>auto_awesome</span>
                            <span style={{ fontSize: '0.75rem' }}>Rozkaż AI</span>
                          </>
                        )}
                      </button>
                      {mediaError && !mediaFeedback.trim() && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', textAlign: 'center', marginTop: '2px' }}>Wpisz instrukcję</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Animation Prompt Panel */}
                {animatingMediaIdx === idx && (
                  <div id={`animation-panel-${idx}`} style={{ 
                    marginTop: '5px',
                    padding: '5px', 
                    background: 'var(--bg-card)', 
                    borderRadius: '5px', 
                    border: '1px solid var(--color-primary)',
                    animation: 'fadeIn 0.3s ease-out',
                    textAlign: 'left'
                  }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ width: '100%' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '5px', fontWeight: '800' }}>
                              Instrukcja animacji:
                            </label>
                            <div style={{ position: 'relative' }}>
                              <textarea 
                                value={animationFeedback}
                                onChange={(e) => setAnimationFeedback(e.target.value)}
                                placeholder="Opisz jak zdjęcie ma zostać ożywione (np. postać się uśmiecha, tło lekko faluje...)"
                                style={{ 
                                  width: '100%', 
                                  minHeight: '60px', 
                                  padding: '0.8rem', 
                                  paddingRight: '3.5rem',
                                  fontSize: '0.9rem', 
                                  borderRadius: '4px', 
                                  border: animationError && !animationFeedback.trim() ? '2px solid #ef4444' : '1px solid var(--border-color)', 
                                  background: 'var(--bg-white)', 
                                  color: 'var(--text-main)', 
                                  resize: 'none' 
                                }}
                                disabled={imageLoading}
                              />
                              <button 
                                onClick={() => handleOptimizePrompt(animationFeedback, setAnimationFeedback)}
                                disabled={isOptimizing || !animationFeedback.trim()}
                                title="Ulepsz instrukcję za pomocą AI"
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  background: 'rgba(var(--color-primary-rgb), 0.1)',
                                  border: 'none',
                                  borderRadius: '3px',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: 'var(--color-primary)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {isOptimizing ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : <span className="material-icons" style={{ fontSize: '1.2rem' }}>auto_awesome</span>}
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!animationFeedback.trim()) {
                                setAnimationError(true);
                                return;
                              }
                              setAnimationError(false);
                              await handleAnimateImage(media.url, animationFeedback);
                              setAnimatingMediaIdx(null);
                            }}
                            disabled={imageLoading}
                            className="btn-primary"
                            style={{ 
                              width: '100%',
                              padding: '8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              background: 'linear-gradient(135deg, var(--color-primary), #1d4ed8)',
                              border: 'none',
                              color: 'white',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                          >
                            {imageLoading ? <span className="spinner"></span> : (
                              <>
                                <span className="material-icons" style={{ fontSize: '1.2rem' }}>play_circle_filled</span>
                                <span style={{ fontSize: '0.75rem' }}>Rozkaż AI</span>
                              </>
                            )}
                          </button>
                          {animationError && !animationFeedback.trim() && (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', textAlign: 'center', marginTop: '2px' }}>Wpisz instrukcję</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Grouped Child Videos (Animations List) */}
                    {mediaHistory.some(m => m.parentUrl === media.url) && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                          {mediaHistory.filter(m => m.parentUrl === media.url).map((video, vIdx) => (
                            <div key={vIdx} style={{ background: 'rgba(var(--color-primary-rgb), 0.03)', padding: '1rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                              <video 
                                src={video.url} 
                                controls 
                                style={{ width: '100%', borderRadius: '4px', boxShadow: 'var(--shadow-sm)', background: '#000' }} 
                              />
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                                <button 
                                  onClick={() => handleDownload(video.url, 'video')} 
                                  className="btn-primary" 
                                  style={{ flex: 1, padding: '0.5rem', borderRadius: '3px', fontSize: '0.75rem' }}
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
                  </div>
                ))}
              </div>
            )}

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
            {(isMediaRefining || imageLoading) && (
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
                    {isMediaRefining ? 'Tworzenie nowej wersji...' : `Generowanie ${visualizationType === 'image' ? 'obrazu' : 'wideo'}...`}
                  </h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7, maxWidth: '300px' }}>
                    {isMediaRefining 
                      ? 'Nano Banana nakłada poprawki, dbając o spójność z oryginałem.' 
                      : 'AI przygotowuje profesjonalny materiał wizualny. To może potrwać kilka chwil.'}
                  </p>
                </div>

              </div>
            )}

        {isPromptMode && currentPromptData && (
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
                  onClick={() => visualizationType === 'video' ? handleGenerateVideo() : handleGenerateImage()} 
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
                      <span className="material-icons">{visualizationType === 'video' ? 'movie' : 'rocket_launch'}</span>
                      {visualizationType === 'video' ? 'Generuj Klip Wideo' : 'Generuj Grafikę'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
      )}

      {/* Save Project / Next Project Action */}
      {(result || (mediaHistory && mediaHistory.length > 0)) && (
        <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          <button 
            onClick={handleReset}
            className="premium-button"
            style={{ 
              padding: '1.2rem 4rem', 
              borderRadius: '12.5px', 
              fontSize: '1.1rem',
              gap: '1rem',
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '1.4rem' }}>cloud_done</span>
            Zakończ i Zapisz Projekt
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultSection;
