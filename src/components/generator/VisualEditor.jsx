import React, { useState, useRef, useEffect } from 'react';
import { storage, auth, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import { useNotification } from '../common/NotificationContext';
import { useNavigate } from 'react-router-dom';

const VisualEditor = ({ 
  balance, 
  isReadOnly, 
  activeWorkspace, 
  handleApiError, 
  API_BASE_URL,
  initialSession,
  onClearSession,
  pricing,
  handleOptimizePrompt,
  isOptimizingProp
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [loadingType, setLoadingType] = useState(null); // null | 'image' | 'video' | 'refine'
  const [isUploading, setIsUploading] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState(null); // { type: 'image'|'video', url: string }
  const [lastPromptData, setLastPromptData] = useState(null);
  const [v1PromptData, setV1PromptData] = useState(null);
  const [mediaHistory, setMediaHistory] = useState([]);
  const [modificationText, setModificationText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editorMode, setEditorMode] = useState('image'); // 'image' | 'video' | 'gif'
  const [targetFile, setTargetFile] = useState(null);
  const [targetPreview, setTargetPreview] = useState(null);

  // GIF Specific Settings
  const [gifLoopType, setGifLoopType] = useState('loop'); // 'loop' | 'pingpong'
  const [gifSpeed, setGifSpeed] = useState(0.5); // 0.1 - 2.0
  const [gifText, setGifText] = useState('');
  const [gifFont, setGifFont] = useState('modern'); // 'elegant' | 'modern' | 'handwritten'
  const [gifBeautyEffect, setGifBeautyEffect] = useState('none'); // 'none' | 'sparkle' | 'vibe' | 'glow' | 'bw'
  const [gifCTA, setGifCTA] = useState('none'); // 'none' | 'zapisz_sie' | 'click_bio' | 'book_now'
  const [isTransparent, setIsTransparent] = useState(false);

  const fileInputRef = useRef(null);
  const targetFileInputRef = useRef(null);
  const { showSuccess, showError, showInfo, showWarning, addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialSession) {
      setCurrentSessionId(initialSession.id);
      setInstruction(initialSession.instruction || '');
      setMediaHistory(initialSession.mediaHistory || []);
      setV1PromptData(initialSession.v1PromptData || null);
      setLastPromptData(initialSession.lastPromptData || null);
      setAspectRatio(initialSession.aspectRatio || '1:1');
      if (initialSession.mediaHistory?.length > 0) {
        setGeneratedMedia(initialSession.mediaHistory[initialSession.mediaHistory.length - 1]);
      }
      if (initialSession.originalFileUrl) {
         setPreview(initialSession.originalFileUrl);
      }
    }
  }, [initialSession]);

  const saveSession = async (updatedHistory, lastPrompt, v1Prompt, originalUrl) => {
    if (!auth.currentUser || isReadOnly) return;
    try {
      const sessionData = {
        historyType: 'editor',
        topic: `Edycja: ${instruction.slice(0, 30)}${instruction.length > 30 ? '...' : ''}`,
        platform: 'Edytor',
        content: `Sesja edycji obrazu/wideo. Kroki: ${updatedHistory.length}`,
        instruction: instruction,
        mediaHistory: updatedHistory,
        lastPromptData: lastPrompt,
        v1PromptData: v1Prompt,
        originalFileUrl: originalUrl || preview,
        aspectRatio: aspectRatio,
        updatedAt: serverTimestamp(),
      };

      if (!currentSessionId) {
        sessionData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'history'), sessionData);
        setCurrentSessionId(docRef.id);
      } else {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'history', currentSessionId), sessionData);
      }
    } catch (error) {
      console.error("Failed to save session:", error);
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

  const handleFinalSave = async () => {
    if (mediaHistory.length === 0 && !preview) {
      showWarning("Nie ma nic do zapisania.");
      return;
    }

    try {
      // Final explicit save
      await saveSession(mediaHistory, lastPromptData, v1PromptData, preview);
      showSuccess("Sesja została zapisana i jest dostępna w panelu historii! 💾");
      
      // Reset everything
      setCurrentSessionId(null);
      setFile(null);
      setPreview(null);
      setInstruction('');
      setMediaHistory([]);
      setGeneratedMedia(null);
      setLastPromptData(null);
      setV1PromptData(null);
      setTargetFile(null);
      setTargetPreview(null);
      if (onClearSession) onClearSession();
    } catch (err) {
      console.error("Save error:", err);
      showError("Błąd podczas zapisywania sesji.");
    }
  };

  const handleFileChange = (e, isTarget = false) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (isTarget) {
        setTargetFile(selectedFile);
        setTargetPreview(URL.createObjectURL(selectedFile));
      } else {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setGeneratedMedia(null);
        setMediaHistory([]);
        setV1PromptData(null);
        setLastPromptData(null);
      }
    }
  };

  const uploadImage = async (fileToUpload) => {
    if (!auth.currentUser) throw new Error("Musisz być zalogowany.");
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${Date.now()}_${fileToUpload.name}`);
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } finally {
      setIsUploading(false);
    }
  };

  const checkBalance = (type) => {
    const cost = pricing[type] || 1;
    if (balance < cost) {
      addNotification(
        `Niewystarczająca ilość kredytów. Generowanie ${type === 'image' ? 'obrazu' : (type === 'video' ? 'wideo' : (type === 'gif' ? 'GIF-a' : 'poprawki'))} kosztuje ${cost.toLocaleString()}, a masz ich ${balance.toLocaleString()}.`, 
        'warning', 
        10000, 
        {
          label: 'Doładuj konto',
          onClick: () => navigate('/payment')
        }
      );
      return false;
    }
    return true;
  };

  const handleInitialGenerate = async (type = 'image') => {
    if (!checkBalance(type)) return;
    if (!file && !preview) {
      showError("Wybierz obraz i wpisz instrukcję.");
      return;
    }
    if (type !== 'gif' && !instruction.trim()) {
      showError("Wpisz instrukcję.");
      return;
    }
    const finalInstruction = instruction.trim() || "Ożyw ten obraz i dodaj wskazane efekty.";
    setLoadingType(type);
    try {
      const token = await auth.currentUser.getIdToken();
      
      let uploadedUrl = preview;
      if (file) {
        uploadedUrl = await uploadImage(file);
      }

      let uploadedTargetUrl = null;
      if ((type === 'video' || type === 'gif') && targetFile) {
        uploadedTargetUrl = await uploadImage(targetFile);
      }
      
      // Step 1: Create a technical prompt based on the image and instruction
      const response = await axios.post(`${API_BASE_URL}/refine-image-prompt`, {
        v1PromptObject: { englishPrompt: "Initial uploaded image", polishDescription: "Oryginalny obraz" },
        lastPromptObject: { englishPrompt: "Initial uploaded image", polishDescription: "Oryginalny obraz" },
        instructions: finalInstruction,
        mediaUrl: uploadedUrl,
        targetMediaUrl: uploadedTargetUrl, // Pass target image if present
        type, // 'image' | 'video' | 'gif'
        gifSettings: type === 'gif' ? {
          loopType: gifLoopType,
          speed: gifSpeed,
          text: gifText,
          font: gifFont,
          beautyEffect: gifBeautyEffect,
          cta: gifCTA,
          isTransparent
        } : null,
        workspaceContext: activeWorkspace ? { visualStyle: activeWorkspace.visualStyle } : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const vPlan = response.data.visualPlannedPrompt;
      setV1PromptData(vPlan);
      setLastPromptData(vPlan);

      // Step 2: Generate the media
      if (type === 'video' || type === 'gif') {
        await generateVideo(vPlan, uploadedUrl, uploadedTargetUrl, type);
      } else {
        await generateImage(vPlan, uploadedUrl);
        showSuccess("Pierwsza wersja wygenerowana!");
      }
    } catch (error) {
      console.error("Initial generation failed:", error);
      if (handleApiError) {
        handleApiError(error, "Nie udało się przetworzyć obrazu. Spróbuj ponownie za chwilę.");
      } else {
        showError("Wystąpił błąd podczas generowania.");
      }
      setLoadingType(null);
    }
  };

  const generateImage = async (promptData, contextUrl) => {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(`${API_BASE_URL}/generate-image`, {
      prompt: promptData.englishPrompt,
      aspectRatio: aspectRatio,
      originalImageUrl: contextUrl,
      isAlreadyTechnical: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const newMedia = { type: 'image', url: response.data.imageUrl };
    setGeneratedMedia(newMedia);
    const updatedHistory = [...mediaHistory, { ...newMedia, prompt: promptData }];
    setMediaHistory(updatedHistory);
    saveSession(updatedHistory, promptData, v1PromptData || promptData, contextUrl);
    setLoadingType(null);
  };

  const generateVideo = async (promptData, contextUrl, targetUrl = null, type = 'video') => {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(`${API_BASE_URL}/generate-video`, {
      prompt: promptData.englishPrompt,
      aspectRatio: aspectRatio === '1:1' ? '1:1' : (aspectRatio === '9:16' ? '9:16' : '16:9'),
      imageUrl: contextUrl,
      targetImageUrl: targetUrl,
      type: type
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.status === 'started') {
      showInfo("Rozpoczęto generowanie wideo. To może potrwać do 2 minut.");
      pollVideoStatus(response.data.operationName, promptData, contextUrl, type);
    } else if (response.data.status === 'done') {
      const newMedia = { type: 'video', url: response.data.videoUrl };
      setGeneratedMedia(newMedia);
      const updatedHistory = [...mediaHistory, { ...newMedia, prompt: promptData }];
      setMediaHistory(updatedHistory);
      saveSession(updatedHistory, promptData, v1PromptData || promptData, contextUrl);
    }
  };

  const pollVideoStatus = async (operationName, promptData, contextUrl, type = 'video') => {
    const token = await auth.currentUser.getIdToken();
    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 40) {
      attempts++;
      await new Promise(r => setTimeout(r, 5000));
      try {
        const response = await axios.get(`${API_BASE_URL}/video-status?operationName=${encodeURIComponent(operationName)}&type=${type}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.status === 'done') {
          isDone = true;
          const newMedia = { type: 'video', url: response.data.videoUrl };
          setGeneratedMedia(newMedia);
          const updatedHistory = [...mediaHistory, { ...newMedia, prompt: promptData }];
          setMediaHistory(updatedHistory);
          saveSession(updatedHistory, promptData, v1PromptData || promptData, contextUrl);
          showSuccess("Wideo jest gotowe!");
        } else if (response.data.status === 'failed') {
          showError("Generowanie wideo nie powiodło się.");
          isDone = true;
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }
    setLoadingType(null);
  };

  const handleRefine = async () => {
    if (!checkBalance('refine')) return;
    if (!modificationText.trim() || !lastPromptData) return;
    setLoadingType('refine');
    try {
      const token = await auth.currentUser.getIdToken();
      const currentMediaUrl = generatedMedia.url;

      const response = await axios.post(`${API_BASE_URL}/refine-image-prompt`, {
        v1PromptObject: v1PromptData,
        lastPromptObject: lastPromptData,
        instructions: modificationText,
        mediaUrl: currentMediaUrl,
        workspaceContext: activeWorkspace ? { visualStyle: activeWorkspace.visualStyle } : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const vPlan = response.data.visualPlannedPrompt;
      setLastPromptData(vPlan);
      
      await generateImage(vPlan, currentMediaUrl);
      setModificationText('');
      showSuccess("Zmiana naniesiona!");
    } catch (error) {
      console.error("Refinement failed:", error);
      if (handleApiError) {
        handleApiError(error, "Nie udało się wprowadzić poprawek.");
      } else {
        showError("Wystąpił błąd podczas nanoszenia zmian.");
      }
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="visual-editor-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Edytor Wizualny</h2>
          <div style={{ display: 'flex', gap: '0.8rem' }}>

            {(currentSessionId || mediaHistory.length > 0) && (
              <button 
                onClick={() => {
                  setCurrentSessionId(null);
                  setFile(null);
                  setPreview(null);
                  setInstruction('');
                  setMediaHistory([]);
                  setGeneratedMedia(null);
                  setLastPromptData(null);
                  setV1PromptData(null);
                  setTargetFile(null);
                  setTargetPreview(null);
                  if (onClearSession) onClearSession();
                  showInfo("Rozpoczęto nową sesję.");
                }}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>add_circle_outline</span>
                Nowa sesja
              </button>
            )}
          </div>
        </div>
        
        {/* Editor Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-app)', padding: '0.4rem', borderRadius: '18px', border: '1px solid var(--border-color)', maxWidth: '500px' }}>
          <button
            onClick={() => setEditorMode('image')}
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '14px',
              border: 'none',
              background: editorMode === 'image' ? 'var(--bg-white)' : 'transparent',
              color: editorMode === 'image' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: editorMode === 'image' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span className="material-icons">image</span>
            Obraz
          </button>
          <button
            onClick={() => setEditorMode('video')}
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '14px',
              border: 'none',
              background: editorMode === 'video' ? 'var(--bg-white)' : 'transparent',
              color: editorMode === 'video' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: editorMode === 'video' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span className="material-icons">movie</span>
            Wideo
          </button>
          <button
            onClick={() => setEditorMode('gif')}
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '14px',
              border: 'none',
              background: editorMode === 'gif' ? 'var(--bg-white)' : 'transparent',
              color: editorMode === 'gif' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: editorMode === 'gif' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span className="material-icons">gif</span>
            GIF
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Left Side: Upload & Initial Instruction */}
          <div style={{ flex: 1, minWidth: 'min(300px, 100%)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: (editorMode === 'video' || editorMode === 'gif' ? '1fr 1fr' : '1fr'), gap: '1rem', marginBottom: '1rem' }}>
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: '100%',
                  height: (editorMode === 'video' || editorMode === 'gif' ? '180px' : '250px'),
                  border: '2px dashed var(--border-color)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-app)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    setFile(droppedFile);
                    setPreview(URL.createObjectURL(droppedFile));
                  }
                }}
              >
                {preview ? (
                  <img src={preview} alt="Podgląd" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{editorMode === 'video' || editorMode === 'gif' ? 'start' : 'cloud_upload'}</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{editorMode === 'video' || editorMode === 'gif' ? 'Zdj. początkowe' : 'Wgraj zdjęcie'}</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => handleFileChange(e, false)} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              {(editorMode === 'video' || editorMode === 'gif') && (
                <div 
                  onClick={() => targetFileInputRef.current.click()}
                  style={{
                    width: '100%',
                    height: '180px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-app)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    borderColor: targetPreview ? 'var(--color-primary)' : 'var(--border-color)'
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile) {
                      setTargetFile(droppedFile);
                      setTargetPreview(URL.createObjectURL(droppedFile));
                    }
                  }}
                >
                  {targetPreview ? (
                    <img src={targetPreview} alt="Podgląd docelowy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>flag</span>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Zdj. docelowe (opcjonalnie)</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={targetFileInputRef} 
                    onChange={(e) => handleFileChange(e, true)} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Co chcesz zrobić z tym obrazem?</label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Np. zmień tło na futurystyczne miasto lub dodaj neonowy napis 'Summer'..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '1rem',
                    paddingRight: '3.5rem',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '15px',
                    color: 'var(--text-main)',
                    resize: 'none'
                  }}
                />
                <button 
                  onClick={() => handleOptimizePrompt(instruction, setInstruction)}
                  disabled={isOptimizingProp || !instruction.trim()}
                  title="Ulepsz instrukcję za pomocą AI"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(var(--color-primary-rgb), 0.1)',
                    border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
                    borderRadius: '10px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--color-primary-rgb), 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(var(--color-primary-rgb), 0.1)'}
                >
                  {isOptimizingProp ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : <span className="material-icons" style={{ fontSize: '1.2rem' }}>auto_awesome</span>}
                </button>
              </div>
            </div>

            {/* GIF SETTINGS PANEL */}
            {editorMode === 'gif' && (
              <div className="glass" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-icons" style={{ color: 'var(--color-primary)' }}>settings</span>
                  Ustawienia GIF
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {/* Aspect Ratio */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.8rem', opacity: 0.8 }}>Format (Proporcje)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['9:16', '1:1', '16:9'].map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          style={{
                            flex: 1,
                            padding: '0.6rem',
                            borderRadius: '10px',
                            border: '1px solid ' + (aspectRatio === ratio ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'),
                            background: aspectRatio === ratio ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                            color: aspectRatio === ratio ? 'var(--color-primary)' : 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}
                        >
                          {ratio === '9:16' && <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>stay_current_portrait</span>}
                          {ratio === '1:1' && <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>crop_square</span>}
                          {ratio === '16:9' && <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>stay_current_landscape</span>}
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loop Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.8rem', opacity: 0.8 }}>Typ animacji</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setGifLoopType('loop')}
                        className={gifLoopType === 'loop' ? 'active' : ''}
                        style={{
                          flex: 1, padding: '0.6rem', borderRadius: '10px', border: '1px solid ' + (gifLoopType === 'loop' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'),
                          background: gifLoopType === 'loop' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent', color: gifLoopType === 'loop' ? 'var(--color-primary)' : 'inherit', cursor: 'pointer'
                        }}
                      >
                        Loop
                      </button>
                      <button
                        onClick={() => setGifLoopType('pingpong')}
                        style={{
                          flex: 1, padding: '0.6rem', borderRadius: '10px', border: '1px solid ' + (gifLoopType === 'pingpong' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'),
                          background: gifLoopType === 'pingpong' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent', color: gifLoopType === 'pingpong' ? 'var(--color-primary)' : 'inherit', cursor: 'pointer'
                        }}
                      >
                        Ping-Pong
                      </button>
                    </div>
                  </div>

                  {/* Speed Slider */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Prędkość animacji</label>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{gifSpeed}s / klatka</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="2.0" step="0.1" 
                      value={gifSpeed} onChange={(e) => setGifSpeed(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                    />
                  </div>



                  {/* Beauty Effects */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.8rem', opacity: 0.8 }}>Efekt Beauty</label>
                    <select 
                      value={gifBeautyEffect} onChange={(e) => setGifBeautyEffect(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    >
                      <option value="none">Brak efektu</option>
                      <option value="sparkle">Sparkle (Błysk ✨)</option>
                      <option value="glow">Glow (Promienność 🌟)</option>
                      <option value="vibe">Vibe (Ciepły filtr)</option>
                      <option value="bw">B&W (Klasyczny)</option>
                    </select>
                  </div>


                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" id="transparent-bg" 
                    checked={isTransparent} onChange={(e) => setIsTransparent(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor="transparent-bg" style={{ fontSize: '0.85rem', opacity: 0.8, cursor: 'pointer' }}>Przezroczyste tło (Sticker/Naklejka)</label>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <button 
                onClick={() => handleInitialGenerate(editorMode)}
                disabled={loadingType !== null || !file || (editorMode !== 'gif' && !instruction.trim()) || isReadOnly}
                className="btn-primary"
                style={{ flex: 1, padding: '1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loadingType !== null ? 'Generowanie...' : <><span className="material-icons">{editorMode === 'image' ? 'image' : (editorMode === 'video' ? 'movie' : 'gif')}</span> Generuj {editorMode === 'image' ? 'Obraz' : (editorMode === 'video' ? 'Wideo' : 'GIF')}</>}
                {loadingType !== null && <span className="spinner"></span>}
              </button>
            </div>
          </div>

          {/* Right Side: Result & Iterative Editing */}
          <div style={{ flex: 1.2, minWidth: 'min(350px, 100%)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ 
              width: '100%', 
              minHeight: '400px', 
              background: 'var(--bg-app)', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              {loadingType !== null ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderWidth: '5px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderTopColor: 'var(--color-primary)',
                    margin: '0 auto 1.5rem' 
                  }}></div>
                  <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {loadingType === 'image' && "Malowanie obrazu..."}
                    {loadingType === 'video' && "Reżyserowanie wideo..."}
                    {loadingType === 'gif' && "Tworzenie animacji..."}
                    {loadingType === 'refine' && "Aktualizacja projektu..."}
                  </p>
                  <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>To zajmie tylko chwilę</p>
                </div>
              ) : generatedMedia ? (
                <>
                  {generatedMedia.type === 'video' || generatedMedia.type === 'gif' ? (
                    <video 
                      src={generatedMedia.url} 
                      controls 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }} 
                    />
                  ) : (
                    <img src={generatedMedia.url} alt="Wygenerowany" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }} />
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(generatedMedia.url, generatedMedia.type); }}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(var(--color-primary-rgb), 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Pobierz ten plik"
                  >
                    <span className="material-icons">download</span>
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <span className="material-icons" style={{ fontSize: '4rem', opacity: 0.2 }}>auto_awesome</span>
                  <p>Tutaj pojawi się wynik</p>
                </div>
              )}
            </div>

            {generatedMedia && (
              <div className="glass" style={{ padding: '1.5rem', background: 'rgba(var(--color-primary-rgb), 0.05)', borderRadius: '20px', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>edit</span>
                  Chcesz coś zmienić? Opisz kolejną poprawkę:
                </h4>
                <div style={{ display: 'flex', gap: '0.8rem', position: 'relative', width: '100%' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input 
                      type="text"
                      value={modificationText}
                      onChange={(e) => setModificationText(e.target.value)}
                      placeholder="Np. zrób to jaśniej, dodaj więcej detali..."
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      style={{
                        width: '100%',
                        padding: '0.8rem 3.5rem 0.8rem 1.2rem',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                    <button 
                      onClick={() => handleOptimizePrompt(modificationText, setModificationText)}
                      disabled={isOptimizingProp || !modificationText.trim()}
                      title="Ulepsz instrukcję za pomocą AI"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: modificationText.trim() ? 1 : 0.4
                      }}
                    >
                      {isOptimizingProp ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : <span className="material-icons" style={{ fontSize: '1.2rem' }}>auto_awesome</span>}
                    </button>
                  </div>
                  <button 
                    onClick={handleRefine}
                    disabled={loadingType !== null || !modificationText.trim()}
                    className="btn-primary"
                    style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                  >
                    {loadingType === 'refine' ? <span className="spinner"></span> : 'Zmień'}
                  </button>
                </div>
                <p style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  💡 Każda zmiana opiera się na poprzednim kroku, zachowując spójność projektu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History of changes in this session */}
      {mediaHistory.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Historia zmian w tej sesji</h3>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {mediaHistory.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  minWidth: '150px', 
                  height: '150px', 
                  borderRadius: '15px', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: generatedMedia?.url === item.url ? '3px solid var(--color-primary)' : '1px solid var(--border-color)',
                  opacity: generatedMedia?.url === item.url ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div onClick={() => setGeneratedMedia(item)} style={{ width: '100%', height: '100%' }}>
                  {item.type === 'video' ? (
                    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ color: '#fff' }}>play_circle</span>
                    </div>
                  ) : (
                    <img src={item.url} alt={`Wersja ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(item.url, item.type); }}
                  style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Pobierz"
                >
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Bottom Save Button */}
      {(generatedMedia || mediaHistory.length > 0) && (
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <button 
            onClick={handleFinalSave}
            className="premium-button"
            style={{ 
              padding: '1rem 3rem', 
              borderRadius: '50px', 
              fontSize: '1rem',
              gap: '0.8rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '1.3rem' }}>cloud_done</span>
            Zakończ i Zapisz Projekt
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualEditor;
