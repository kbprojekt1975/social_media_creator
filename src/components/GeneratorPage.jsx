import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, collection, query, orderBy, onSnapshot, limit, deleteDoc, addDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import PaymentPage from './PaymentPage';
import StatusHeader from './generator/StatusHeader';
import GeneratorTabs from './generator/GeneratorTabs';
import HistoryDrawer from './generator/HistoryDrawer';
import WorkspaceManager from './generator/WorkspaceManager';
import PostGenerator from './generator/PostGenerator';
import ResultSection from './generator/ResultSection'; 
import axiosRetry from 'axios-retry';
import CampaignPlanner from './generator/CampaignPlanner';
import HelpModal from './generator/HelpModal';
import VisualEditor from './generator/VisualEditor';
import { useNotification } from './common/NotificationContext';

// Configure axios to retry on 429 errors
axiosRetry(axios, { 
  retries: 5, 
  retryDelay: (retryCount) => {
    // Exponential backoff: 3s, 9s, 27s, 81s, 243s
    // This is safer for Gemini's 15 RPM / 2 RPM limits
    return Math.pow(3, retryCount) * 1000; 
  },
  retryCondition: (error) => {
    const status = error.response?.status;
    const body = JSON.stringify(error.response?.data || "").toLowerCase();
    // Retry on 429, 503 (Overloaded) or specific rate limit messages in body
    return status === 429 || status === 503 || body.includes("rate limit") || body.includes("too many requests") || axiosRetry.isNetworkOrIdempotentRequestError(error);
  }
});

