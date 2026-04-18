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
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [activeImageLabel, setActiveImageLabel] = useState('Post');
  const [videoAspectRatio, setVideoAspectRatio] = useState('9:16');
  const [activeVideoLabel, setActiveVideoLabel] = useState('Reels');
  const [expandedHistoryItems, setExpandedHistoryItems] = useState({});
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [visualizationType, setVisualizationType] = useState('image'); // 'image' or 'video'
  const [generatedVideo, setGeneratedVideo] = useState(null);

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

  // Stany dla funkcji poprawiania (Refinement)
  const [textFeedback, setTextFeedback] = useState('');
  const [isTextRefining, setIsTextRefining] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState('');
  const [isMediaRefining, setIsMediaRefining] = useState(false);

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
    setGeneratedVideo(null);
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

      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
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

  const handleGeneratePrompt = async (type = 'image') => {
    if (!result) return;
    try {
      setVisualizationType(type);
      setImageLoading(true);
      const token = await user.getIdToken();
      const currentAspectRatio = type === 'video' ? videoAspectRatio : imageAspectRatio;
      const response = await axios.post(`${API_BASE_URL}/generate-image-prompt`, 
        { postContent: result, aspectRatio: currentAspectRatio, platform, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setImagePrompt(response.data.prompt);
      setIsPromptMode(true);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Prompt generation failed:', error);
      alert(`Nie udało się przygotować opisu ${type === 'video' ? 'wideo' : 'obrazu'}.`);
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateImage = async (overridePrompt = null) => {
    const promptToUse = overridePrompt || imagePrompt;
    if (!promptToUse) return;
    setImageLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-image`, 
        { prompt: promptToUse, aspectRatio: imageAspectRatio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update history record with image
      if (currentRecordId) {
        const recordRef = doc(db, 'users', user.uid, 'history', currentRecordId);
        await updateDoc(recordRef, {
          imageUrl: response.data.imageUrl,
          imagePrompt: promptToUse
        });
      }

      setGeneratedImage(response.data.imageUrl);
      setIsPromptMode(false);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {

      console.error('Image generation failed:', error);
      alert(error.response?.data?.error || 'Nie udało się wygenerować obrazu.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateVideo = async (overridePrompt = null) => {
    const promptToUse = overridePrompt || imagePrompt;
    if (!promptToUse) return;
    setImageLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-video`, 
        { prompt: promptToUse, aspectRatio: videoAspectRatio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (currentRecordId) {
        const recordRef = doc(db, 'users', user.uid, 'history', currentRecordId);
        await updateDoc(recordRef, {
          videoUrl: response.data.videoUrl,
          videoPrompt: promptToUse
        });
      }

      setGeneratedVideo(response.data.videoUrl);
      setIsPromptMode(false);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {

      console.error('Video generation failed:', error);
      alert(error.response?.data?.error || 'Nie udało się wygenerować klipu wideo.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleRefineText = async () => {
    if (!textFeedback.trim() || !result) return;
    setIsTextRefining(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/refine-post`, 
        { originalPost: result, instructions: textFeedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data.content);
      setTextFeedback(''); // Wyczyść pole po udanej operacji
      
      // Update history if currentRecordId exists
      if (currentRecordId) {
        const recordRef = doc(db, 'users', user.uid, 'history', currentRecordId);
        await updateDoc(recordRef, {
          content: response.data.content
        });
      }
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Refine Text Error:', error);
      alert('Nie udało się wdrożyć poprawek tekstu.');
    } finally {
      setIsTextRefining(false);
    }
  };

  const handleRefineMedia = async () => {
    if (!mediaFeedback.trim() || !imagePrompt) return;
    setIsMediaRefining(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/refine-image-prompt`, 
        { originalPrompt: imagePrompt, instructions: mediaFeedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newPrompt = response.data.prompt;
      setImagePrompt(newPrompt); // Aktualizujemy widok monitu
      setMediaFeedback('');

      // Auto-generacja po poprawce
      if (generatedVideo) {
        await handleGenerateVideo(newPrompt);
      } else {
        await handleGenerateImage(newPrompt);
      }
    } catch (error) {
      console.error('Refine Media Error:', error);
      alert('Nie udało się przygotować poprawek dla modelu wizualnego.');
    } finally {
      setIsMediaRefining(false);
    }
  };

  const toggleHistoryItem = (itemId) => {
    setExpandedHistoryItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleAllHistory = (expand = true) => {
    if (!expand) {
      setExpandedHistoryItems({});
    } else {
      const all = {};
      history.forEach(item => {
        all[item.id] = true;
      });
      setExpandedHistoryItems(all);
    }
  };

  const toggleHistoryDrawer = () => {
    setIsHistoryDrawerOpen(!isHistoryDrawerOpen);
  };

  const handleReset = () => {
    setTopic('');
    setResult('');
    setPlannedPrompt(null);
    setPlanActive(false);
    setIsPromptMode(false);
    setImagePrompt('');
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setCurrentRecordId(null);
  };

  const handleEditHistoryItem = (item) => {
    setTopic(item.topic || '');
    setPlatform(item.platform || 'LinkedIn');
    setStyle(item.style || 'Profesjonalny');
    setResult(item.content || '');
    if (item.polishPlan || item.englishPrompt || item.imagePrompt || item.videoPrompt) {
      setPlannedPrompt({
        polishPlan: item.polishPlan || '',
        englishPrompt: item.englishPrompt || item.imagePrompt || item.videoPrompt || ''
      });
      setPlanActive(true);
    } else {
      setPlannedPrompt(null);
      setPlanActive(false);
    }
    setGeneratedImage(item.imageUrl || null);
    setGeneratedVideo(item.videoUrl || null);
    setImagePrompt(item.imagePrompt || item.videoPrompt || '');
    setIsHistoryDrawerOpen(false); // Automatycznie zamyka panel historii
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Przewija ekran do góry podążając za nowo załadowanym tematem
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

      {/* History Slide-out Drawer */}
      <div 
        style={{ 
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: '30%',
          minWidth: '400px',
          zIndex: 1000,
          padding: '2.5rem', 
          borderRadius: '0 30px 30px 0', 
          background: 'var(--bg-card)', 
          borderRight: '1px solid var(--border-color)',
          borderLeft: 'none',
          boxShadow: 'var(--shadow-lg)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHistoryDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700' }}>Historia</h2>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {history.length > 0 && (
              <button 
                onClick={() => toggleAllHistory(Object.keys(expandedHistoryItems).length === 0)}
                style={{ 
                  background: 'var(--bg-app)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--color-primary)', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  fontWeight: '700',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {Object.keys(expandedHistoryItems).length === 0 ? 'Rozwiń wszystkie' : 'Zwiń wszystkie'}
              </button>
            )}
            <button 
              onClick={toggleHistoryDrawer}
              style={{ background: 'var(--bg-app)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '10px' }}
            >
              <span className="material-icons">first_page</span>
            </button>
          </div>
        </div>
        
        <div className="history-list" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'stretch',
          gap: '1.2rem', 
          overflowY: 'auto',
          paddingRight: '0.5rem',
          scrollbarGutter: 'stable'
        }}>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Brak wygenerowanych treści.</p>
          ) : (
            history.map(item => {
              const isExpanded = !!expandedHistoryItems[item.id];
              return (
                <div key={item.id} style={{
                  background: 'var(--bg-app)',
                  borderRadius: '25px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  flexShrink: 0
                }}>
                  <div 
                    onClick={() => toggleHistoryItem(item.id)}
                    style={{ 
                      padding: '1.2rem 1.8rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '700' }}>
                        {item.topic?.slice(0, 35)}{item.topic?.length > 35 ? '...' : ''}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                          {item.platform}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                    </div>
                    <span className="material-icons" style={{ 
                      color: 'var(--color-primary)', 
                      transition: 'transform 0.3s', 
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      fontSize: '1.8rem' 
                    }}>
                      expand_more
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 1.8rem 1.8rem 1.8rem', animation: 'fadeIn 0.3s ease-out' }}>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginBottom: '1.2rem' }}>
                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.8rem', marginBottom: '1.5rem' }}>
                          <p style={{ 
                            fontSize: '1rem', 
                            color: 'var(--text-main)', 
                            lineHeight: '1.7', 
                            whiteSpace: 'pre-wrap', 
                            letterSpacing: '0.2px'
                          }}>
                            {item.content}
                          </p>
                        </div>
                        
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="History" style={{ width: '100%', borderRadius: '15px', marginBottom: '1rem', border: '1px solid var(--border-color)' }} />
                        )}
                        {item.videoUrl && (
                          <video src={item.videoUrl} controls style={{ width: '100%', borderRadius: '15px', marginBottom: '1rem', background: '#000' }} />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(item.content); }}
                              className="btn-secondary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '12px' }}
                            >
                              Kopiuj
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditHistoryItem(item); }}
                              className="btn-secondary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            >
                              <span className="material-icons" style={{ fontSize: '1rem' }}>edit</span>
                              Edytuj
                            </button>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                          >
                            <span className="material-icons" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                            Usuń
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Drawer Trigger */}
      {!isHistoryDrawerOpen && (
        <button 
          onClick={toggleHistoryDrawer}
          style={{
            position: 'fixed',
            left: '1.5rem',
            bottom: '2.5rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            cursor: 'pointer',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            transition: 'transform 0.3s ease',
            animation: 'fadeIn 0.5s ease-out'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-icons" style={{ fontSize: '2rem' }}>history</span>
        </button>
      )}

      {/* Dashboard Grid (now Centered Layout) */}
      <div className="dashboard-grid" style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        alignItems: 'stretch'
      }}>
        {/* Input Form & Planning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none' }}>
            {/* ... Content remains same ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Nowy Projekt</h2>
              <button 
                onClick={handleReset} 
                className="btn-secondary" 
                style={{ padding: '0.5rem 1rem', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Wyczyść formularz i zacznij od nowa"
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>refresh</span>
                Resetuj
              </button>
            </div>

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
                    <button 
                      onClick={visualizationType === 'video' ? handleGenerateVideo : handleGenerateImage} 
                      disabled={imageLoading || isReadOnly} 
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
          )}
      </div>
    </div>
  </div>
  );
};

export default GeneratorPage;
