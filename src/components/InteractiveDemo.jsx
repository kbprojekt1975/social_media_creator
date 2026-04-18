import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, delay = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
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

const SimulationSlide = ({ topic, prompt, responsePost, isHero }) => {
  const [step, setStep] = useState(0); 
  // 0: Typing Prompt, 1: Post Gen, 2: Button 'Gen Obraz', 3: Image Result (Show Empty Video PH), 4: Moving to 'Gen Klip', 5: Video Result
  const [isTypingPrompt, setIsTypingPrompt] = useState(true);
  const [isTypingPost, setIsTypingPost] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorTarget, setCursorTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (step === 2) {
      const t1 = setTimeout(() => {
        setCursorTarget({ x: -100, y: -20 });
        setShowCursor(true);
      }, 1000);
      const t2 = setTimeout(() => {
        setStep(3);
        setShowCursor(false);
      }, 3500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    
    if (step === 3) {
      // Small pause before moving to klip
      const t = setTimeout(() => setStep(4), 1500);
      return () => clearTimeout(t);
    }

    if (step === 4) {
      const t1 = setTimeout(() => {
        setCursorTarget({ x: -100, y: 150 }); // Higher Y for the button below image
        setShowCursor(true);
      }, 500);
      const t2 = setTimeout(() => {
        setStep(5);
        setShowCursor(false);
      }, 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [step]);

  const getDimensions = () => {
    if (!isHero) {
      switch (step) {
        case 0: return { width: '650px', height: '200px' };
        case 1: return { width: '650px', height: '420px' };
        default: return { width: '950px', height: '800px' };
      }
    }
    switch (step) {
      case 0: return { width: '280px', height: '180px' };
      case 1: return { width: '360px', height: '360px' };
      case 2: return { width: '360px', height: '420px' };
      case 3: return { width: '400px', height: '580px' };
      case 4: return { width: '400px', height: '620px' };
      case 5: return { width: '420px', height: '780px' };
      default: return { width: '280px', height: '180px' };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div className="simulation-window" style={{
      width,
      height,
      transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
      background: 'rgba(10, 10, 10, 0.85)',
      backdropFilter: 'blur(40px)',
      borderRadius: '32px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
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
        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#FFF' }}>@TwojaMarka_AI</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        {/* Prompt */}
        <div style={{ 
          padding: '1rem', 
          borderRadius: '20px', 
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontSize: '0.6rem', color: '#38BDF8', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '1px' }}>PROMPT:</div>
          <div style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
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
          <div className="animate-fade-in" style={{ 
            background: 'rgba(56, 189, 248, 0.05)', 
            padding: '1.2rem', 
            borderRadius: '20px', 
            border: '1px solid rgba(56, 189, 248, 0.15)',
            fontSize: '0.75rem',
            lineHeight: '1.5',
            color: 'rgba(255,255,255,0.8)',
            maxHeight: step >= 3 ? '120px' : 'none',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
             <style>{`
               .simulation-window ::-webkit-scrollbar { width: 4px; }
               .simulation-window ::-webkit-scrollbar-track { background: transparent; }
               .simulation-window ::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.2); border-radius: 10px; }
             `}</style>
             <div style={{ fontSize: '0.6rem', color: '#818CF8', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '1px' }}>POST:</div>
             <div style={{ whiteSpace: 'pre-wrap' }}>
               {isTypingPost ? (
                 <TypewriterText 
                   text={responsePost} 
                   delay={5} 
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
            height: step >= 3 ? '160px' : '60px', 
            background: step >= 3 ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderRadius: '20px', 
            border: step >= 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.5s ease'
          }}>
             {step === 2 ? (
               <button className="demo-btn-primary">Generuj obraz 🎨</button>
             ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem' }}>🖼️</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>OBRAZ GOTOWY</div>
                </div>
             )}
          </div>
        )}

        {/* Video Placeholder (Permanent from Step 3) */}
        {step >= 3 && (
          <div className="animate-slide-up" style={{ 
            height: '180px', 
            background: step === 5 ? 'rgba(56, 189, 248, 0.03)' : 'rgba(255,255,255,0.01)', 
            borderRadius: '24px',
            border: step === 5 ? '1px solid #38BDF8' : '1px dashed rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            gap: '1rem',
            transition: 'all 0.5s ease'
          }}>
             {step === 3 && (
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}>WIDEO OCZEKUJE...</div>
             )}

             {step === 4 && (
               <button className="demo-btn-primary" style={{ background: 'linear-gradient(135deg, #818CF8, #38BDF8)' }}>Generuj klip 🎥</button>
             )}

             {step === 5 && (
               <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '1.2rem' }}>
                 <div style={{ 
                   width: '80px', height: '140px', background: '#000', borderRadius: '12px',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)'
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
             )}
          </div>
        )}
      </div>

      {/* Mouse Cursor */}
      {showCursor && (
        <div className="simulated-mouse" style={{
          position: 'absolute',
          fontSize: '2rem',
          bottom: '20%',
          right: '10%',
          zIndex: 100,
          pointerEvents: 'none',
          animation: 'mouseMoveAction 3s forwards'
        }}>🖱️</div>
      )}

      <style>{`
        .cursor-caret { border-left: 2px solid #38BDF8; margin-left: 2px; animation: blinkAnim 1s infinite; }
        @keyframes blinkAnim { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        
        .demo-btn-primary {
          padding: 0.8rem 1.8rem;
          background: linear-gradient(135deg, #38BDF8, #1E40AF);
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 800;
          font-size: 0.8rem;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          cursor: pointer;
        }

        @keyframes mouseMoveAction {
          0% { transform: translate(150px, 150px); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translate(${cursorTarget.x}px, ${cursorTarget.y}px); }
          60% { transform: translate(${cursorTarget.x}px, ${cursorTarget.y}px) scale(0.8); }
          70% { transform: translate(${cursorTarget.x}px, ${cursorTarget.y}px) scale(1); }
          100% { transform: translate(${cursorTarget.x}px, ${cursorTarget.y}px); opacity: 0; }
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

const InteractiveDemo = ({ isHero }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      topic: 'neony-led',
      prompt: 'Przygotuj post, który osiągnie duże zasięgi na social media. tematem są neony LED, które będe tworzyl z okazji Walentynek.',
      responsePost: `🔥 MIŁOŚĆ W BLASKU NEONÓW! 🔥\n\nWalentynki tuż tuż... a Ty wciąż nie masz pomysłu na prezent, który zapadnie w pamięć? 🤔\n\nMam dla Ciebie coś absolutnie wyjątkowego! ✨\n\n💥 Oto moje neony LED – ręcznie robione, niepowtarzalne i pełne miłości! 💥\n\nKażdy neon to kawałek mojego serca, który może rozświetlić Twoje wnętrze lub stać się symbolem Waszej miłości. ❤️\n\n💡 Co sprawia, że moje neony są tak wyjątkowe?\n\n- Ręczna robota: Każdy neon jest unikalny, stworzony z pasją i dbałością o najdrobniejsze szczegóły. 🛠️\n- Pełna personalizacja: Ty decydujesz o kolorze, kształcie i napisie. ✨\n- Nowoczesny design: Stylowy dodatek, który wpasuje się w każde wnętrze. 🎉\n- Idealny prezent: Zaskocz swoją drugą połówkę czymś romantycznym. 💕\n\nNie czekaj! Zamów swój wymarzony neon już dziś! 💖\n\n🎁 Szczegóły zamówienia znajdziesz w linku w BIO! 🎁\n\n#neonyLED #prezentnaWalentynki #Walentynki2024 #dekoracjewnętrz #miłość #neonart #rękodzieło`
    },
    {
      topic: 'podroze-bali',
      prompt: 'stwórz post promujący wycieczkę na Bali dla nomadów.',
      responsePost: '🌴 Biuro w raju? 🌴\n\nPracuj z widokiem na Ubud! 🥥\n\n✅ Szybkie Wi-Fi\n✅ Kreatywna społeczność\n\n🚀 Leć z nami! #Bali #DigitalNomad #Workation'
    }
  ];

  return (
    <div className="interactive-demo-carousel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: isHero ? 'flex-start' : 'center',
      gap: '1.2rem'
    }}>
      <SimulationSlide {...slides[currentSlide]} key={currentSlide} isHero={isHero} />
      
      {/* Navigation Controls */}
      <div style={{ display: 'flex', gap: '10px', paddingLeft: isHero ? '1.5rem' : '0', alignItems: 'center' }}>
        {slides.map((_, i) => (
          <div 
            key={i} 
            onClick={() => setCurrentSlide(i)}
            style={{ 
              width: currentSlide === i ? '24px' : '10px', 
              height: '10px', 
              borderRadius: '5px', 
              background: currentSlide === i ? '#38BDF8' : 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.4s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveDemo;
