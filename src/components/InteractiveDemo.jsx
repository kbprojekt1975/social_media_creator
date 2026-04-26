import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ text, delay = 30, onComplete, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      const nextText = text.substring(0, i + 1);
      setDisplayedText(nextText);
      if (onUpdate) onUpdate(nextText);
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

const SimulationSlide = ({ topic, prompt, responsePost, imageSrc, videoSrc, isHero, onClose }) => {
  const [step, setStep] = useState(0); 
  const [isTypingPrompt, setIsTypingPrompt] = useState(true);
  const [isTypingPost, setIsTypingPost] = useState(false);
  const [clickState, setClickState] = useState('idle');
  
  const postScrollRef = useRef(null);

  useEffect(() => {
    if (step === 2) {
      const t1 = setTimeout(() => setClickState('pressing'), 1200);
      const t2 = setTimeout(() => setClickState('glowing'), 1500);
      const t3 = setTimeout(() => {
        setStep(3);
        setClickState('idle');
      }, 2800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    
    if (step === 3) {
      const t = setTimeout(() => setStep(4), 1500);
      return () => clearTimeout(t);
    }

    if (step === 4) {
      const t1 = setTimeout(() => setClickState('pressing'), 800);
      const t2 = setTimeout(() => setClickState('glowing'), 1100);
      const t3 = setTimeout(() => {
        setStep(5);
        setClickState('idle');
      }, 2400);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [step]);

  const handlePostUpdate = () => {
    if (postScrollRef.current) {
      postScrollRef.current.scrollTop = postScrollRef.current.scrollHeight;
    }
  };

  const getDimensions = () => {
    if (!isHero) {
      switch (step) {
        case 0: return { width: '650px', height: '240px' };
        case 1: return { width: '650px', height: '450px' };
        default: return { width: '950px', height: '800px' };
      }
    }
    const constantWidth = '100%';
    switch (step) {
      case 0: return { width: constantWidth, height: '240px' };
      case 1: return { width: constantWidth, height: '440px' };
      case 2: return { width: constantWidth, height: '540px' };
      case 3: return { width: constantWidth, height: '800px' };
      case 4: return { width: constantWidth, height: '880px' };
      case 5: return { width: constantWidth, height: '1050px' };
      default: return { width: constantWidth, height: '240px' };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div className="simulation-window" style={{
      width,
      height,
      maxWidth: isHero ? '420px' : 'none',
      transition: 'all 1s cubic-bezier(0.23, 1, 0.32, 1)',
      background: '#0a0a0a',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.2rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #FF6B6B, #FFD93D)' }}></div>
        <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#FFF' }}>@TwojaMarka_AI</span>
        
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        )}
      </div>

      <div style={{ 
        padding: '1.5rem', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem', 
        overflowY: 'auto',
        maxHeight: '100%'
      }}>
        {/* Prompt Container */}
        <div style={{ 
          padding: '1.2rem', 
          borderRadius: '5px', 
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '1.1rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 'bold', marginBottom: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Twoje Zapytanie:</div>
          <div style={{ color: 'rgba(255,255,255,0.95)', lineHeight: '1.6' }}>
            {isTypingPrompt ? (
              <TypewriterText 
                text={prompt} 
                delay={25}
                onComplete={() => {
                  setTimeout(() => {
                    setStep(1);
                    setIsTypingPrompt(false);
                    setIsTypingPost(true);
                  }, 800);
                }} 
              />
            ) : (
              prompt
            )}
            {isTypingPrompt && <span className="cursor-caret"></span>}
          </div>
        </div>

        {/* Post */}
        {step >= 1 && (
          <div 
            ref={postScrollRef}
            className="animate-fade-in" 
            style={{ 
              background: 'rgba(56, 189, 248, 0.05)', 
              padding: '1.2rem', 
              borderRadius: '5px', 
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              color: 'rgba(255,255,255,0.8)',
              maxHeight: step >= 3 ? '220px' : 'none',
              overflowY: 'auto',
              paddingRight: '10px',
              scrollBehavior: 'smooth'
            }}>
             <style>{`
               .simulation-window ::-webkit-scrollbar { width: 4px; }
               .simulation-window ::-webkit-scrollbar-track { background: transparent; }
               .simulation-window ::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.2); border-radius: 10px; }
             `}</style>
             <div style={{ fontSize: '0.75rem', color: '#818CF8', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '1px' }}>POST:</div>
             <div style={{ whiteSpace: 'pre-wrap' }}>
               {isTypingPost ? (
                 <TypewriterText 
                   text={responsePost} 
                   delay={5} 
                   onUpdate={handlePostUpdate}
                   onComplete={() => {
                     setIsTypingPost(false);
                     setTimeout(() => setStep(2), 1200);
                   }} 
                 />
               ) : (
                 responsePost
               )}
             </div>
          </div>
        )}

        {/* Image Placeholder / Result */}
        {step >= 2 && (
          <div className="animate-zoom-in" style={{ 
            height: step >= 3 ? '240px' : '100px', 
            background: step >= 3 ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderRadius: '5px', 
            border: step >= 3 ? '1px solid rgba(56, 189, 248, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.5s ease',
            boxShadow: step >= 3 ? '0 0 20px rgba(56, 189, 248, 0.1)' : 'none',
            position: 'relative',
            flexShrink: 0
          }}>
             {step === 2 ? (
               <button 
                 className={`demo-btn-primary ${clickState === 'pressing' ? 'pressing' : ''} ${clickState === 'glowing' ? 'glow' : ''}`}
               >
                 Generuj obraz 🎨
               </button>
             ) : (
                imageSrc ? (
                  <img 
                    src={imageSrc} 
                    alt="AI Generated" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} 
                  />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem' }}>🖼️</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#38BDF8', marginTop: '5px', textShadow: '0 0 10px rgba(56, 189, 248, 0.3)' }}>OBRAZ GOTOWY</div>
                  </div>
                )
             )}
          </div>
        )}

        {/* Video Placeholder (Permanent from Step 3) */}
        {step >= 3 && (
          <div className="animate-slide-up" style={{ 
            height: step === 5 ? '280px' : '100px', 
            background: step === 5 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.01)', 
            borderRadius: '24px',
            border: step === 5 ? '2px solid #38BDF8' : '1px dashed rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: step === 5 ? '0' : '1rem',
            gap: '1rem',
            transition: 'all 0.5s ease',
            boxShadow: step === 5 ? '0 0 40px rgba(56, 189, 248, 0.25)' : 'none',
            position: 'relative',
            flexShrink: 0
          }}>
             {step === 3 && (
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}>WIDEO OCZEKUJE...</div>
             )}

             {step === 4 && (
               <button 
                 className={`demo-btn-primary ${clickState === 'pressing' ? 'pressing' : ''} ${clickState === 'glowing' ? 'glow' : ''}`}
                 style={{ background: 'linear-gradient(135deg, #818CF8, #38BDF8)' }}
               >
                 Generuj klip 🎥
               </button>
             )}

             {step === 5 && (
               videoSrc ? (
                 <video 
                   src={videoSrc} 
                   autoPlay 
                   loop 
                   muted 
                   playsInline
                   style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }}
                 />
               ) : (
                 <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '1.2rem', padding: '1rem' }}>
                   <div style={{ 
                     width: '80px', height: '140px', background: '#000', borderRadius: '12px',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.2)',
                     boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
                   }}>
                     <div style={{ fontSize: '1.5rem' }}>📱</div>
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: '800', fontSize: '0.8rem', color: '#FFF' }}>KLIP WIDEO 9:16 GOTOWY</div>
                     <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '100%', background: '#38BDF8', animation: 'progressFillAuto 3s linear' }}></div>
                     </div>
                   </div>
                 </div>
               )
             )}
          </div>
        )}
      </div>

      <style>{`
        .cursor-caret { border-left: 2px solid #38BDF8; margin-left: 2px; animation: blinkAnim 1s infinite; }
        @keyframes blinkAnim { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        
        .demo-btn-primary {
          padding: 0.8rem 2.2rem;
          background: linear-gradient(135deg, #38BDF8, #1E40AF);
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 800;
          font-size: 0.85rem;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .demo-btn-primary.pressing { transform: scale(0.92); }
        .demo-btn-primary.glow { 
          transform: scale(1);
          box-shadow: 0 0 60px 15px rgba(56, 189, 248, 0.4), 0 0 25px rgba(56, 189, 248, 0.6);
          filter: brightness(1.1);
        }

        @keyframes progressFillAuto { from { width: 0%; } to { width: 100%; } }
        
        .animate-fade-in { animation: fadeInAnim 0.6s ease-out forwards; }
        .animate-zoom-in { animation: zoomInAnim 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slideUpAnim 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeInAnim { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomInAnim { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUpAnim { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const InteractiveDemo = ({ isHero, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      topic: 'neony-led',
      prompt: 'Przygotuj post, który osiągnie duże zasięgi na social media. tematem są neony LED, które będe tworzyl z okazji Walentynek.',
      responsePost: `🔥 MIŁOŚĆ W BLASKU NEONÓW! 🔥\n\nWalentynki tuż tuż... a Ty wciąż nie masz pomysłu na prezent, który zapadnie w pamięć? 🤔\n\nMam dla Ciebie coś absolutnie wyjątkowego! ✨\n\n💥 Oto moje neony LED – ręcznie robione, niepowtarzalne i pełne miłości! 💥\n\nKażdy neon to kawałek mojego serca, który może rozświetlić Twoje wnętrze lub stać się symbolem Waszej miłości. ❤️\n\n💡 Co sprawia, że moje neony są tak wyjątkowe?\n\n- Ręczna robota: Każdy neon jest unikalny, stworzony z pasją i dbałością o najdrobniejsze szczegóły. 🛠️\n- Pełna personalizacja: Ty decydujesz o kolorze, kształcie i napisie. ✨\n- Nowoczesny design: Stylowy dodatek, który wpasuje się w każde wnętrze. 🎉\n- Idealny prezent: Zaskocz swoją drugą połówkę czymś romantycznym. 💕\n\nNie czekaj! Zamów swój wymarzony neon już dziś! 💖\n\n🎁 Szczegóły zamówienia znajdziesz w linku w BIO! 🎁\n\n#neonyLED #prezentnaWalentynki #Walentynki2024 #dekoracjewnętrz #miłość #neonart #rękodzieło`,
      imageSrc: '/demo-image.png',
      videoSrc: '/demo-video.mp4'
    },
    {
      topic: 'podroze-bali',
      prompt: 'stwórz post promujący wycieczkę na Bali dla nomadów.',
      responsePost: '🌴 Biuro w raju? 🌴\n\nPracuj z widokiem na Ubud! 🥥\n\n✅ Szybkie Wi-Fi\n✅ Kreatywna społeczność\n\n🚀 Leć z nami! #Bali #DigitalNomad #Workation',
      // No imageSrc/videoSrc means it will use placeholders
    }
  ];

  return (
    <div className="interactive-demo-carousel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: isHero ? 'flex-start' : 'center',
      gap: '1.2rem'
    }}>
      <SimulationSlide {...slides[currentSlide]} key={currentSlide} isHero={isHero} onClose={onClose} />
      
      {/* Navigation Controls removed as requested */}
    </div>
  );
};

export default InteractiveDemo;
