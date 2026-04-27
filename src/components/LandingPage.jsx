import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, query, collection, orderBy, limit } from 'firebase/firestore'
import heroBg from '../assets/hero-bg-globe-highres.png'
import InteractiveDemo from './InteractiveDemo'
import HelpModal from './generator/HelpModal'
import StatusHeader from './generator/StatusHeader'

import { StatusPill, ProfileDropdown } from './generator/HeaderComponents'

const LandingPage = ({ deferredPrompt, setDeferredPrompt }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();

  // Auth & Data States
  const [user, setUser] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [balance, setBalance] = useState(0);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [activeStatIdx, setActiveStatIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const MAX_TOKENS = 10000000;
  const perc = Math.max(0, Math.min(100, (balance / MAX_TOKENS) * 100));

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Balance - Fix field name to 'balance' to match GeneratorPage
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setBalance(docSnap.data().balance || 0);
          }
        });

        // Fetch Workspaces
        const workspacesQuery = query(
          collection(db, 'users', currentUser.uid, 'workspaces'),
          orderBy('createdAt', 'desc')
        );
        const unsubWorkspaces = onSnapshot(workspacesQuery, (snapshot) => {
          const wsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const active = wsData.find(ws => ws.isActive);
          setActiveWorkspace(active || null);
        });

        // Fetch Subscription Status
        const subQuery = query(
          collection(db, 'customers', currentUser.uid, 'subscriptions'),
          limit(1)
        );
        const unsubSub = onSnapshot(subQuery, (snapshot) => {
          if (!snapshot.empty) {
            setSubscriptionData(snapshot.docs[0].data());
          } else {
            setSubscriptionData(null);
          }
        });

        return () => {
          unsubUser();
          unsubWorkspaces();
          unsubSub();
        };
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  const stats = [
    { label: 'Wzrost zasięgu', value: '+124%', icon: '📈', color: 'var(--color-primary)', bars: ['40%', '60%', '100%'] },
    { label: 'Konwersja', value: '+12%', icon: '💰', color: '#10b981', bars: ['30%', '50%', '80%'] },
    { label: 'Engagement', value: '+85%', icon: '🔥', color: '#f4af45', bars: ['50%', '70%', '90%'] },
    { label: 'Czas', value: 'Oszczędzone: 4h', icon: '⏱️', color: 'var(--color-info)', bars: ['20%', '40%', '60%'] },
    { label: 'Kliknięcia', value: '240', icon: '🔗', color: '#38bdf8', bars: ['35%', '55%', '75%'] }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveStatIdx(prev => (prev + 1) % stats.length);
        setIsFading(false);
      }, 500);
    }, 4500);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <div className="landing-page" style={{ overflowX: 'hidden' }}>
      <nav className="landing-nav premium-border">
        <a href="#hero" className="logo" style={{ 
          fontWeight: '800', 
          fontSize: 'clamp(0.9rem, 4vw, 1.5rem)', 
          letterSpacing: '-1px', 
          textDecoration: 'none', 
          color: 'var(--text-main)',
          cursor: 'pointer',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center'
        }}>
          KUŹNIA<span className="logo-suffix" style={{ color: 'var(--color-primary)' }}>TREŚCI</span>
        </a>
        
        <div className="nav-links-container">
          <a 
            href="#how-it-works" 
            className="nav-text-link"
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
            className="nav-text-link"
            style={{ 
              color: activeSection === 'showcase' ? 'var(--color-primary)' : 'var(--text-muted)', 
              textDecoration: 'none',
              fontWeight: activeSection === 'showcase' ? '700' : '400',
              transition: 'all 0.3s ease'
            }}
          >
            Możliwości
          </a>

          {!user ? (
            <>
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
                title="Jak to działa?"
              >
                <span className="material-icons" style={{ fontSize: '1.4rem' }}>info</span>
              </button>
              <Link to="/login" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', boxShadow: '0 0 15px var(--primary-glow)' }}>
                Rozpocznij
              </Link>
            </>
          ) : (
            <>
              <div style={{ width: '1px', height: '25px', background: 'var(--border-color)', margin: '0 1rem' }}></div>
              <StatusPill 
                perc={perc}
                activeWorkspace={activeWorkspace}
                setActiveTab={(tab) => navigate('/dashboard', { state: { activeTab: tab } })}
                setForcePaymentView={() => navigate('/dashboard')}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
              <ProfileDropdown 
                user={user}
                isDark={isDarkMode}
                setIsDark={setIsDarkMode}
                onShowHelp={() => setShowHelp(true)}
                handleLogout={handleLogout}
                deferredPrompt={deferredPrompt}
                setDeferredPrompt={setDeferredPrompt}
                subscriptionData={subscriptionData}
                hideMobileExtra={true}
              />
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero" style={{
        minHeight: '100vh',
        width: '100vw',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '6rem 1rem 0',
        background: `radial-gradient(circle, rgba(0,0,0,0.3) 0%, #050505 90%), #050505 url(${heroBg}) no-repeat center center`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        position: 'relative',
        overflow: 'visible'
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
          <h1 style={{ 
            fontSize: '4.5rem', 
            lineHeight: '1.2', 
            marginBottom: '1.5rem', 
            fontWeight: '700'
          }}>
            Wystarczy Twój Pomysł. <br/>
            <span className="gradient-text" style={{ fontSize: '0.7em', display: 'block', marginTop: '0.5rem' }}>
              Resztę Posta Zrobi nasza Kuźnia
            </span>
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'white', 
            marginBottom: '2.5rem', 
            maxWidth: '600px', 
            marginInline: 'auto',
            fontWeight: '500'
          }}>
            Nie musisz być ekspertem od AI. Ty piszesz, o czym ma być post, a my tworzymy chwytliwy tekst, dopasowany styl i zachwycającą grafikę w sekundy.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link 
              to={user ? "/dashboard" : "/login"} 
              className="btn-primary" 
              style={{ padding: '1rem 3rem', fontSize: '1.1rem', boxShadow: '0 0 20px var(--primary-glow)' }}
            >
              {user ? "Przejdź do panelu" : "Zaczynamy"}
            </Link>

            <button 
              onClick={() => setShowDemo(!showDemo)} 
              className="btn-secondary mobile-demo-toggle-btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                borderRadius: '100px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <span className="material-icons">{showDemo ? 'close' : 'play_circle'}</span>
              {showDemo ? 'Zamknij Demo' : 'Zobacz Demo'}
            </button>
          </div>
        </div>

        {/* Main Interactive Demo in Hero */}
        {showDemo && (
          <div className="hero-demo-wrapper show-mobile" style={{
            position: 'absolute',
            top: '120px', 
            left: '2%',
            zIndex: 100,
            maxWidth: '45%',
            height: 'calc(100vh - 160px)', 
            pointerEvents: 'all'
          }}>
            <InteractiveDemo key={showDemo} isHero={true} onClose={() => setShowDemo(false)} />
          </div>
        )}

        <div className="animate-float" style={{
          position: 'absolute',
          bottom: '15%',
          right: '5%',
          zIndex: 1,
        }}>
          <div className="hero-stats-card" style={{
            padding: '1.2rem 1.5rem',
            borderRadius: '20px',
            width: '320px',
            textAlign: 'left',
            transform: 'scale(1.5)',
            transformOrigin: 'right bottom',
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            transition: 'all 0.5s ease',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              opacity: isFading ? 0 : 1,
              transform: isFading ? 'translateX(10px)' : 'translateX(0)',
              filter: isFading ? 'blur(4px)' : 'blur(0)',
              transition: 'all 0.5s ease-in-out'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'all 0.3s ease' }}>
                  {stats[activeStatIdx].label}
                </h4>
                <div style={{ 
                  fontSize: stats[activeStatIdx].label === 'Czas' ? '1.1rem' : '1.4rem', 
                  fontWeight: 'bold', 
                  color: stats[activeStatIdx].color, 
                  transition: 'all 0.3s ease', 
                  lineHeight: '1.2' 
                }}>
                  {stats[activeStatIdx].value} {stats[activeStatIdx].icon}
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                height: '45px', 
                gap: '4px', 
                flexShrink: 0
              }}>
                {stats[activeStatIdx].bars.map((height, i) => (
                  <div key={i} style={{ 
                    width: '15px', 
                    height: height, 
                    background: i === 2 ? stats[activeStatIdx].color : 'var(--color-secondary)', 
                    opacity: i === 2 ? 1 : 0.3,
                    borderRadius: '3px',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transitionDelay: `${i * 100}ms`
                  }}></div>
                ))}
              </div>
            </div>
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
          
          <div className="how-it-works-grid" style={{ display: 'grid', gap: '3rem', position: 'relative' }}>
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

          <div className="features-grid" style={{ display: 'grid', gap: '2rem' }}>
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
        <Link 
          to={user ? "/dashboard" : "/login"} 
          className="btn-primary" 
          style={{ padding: '1rem 3rem', fontSize: '1.2rem', boxShadow: '0 0 25px var(--primary-glow)' }}
        >
          {user ? "Przejdź do panelu" : "Zacznij tworzyć"}
        </Link>
      </section>

      {showHelp && <HelpModal isOpen={true} onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default LandingPage;
