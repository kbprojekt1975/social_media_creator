import React, { useState, useRef } from 'react';
import { storage, auth, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { useNotification } from '../common/NotificationContext';

const VisualEditor = ({ 
  balance, 
  isReadOnly, 
  activeWorkspace, 
  handleApiError, 
  API_BASE_URL 
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
  
  const fileInputRef = useRef(null);
  const { showSuccess, showError, showInfo } = useNotification();

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
    if (!file || !instruction.trim()) {
      showError("Wybierz obraz i wpisz instrukcję.");
      return;
    }
    setLoadingType(type);
    try {
      const token = await auth.currentUser.getIdToken();
      const uploadedUrl = await uploadImage(file);
      
      // Step 1: Create a technical prompt based on the image and instruction
      // We'll use the refine-image-prompt endpoint with a "dummy" v1 to bootstrap the context
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
      }
      
      showSuccess("Pierwsza wersja wygenerowana!");
    } catch (error) {
      console.error("Initial generation failed:", error);
      // Fallback to local showError if handleApiError is not provided or fails
      if (handleApiError) {
        handleApiError(error, "Nie udało się przetworzyć obrazu. Spróbuj ponownie za chwilę.");
      } else {
        const msg = error.response?.status === 429 
          ? "Zbyt wiele zapytań. Odczekaj chwilę." 
          : "Wystąpił błąd podczas generowania.";
        showError(msg);
      }
    } finally {
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
    setMediaHistory(prev => [...prev, { ...newMedia, prompt: promptData }]);
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
      pollVideoStatus(response.data.operationName, promptData);
    } else if (response.data.status === 'done') {
      const newMedia = { type: 'video', url: response.data.videoUrl };
      setGeneratedMedia(newMedia);
      setMediaHistory(prev => [...prev, { ...newMedia, prompt: promptData }]);
    }
  };

  const pollVideoStatus = async (operationName, promptData) => {
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
          setMediaHistory(prev => [...prev, { ...newMedia, prompt: promptData }]);
          showSuccess("Wideo jest gotowe!");
        } else if (res.data.status === 'failed') {
          showError("Generowanie wideo nie powiodło się.");
          isDone = true;
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }
  };

  const handleRefine = async () => {
    if (!modificationText.trim() || !lastPromptData) return;
    setLoadingType('refine');
    try {
      const token = await auth.currentUser.getIdToken();
      
      // Use the last generated media as context for the next change
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
      
      // Always generate an image for iterative refinement for now (simpler flow)
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
        <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '700' }}>Edytor Wizualny</h2>
        
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
              {generatedMedia ? (
                generatedMedia.type === 'video' ? (
                  <video src={generatedMedia.url} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }} />
                ) : (
                  <img src={generatedMedia.url} alt="Wygenerowany" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }} />
                )
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
                onClick={() => setGeneratedMedia(item)}
                style={{ 
                  minWidth: '150px', 
                  height: '150px', 
                  borderRadius: '15px', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: generatedMedia?.url === item.url ? '3px solid var(--color-primary)' : '1px solid var(--border-color)',
                  opacity: generatedMedia?.url === item.url ? 1 : 0.7,
                  transition: 'all 0.2s ease'
                }}
              >
                {item.type === 'video' ? (
                   <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-icons" style={{ color: '#fff' }}>play_circle</span>
                   </div>
                ) : (
                  <img src={item.url} alt={`Wersja ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualEditor;
