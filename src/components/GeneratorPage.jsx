import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, collection, query, orderBy, onSnapshot, limit, deleteDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import PaymentPage from './PaymentPage'; // Importujemy widok płatności

const GeneratorPage = () => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [style, setStyle] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading'); // 'loading', 'active', 'none'

  const [imagePrompt, setImagePrompt] = useState('');
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  // Podstawowy adres API Twoich funkcji Firebase
  const API_BASE_URL = 'https://us-central1-social-media-creator-b6df8.cloudfunctions.net/api';

  // Auth Guard & State Sync

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        navigate('/login');
      } else {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Subskrypcja danych użytkownika i statusu Stripe
  useEffect(() => {
    if (!user) return;

    // 1. Nasłuchiwanie balansu (users/{uid})
    const userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setBalance(snapshot.data().balance || 0);
      }
    });

    // 2. Nasłuchiwanie statusu subskrypcji Stripe
    const subQuery = query(
      collection(db, 'customers', user.uid, 'subscriptions'),
      limit(1)
    );
    const stripeUnsubscribe = onSnapshot(subQuery, (snapshot) => {
      if (!snapshot.empty) {
        const sub = snapshot.docs[0].data();
        if (sub.status === 'active' || sub.status === 'trialing') {
          setSubscriptionStatus('active');
        } else {
          setSubscriptionStatus('none');
        }
      } else {
        setSubscriptionStatus('none');
      }
    });

    // 3. Nasłuchiwanie historii
    const q = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('createdAt', 'desc')
    );
    const historyUnsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
    });

    return () => {
      userUnsubscribe();
      stripeUnsubscribe();
      historyUnsubscribe();
    };
  }, [user]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic || subscriptionStatus !== 'active') return;

    setLoading(true);
    setResult(null);
    setGeneratedImage(null);
    setImagePrompt('');
    setIsPromptMode(false);
    try {

      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate`, 
        { topic, platform, style },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const content = response.data.content;
      setResult(content);

      // Use the ID provided by the backend to avoid duplicates
      if (response.data.historyId) {
        setCurrentRecordId(response.data.historyId);
      }

    } catch (error) {
      console.error('Generation failed:', error);
      alert(error.response?.data?.error || 'Nie udało się wygenerować treści.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!result) return;
    try {
      setImageLoading(true);
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-image-prompt`, 
        { postContent: result, aspectRatio, platform },
        { headers: { Authorization: `Bearer ${token}` } }
      );


      setImagePrompt(response.data.prompt);
      setIsPromptMode(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Prompt generation failed:', error);
      alert('Nie udało się przygotować opisu obrazu.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setImageLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-image`, 
        { prompt: imagePrompt, aspectRatio },
        { headers: { Authorization: `Bearer ${token}` } }
      );


      // Update history record with image
      if (currentRecordId) {
        const recordRef = doc(db, 'users', user.uid, 'history', currentRecordId);
        await updateDoc(recordRef, {
          imageUrl: response.data.imageUrl,
          imagePrompt: imagePrompt
        });
      }

      setGeneratedImage(response.data.imageUrl);
      setIsPromptMode(false);
    } catch (error) {
      console.error('Image generation failed:', error);
      alert(error.response?.data?.error || 'Nie udało się wygenerować obrazu.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Skopiowano do schowka!');
  };

  const handleDeleteHistory = async (itemId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wpis z historii?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', itemId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Nie udało się usunąć wpisu.');
    }
  };


  // Jeśli trwa sprawdzanie subskrypcji
  if (subscriptionStatus === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Wczytywanie profilu...</p>
      </div>
    );
  }

  // GŁÓWNY WARUNEK: Jeśli brak aktywnej subskrypcji, pokazujemy okno zakupu
  if (subscriptionStatus === 'none') {
    return (
      <div className="pricing-overlay">
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 1000 }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Wyloguj</button>
        </div>
        <PaymentPage />
      </div>
    );
  }

  // Jeśli użytkownik ma aktywną subskrypcję, pokazujemy Dashboard
  return (
    <div className="generator-container" style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: '2rem'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem'
      }}>
        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          SOCIAL<span style={{ color: 'var(--secondary)' }}>CREATOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.9rem' }}>
            Portfel: <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{balance.toLocaleString()} tokens</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Wyloguj
          </button>
        </div>
      </header>

      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '2rem'
      }}>
        {/* Left: Input Form */}
        <div className="glass" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Nowy Projekt</h2>
          <form onSubmit={handleGenerate}>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Temat / O czym ma być post?</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Np. Zalety pracy zdalnej w 2024 roku..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Platforma</label>
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '10px' }}
                >
                  <option>LinkedIn</option>
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Twitter / X</option>
                </select>
              </div>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Styl</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '10px' }}
                >
                  <option>Professional</option>
                  <option>Creative</option>
                  <option>Witty</option>
                  <option>Inspirational</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Zużywasz tokeny zgodnie z licznikiem Gemini.
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || balance < 1000} 
              style={{ width: '100%', padding: '1rem', opacity: (loading || balance < 1000) ? 0.7 : 1 }}
            >
              {loading ? 'Generowanie...' : balance < 1000 ? 'Brak tokenów ❌' : 'Generuj Treść ✨'}
            </button>
            
            {balance < 1000 && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--accent)', fontSize: '0.9rem' }}>
                Skontaktuj się z administracją lub odczekaj na odnowienie tokenów.
              </p>
            )}
          </form>
        </div>

        {/* Right: Result & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Result Area */}
          {result && (
            <div className="glass" style={{ padding: '2rem', border: '1px solid var(--secondary)', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--secondary)' }}>Wygenerowana Treść</h3>
                <button onClick={() => copyToClipboard(result)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                  Kopiuj
                </button>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{result}</p>
              
              {/* Format Selection UI */}
              {!isPromptMode && !generatedImage && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', textAlign: 'center' }}>
                    Wybierz format grafiki:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { id: '1:1', label: '⏹️ Post', desc: '1:1' },
                      { id: '9:16', label: '📱 Story', desc: '9:16' },
                      { id: '16:9', label: '🖥️ Poziom', desc: '16:9' },
                      { id: '4:5', label: '👤 Portret', desc: '4:5' }
                    ].map(format => (
                      <button
                        key={format.id}
                        onClick={() => setAspectRatio(format.id)}
                        style={{
                          padding: '0.6rem 0.2rem',
                          borderRadius: '10px',
                          border: aspectRatio === format.id ? '2px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)',
                          background: aspectRatio === format.id ? 'var(--secondary-glow)' : 'rgba(255,255,255,0.03)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>{format.label}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{format.desc}</span>
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleGeneratePrompt}
                    disabled={imageLoading}
                    className="btn-secondary" 
                    style={{ 
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.8rem',
                      padding: '1.2rem'
                    }}
                  >
                    {imageLoading ? 'Przygotowywanie...' : '🎨 Przygotuj grafikę (Nano Banana)'}
                  </button>
                </div>
              )}




              {isPromptMode && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '15px',
                  border: '1px solid var(--secondary)'
                }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--secondary)' }}>
                    ✨ Nano Banana przygotował opis grafiki. Możesz go edytować:
                  </p>
                  <textarea 
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    style={{ 
                      width: '100%',
                      minHeight: '100px', 
                      fontSize: '0.9rem', 
                      marginBottom: '1rem',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'white',
                      padding: '1rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => setIsPromptMode(false)} className="btn-secondary" style={{ padding: '0.8rem' }}>
                      Anuluj
                    </button>
                    <button 
                      onClick={handleGenerateImage} 
                      disabled={imageLoading} 
                      className="btn-primary"
                      style={{ padding: '0.8rem' }}
                    >
                      {imageLoading ? 'Generowanie...' : '🚀 Generuj obraz (1M)'}
                    </button>
                  </div>
                </div>
              )}

              {generatedImage && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <img 
                    src={generatedImage} 
                    alt="Generated content" 
                    style={{ width: '100%', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }} 
                  />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      onClick={() => setGeneratedImage(null)} 
                      className="btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Usuń / Nowa
                    </button>
                    <a 
                      href={generatedImage} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-primary"
                      style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      download={`nano-banana-${Date.now()}.png`}
                    >
                      ⏬ Pobierz HD
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* History Toggle Button */}
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="glass"
            style={{ 
              width: '100%', 
              padding: '1.5rem', 
              borderRadius: '20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📜</span>
              <h3 style={{ margin: 0 }}>Twoja Historia</h3>
            </div>
            <span>{showHistory ? '🔼 Ukryj' : '🔽 Pokaż'}</span>
          </button>

          {/* History List (Conditional) */}
          {showHistory && (
            <div className="glass" style={{ padding: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
              <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Brak wygenerowanych treści.</p>
                ) : (
                  history.map(item => (
                    <div key={item.id} style={{
                      padding: '1.5rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '15px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', paddingRight: '2rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold' }}>
                          {item.platform} • {item.style} • {item.tokensUsed?.toLocaleString() || '0'} tokens
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : ''}
                        </span>
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDeleteHistory(item.id)}
                        style={{
                          position: 'absolute',
                          top: '1.2rem',
                          right: '1.2rem',
                          background: 'none',
                          border: 'none',
                          color: '#ff4d4d',
                          cursor: 'pointer',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.6}
                      >
                        🗑️
                      </button>

                      <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>"{item.topic}"</p>
                      
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '300px' }}>
                          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{item.content}</p>
                        </div>
                        
                        {item.imageUrl && (
                          <div style={{ flex: '0 0 150px' }}>
                            <img 
                              src={item.imageUrl} 
                              alt="Generated preview" 
                              style={{ width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} 
                            />
                            <a 
                              href={item.imageUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ display: 'block', textAlign: 'center', fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--secondary)' }}
                            >
                              Podgląd HD
                            </a>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => copyToClipboard(item.content)}
                        style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Kopiuj treść
                      </button>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
