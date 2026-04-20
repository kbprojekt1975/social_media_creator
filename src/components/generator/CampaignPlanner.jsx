import React, { useState } from 'react';

const CampaignPlanner = ({ 
  handleGenerateCampaign, 
  handleRefineCustomGoal,
  loading, 
  campaigns, 
  handleSelectCampaignItem,
  balance,
  isReadOnly 
}) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Budowanie świadomości marki');
  const [productDescription, setProductDescription] = useState('');
  const [usp, setUsp] = useState('');
  const [duration, setDuration] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['LinkedIn']);
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoalDescription, setCustomGoalDescription] = useState('');
  const [isRefiningGoal, setIsRefiningGoal] = useState(false);

  const goals = [
    { id: 'awareness', label: 'Świadomość marki', icon: 'lightbulb' },
    { id: 'sales', label: 'Sprzedaż produktu', icon: 'shopping_cart' },
    { id: 'leads', label: 'Pozyskanie leadów', icon: 'person_add' },
    { id: 'engagement', label: 'Zaangażowanie', icon: 'forum' },
    { id: 'custom', label: 'Własny cel', icon: 'edit_note' }
  ];

  const handleRefineGoal = async () => {
    if (!customGoalName) return;
    setIsRefiningGoal(true);
    try {
      const refined = await handleRefineCustomGoal(customGoalName);
      if (refined) {
        setCustomGoalName(refined.refinedGoal);
        setCustomGoalDescription(refined.description);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefiningGoal(false);
    }
  };

  const platformsList = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter / X'];

  const togglePlatform = (p) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const finalGoal = goal === 'Własny cel' 
      ? `${customGoalName}${customGoalDescription ? ` - ${customGoalDescription}` : ''}`
      : goal;

    handleGenerateCampaign({
      name,
      goal: finalGoal,
      productDescription,
      usp,
      duration,
      platforms: selectedPlatforms
    });
  };

  const isFormInvalid = !name || !productDescription || (goal === 'Własny cel' && !customGoalName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '30px', background: 'var(--bg-white)', border: 'none' }}>
        <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.8rem', fontWeight: '700' }}>Planer Kampanii</h2>
        
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
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Premiera kursu Moto-Lady 2024"
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '15px', color: 'var(--text-main)' }}
              />
            </div>

            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Cel kampanii</label>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {goals.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.label)}
                  className={`chip ${goal === g.label ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>

            {goal === 'Własny cel' && (
              <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Zdefiniuj swój cel</label>
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <input 
                      type="text"
                      value={customGoalName}
                      onChange={(e) => setCustomGoalName(e.target.value)}
                      placeholder="np. Zwiększenie retencji klientów o 20%"
                      style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                    <button 
                      type="button"
                      onClick={handleRefineGoal}
                      disabled={isRefiningGoal || !customGoalName}
                      className="btn-secondary"
                      style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>{isRefiningGoal ? 'sync' : 'auto_fix_high'}</span>
                      AI Weryfikacja
                    </button>
                  </div>
                </div>
                
                {customGoalDescription && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Opis strategiczny (AI)</label>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.4' }}>{customGoalDescription}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section B: Oferta */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons">local_offer</span> Sekcja B: Oferta
            </h4>
            
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Opisz swój produkt/usługę</label>
              <textarea 
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Opisz swoją usługę tak, jakbyś mówił do klienta..."
                style={{ width: '100%', minHeight: '100px', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '15px', color: 'var(--text-main)', resize: 'vertical' }}
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Unikalna wartość (USP)</label>
              <input 
                type="text"
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder="np. Jedyny taki kurs w Polsce dla kobiet na motocyklach"
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '15px', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          {/* Section C: Strategia */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons">strategy</span> Sekcja C: Strategia
            </h4>
            
            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                Czas trwania kampanii: <strong>{duration} dni</strong>
              </label>
              <input 
                type="range"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>

            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Platformy docelowe</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {platformsList.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-app)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
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
            style={{ width: '100%', padding: '1.2rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1.1rem' }}
          >
            {loading ? 'Planowanie strategii...' : (
              <>
                <span className="material-icons">auto_awesome</span>
                Generuj strategię kampanii (25k)
              </>
            )}
            {loading && <span className="spinner"></span>}
          </button>
        </form>
      </div>

      {/* Campaigns History / Results */}
      {campaigns && campaigns.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: '1rem 0 0.5rem 0', fontWeight: '700' }}>Twoje Strategie</h3>
          {campaigns.map(campaign => (
            <div key={campaign.id} className="glass" style={{ padding: '2rem', borderRadius: '25px', background: 'var(--bg-white)', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{campaign.name}</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cel: {campaign.goal} | {campaign.duration} dni</p>
                </div>
                <span className="material-icons" style={{ color: 'var(--color-primary)' }}>verified</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {campaign.strategy.map((item, idx) => (
                  <div key={idx} style={{ padding: '1.2rem', background: 'var(--bg-app)', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--color-primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{item.day}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>{item.platform.toUpperCase()}</span>
                      </div>
                      <h5 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem' }}>{item.topic}</h5>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Wizualizacja: {item.visualIdea}</p>
                    </div>
                    <button 
                      onClick={() => handleSelectCampaignItem(item)}
                      className="btn-secondary"
                      style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span className="material-icons" style={{ fontSize: '1rem' }}>bolt</span>
                      Generuj Post
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignPlanner;