const GeneratorPage = ({ deferredPrompt, setDeferredPrompt }) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, showWarning, addNotification } = useNotification();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [style, setStyle] = useState('Profesjonalny');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading'); // 'loading', 'active', 'none'

  const [imagePromptData, setImagePromptData] = useState(null); // { polishDescription, englishPrompt }
  const [videoPromptData, setVideoPromptData] = useState(null); // { polishDescription, englishPrompt }
  const [isVisualSyncing, setIsVisualSyncing] = useState(false);
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [customStyles, setCustomStyles] = useState([]);
  const [activeEditorSession, setActiveEditorSession] = useState(null);
  const [activeCampaignSession, setActiveCampaignSession] = useState(null);
  const [activeCampaignContext, setActiveCampaignContext] = useState(null); // { campaignId, itemIndex }

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setShowScrollTop(scrolled);
      setIsAtTop(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPosition = (direction) => {
    window.scrollTo({
      top: direction === 'up' ? 0 : document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Plan/PEaaS States
  const [plannedPrompt, setPlannedPrompt] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [planActive, setPlanActive] = useState(false);

  // Theme State - Default to dark
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') !== 'light');

  const [pricing, setPricing] = useState({
    post: 5000,
    image: 105000,
    video: 1100000,
    campaign: 25000,
    gif: 350000,
    refine: 5000
  });

  useEffect(() => {
    // Live sync pricing from Firestore
    const pricingRef = doc(db, 'config', 'pricing');
    const unsubscribe = onSnapshot(pricingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPricing({
          post: data.POST_COST || 5000,
          image: data.IMAGE_COST || 105000,
          video: data.VIDEO_COST || 1100000,
          campaign: data.CAMPAIGN_COST || 25000,
          gif: data.GIF_COST || 350000,
          refine: data.REFINE_COST || 5000
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const checkBalance = (actionType) => {
    const cost = pricing[actionType] || 1;
    if (balance < cost) {
      addNotification(
        `Niewystarczająca ilość kredytów. Ta akcja kosztuje ${cost.toLocaleString()}, a masz ich ${balance.toLocaleString()}.`, 
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

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDark]);

  // Credit/Limit Logic
  const MAX_TOKENS = 10000000; // 10M tokens as the full bar reference (Standard Plan)
  const perc = Math.max(0, Math.min(100, (balance / MAX_TOKENS) * 100));
  const [showTooltip, setShowTooltip] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [forcePaymentView, setForcePaymentView] = useState(false);

  useEffect(() => {
    if (perc <= 25 && balance > 0) setShowTooltip(true);
    if (balance <= 0 && subscriptionStatus === 'active') {
      // We don't force read-only anymore, let checkBalance handle it with a notification
      setIsReadOnly(false); 
    }
  }, [perc, balance, subscriptionStatus]);

  const location = useLocation();
  const [user, setUser] = useState(auth.currentUser);

  // Stany dla funkcji poprawiania (Refinement)
  const [textFeedback, setTextFeedback] = useState('');
  const [isTextRefining, setIsTextRefining] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState('');
  const [isMediaRefining, setIsMediaRefining] = useState(false);
  const [mediaHistory, setMediaHistory] = useState([]); // Array to store { type: 'image'|'video', url: string, prompt: string }
  const [v1VisualPrompt, setV1VisualPrompt] = useState(null);
  const [aiDetectionLog, setAiDetectionLog] = useState("");

  // Workspace States
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'generator'); // 'generator' | 'workspaces' | 'campaigns'
  const [showHelp, setShowHelp] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', contentDirectives: '', visualStyle: '' });



  // Auto-scroll refs
  const resultSectionRef = useRef(null);

  // Auto-scroll logic for Post Generation
  useEffect(() => {
    if (loading && resultSectionRef.current) {
      // Scroll to the bottom of the page to show the spinner/result appearing
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [loading]);

  // Auto-scroll logic for Media Generation/Refinement
  useEffect(() => {
    if ((imageLoading || isMediaRefining || isVisualSyncing) && resultSectionRef.current) {
      // Small timeout to ensure the loading placeholder or section is rendered
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 150);
    }
  }, [imageLoading, isMediaRefining, isVisualSyncing]);

  // Campaign States
  const [campaigns, setCampaigns] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);

  // Podstawowy adres API Twoich funkcji Firebase
  const API_BASE_URL = 'https://us-central1-social-media-creator-b6df8.cloudfunctions.net/api';

  // Auth Guard & State Sync

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        navigate('/login');
      } else {
        setUser(u);
        // Inicjalizacja użytkownika (nadanie powitalnych tokenów)
        u.getIdToken().then(token => {
          axios.post(`${API_BASE_URL}/initialize-user`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.error("Błąd inicjalizacji użytkownika:", err));
        });
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

    // 4. Nasłuchiwanie przestrzeni roboczych (workspaces)
    const workspacesQuery = query(
      collection(db, 'users', user.uid, 'workspaces'),
      orderBy('createdAt', 'desc')
    );
    const workspacesUnsubscribe = onSnapshot(workspacesQuery, (snapshot) => {
      const wsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkspaces(wsData);
      const active = wsData.find(ws => ws.isActive);
      setActiveWorkspace(active || null);
    });

    // 5. Nasłuchiwanie kampanii
    const campaignsQuery = query(
      collection(db, 'users', user.uid, 'campaigns'),
      orderBy('createdAt', 'desc')
    );
    const campaignsUnsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
      const campData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(campData);
    });

    // 6. Nasłuchiwanie własnych stylów
    const stylesQuery = query(
      collection(db, 'users', user.uid, 'customStyles'),
      orderBy('createdAt', 'desc')
    );
    const stylesUnsubscribe = onSnapshot(stylesQuery, (snapshot) => {
      const stylesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomStyles(stylesData);
    });

    return () => {
      userUnsubscribe();
      stripeUnsubscribe();
      historyUnsubscribe();
      workspacesUnsubscribe();
      campaignsUnsubscribe();
      stylesUnsubscribe();
    };
  }, [user]);

  const handleApiError = (error, defaultMsg) => {
    const serverError = error?.response?.data?.error || error?.message || '';
    const status = error?.response?.status;

    if (status === 429 || serverError.includes('429') || serverError.includes('Resource exhausted') || serverError.includes('Too Many Requests')) {
      showError('🚀 System jest obecnie przeciążony (zbyt wiele zapytań). Odczekaj 30-60 sekund i spróbuj ponownie.');
    } else if (status === 500 || serverError.includes('500') || serverError.includes('Internal Server Error')) {
      showError('🛠️ Wystąpił błąd po stronie serwerów Google Gemini. Zwykle pomaga odczekanie chwili i ponowna próba.');
    } else if (serverError.includes('safety') || serverError.includes('SAFETY')) {
      showWarning('🛡️ Treść została zablokowana przez filtry bezpieczeństwa AI. Spróbuj zmienić temat lub opis.');
    } else if (error?.code === 'ECONNABORTED' || serverError.includes('timeout')) {
      showError('⏳ Połączenie zajęło zbyt dużo czasu. Sprawdź swoje łącze internetowe i spróbuj ponownie.');
    } else if (serverError.includes('fetch') || serverError.includes('Network Error')) {
      showError('🌐 Problem z połączeniem sieciowym. Sprawdź, czy jesteś online.');
    } else {
      showError(serverError || defaultMsg);
    }
  };


  // Workspace Management Functions
  const handleAddWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspace.name) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'workspaces'), {
        ...newWorkspace,
        isActive: false,
        createdAt: serverTimestamp()
      });
      showSuccess(`Przestrzeń "${newWorkspace.name}" została utworzona.`);
      setNewWorkspace({ name: '', contentDirectives: '', visualStyle: '' });
      setShowWorkspaceForm(false);
    } catch (error) {
      console.error('Error adding workspace:', error);
      showError('Nie udało się utworzyć przestrzeni roboczej.');
    }
  };

  const toggleWorkspace = async (id, currentActive) => {
    try {
      // Jeśli chcemy aktywować, najpierw deaktywujemy wszystkie inne
      if (!currentActive) {
        const batch = [];
        workspaces.forEach(ws => {
          if (ws.isActive) {
            batch.push(updateDoc(doc(db, 'users', user.uid, 'workspaces', ws.id), { isActive: false }));
          }
        });
        batch.push(updateDoc(doc(db, 'users', user.uid, 'workspaces', id), { isActive: true }));
        await Promise.all(batch);
      } else {
        // Jeśli chcemy deaktywować obecną
        await updateDoc(doc(db, 'users', user.uid, 'workspaces', id), { isActive: false });
      }
    } catch (error) {
      console.error('Error toggling workspace:', error);
    }
  };

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę przestrzeń?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'workspaces', id));
    } catch (error) {
      console.error('Error deleting workspace:', error);
      showError('Nie udało się usunąć przestrzeni roboczej.');
    }
  };

  const handleAddCustomStyle = async (name, description) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'customStyles'), {
        name,
        description,
        createdAt: serverTimestamp()
      });
      showSuccess('Nowy styl został dodany.');
    } catch (error) {
      console.error('Error adding custom style:', error);
      showError('Nie udało się dodać stylu.');
    }
  };

  const handleDeleteCustomStyle = async (id) => {
    if (!user || !window.confirm('Czy na pewno chcesz usunąć ten styl?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'customStyles', id));
      if (style === customStyles.find(s => s.id === id)?.name) {
        setStyle('Profesjonalny');
      }
      showSuccess('Styl został usunięty.');
    } catch (error) {
      console.error('Error deleting custom style:', error);
      showError('Nie udało się usunąć stylu.');
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!checkBalance('post')) return;
    if (!topic || subscriptionStatus === 'loading') return;

    setLoading(true);
    setResult(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setImagePromptData(null);
    setVideoPromptData(null);
    setIsPromptMode(false);
    try {

      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate`, 
        { 
          topic, 
          platform, 
          style, 
          customStyleGuidelines: customStyles.find(s => s.name === style)?.description || null,
          plannedPrompt: planActive && plannedPrompt ? plannedPrompt.englishPrompt : null,
          campaignId: activeCampaignContext?.campaignId || null,
          workspaceContext: activeWorkspace ? {
            contentDirectives: activeWorkspace.contentDirectives,
            visualStyle: activeWorkspace.visualStyle
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(response.data.content);
      const historyId = response.data.historyId;
      setCurrentRecordId(historyId);

      // Force update with campaignId to ensure grouping works even if backend lags
      if (activeCampaignContext?.campaignId) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'history', historyId), {
            campaignId: activeCampaignContext.campaignId,
            campaignItemIndex: activeCampaignContext.itemIndex
          });
        } catch (updateErr) {
          console.error("Error linking post to campaign:", updateErr);
        }
      }

      showSuccess('Treść została wygenerowana pomyślnie!');
      
      // Auto-scroll to result
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Generation failed:', error);
      handleApiError(error, 'Wystąpił błąd podczas generowania treści.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!topic) {
      showWarning('Proszę wpisać temat, aby przygotować plan.');
      return;
    }
    setIsPlanning(true);
    setPlannedPrompt(null);
    setPlanActive(false);

    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-plan`, {
        platform,
        topic,
        style,
        customStyleGuidelines: customStyles.find(s => s.name === style)?.description || null,
        workspaceContext: activeWorkspace ? {
          contentDirectives: activeWorkspace.contentDirectives,
          visualStyle: activeWorkspace.visualStyle
        } : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const planData = response.data.plan;
      if (typeof planData === 'string') {
        setPlannedPrompt({
          polishPlan: "Wygenerowano plan automatyczny.",
          englishPrompt: planData
        });
      } else {
        setPlannedPrompt(planData);
      }
      setPlanActive(true);
      showInfo('Profesjonalny plan strategii jest gotowy.');
    } catch (error) {
      console.error('Planning failed:', error);
      handleApiError(error, 'Nie udało się przygotować profesjonalnego planu.');
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
          style,
          customStyleGuidelines: customStyles.find(s => s.name === style)?.description || null,
          workspaceContext: activeWorkspace ? {
            contentDirectives: activeWorkspace.contentDirectives,
            visualStyle: activeWorkspace.visualStyle
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPlannedPrompt({
        ...plannedPrompt,
        englishPrompt: response.data.englishPrompt
      });
    } catch (error) {
      console.error('Sync failed:', error);
      handleApiError(error, 'Nie udało się dopasować instrukcji technicznych do Twoich zmian.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGeneratePrompt = async (type, autoGenerate = false) => {
    if (!checkBalance(type)) return;
    if (!result || imageLoading || isReadOnly) return;
    
    setImageLoading(true);
    setIsAutoGenerating(autoGenerate);
    setVisualizationType(type);
    setGeneratedImage(null);
    setGeneratedVideo(null);

    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-image-prompt`, {
        postContent: result,
        type: type,
        aspectRatio: type === 'video' ? videoAspectRatio : imageAspectRatio,
        workspaceContext: activeWorkspace ? {
          visualStyle: activeWorkspace.visualStyle
        } : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const vPlan = response.data.visualPlannedPrompt;
      if (type === 'video') {
        setVideoPromptData(vPlan);
      } else {
        setImagePromptData(vPlan);
      }
      
      // ONLY show prompt mode if NOT auto-generating
      if (!autoGenerate) {
        setIsPromptMode(true);
      }

      // If auto-generation is requested, proceed immediately
      if (autoGenerate) {
        if (type === 'video') {
          await handleGenerateVideo(vPlan);
        } else {
          await handleGenerateImage(vPlan);
        }
      }
    } catch (error) {
      console.error('Prompt generation failed:', error);
      handleApiError(error, `Nie udało się przygotować opisu ${type === 'video' ? 'wideo' : 'obrazu'}.`);
    } finally {
      setImageLoading(false);
    }
  };

  const handleAnimateImage = async (imageUrl, instruction) => {
    if (!imageUrl || !instruction.trim() || isVisualSyncing || isReadOnly) return;
    setIsVisualSyncing(true);
    setImageLoading(true);
    try {
      const token = await user.getIdToken();
      
      // Step 1: AI Analysis of the animation instruction
      // We use the sync-visual-prompt endpoint with video type to get a technical prompt for Veo
      const syncResponse = await axios.post(`${API_BASE_URL}/sync-visual-prompt`, 
        { 
          polishDescription: instruction,
          aspectRatio: videoAspectRatio,
          type: 'video',
          isAnimation: true,
          sourceImageUrl: imageUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const technicalPrompt = syncResponse.data.englishPrompt;
      
      // Step 2: Generate the video using the technical prompt and source image
      await handleGenerateVideo({ englishPrompt: technicalPrompt, polishDescription: instruction }, imageUrl);
      
      showSuccess('Instrukcje ożywienia zostały przetworzone!');
    } catch (error) {
      console.error('Failed to animate image:', error);
      handleApiError(error, 'Nie udało się ożywić zdjęcia.');
    } finally {
      setIsVisualSyncing(false);
      setImageLoading(false);
    }
  };

  const handleSyncVisualPrompt = async () => {
    const currentData = visualizationType === 'video' ? videoPromptData : imagePromptData;
    if (!currentData || isVisualSyncing || isReadOnly) return;
    setIsVisualSyncing(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/sync-visual-prompt`, 
        { 
          polishDescription: currentData.polishDescription,
          aspectRatio: visualizationType === 'video' ? videoAspectRatio : imageAspectRatio,
          type: visualizationType,
          workspaceContext: activeWorkspace ? {
            visualStyle: activeWorkspace.visualStyle
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (visualizationType === 'video') {
        setVideoPromptData(prev => ({ ...prev, englishPrompt: response.data.englishPrompt }));
      } else {
        setImagePromptData(prev => ({ ...prev, englishPrompt: response.data.englishPrompt }));
      }
    } catch (error) {
      console.error('Failed to sync visual prompt:', error);
      handleApiError(error, 'Nie udało się zaktualizować technicznego opisu.');
    } finally {
      setIsVisualSyncing(false);
    }
  };

  const handleGenerateVideo = async (overridePrompt = null, imageUrl = null) => {
    const targetPrompt = overridePrompt || videoPromptData;
    if (!targetPrompt?.englishPrompt) return;
    setImageLoading(true);
    try {
      const token = await user.getIdToken();
      
      // Step 1: Start the generation process
      const startResponse = await axios.post(`${API_BASE_URL}/generate-video`, 
        { 
          prompt: targetPrompt.englishPrompt, 
          aspectRatio: videoAspectRatio,
          imageUrl: imageUrl // This enables Image-to-Video!
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const operationName = startResponse.data.operationName;
      console.log("Video generation started, operation:", operationName);

      // Step 2: Poll for status
      let isDone = false;
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 40; // ~3-4 minutes max polling

      while (!isDone && attempts < maxAttempts) {
        attempts++;
        // Wait 5 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
          const statusResponse = await axios.get(
            `${API_BASE_URL}/video-status?operationName=${encodeURIComponent(operationName)}`, 
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (statusResponse.data.status === "done") {
            isDone = true;
            videoUrl = statusResponse.data.videoUrl;
          } else if (statusResponse.data.status === "failed") {
            throw new Error(statusResponse.data.error || "Generation failed at Google side.");
          }
          // if "processing", just continue loop
        } catch (pollError) {
          console.error("Polling error:", pollError);
          // If it's a transient error, we can continue polling
          if (attempts > 10) throw pollError; 
        }
      }

      if (!videoUrl) {
        throw new Error("Generowanie trwa zbyt długo. Sprawdź historię za chwilę.");
      }

      // Step 3: Success! Update local state and history
      if (currentRecordId) {
        const recordRef = doc(db, 'users', user.uid, 'history', currentRecordId);
        const newMediaItem = { 
          type: 'video', 
          url: videoUrl, 
          prompt: targetPrompt.polishDescription, 
          englishPrompt: targetPrompt.englishPrompt, 
          createdAt: new Date().toISOString(),
          parentUrl: imageUrl 
        };
        await updateDoc(recordRef, {
          videoUrl: videoUrl,
          videoPrompt: targetPrompt.englishPrompt,
          imagePolishDescription: targetPrompt.polishDescription,
          visuals: arrayUnion(newMediaItem)
        });
      }

      setGeneratedVideo(videoUrl);
      setMediaHistory(prev => [
        ...prev, 
        { type: 'video', url: videoUrl, prompt: targetPrompt.polishDescription, englishPrompt: targetPrompt.englishPrompt, parentUrl: imageUrl }
      ]);
      // Update current prompt data to the target one to keep refinement possible
      setVideoPromptData(targetPrompt);
      setIsPromptMode(false);
      showSuccess('Klip wideo został wygenerowany!');
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Video generation failed:', error);
      handleApiError(error, 'Nie udało się wygenerować klipu wideo.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateImage = async (overridePrompt = null) => {
    const targetPrompt = overridePrompt || imagePromptData;
    if (!targetPrompt?.englishPrompt) return;
    setImageLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/generate-image`, 
        { 
          prompt: targetPrompt.englishPrompt, 
          aspectRatio: imageAspectRatio,
          originalImageUrl: generatedImage, // Send the current image as context!
          isAlreadyTechnical: true // Optimization: Skip redundant translation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (currentRecordId) {
        const recordRef = doc(db, 'users', user.uid, 'history', currentRecordId);
        const newMediaItem = { type: 'image', url: response.data.imageUrl, prompt: targetPrompt.polishDescription, englishPrompt: targetPrompt.englishPrompt, createdAt: new Date().toISOString() };
        await updateDoc(recordRef, {
          imageUrl: response.data.imageUrl,
          imagePrompt: targetPrompt.englishPrompt,
          imagePolishDescription: targetPrompt.polishDescription,
          visuals: arrayUnion(newMediaItem)
        });
      }

      setGeneratedImage(response.data.imageUrl);
      
      // Set V1 Anchor if this is the first generation in the session
      if (!v1VisualPrompt) {
        setV1VisualPrompt(targetPrompt);
      }

      setMediaHistory(prev => [
        ...prev, 
        { type: 'image', url: response.data.imageUrl, prompt: targetPrompt.polishDescription, englishPrompt: targetPrompt.englishPrompt }
      ]);
      // Update current prompt data to the target one to keep refinement possible
      setImagePromptData(targetPrompt);
      setIsPromptMode(false);
      showSuccess('Obraz został wygenerowany!');
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Image generation failed:', error);
      handleApiError(error, 'Nie udało się wygenerować obrazu.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleRefineText = async () => {
    if (!checkBalance('post')) return; // Same cost as original post
    if (!textFeedback.trim() || !result) return;
    setIsTextRefining(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/refine-post`, 
        { 
          originalPost: result, 
          instructions: textFeedback,
          workspaceContext: activeWorkspace ? {
            contentDirectives: activeWorkspace.contentDirectives,
            visualStyle: activeWorkspace.visualStyle
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data.content);
      setTextFeedback(''); // Wyczyść pole po udanej operacji
      showSuccess('Poprawki tekstu zostały naniesione.');
      
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
      handleApiError(error, 'Nie udało się wdrożyć poprawek tekstu.');
    } finally {
      setIsTextRefining(false);
    }
  };

  const handleRefineMedia = async (index = null) => {
    // If index is provided, we are refining a specific version from history
    const targetMedia = (index !== null && mediaHistory[index]) ? mediaHistory[index] : null;
    
    // Determine the prompt data to use
    let currentPromptData;
    if (targetMedia) {
      currentPromptData = {
        polishDescription: targetMedia.prompt,
        englishPrompt: targetMedia.englishPrompt
      };
    } else {
      currentPromptData = visualizationType === 'video' ? videoPromptData : imagePromptData;
    }

    if (!mediaFeedback.trim() || !currentPromptData) return;
    if (!checkBalance(visualizationType)) return;
    
    setIsMediaRefining(true);
    setAiDetectionLog(""); 
    try {
      const token = await user.getIdToken();
      
      const mediaUrl = targetMedia ? targetMedia.url : (visualizationType === 'video' ? generatedVideo : generatedImage);

      // Important: if v1VisualPrompt is missing (e.g. history session), use current as anchor
      const anchorPrompt = v1VisualPrompt || currentPromptData;

      const response = await axios.post(`${API_BASE_URL}/refine-image-prompt`, 
        { 
          v1PromptObject: anchorPrompt, 
          lastPromptObject: currentPromptData,
          instructions: mediaFeedback,
          mediaUrl,
          workspaceContext: activeWorkspace ? {
            visualStyle: activeWorkspace.visualStyle
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const vPlan = response.data.visualPlannedPrompt;
      if (visualizationType === 'video') {
        setVideoPromptData(vPlan);
      } else {
        setImagePromptData(vPlan);
      }
      setAiDetectionLog(vPlan.aiDetectionLog || "");
      setMediaFeedback('');
      
      if (visualizationType === 'video') {
        await handleGenerateVideo(vPlan);
      } else {
        await handleGenerateImage(vPlan);
      }
    } catch (error) {
      console.error('Refine Media Error:', error);
      handleApiError(error, 'Nie udało się przygotować poprawek dla modelu wizualnego.');
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

  const markCampaignItemCompleted = async (campaignId, itemIndex) => {
    try {
      const campaignRef = doc(db, 'users', user.uid, 'campaigns', campaignId);
      const camp = campaigns.find(c => c.id === campaignId);
      if (!camp) return;

      const newStrategy = [...camp.strategy];
      newStrategy[itemIndex] = { ...newStrategy[itemIndex], isCompleted: true };

      await updateDoc(campaignRef, {
        strategy: newStrategy
      });
      showSuccess('Zadanie kampanii oznaczone jako wykonane! ✅');
    } catch (error) {
      console.error('Error marking item completed:', error);
    }
  };

  const clearEditor = () => {
    setTopic('');
    setResult('');
    setPlannedPrompt(null);
    setPlanActive(false);
    setIsPromptMode(false);
    setImagePromptData(null);
    setVideoPromptData(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setMediaHistory([]);
    setV1VisualPrompt(null);
    setAiDetectionLog("");
    setCurrentRecordId(null);
    setActiveCampaignContext(null);
  };

  const handleReset = () => {
    if (activeCampaignContext) {
      markCampaignItemCompleted(activeCampaignContext.campaignId, activeCampaignContext.itemIndex);
    }
    clearEditor();
  };

  const handleEditHistoryItem = (item) => {
    if (item.historyType === 'campaign') {
      setActiveCampaignSession(item);
      setActiveTab('campaigns');
      setIsHistoryDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (item.historyType === 'editor') {
      setActiveEditorSession(item);
      setActiveTab('visual_editor');
      setIsHistoryDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentRecordId(item.id);
    setTopic(item.topic || '');
    setPlatform(item.platform || 'LinkedIn');
    setStyle(item.style || 'Profesjonalny');
    setResult(item.content || '');
    
    // Restore Text Post Plan
    if (item.polishPlan || item.englishPrompt) {
      setPlannedPrompt({
        polishPlan: item.polishPlan || '',
        englishPrompt: item.englishPrompt || ''
      });
      setPlanActive(true);
    } else {
      setPlannedPrompt(null);
      setPlanActive(false);
    }

    // Restore Media
    setGeneratedImage(item.imageUrl || null);
    setGeneratedVideo(item.videoUrl || null);
    
    // Determine visualization type and restore visual prompt
    const hasVideo = !!item.videoUrl;
    const hasImage = !!item.imageUrl;
    
    if (hasVideo || hasImage) {
      const activeType = hasVideo ? 'video' : 'image';
      setVisualizationType(activeType);
      
      const loadedPrompt = {
        polishDescription: item.imagePolishDescription || 'Edytowany projekt',
        englishPrompt: (hasVideo ? item.videoPrompt : item.imagePrompt) || ''
      };
      
      if (activeType === 'video') {
        setVideoPromptData(loadedPrompt);
        setImagePromptData(null);
      } else {
        setImagePromptData(loadedPrompt);
        setVideoPromptData(null);
      }

      // Restore mediaHistory from the item's visuals array (or fallback to legacy single fields)
      if (item.visuals && Array.isArray(item.visuals)) {
        setMediaHistory(item.visuals);
      } else {
        const historyMedia = [];
        if (item.videoUrl) historyMedia.push({ type: 'video', url: item.videoUrl, prompt: item.imagePolishDescription, englishPrompt: item.videoPrompt });
        if (item.imageUrl) historyMedia.push({ type: 'image', url: item.imageUrl, prompt: item.imagePolishDescription, englishPrompt: item.imagePrompt });
        setMediaHistory(historyMedia);
      }
      setIsPromptMode(false);
    } else {
      setImagePromptData(null);
      setVideoPromptData(null);
      setMediaHistory([]);
    }

    setIsHistoryDrawerOpen(false); 
    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleGenerateCampaign = async (campaignData) => {
    if (!checkBalance('campaign')) return;
    setCampaignLoading(true);
    try {
      const token = await user.getIdToken();
      await axios.post(`${API_BASE_URL}/generate-campaign`, 
        { 
          ...campaignData,
          workspaceContext: activeWorkspace ? {
            contentDirectives: activeWorkspace.contentDirectives,
            visualStyle: activeWorkspace.visualStyle
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess('Kampania marketingowa została wygenerowana!');
      // Campaign will be updated via Firestore onSnapshot
    } catch (error) {
      console.error('Campaign generation failed:', error);
      showError(error.response?.data?.error || 'Nie udało się wygenerować strategii kampanii.');
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleSelectCampaignItem = async (item, campaignId, itemIndex) => {
    if (item.isCompleted) {
      const confirmReset = window.confirm("Ten post został już wygenerowany. Czy na pewno chcesz go wygenerować ponownie? Spowoduje to usunięcie poprzedniej wersji z historii i zresetowanie obecnego tematu.");
      if (!confirmReset) return;

      // Delete old version from history
      await deleteRelatedHistoryItem(campaignId, itemIndex, item.topic, item.platform);
    }

    // Always clear the editor before loading a campaign item
    clearEditor();

    setTopic(item.topic);
    setPlatform(item.platform || 'LinkedIn');
    setActiveCampaignContext({ campaignId, itemIndex });
    // Pre-fill result with visualization idea so user knows what the context was
    setResult(`💡 Pomysł z kampanii:\n${item.topic}\n\nWizualizacja: ${item.visualIdea}\n\nUzasadnienie: ${item.rationale}\n\n--- Kliknij "Generuj Treść" aby stworzyć gotowy post. ---`);
    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefineCustomGoal = async (rawGoal) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/refine-campaign-goal`, 
        { rawGoal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Goal refinement failed:', error);
      showError('Nie udało się zredagować celu.');
      return null;
    }
  };

  const handleUpdateCampaignName = async (id, newName) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'campaigns', id), {
        name: newName
      });
    } catch (error) {
      console.error('Error updating campaign name:', error);
    }
  };

  const handleRefineProductDescription = async (rawDescription) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/refine-product-description`, 
        { rawDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.refinedDescription;
    } catch (error) {
      console.error('Product refinement failed:', error);
      showError('Nie udało się zredagować opisu.');
      return null;
    }
  };

  const handleRefineUSP = async (rawUSP) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/refine-usp`, 
        { rawUSP },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.refinedUSP;
    } catch (error) {
      console.error('USP refinement failed:', error);
      showError('Nie udało się zredagować USP.');
      return null;
    }
  };

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Skopiowano do schowka!');
  };

  const handleDeleteHistory = async (itemId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wpis z historii?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', itemId));
    } catch (error) {
      console.error('Delete failed:', error);
      showError('Nie udało się usunąć wpisu.');
    }
  };

  const deleteRelatedHistoryItem = async (campaignId, itemIndex, topic, platform) => {
    try {
      // Find matching item in history
      let historyItem = history.find(h => 
        h.campaignId === campaignId && 
        (h.campaignItemIndex !== undefined && Number(h.campaignItemIndex) === Number(itemIndex))
      );

      // Fallback if index matching fails
      if (!historyItem) {
        historyItem = history.find(h => 
          h.campaignId === campaignId && 
          h.topic === topic &&
          h.platform === platform
        );
      }

      if (historyItem) {
        await deleteDoc(doc(db, 'users', user.uid, 'history', historyItem.id));
      }
    } catch (err) {
      console.error("Error deleting related history item:", err);
    }
  };

  const handleResetCampaignItem = async (campaignId, itemIndex) => {
    if (!window.confirm('Czy na pewno chcesz usunąć status wykonania dla tego posta? Powiązany wpis zniknie również z historii.')) return;
    try {
      const campaignRef = doc(db, 'users', user.uid, 'campaigns', campaignId);
      const camp = campaigns.find(c => c.id === campaignId);
      if (!camp) return;

      const item = camp.strategy[itemIndex];
      const newStrategy = [...camp.strategy];
      newStrategy[itemIndex] = { ...newStrategy[itemIndex], isCompleted: false };

      await updateDoc(campaignRef, {
        strategy: newStrategy
      });

      // Also delete from history
      await deleteRelatedHistoryItem(campaignId, itemIndex, item.topic, item.platform);

      showInfo('Status posta został zresetowany, a wpis usunięty z historii.');
    } catch (error) {
      console.error('Error resetting item status:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę kampanię?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'campaigns', campaignId));
      showSuccess('Kampania została usunięta.');
    } catch (error) {
      console.error('Delete campaign failed:', error);
      showError('Nie udało się usunąć kampanii.');
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
      <StatusHeader 
        user={user}
        perc={perc}
        showTooltip={showTooltip}
        setShowTooltip={setShowTooltip}
        setForcePaymentView={setForcePaymentView}
        isDark={isDark}
        setIsDark={setIsDark}
        handleLogout={handleLogout}
        onShowHelp={() => setShowHelp(true)}
        deferredPrompt={deferredPrompt}
        setDeferredPrompt={setDeferredPrompt}
        activeWorkspace={activeWorkspace}
        setActiveTab={setActiveTab}
      />

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <GeneratorTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeWorkspace={activeWorkspace}
        showAdvanced={showAdvancedMenu}
        setShowAdvanced={setShowAdvancedMenu}
      />

      <HistoryDrawer 
        isHistoryDrawerOpen={isHistoryDrawerOpen}
        toggleHistoryDrawer={toggleHistoryDrawer}
        history={[
          ...history.map(h => ({ historyType: 'post', ...h })),
          ...campaigns.map(c => ({ 
            ...c, 
            historyType: 'campaign', 
            topic: c.name, 
            platform: 'Kampania',
            content: `Strategia kampanii marketingowej: ${c.goal}. Kliknij edytuj, aby zobaczyć szczegóły w zakładce Kampanie.`
          }))
        ].sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
          return timeB - timeA;
        })}
        expandedHistoryItems={expandedHistoryItems}
        toggleAllHistory={(expand) => {
          if (expand) {
            const allIds = {};
            history.forEach(h => allIds[h.id] = true);
            campaigns.forEach(c => allIds[c.id] = true);
            setExpandedHistoryItems(allIds);
          } else {
            setExpandedHistoryItems({});
          }
        }}
        toggleHistoryItem={toggleHistoryItem}
        copyToClipboard={copyToClipboard}
        handleEditHistoryItem={handleEditHistoryItem}
        handleDeleteHistory={(id, type) => {
          if (type === 'campaign') {
            handleDeleteCampaign(id);
          } else {
            handleDeleteHistory(id);
          }
        }}
      />

      {/* Dashboard Grid (now Centered Layout) */}
      <div className="dashboard-grid" style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        alignItems: 'stretch'
      }}>
        {activeTab === 'generator' && (
          <>
            <PostGenerator 
              activeWorkspace={activeWorkspace}
              topic={topic}
              setTopic={setTopic}
              style={style}
              setStyle={setStyle}
              platform={platform}
              setPlatform={setPlatform}
              isPlanning={isPlanning}
              handleGeneratePlan={handleGeneratePlan}
              handleGenerate={handleGenerate}
              planActive={planActive}
              plannedPrompt={plannedPrompt}
              setPlannedPrompt={setPlannedPrompt}
              handleSyncPrompt={handleSyncPrompt}
              isSyncing={isSyncing}
              loading={loading}
              balance={balance}
              isReadOnly={isReadOnly}
              customStyles={customStyles}
              handleAddCustomStyle={handleAddCustomStyle}
              handleDeleteCustomStyle={handleDeleteCustomStyle}
              setForcePaymentView={setForcePaymentView}
              handleReset={handleReset}
              onShowHelp={() => setShowHelp(true)}
            />

            {loading && (
              <div id="text-loading-placeholder" className="glass" style={{ 
                padding: '3rem 2rem', 
                borderRadius: '25px', 
                border: '2px dashed var(--color-primary)', 
                marginTop: '1.5rem',
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
                    auto_awesome
                  </span>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: '800' }}>
                    Generowanie treści posta...
                  </h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7, maxWidth: '300px' }}>
                    Model AI analizuje Twoje wytyczne i tworzy idealny przekaz.
                  </p>
                </div>
              </div>
            )}

            <div ref={resultSectionRef}>
              <ResultSection 
                result={result}
                setResult={setResult}
                copyToClipboard={copyToClipboard}
                textFeedback={textFeedback}
                setTextFeedback={setTextFeedback}
                isTextRefining={isTextRefining}
                handleRefineText={handleRefineText}
                isPromptMode={isPromptMode}
                setIsPromptMode={setIsPromptMode}
                imageAspectRatio={imageAspectRatio}
                setImageAspectRatio={setImageAspectRatio}
                activeImageLabel={activeImageLabel}
                setActiveImageLabel={setActiveImageLabel}
                imageLoading={imageLoading}
                isReadOnly={isReadOnly}
                visualizationType={visualizationType}
                isAutoGenerating={isAutoGenerating}
                handleGeneratePrompt={handleGeneratePrompt}
                handleGenerateVideo={handleGenerateVideo}
                videoAspectRatio={videoAspectRatio}
                setVideoAspectRatio={setVideoAspectRatio}
                activeVideoLabel={activeVideoLabel}
                setActiveVideoLabel={setActiveVideoLabel}
                isVisualSyncing={isVisualSyncing}
                handleSyncVisualPrompt={handleSyncVisualPrompt}
                handleGenerateImage={handleGenerateImage}
                handleAnimateImage={handleAnimateImage}
                generatedImage={generatedImage}
                setGeneratedImage={setGeneratedImage}
                generatedVideo={generatedVideo}
                setGeneratedVideo={setGeneratedVideo}
                mediaFeedback={mediaFeedback}
                setMediaFeedback={setMediaFeedback}
                isMediaRefining={isMediaRefining}
                handleRefineMedia={handleRefineMedia}
                imagePromptData={imagePromptData}
                setImagePromptData={setImagePromptData}
                videoPromptData={videoPromptData}
                setVideoPromptData={setVideoPromptData}
                mediaHistory={mediaHistory}
                setMediaHistory={setMediaHistory}
                aiDetectionLog={aiDetectionLog}
                setAiDetectionLog={setAiDetectionLog}
                API_BASE_URL={API_BASE_URL}
                handleReset={handleReset}
              />
            </div>
          </>
        )}

        {activeTab === 'workspaces' && (
          <WorkspaceManager 
            activeWorkspace={activeWorkspace}
            workspaces={workspaces}
            showWorkspaceForm={showWorkspaceForm}
            setShowWorkspaceForm={setShowWorkspaceForm}
            handleAddWorkspace={handleAddWorkspace}
            newWorkspace={newWorkspace}
            setNewWorkspace={setNewWorkspace}
            handleActivateWorkspace={toggleWorkspace}
            handleDeleteWorkspace={handleDeleteWorkspace}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignPlanner 
            handleGenerateCampaign={handleGenerateCampaign}
            handleRefineCustomGoal={handleRefineCustomGoal}
            handleUpdateCampaignName={handleUpdateCampaignName}
            handleRefineProductDescription={handleRefineProductDescription}
            handleRefineUSP={handleRefineUSP}
            loading={campaignLoading}
            campaigns={campaigns}
            handleSelectCampaignItem={handleSelectCampaignItem}
            handleResetCampaignItem={handleResetCampaignItem}
            handleEditHistoryItem={handleEditHistoryItem}
            history={history}
            balance={balance}
            isReadOnly={isReadOnly}
            initialSession={activeCampaignSession}
            onClearSession={() => setActiveCampaignSession(null)}
          />
        )}

        {activeTab === 'visual_editor' && (
          <VisualEditor 
            balance={balance}
            isReadOnly={isReadOnly}
            activeWorkspace={activeWorkspace}
            handleApiError={handleApiError}
            API_BASE_URL={API_BASE_URL}
            initialSession={activeEditorSession}
            onClearSession={() => setActiveEditorSession(null)}
            pricing={pricing}
          />
        )}
      </div>

      {/* Floating Scroll Navigation */}
      <button 
        onClick={() => scrollToPosition(showScrollTop ? 'up' : 'down')}
        className="glass"
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          right: '2.5rem',
          width: '55px',
          height: '55px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'var(--shadow-lg)',
          background: showScrollTop ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
          color: showScrollTop ? '#fff' : 'var(--text-main)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          opacity: (showScrollTop || isAtTop) ? 1 : 0,
          pointerEvents: (showScrollTop || isAtTop) ? 'auto' : 'none',
          transform: (showScrollTop || isAtTop) ? 'scale(1)' : 'scale(0.8)'
        }}
      >
        <span className="material-icons" style={{ 
          fontSize: '1.8rem',
          transform: showScrollTop ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.4s ease'
        }}>
          arrow_upward
        </span>
      </button>
  </div>
  );
};

export default GeneratorPage;
