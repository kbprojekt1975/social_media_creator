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
  const [style, setStyle] = useState('Profesjonalny');
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

  // Plan/PEaaS States
  const [plannedPrompt, setPlannedPrompt] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [planActive, setPlanActive] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDark]);

  // Credit/Limit Logic
  const MAX_TOKENS = 200000;
  const perc = Math.max(0, Math.min(100, (balance / MAX_TOKENS) * 100));
  const [showTooltip, setShowTooltip] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [forcePaymentView, setForcePaymentView] = useState(false);

  useEffect(() => {
    if (perc <= 25 && balance > 0) setShowTooltip(true);
    if (balance <= 0 && subscriptionStatus === 'active') {
      setForcePaymentView(true);
      setIsReadOnly(true);
    }
  }, [perc, balance, subscriptionStatus]);

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
        { 
          topic, 
          platform, 
          style, 
          plannedPrompt: planActive && plannedPrompt ? plannedPrompt.englishPrompt : null 
        },
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

  const handleGeneratePlan = async () => {
    if (!topic || subscriptionStatus !== 'active') return;

    setIsPlanning(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-plan`, 
        { topic, platform, style },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const planData = response.data.plan;
      console.log("DEBUG: Plan object received from API:", planData);

      if (typeof planData === 'string') {
        console.warn("DEBUG: API returned string instead of object. Falling back.");
        setPlannedPrompt({
          polishPlan: "Wygenerowano standardowy plan automatyczny.",
          englishPrompt: planData
        });
      } else if (planData && typeof planData === 'object') {
        console.log("DEBUG: Setting structured plan state.");
        setPlannedPrompt(planData);
      } else {
        console.error("DEBUG: Received invalid plan format:", planData);
      }
      setPlanActive(true);
    } catch (error) {
      console.error('Planning failed:', error);
      alert('Nie udało się przygotować profesjonalnego planu.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSyncPrompt = async () => {
    if (!plannedPrompt?.polishPlan || subscriptionStatus !== 'active') return;

    setIsSyncing(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/sync-prompt`, 
        { 
          polishPlan: plannedPrompt.polishPlan, 
          topic, 
          platform, 
          style 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPlannedPrompt({
        ...plannedPrompt,
        englishPrompt: response.data.englishPrompt
      });
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Nie udało się dopasować instrukcji technicznych do Twoich zmian.');
    } finally {
      setIsSyncing(false);
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

  // GŁÓWNY WARUNEK: Jeśli brak aktywnej subskrypcji lub wymuszone okno płatności (brak środków)
  if (subscriptionStatus === 'none' || forcePaymentView) {
    return (
      <div className="pricing-overlay">
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 1000, display: 'flex', gap: '1rem' }}>
          {forcePaymentView && (
            <button 
              onClick={() => setForcePaymentView(false)} 
              className="btn-secondary" 
              style={{ padding: '0.5rem 1.5rem', borderColor: 'var(--secondary)' }}
            >
              Przejdź do aplikacji (Tryb odczytu)
            </button>
          )}
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
      background: 'var(--bg-app)',
      padding: '1rem 4rem'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 0',
        marginBottom: '1rem'
      }}>
        <div className="logo" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
          SOCIAL<span style={{ color: '#2a8ca8' }}>CREATOR</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Status Pill */}
          <div className="glass" style={{ 
            padding: '0.4rem 0.6rem 0.4rem 1.2rem', 
            borderRadius: '40px', 
            fontSize: '0.9rem', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="#e0e4e8" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="10" fill="none" stroke={perc > 50 ? '#4ade80' : perc > 25 ? '#fb923c' : '#ef4444'} strokeWidth="2.5" 
                    strokeDasharray={2 * Math.PI * 10} 
                    strokeDashoffset={2 * Math.PI * 10 * (1 - perc / 100)} 
                    strokeLinecap="round"
                    transform="rotate(-90 12 12)"
                  />
                </svg>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Status konta: <span style={{ fontWeight: '600', color: '#4ade80' }}>{perc.toFixed(0)}%</span></span>
            </div>

            {showTooltip && (
              <div className="buy-credits-tooltip">
                <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="material-icons" style={{ color: '#fbbf24', fontSize: '1.1rem' }}>lightbulb</span>
                  Twoje kredyty kończą się.
                </p>
                <button onClick={() => setForcePaymentView(true)} className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', borderRadius: '15px' }}>Dokup kredyty</button>
                <button onClick={() => setShowTooltip(false)} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}>Zamknij</button>
              </div>
            )}
          </div>

          <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500' }}>{user?.email}</span>
          
          <button 
            onClick={() => setIsDark(!isDark)}
            className="btn-secondary"
            style={{ 
              padding: '0.6rem', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
            title={isDark ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"}
          >
            <span className="material-icons" style={{ fontSize: '1.4rem', color: isDark ? '#fbbf24' : '#64748b' }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.6rem 1.4rem' }}>
            Wyloguj
          </button>
        </div>
      </header>

      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 1fr) 1.2fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Left: Input Form & Planning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none' }}>
            <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '700' }}>Nowy Projekt</h2>
            <form onSubmit={handleGenerate}>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Temat / O czym ma być post?</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={isReadOnly ? "Tryb tylko do odczytu - brak środków" : "Np. Zalety pracy zdalnej w 2024 roku..."}
                  readOnly={isReadOnly}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '1rem',
                    background: 'var(--bg-app)',
                    border: isReadOnly ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '15px',
                    color: 'var(--text-main)',
                    resize: 'vertical',
                    cursor: isReadOnly ? 'not-allowed' : 'text',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>Styl postu</label>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  {['Profesjonalny', 'Humorystyczny', 'Entuzjastyczny', 'Nietuzinkowy'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={`chip ${style === s ? 'active' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>Platforma docelowa</label>
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '15px', fontSize: '1rem' }}
                >
                  <option>LinkedIn</option>
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Twitter / X</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Zużywasz tokeny zgodnie z licznikiem Gemini.
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={handleGeneratePlan}
                  disabled={isPlanning || !topic || isReadOnly}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '1.2rem', fontSize: '0.95rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isReadOnly ? 0.3 : 1 }}
                >
                  {isPlanning ? 'Planowanie...' : (
                    <>
                      <span className="material-icons" style={{ fontSize: '1.2rem', marginRight: '0.5rem', color: 'var(--color-primary)' }}>auto_awesome</span>
                      Ulepsz opis
                    </>
                  )}
                  {isPlanning && <span className="spinner"></span>}
                </button>
                
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading || balance < 1000 || isReadOnly} 
                  style={{ flex: 1.2, padding: '1.2rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {loading ? 'Generowanie...' : (
                    <>
                      {isReadOnly || balance < 1000 ? (
                        <>Brak środków <span className="material-icons" style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>error_outline</span></>
                      ) : (
                        <>Generuj Treść <span className="material-icons" style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>bolt</span></>
                      )}
                    </>
                  )}
                  {loading && <span className="spinner"></span>}
                </button>
              </div>
            </form>
          </div>

          {/* Planning / PEaaS Session */}
          {planActive && (
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '25px', border: '1px dashed var(--color-secondary)' }}>
              <div style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1rem', background: 'var(--bg-white)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>assignment</span>
                  Strategia (PL) - możesz edytować:
                </h4>
                <textarea 
                  value={plannedPrompt?.polishPlan || ''}
                  onChange={(e) => setPlannedPrompt({ ...plannedPrompt, polishPlan: e.target.value })}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    marginBottom: '0.5rem'
                  }}
                />
              </div>

              <div style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1rem', background: 'var(--bg-white)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>smart_toy</span>
                  Techniczny Prompt (EN)
                </h4>
                <textarea 
                  value={plannedPrompt.englishPrompt}
                  onChange={(e) => setPlannedPrompt({ ...plannedPrompt, englishPrompt: e.target.value })}
                  style={{ width: '100%', minHeight: '150px', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}
                />
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    type="button"
                    onClick={handleSyncPrompt}
                    disabled={isSyncing || isReadOnly}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isSyncing ? 'Synchronizacja...' : (
                      <>
                        <span className="material-icons" style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>sync</span>
                        Aktualizuj instrukcje techniczne (EN)
                      </>
                    )}
                    {isSyncing && <span className="spinner"></span>}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || isReadOnly}
                  className="btn-primary"
                  style={{ padding: '0.8rem 2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {loading ? 'Generowanie...' : (
                    <>
                      <span className="material-icons" style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>check_circle</span>
                      Zatwierdzam i generuj
                    </>
                  )}
                  {loading && <span className="spinner"></span>}
                </button>
              </div>
            </div>
          )}

          {balance < 1000 && !isReadOnly && (
            <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>
              Wymagane doładowanie konta, aby kontynuować generowanie.
            </p>
          )}
        </div>

        {/* Right: Result & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Result Area */}
          {result && (
            <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--color-primary)', fontWeight: '700' }}>Wygenerowana Treść</h3>
                <button onClick={() => copyToClipboard(result)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>
                  Kopiuj teraz
                </button>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text-main)', fontSize: '1.05rem' }}>{result}</p>
              
              {/* Graphic Options */}
              {!isPromptMode && !generatedImage && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>
                    Wybierz format grafiki
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    {[
                      { id: '1:1', label: 'crop_square', tip: 'Post', desc: '1:1' },
                      { id: '9:16', label: 'smartphone', tip: 'Story', desc: '9:16' },
                      { id: '16:9', label: 'desktop_windows', tip: 'Poziom', desc: '16:9' },
                      { id: '4:5', label: 'portrait', tip: 'Portret', desc: '4:5' }
                    ].map(format => (
                      <button
                        key={format.id}
                        onClick={() => setAspectRatio(format.id)}
                        style={{
                          padding: '0.8rem 0.4rem',
                          borderRadius: '15px',
                          border: aspectRatio === format.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: aspectRatio === format.id ? 'var(--bg-white)' : 'var(--bg-app)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '1.3rem', color: aspectRatio === format.id ? 'var(--color-primary)' : 'var(--text-muted)' }}>{format.label}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{format.tip}</span>
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleGeneratePrompt}
                    disabled={imageLoading || isReadOnly}
                    className="btn-secondary" 
                    style={{ 
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.8rem',
                      padding: '1rem',
                      borderRadius: '20px'
                    }}
                  >
                    {imageLoading ? 'Przygotowywanie...' : (
                      <>
                        <span className="material-icons" style={{ color: '#1d6e8a' }}>palette</span>
                        {isReadOnly ? 'Brak środków AI' : 'Przygotuj grafikę (Nano Banana)'}
                      </>
                    )}
                    {imageLoading && <span className="spinner"></span>}
                  </button>
                </div>
              )}

              {isPromptMode && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '25px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                    <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>auto_awesome</span>
                    Nano Banana przygotował opis grafiki:
                  </p>
                  <textarea 
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    style={{ 
                      width: '100%',
                      minHeight: '100px', 
                      fontSize: '0.9rem', 
                      marginBottom: '1rem',
                      background: 'var(--bg-white)',
                      color: 'var(--text-main)',
                      padding: '1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '15px'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => setIsPromptMode(false)} className="btn-secondary" style={{ padding: '0.8rem', borderRadius: '15px' }}>
                      Anuluj
                    </button>
                    <button onClick={handleGenerateImage} disabled={imageLoading || isReadOnly} className="btn-primary" style={{ padding: '0.8rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imageLoading ? 'Generowanie...' : (
                        <>
                          <span className="material-icons" style={{ marginRight: '0.5rem' }}>rocket_launch</span>
                          Generuj obraz (10k)
                        </>
                      )}
                      {imageLoading && <span className="spinner"></span>}
                    </button>
                  </div>
                </div>
              )}

              {generatedImage && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', borderRadius: '25px', boxShadow: 'var(--shadow-md)' }} />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button onClick={() => setGeneratedImage(null)} className="btn-secondary" style={{ flex: 1, borderRadius: '15px' }}>Usuń / Nowa</button>
                    <a href={generatedImage} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1.5, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }} download>
                      Pobierz HD
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Column */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700' }}>Twoja Historia</h2>
            </div>
            
            <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Brak wygenerowanych treści.</p>
              ) : (
                history.map(item => (
                  <div key={item.id} style={{
                    padding: '1.8rem',
                    background: 'var(--bg-app)',
                    borderRadius: '25px',
                    border: '1px solid var(--border-color)',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '700' }}>
                        Projekt: {item.topic?.slice(0, 35)}...
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                        <span className="material-icons" style={{ color: '#fbbf24', fontSize: '1.1rem' }}>auto_awesome</span>
                      </div>
                    </div>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-muted)', 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.6',
                      marginBottom: '1.2rem'
                    }}>
                      {item.content}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '12px', background: 'var(--bg-white)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
                          {item.platform}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteHistory(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                      >
                        <span className="material-icons" style={{ fontSize: '1.2rem' }}>delete_outline</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
