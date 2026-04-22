import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import InteractiveDemo from './InteractiveDemo'
import HelpModal from './generator/HelpModal'

const LandingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // Default to dark mode as suggested
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = ['hero', 'how-it-works', 'showcase'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page" style={{ overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav className="premium-border" style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1200px',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <a href="#hero" className="logo" style={{ 
          fontWeight: '800', 
          fontSize: '1.5rem', 
          letterSpacing: '-1px', 
          textDecoration: 'none', 
          color: '#ffffff',
          cursor: 'pointer',
          textTransform: 'uppercase'
        }}>
          KREATOR
        </a>
        <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a 
            href="#how-it-works" 
            style={{ 
              color: activeSection === 'how-it-works' ? 'var(--color-primary)' : 'var(--text-muted)', 
              textDecoration: 'none',
              fontWeight: activeSection === 'how-it-works' ? '700' : '400',
              transition: 'all 0.3s ease'
            }}
          >
            Jak to działa
          </a>
          <a 
            href="#showcase" 
            style={{ 
              color: activeSection === 'showcase' ? 'var(--color-primary)' : 'var(--text-muted)', 
              textDecoration: 'none',
              fontWeight: activeSection === 'showcase' ? '700' : '400',
              transition: 'all 0.3s ease'
            }}
          >
            Możliwości
          </a>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
            title="Przełącz tryb"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button 
             onClick={() => setShowHelp(true)}
             style={{ 
               background: 'rgba(56, 189, 248, 0.1)', 
               border: '1px solid rgba(56, 189, 248, 0.3)', 
               color: '#38bdf8', 
               cursor: 'pointer', 
               width: '40px', 
               height: '40px', 
               borderRadius: '50%', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               transition: 'all 0.3s ease'
             }}
             onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
             onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
             title="Jak to działa?"
           >
             <span className="material-icons" style={{ fontSize: '1.4rem' }}>info</span>
           </button>
          <Link to="/login" className="btn-primary" style={{ boxShadow: '0 0 15px var(--primary-glow)' }}>
            Rozpocznij
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '6rem 1rem 0',
        background: '#050505',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Interactive Mouse Glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(56, 189, 248, 0.15) 0%, transparent 40%)`,
          zIndex: 0,
          pointerEvents: 'none',
          transition: 'background 0.1s ease-out'
        }}></div>

        <div className="hero-content animate-float" style={{ maxWidth: '900px', zIndex: 5, position: 'relative', padding: '0 2rem' }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '700' }}>
            Zbuduj swoją <br/><span className="gradient-text">Obecność w Social Media z AI</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
            Kompleksowa platforma AI do projektowania, planowania i analizowania Twoich treści w mediach społecznościowych z zachwycającą estetyką i maksymalnym zasięgiem.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', boxShadow: '0 0 20px var(--primary-glow)' }}>
              Zaczynamy
            </Link>
          </div>
        </div>
        
        {/* Main Interactive Demo in Hero */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '1%',
          zIndex: 1,
          transform: 'scale(0.85)',
          transformOrigin: 'left center'
        }}>
          <InteractiveDemo isHero={true} />
        </div>

        <div className="animate-float" style={{
          position: 'absolute',
          bottom: '15%',
          right: '2%',
          padding: '1.5rem',
          borderRadius: '16px',
          width: '220px',
          textAlign: 'left',
          animationDelay: '1s',
          zIndex: 1,
          transform: 'scale(0.9)',
          transformOrigin: 'right bottom',
          background: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Wzrost zasięgu</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>+124% 📈</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '5px', marginTop: '1rem' }}>
            <div style={{ width: '20px', height: '40%', background: 'var(--color-info)', borderRadius: '4px' }}></div>
            <div style={{ width: '20px', height: '60%', background: 'var(--color-info)', borderRadius: '4px' }}></div>
            <div style={{ width: '20px', height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
          </div>
        </div>

        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'var(--primary-glow)',
          filter: 'blur(150px)',
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none'
        }}></div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" style={{ padding: '8rem 2rem', background: 'var(--bg-card)', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Jak to działa</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Trzy proste kroki do viralowych treści.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', position: 'relative' }}>
            {[
              { title: '1. Temat', desc: 'Wpisz temat lub wklej link. My zajmiemy się resztą.', icon: '✍️' },
              { title: '2. Magia', desc: 'Nasze AI błyskawicznie generuje zachwycające grafiki, angażujące teksty i popularne hashtagi.', icon: '✨' },
              { title: '3. Publikacja', desc: 'Przejrzyj i zaplanuj post na wszystkie platformy jednym kliknięciem.', icon: '🚀' }
            ].map((step, i) => (
              <div key={i} className="glass" style={{ padding: '3rem', borderRadius: '24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ 
                  width: '80px', height: '80px', margin: '0 auto 1.5rem', 
                  background: 'var(--bg-glass-bright)', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                  boxShadow: '0 0 20px var(--primary-glow)'
                }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" style={{ padding: '8rem 2rem', background: 'var(--bg-app)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', fontWeight: '700' }}>Twoje możliwości są <span className="gradient-text">nieograniczone</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
              Nie musisz być ekspertem, aby tworzyć treści, które zachwycają. Pozwól, aby nasze AI zajęło się techniką, a Ty skup się na swoim biznesie.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            <div className="premium-border" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
              <div style={{ color: 'var(--color-primary)', fontSize: '2.5rem' }}><span className="material-icons" style={{ fontSize: '3rem' }}>auto_awesome</span></div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Osobisty Copywriter 24/7</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                Zapomnij o "blokadzie pisarskiej". Nasze AI stworzy dla Ciebie angażujące posty, które Twoi obserwujący pokochają. Ty podajesz temat, a my zajmiemy się słowami, hashtagami i emotikonami. 
                <br/><br/>
                <strong>Korzyść:</strong> Oszczędzasz godziny pracy, a Twoje posty przyciągają więcej uwagi.
              </p>
            </div>

            <div className="premium-border" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
              <div style={{ color: 'var(--color-info)', fontSize: '2.5rem' }}><span className="material-icons" style={{ fontSize: '3rem' }}>palette</span></div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Studio Graficzne w Kieszeni</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                Twórz profesjonalne grafiki i klipy wideo, których nie powstydziłaby się duża agencja. Od pięknych zdjęć produktowych po dynamiczne klipy Reels – wszystko generowane na Twoje życzenie.
                <br/><br/>
                <strong>Korzyść:</strong> Profesjonalny wygląd marki bez wydawania tysięcy na grafików.
              </p>
            </div>

            <div className="premium-border" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
              <div style={{ color: '#10b981', fontSize: '2.5rem' }}><span className="material-icons" style={{ fontSize: '3rem' }}>event_available</span></div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Strategia, która buduje zasięg</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                Nie wiesz o czym pisać w przyszłym tygodniu? Nasz Planer Kampanii stworzy dla Ciebie kompletną strategię. Dowiesz się co i kiedy publikować, aby Twoje zasięgi rosły z każdym dniem.
                <br/><br/>
                <strong>Korzyść:</strong> Spokój ducha i stała obecność w mediach społecznościowych bez wysiłku.
              </p>
            </div>

            <div className="premium-border" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
              <div style={{ color: '#f4af45', fontSize: '2.5rem' }}><span className="material-icons" style={{ fontSize: '3rem' }}>business_center</span></div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Wiele marek, jeden system</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                Zarządzasz wieloma kontami? Twórz osobne "Przestrzenie robocze" dla każdej marki. AI zapamięta unikalny styl i głos Twojego biznesu, dzięki czemu każde wygenerowane słowo będzie pasować idealnie.
                <br/><br/>
                <strong>Korzyść:</strong> Pełna kontrola nad wieloma projektami w jednym, prostym panelu.
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements for showcase */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'var(--primary-glow)',
          filter: 'blur(150px)',
          borderRadius: '50%',
          zIndex: 0,
          opacity: 0.3
        }}></div>
      </section>
      
      {/* Footer CTA */}
      <section style={{ padding: '6rem 2rem', background: 'var(--bg-card)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Gotów zrewolucjonizować swoje media społecznościowe?</h2>
        <Link to="/login" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem', boxShadow: '0 0 25px var(--primary-glow)' }}>
          Zacznij tworzyć
        </Link>
      </section>

      {showHelp && <HelpModal isOpen={true} onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default LandingPage
