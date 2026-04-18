import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import InteractiveDemo from './InteractiveDemo'

const LandingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Default to dark mode as suggested
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  return (
    <div className="landing-page" style={{ overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav className="glass" style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1200px',
        padding: '1rem 2rem',
        borderRadius: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div className="logo" style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-1px' }}>
          SOCIAL<span className="gradient-text">CREATOR</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#how-it-works" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Jak to działa</a>
          <a href="#showcase" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Możliwości</a>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="btn-primary" style={{ boxShadow: '0 0 15px var(--primary-glow)' }}>
            Rozpocznij
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '6rem 1rem 0',
        background: `radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(129, 140, 248, 0.15) 0px, transparent 50%), var(--bg-app)`,
        position: 'relative'
      }}>
        <div className="hero-content animate-float" style={{ maxWidth: '800px', zIndex: 2, position: 'relative' }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '700' }}>
            Zbuduj swoją <span className="gradient-text">Obecność w Social Media z AI</span>
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
          top: '15%',
          left: '2%',
          zIndex: 10,
        }}>
          <InteractiveDemo isHero={true} />
        </div>

        <div className="glass animate-float" style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          padding: '1.5rem',
          borderRadius: '16px',
          width: '220px',
          textAlign: 'left',
          animationDelay: '1s',
          zIndex: 1
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
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Moved to Hero, leaving empty or putting something else here if needed */}
        </div>
        
        {/* Decorative elements for showcase */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'var(--primary-glow)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          zIndex: 0,
          opacity: 0.5
        }}></div>
      </section>
      
      {/* Footer CTA */}
      <section style={{ padding: '6rem 2rem', background: 'var(--bg-card)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Gotów zrewolucjonizować swoje media społecznościowe?</h2>
        <Link to="/login" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem', boxShadow: '0 0 25px var(--primary-glow)' }}>
          Zacznij tworzyć za darmo
        </Link>
      </section>
    </div>
  )
}

export default LandingPage

