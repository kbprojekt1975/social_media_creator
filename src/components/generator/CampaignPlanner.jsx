import React, { useState, useEffect } from 'react';

const parseBold = (str) => {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} style={{ fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) return <h5 key={i} style={{ margin: '1.2rem 0 0.8rem', color: 'var(--color-primary)', fontSize: '1.3rem' }}>{parseBold(trimmed.replace('### ', ''))}</h5>;
    if (trimmed.startsWith('#### ')) return <h6 key={i} style={{ margin: '1.2rem 0 0.8rem', color: 'var(--color-primary)', fontSize: '1.2rem' }}>{parseBold(trimmed.replace('#### ', ''))}</h6>;
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', lineHeight: '1.6' }}>{parseBold(trimmed.substring(2))}</li>;
    if (trimmed === '' || trimmed === '---') return <br key={i} />;
    return <div key={i} style={{ marginBottom: '0.8rem', lineHeight: '1.6' }}>{parseBold(line)}</div>;
  });
};

const CampaignPlanner = ({ 
  handleGenerateCampaign, 
  handleRefineCustomGoal,
  handleUpdateCampaignName,
  handleRefineProductDescription,
  handleRefineUSP,
  loading, 
  campaigns, 
  handleSelectCampaignItem,
  handleResetCampaignItem,
  handleEditHistoryItem,
  history,
  balance,
  isReadOnly,
  initialSession,
  onClearSession,
  handleGetPublishingSchedule,
  handleSavePublishingSchedule,
  handleSaveDraftCampaign
}) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState(['Budowanie świadomości marki']);
  const [customGoals, setCustomGoals] = useState([]);
  const [customGoalLabel, setCustomGoalLabel] = useState('');
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoalDescription, setCustomGoalDescription] = useState('');
  const [isRefiningGoal, setIsRefiningGoal] = useState(false);
  const [isRefiningProduct, setIsRefiningProduct] = useState(false);
  const [isRefiningUSP, setIsRefiningUSP] = useState(false);
  const [isRefiningAudience, setIsRefiningAudience] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [hideHistory, setHideHistory] = useState(false);
  const [showCampaignHelp, setShowCampaignHelp] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Publishing Schedule states
  const [publishingSchedule, setPublishingSchedule] = useState({});
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState({});
  const [expandedSchedules, setExpandedSchedules] = useState({});

  const toggleSchedule = (id) => {
    setExpandedSchedules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [expandedCampaigns, setExpandedCampaigns] = useState({});

  const toggleCampaign = (id) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (initialSession) {
      setName(initialSession.name || '');
      setSelectedGoals(initialSession.goal ? initialSession.goal.split(', ') : ['Budowanie świadomości marki']);
      setProductDescription(initialSession.productDescription || '');
      setUsp(initialSession.usp || '');
      setDuration(initialSession.duration || 7);
      setSelectedPlatforms(initialSession.platforms || ['LinkedIn']);
      setIntensity(initialSession.intensity || 'Steady');
      setToneOfVoice(initialSession.toneOfVoice || 'Profesjonalny');
      setMainCTA(initialSession.mainCTA || '');
      setTargetAudience(initialSession.targetAudience || '');
      setProblemSolved(initialSession.problemSolved || '');
      setHideHistory(false);
    }
  }, [initialSession]);

  // New Strategy States
  const [intensity, setIntensity] = useState('Steady'); // Steady, Teaser-Launch, Sprint
  const [toneOfVoice, setToneOfVoice] = useState('Profesjonalny');
  const [mainCTA, setMainCTA] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [problemSolved, setProblemSolved] = useState('');

  const handleRefineProduct = async () => {
    if (!productDescription) return;
    setIsRefiningProduct(true);
    try {
      const refined = await handleRefineProductDescription(productDescription);
      if (refined) setProductDescription(refined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefiningProduct(false);
    }
  };

  const handleRefineUSPHandler = async () => {
    if (!usp) return;
    setIsRefiningUSP(true);
    try {
      const refined = await handleRefineUSP(usp);
      if (refined) setUsp(refined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefiningUSP(false);
    }
  };

  const defaultGoals = [
    { id: 'awareness', label: 'Świadomość marki', icon: 'lightbulb' },
    { id: 'sales', label: 'Sprzedaż produktu', icon: 'shopping_cart' },
    { id: 'leads', label: 'Pozyskanie leadów', icon: 'person_add' },
    { id: 'engagement', label: 'Zaangażowanie', icon: 'forum' }
  ];

  const handleAddCustomGoal = (label, name, description = '') => {
    const newGoal = {
      id: `custom-${Date.now()}`,
      label: label,
      description: `${name}${description ? ` - ${description}` : ''}`,
      icon: 'edit_note'
    };
    setCustomGoals([...customGoals, newGoal]);
    setSelectedGoals([...selectedGoals, label]);
    setCustomGoalLabel('');
    setCustomGoalName('');
    setCustomGoalDescription('');
    setShowCustomForm(false);
  };

  const handleRefineGoal = async () => {
    if (!customGoalName) return;
    setIsRefiningGoal(true);
    try {
      const refined = await handleRefineCustomGoal(customGoalName);
      if (refined) {
        handleAddCustomGoal(refined.refinedGoal, refined.refinedGoal, refined.description);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefiningGoal(false);
    }
  };

  const toggleGoal = (label) => {
    if (selectedGoals.includes(label)) {
      setSelectedGoals(selectedGoals.filter(g => g !== label));
    } else {
      setSelectedGoals([...selectedGoals, label]);
    }
  };

  const platformsList = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter / X'];

  const [productDescription, setProductDescription] = useState('');
  const [usp, setUsp] = useState('');
  const [duration, setDuration] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['LinkedIn']);

  const togglePlatform = (p) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Wypełnij pole';
    if (!productDescription.trim()) newErrors.productDescription = 'Wypełnij pole';
    if (!targetAudience.trim()) newErrors.targetAudience = 'Wypełnij pole';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setHideHistory(false);
    const finalGoalsString = selectedGoals.join(', ');

    handleGenerateCampaign({
      name,
      goal: finalGoalsString,
      productDescription,
      usp,
      duration,
      platforms: selectedPlatforms,
      intensity,
      toneOfVoice,
      mainCTA,
      targetAudience,
      problemSolved
    });
  };

  const isFormInvalid = selectedGoals.length === 0;
  const isDraftSavable = name || productDescription;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '8px', background: 'var(--bg-white)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFormCollapsed ? '0' : '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Planer Kampanii</h2>
            {!isFormCollapsed && (
              <button
                type="button"
                onClick={() => setShowCampaignHelp(!showCampaignHelp)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                title="Jak działa Planer Kampanii?"
              >
                <span className="material-icons" style={{ fontSize: '1.6rem' }}>info</span>
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isFormCollapsed && (name || productDescription || initialSession) && (
              <button 
                onClick={() => {
                  setName('');
                  setProductDescription('');
                  setUsp('');
                  setProblemSolved('');
                  setTargetAudience('');
                  setCustomGoals([]);
                  setSelectedGoals(['Budowanie świadomości marki']);
                  setDuration(7);
                  setSelectedPlatforms(['LinkedIn']);
                  setIntensity('Steady');
                  setToneOfVoice('Profesjonalny');
                  setMainCTA('');
                  setHideHistory(false);
                  if (onClearSession) onClearSession();
                }}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', borderRadius: '3px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>add_circle_outline</span>
                Nowa kampania
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setIsFormCollapsed(!isFormCollapsed)}
              style={{ 
                background: 'rgba(66, 133, 244, 0.1)', 
                border: 'none', 
                color: 'var(--color-primary)', 
                borderRadius: '50%', 
                width: '36px', 
                height: '36px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              title={isFormCollapsed ? "Rozwiń formularz" : "Zwiń formularz"}
            >
              <span className="material-icons" style={{ 
                transition: 'transform 0.3s', 
                transform: isFormCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' 
              }}>
                expand_more
              </span>
            </button>
          </div>
        </div>
        
        {!isFormCollapsed && showCampaignHelp && (
          <div style={{ padding: '1.5rem', background: 'rgba(66, 133, 244, 0.05)', borderRadius: '8px', border: '1px solid rgba(66, 133, 244, 0.2)', marginBottom: '2rem', fontSize: '1.125rem', color: 'var(--text-main)', lineHeight: '1.6', animation: 'fadeIn 0.3s ease-out' }}>
            <h4 style={{ color: 'var(--color-primary)', marginTop: 0, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
              <span className="material-icons" style={{ fontSize: '1.5rem' }}>lightbulb</span>
              Dlaczego warto planować kampanię?
            </h4>
            <p style={{ marginBottom: '0.8rem' }}><strong>Zamiast wymyślać posty z dnia na dzień</strong>, Planer pozwala Ci ułożyć sprytną strategię. To tak, jakbyś prowadził klienta za rękę – od zaciekawienia, aż po zakup.</p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>🎯 Jasny Cel:</strong> Określasz, co chcesz osiągnąć (np. sprzedaż, edukacja). AI zaplanuje posty tak, aby krok po kroku budować u klienta potrzebę i dążyć prosto do Twojego celu.</li>
              <li><strong>📅 Gotowy Harmonogram:</strong> Ty podajesz tylko swoją ofertę i czas trwania. Sztuczna inteligencja przygotuje listę konkretnych, powiązanych ze sobą tematów na każdy dzień.</li>
              <li><strong>💰 Lepsza Konwersja (Sprzedaż):</strong> Wyobraź sobie film – ma wstęp, rozwinięcie i finał. Podobnie w marketingu, seria spójnych postów działa o wiele lepiej i bardziej przekonuje do zakupu niż pojedyncze wrzutki!</li>
            </ul>
          </div>
        )}

        {!isFormCollapsed && (
          <>
            <form onSubmit={onSubmit}>
          {/* Section A: Fundamenty */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons">foundations</span> Sekcja A: Fundamenty
            </h4>
            
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Nazwa kampanii</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                placeholder="np. Wyprzedaż letnia / Premiera nowej marki"
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: 'var(--bg-app)', 
                  border: errors.name ? '2px solid #ff4d4d' : '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  color: 'var(--text-main)',
                  boxShadow: errors.name ? '0 0 10px rgba(255, 77, 77, 0.4)' : 'none',
                  outline: 'none'
                }}
              />
              {errors.name && <span style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block', fontWeight: '600' }}>{errors.name}</span>}
            </div>

            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Cel kampanii (możesz wybrać kilka)</label>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {/* Default Goals */}
              {defaultGoals.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.label)}
                  className={`chip ${selectedGoals.includes(g.label) ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>{g.icon}</span>
                  {g.label}
                </button>
              ))}

              {/* User Created Custom Goals */}
              {customGoals.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.label)}
                  className={`chip ${selectedGoals.includes(g.label) ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--color-primary)' }}
                  title={g.description}
                >
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>{g.icon}</span>
                  {g.label}
                </button>
              ))}

              {/* Toggle Custom Form Button */}
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className={`chip ${showCustomForm ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px dashed var(--border-color)', background: 'transparent' }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>{showCustomForm ? 'close' : 'add'}</span>
                {showCustomForm ? 'Zamknij' : 'Własny cel'}
              </button>
            </div>

            {showCustomForm && (
              <div className="glass" style={{ padding: '1.5rem', borderRadius: '5px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.8rem', alignItems: 'end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nazwa (na przycisku)</label>
                    <input 
                      type="text"
                      value={customGoalLabel}
                      onChange={(e) => setCustomGoalLabel(e.target.value)}
                      placeholder="np. Retencja"
                      style={{ padding: '0.8rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Szczegółowy opis celu (dla AI)</label>
                    <input 
                      type="text"
                      value={customGoalName}
                      onChange={(e) => setCustomGoalName(e.target.value)}
                      placeholder="np. Zwiększenie retencji klientów o 20%"
                      style={{ padding: '0.8rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button"
                      onClick={handleRefineGoal}
                      disabled={isRefiningGoal || !customGoalName}
                      className="btn-secondary"
                      style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                      title="Ulepsz opis z AI"
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                        {isRefiningGoal ? 'sync' : 'auto_fix_high'}
                      </span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleAddCustomGoal(customGoalLabel || customGoalName, customGoalName)}
                      disabled={!customGoalName}
                      className="btn-secondary"
                      style={{ padding: '0.8rem', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Zatwierdź"
                    >
                      <span className="material-icons" style={{ color: '#4ade80' }}>check_circle</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Oferta */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons">local_offer</span> Sekcja B: Oferta
            </h4>
            
            <div className="input-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Opisz swój produkt/usługę</label>
              <textarea 
                value={productDescription}
                onChange={(e) => {
                  setProductDescription(e.target.value);
                  if (errors.productDescription) setErrors(prev => ({ ...prev, productDescription: null }));
                }}
                placeholder="Opisz swoją usługę tak, jakbyś mówił do klienta..."
                style={{ 
                  width: '100%', 
                  minHeight: '120px', 
                  padding: '1rem', 
                  paddingBottom: '3.5rem', 
                  background: 'var(--bg-app)', 
                  border: errors.productDescription ? '2px solid #ff4d4d' : '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  color: 'var(--text-main)', 
                  resize: 'vertical',
                  boxShadow: errors.productDescription ? '0 0 10px rgba(255, 77, 77, 0.4)' : 'none',
                  outline: 'none'
                }}
              />
              {errors.productDescription && <span style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block', fontWeight: '600' }}>{errors.productDescription}</span>}
              <button
                type="button"
                onClick={handleRefineProduct}
                disabled={isRefiningProduct || !productDescription}
                className="btn-secondary"
                style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>{isRefiningProduct ? 'sync' : 'auto_fix_high'}</span>
                AI Weryfikacja
              </button>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Unikalna wartość (USP)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text"
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="np. Jedyna platforma z dostępem do ekspertów 24/7"
                  style={{ width: '100%', padding: '1rem', paddingRight: '120px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)' }}
                />
                <button
                  type="button"
                  onClick={handleRefineUSPHandler}
                  disabled={isRefiningUSP || !usp}
                  className="btn-secondary"
                  style={{ position: 'absolute', top: '50%', right: '5px', transform: 'translateY(-50%)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <span className="material-icons" style={{ fontSize: '0.9rem' }}>{isRefiningUSP ? 'sync' : 'auto_fix_high'}</span>
                  AI
                </button>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Jaki problem rozwiązujesz? (Język korzyści)</label>
              <input 
                type="text"
                value={problemSolved}
                onChange={(e) => setProblemSolved(e.target.value)}
                placeholder="np. Brak czasu na regularne publikowanie postów"
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          {/* Section D: Grupa Docelowa (NEW) */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons">groups</span> Sekcja D: Grupa Docelowa (Persona)
            </h4>
            <div className="input-group" style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Do kogo mówimy? (Twoja Persona)</label>
              <textarea 
                value={targetAudience}
                onChange={(e) => {
                  setTargetAudience(e.target.value);
                  if (errors.targetAudience) setErrors(prev => ({ ...prev, targetAudience: null }));
                }}
                placeholder="np. Właściciele małych firm e-commerce, szukający sposobów na automatyzację marketingu."
                style={{ 
                  width: '100%', 
                  minHeight: '80px', 
                  padding: '1rem', 
                  paddingBottom: '3.5rem', 
                  background: 'var(--bg-app)', 
                  border: errors.targetAudience ? '2px solid #ff4d4d' : '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  color: 'var(--text-main)', 
                  resize: 'vertical',
                  boxShadow: errors.targetAudience ? '0 0 10px rgba(255, 77, 77, 0.4)' : 'none',
                  outline: 'none'
                }}
              />
              {errors.targetAudience && <span style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block', fontWeight: '600' }}>{errors.targetAudience}</span>}
              <button
                type="button"
                onClick={async () => {
                  if (!targetAudience) return;
                  setIsRefiningAudience(true);
                  try {
                    const refined = await handleRefineProductDescription(`OPIS PERSONY: ${targetAudience}`);
                    if (refined) setTargetAudience(refined);
                  } finally {
                    setIsRefiningAudience(false);
                  }
                }}
                disabled={isRefiningAudience || !targetAudience}
                className="btn-secondary"
                style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>{isRefiningAudience ? 'sync' : 'auto_fix_high'}</span>
                AI Weryfikacja
              </button>
            </div>
          </div>

          {/* Section C: Strategia */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons">trending_up</span> Sekcja C: Strategia
            </h4>

            <div className="campaign-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Czas trwania (dni)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="range" 
                    min="3" 
                    max="30" 
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontWeight: '600', minWidth: '3rem' }}>{duration} dni</span>
                </div>
              </div>

              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Intensywność (Faza)</label>
                <select 
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)' }}
                >
                  <option value="Steady">Steady (Stały szum)</option>
                  <option value="Teaser-Launch">Teaser-Launch (Budowanie napięcia)</option>
                  <option value="Sprint">Sprint (Agresywna sprzedaż)</option>
                </select>
              </div>
            </div>

            <div className="campaign-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Ton marki (Tone of Voice)</label>
                <select 
                  value={toneOfVoice}
                  onChange={(e) => setToneOfVoice(e.target.value)}
                  style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)' }}
                >
                  <option value="Profesjonalny">Profesjonalny</option>
                  <option value="Luźny">Luźny / Przyjacielski</option>
                  <option value="Ekspercki">Ekspercki / Techniczny</option>
                  <option value="Zabawny">Zabawny / Ironiczny</option>
                </select>
              </div>

              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Główne Call to Action (CTA)</label>
                <input 
                  type="text"
                  value={mainCTA}
                  onChange={(e) => setMainCTA(e.target.value)}
                  placeholder="np. Zapis na darmową lekcję"
                  style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Platformy docelowe</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {platformsList.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-app)', padding: '0.6rem 1.2rem', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPlatforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{p}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || balance < 25000 || isReadOnly || isFormInvalid} 
            style={{ width: '100%', padding: '1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1.1rem' }}
          >
            {loading ? 'Planowanie strategii...' : (
              <>
                <span className="material-icons">auto_awesome</span>
                Generuj strategię kampanii
              </>
            )}
            {loading && <span className="spinner"></span>}
          </button>
        </form>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => {
              const finalGoalsString = selectedGoals.join(', ');
              handleSaveDraftCampaign({
                name: name || 'Bez nazwy',
                goal: finalGoalsString,
                productDescription,
                usp,
                duration,
                platforms: selectedPlatforms,
                intensity,
                toneOfVoice,
                mainCTA,
                targetAudience,
                problemSolved
              });
              
              // Clear form after save
              setName('');
              setProductDescription('');
              setUsp('');
              setProblemSolved('');
              setTargetAudience('');
              setCustomGoals([]);
              setSelectedGoals(['Budowanie świadomości marki']);
              setDuration(7);
              setSelectedPlatforms(['LinkedIn']);
              setIntensity('Steady');
              setToneOfVoice('Profesjonalny');
              setMainCTA('');
              setHideHistory(false);
              if (onClearSession) onClearSession();
            }}
            disabled={!isDraftSavable}
            className="btn-secondary"
            style={{ padding: '0.8rem 2rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', cursor: isDraftSavable ? 'pointer' : 'not-allowed', fontWeight: '600', opacity: isDraftSavable ? 1 : 0.5 }}
          >
            <span className="material-icons">save</span>
            Zapisz jako wersję roboczą
          </button>
        </div>
          </>
        )}
      </div>

      {/* Campaigns History / Results */}
      {campaigns && campaigns.length > 0 && !hideHistory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: '1rem 0 0.5rem 0', fontWeight: '700' }}>Twoje Strategie</h3>
          {campaigns.map(campaign => (
            <div key={campaign.id} className="glass" style={{ padding: '2rem', borderRadius: '2px', background: 'var(--bg-white)', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  {editingId === campaign.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => {
                          handleUpdateCampaignName(campaign.id, editName);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCampaignName(campaign.id, editName);
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-app)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '1.2rem', width: '100%' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{campaign.name}</h4>
                      {campaign.status === 'draft' && (
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', background: 'var(--color-primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Wersja robocza
                        </span>
                      )}
                      <button 
                        onClick={() => {
                          setEditingId(campaign.id);
                          setEditName(campaign.name);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        title="Zmień nazwę"
                      >
                        <span className="material-icons" style={{ fontSize: '1.1rem' }}>edit</span>
                      </button>
                    </div>
                  )}
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cel: {campaign.goal} | {campaign.duration} dni</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={async () => {
                      // Check if already generating
                      if (isGeneratingSchedule[campaign.id]) return;

                      // If we already have it in state, we just toggle UI (locally)
                      // but usually we want to toggle the block visibility
                      if (publishingSchedule[campaign.id] || campaign.publishingSchedule) {
                        // If it's already there, the button could toggle "collapsed" state of that specific block
                        toggleSchedule(campaign.id);
                        return;
                      }
                      
                      setIsGeneratingSchedule(prev => ({ ...prev, [campaign.id]: true }));
                      const result = await handleGetPublishingSchedule(campaign);
                      if (result) {
                        // 1. Save to local state for immediate feedback
                        setPublishingSchedule(prev => ({ ...prev, [campaign.id]: result }));
                        // 2. Save to Firestore for permanence
                        await handleSavePublishingSchedule(campaign.id, result);
                        // 3. Ensure campaign and schedule are expanded
                        setExpandedCampaigns(prev => ({ ...prev, [campaign.id]: true }));
                        setExpandedSchedules(prev => ({ ...prev, [campaign.id]: true }));
                      }
                      setIsGeneratingSchedule(prev => ({ ...prev, [campaign.id]: false }));
                    }}
                    disabled={isGeneratingSchedule[campaign.id]}
                    className="btn-secondary"
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.85rem', 
                      borderColor: (publishingSchedule[campaign.id] || campaign.publishingSchedule) ? 'var(--color-primary)' : 'var(--border-color)', 
                      color: (publishingSchedule[campaign.id] || campaign.publishingSchedule) ? 'var(--color-primary)' : 'var(--text-main)' 
                    }}
                    title="Sprawdź optymalne godziny publikacji"
                  >
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                      {isGeneratingSchedule[campaign.id] ? 'sync' : 'schedule'}
                    </span>
                    {isGeneratingSchedule[campaign.id] ? 'Analizowanie...' : 'Kiedy publikować?'}
                  </button>
                  <span className="material-icons" style={{ color: 'var(--color-primary)' }}>verified</span>
                  <button 
                    onClick={() => toggleCampaign(campaign.id)}
                    style={{ 
                      background: 'rgba(66, 133, 244, 0.1)', 
                      border: 'none', 
                      color: 'var(--color-primary)', 
                      borderRadius: '3px', 
                      padding: '0.4rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={expandedCampaigns[campaign.id] ? "Zwiń strategię" : "Rozwiń strategię"}
                  >
                    <span className="material-icons" style={{ transition: 'transform 0.3s', transform: expandedCampaigns[campaign.id] ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {(publishingSchedule[campaign.id] || campaign.publishingSchedule) && (
                <div style={{ background: 'rgba(66, 133, 244, 0.05)', borderRadius: '8px', border: '1px solid var(--color-primary)', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease-out', overflow: 'hidden' }}>
                  <div 
                    onClick={() => toggleSchedule(campaign.id)}
                    style={{ 
                      padding: '1rem 1.5rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      borderBottom: collapsedSchedules[campaign.id] ? 'none' : '1px solid rgba(0, 163, 193, 0.1)'
                    }}
                  >
                    <h4 style={{ color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                      <span className="material-icons" style={{ fontSize: '1.3rem' }}>insights</span>
                      Rekomendacja czasu publikacji (AI)
                    </h4>
                    <span className="material-icons" style={{ color: 'var(--color-primary)', transition: 'transform 0.3s', transform: expandedSchedules[campaign.id] ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                      expand_more
                    </span>
                  </div>
                  
                  {expandedSchedules[campaign.id] && (
                    <div style={{ padding: '1.5rem', fontSize: '1.2rem', color: 'var(--text-main)', lineHeight: '1.7' }}>
                      {renderMarkdown(publishingSchedule[campaign.id] || campaign.publishingSchedule)}
                    </div>
                  )}
                </div>
              )}

              {expandedCampaigns[campaign.id] && campaign.strategy && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {campaign.strategy.map((item, idx) => (
                  <div key={idx} className="campaign-item-card" style={{ padding: '1.2rem', background: 'var(--bg-app)', borderRadius: '1px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--color-primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>{item.day}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>{item.platform.toUpperCase()}</span>
                      </div>
                      <h5 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem' }}>{item.topic}</h5>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Wizualizacja: {item.visualIdea}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {item.isCompleted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                          <span className="material-icons" style={{ color: '#10b981', fontSize: '1.5rem' }} title="Ten post został już wygenerowany">check_circle</span>
                          
                          {/* Button to open the generated post from history */}
                          <button 
                            onClick={() => {
                              // Try robust matching: first by campaignId AND index, then fallback to campaignId AND topic/platform
                              let historyItem = history.find(h => 
                                h.campaignId === campaign.id && 
                                (h.campaignItemIndex !== undefined && Number(h.campaignItemIndex) === Number(idx))
                              );

                              // Fallback if index matching fails (e.g. for older posts)
                              if (!historyItem) {
                                historyItem = history.find(h => 
                                  h.campaignId === campaign.id && 
                                  h.topic === item.topic &&
                                  h.platform === item.platform
                                );
                              }

                              if (historyItem) {
                                handleEditHistoryItem(historyItem);
                              } else {
                                alert('Nie znaleziono zapisu tego posta w historii.');
                              }
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.4rem', minWidth: 'auto', borderRadius: '10px', color: 'var(--color-primary)' }}
                            title="Otwórz wygenerowany post"
                          >
                            <span className="material-icons" style={{ fontSize: '1.2rem' }}>visibility</span>
                          </button>

                          {/* Button to reset completion status */}
                          <button 
                            onClick={() => {
                              if (window.confirm('Czy na pewno chcesz usunąć ten wygenerowany post z historii? Tej operacji nie można cofnąć.')) {
                                handleResetCampaignItem(campaign.id, idx);
                              }
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.4rem', minWidth: 'auto', borderRadius: '3px', color: '#ef4444' }}
                            title="Usuń wygenerowaną treść"
                          >
                            <span className="material-icons" style={{ fontSize: '1.2rem' }}>delete_outline</span>
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleSelectCampaignItem(item, campaign.id, idx)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: item.isCompleted ? '#10b981' : 'var(--border-color)' }}
                      >
                        <span className="material-icons" style={{ fontSize: '1rem' }}>{item.isCompleted ? 'refresh' : 'bolt'}</span>
                        {item.isCompleted ? 'Generuj ponownie' : 'Generuj Post'}
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignPlanner;
