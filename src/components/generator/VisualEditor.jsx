import React, { useState, useRef, useEffect } from 'react';
import { storage, auth, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import { useNotification } from '../common/NotificationContext';

const VisualEditor = ({ 
  balance, 
  isReadOnly, 
  activeWorkspace, 
  handleApiError, 
  API_BASE_URL,
  initialSession,
  onClearSession
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
  
  const fileInputRef = useRef(null);
  const { showSuccess, showError, showInfo } = useNotification();

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setGeneratedMedia(null);
      setMediaHistory([]);
      setV1PromptData(null);
      setLastPromptData(null);
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

  const handleInitialGenerate = async (type = 'image') => {
    if (!file && !preview) {
      showError("Wybierz obraz i wpisz instrukcję.");
      return;
    }
    if (!instruction.trim()) {
      showError("Wpisz instrukcję.");
      return;
    }
    setLoadingType(type);
    try {
      const token = await auth.currentUser.getIdToken();
      
      let uploadedUrl = preview;
      if (file) {
        uploadedUrl = await uploadImage(file);
      }
      
      // Step 1: Create a technical prompt based on the image and instruction
      const response = await axios.post(`${API_BASE_URL}/refine-image-prompt`, {
        v1PromptObject: { englishPrompt: "Initial uploaded image", polishDescription: "Oryginalny obraz" },
        lastPromptObject: { englishPrompt: "Initial uploaded image", polishDescription: "Oryginalny obraz" },
        instructions: instruction,
        mediaUrl: uploadedUrl,
        workspaceContext: activeWorkspace ? { visualStyle: activeWorkspace.visualStyle } : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const vPlan = response.data.visualPlannedPrompt;
      setV1PromptData(vPlan);
      setLastPromptData(vPlan);

      // Step 2: Generate the media
      if (type === 'video') {
        await generateVideo(vPlan, uploadedUrl);
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

  const generateVideo = async (promptData, contextUrl) => {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(`${API_BASE_URL}/generate-video`, {
      prompt: promptData.englishPrompt,
      aspectRatio: aspectRatio === '1:1' ? '1:1' : (aspectRatio === '9:16' ? '9:16' : '16:9'),
      imageUrl: contextUrl
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.status === 'started') {
      showInfo("Rozpoczęto generowanie wideo. To może potrwać do 2 minut.");
      pollVideoStatus(response.data.operationName, promptData, contextUrl);
    } else if (response.data.status === 'done') {
      const newMedia = { type: 'video', url: response.data.videoUrl };
      setGeneratedMedia(newMedia);
      const updatedHistory = [...mediaHistory, { ...newMedia, prompt: promptData }];
      setMediaHistory(updatedHistory);
      saveSession(updatedHistory, promptData, v1PromptData || promptData, contextUrl);
    }
  };

  const pollVideoStatus = async (operationName, promptData, contextUrl) => {
    const token = await auth.currentUser.getIdToken();
    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 40) {
      attempts++;
      await new Promise(r => setTimeout(r, 5000));
      try {
        const res = await axios.get(`${API_BASE_URL}/video-status?operationName=${encodeURIComponent(operationName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === 'done') {
          isDone = true;
          const newMedia = { type: 'video', url: res.data.videoUrl };
          setGeneratedMedia(newMedia);
          const updatedHistory = [...mediaHistory, { ...newMedia, prompt: promptData }];
          setMediaHistory(updatedHistory);
          saveSession(updatedHistory, promptData, v1PromptData || promptData, contextUrl);
          showSuccess("Wideo jest gotowe!");
        } else if (res.data.status === 'failed') {
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
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Left Side: Upload & Initial Instruction */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{
                width: '100%',
                height: '250px',
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
                  <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>cloud_upload</span>
                  <p style={{ color: 'var(--text-muted)' }}>Kliknij lub przeciągnij obraz tutaj</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Co chcesz zrobić z tym obrazem?</label>
              <textarea 
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Np. zmień tło na futurystyczne miasto lub dodaj neonowy napis 'Summer'..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '1rem',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '15px',
                  color: 'var(--text-main)',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => handleInitialGenerate('image')}
                disabled={loadingType !== null || !file || !instruction.trim() || isReadOnly}
                className="btn-primary"
                style={{ flex: 1, padding: '1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loadingType === 'image' ? 'Generowanie...' : <><span className="material-icons">image</span> Generuj Obraz</>}
                {loadingType === 'image' && <span className="spinner"></span>}
              </button>
              <button 
                onClick={() => handleInitialGenerate('video')}
                disabled={loadingType !== null || !file || !instruction.trim() || isReadOnly}
                className="btn-secondary"
                style={{ flex: 1, padding: '1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              >
                {loadingType === 'video' ? 'Generowanie...' : <><span className="material-icons">movie</span> Generuj Wideo</>}
                {loadingType === 'video' && <span className="spinner"></span>}
              </button>
            </div>
          </div>

          {/* Right Side: Result & Iterative Editing */}
          <div style={{ flex: 1.2, minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              {loadingType === 'video' || (loadingType === null && !generatedMedia && mediaHistory.some(m => m.type === 'video' && !m.url)) ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ width: '50px', height: '50px', marginBottom: '1rem' }}></div>
                  <p style={{ color: 'var(--text-muted)' }}>Renderowanie wideo przez AI...<br/><small>(może to potrwać do 2 minut)</small></p>
                </div>
              ) : generatedMedia ? (
                <>
                  {generatedMedia.type === 'video' ? (
                    <video src={generatedMedia.url} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }} />
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
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <input 
                    type="text"
                    value={modificationText}
                    onChange={(e) => setModificationText(e.target.value)}
                    placeholder="Np. zrób to jaśniej, dodaj więcej detali..."
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    style={{
                      flex: 1,
                      padding: '0.8rem 1.2rem',
                      background: 'var(--bg-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-main)'
                    }}
                  />
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
    </div>
  );
};

export default VisualEditor;
