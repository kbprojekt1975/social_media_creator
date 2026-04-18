import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'

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
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>✨ Nie wymaga karty kredytowej</span>
          </div>
        </div>
        
        {/* Glassmorphism Floating UI Elements for Hero */}
        <div className="glass animate-float" style={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          padding: '1.5rem',
          borderRadius: '16px',
          width: '250px',
          textAlign: 'left',
          animationDelay: '0.5s',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}></div>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>@twojamarka</span>
          </div>
          <div style={{ width: '100%', height: '120px', borderRadius: '8px', background: 'var(--bg-glass-bright)' }}></div>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-muted)' }}>Generowanie idealnego opisu...</p>
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
      <section id="showcase" style={{ padding: '8rem 2rem', background: 'var(--bg-app)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8rem' }}>
          
          {/* Feature 1 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-primary)', borderRadius: '20px', marginBottom: '1rem', fontWeight: 'bold' }}>Wizualny Projektant AI</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Projekty, które automatycznie przyciągają wzrok.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                Nigdy więcej pustej kartki. Nasz system natychmiast dobiera idealne kolory, układy i typografię zoptymalizowaną dla Twojej marki.
              </p>
            </div>
            <div className="glass" style={{ flex: '1', minWidth: '300px', height: '400px', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', padding: '2rem' }}>
                 <div style={{ width: '120px', height: '160px', borderRadius: '12px', background: 'linear-gradient(45deg, var(--color-primary), var(--color-info))' }}></div>
                 <div style={{ width: '120px', height: '160px', borderRadius: '12px', background: 'linear-gradient(45deg, #10b981, #3b82f6)' }}></div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: '4rem' }}>
            <div className="glass" style={{ flex: '1', minWidth: '300px', height: '400px', borderRadius: '24px', display: 'flex', flexDirection: 'column', padding: '2rem', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <span>Pon</span><span>Wt</span><span>Śr</span><span>Czw</span><span>Pt</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', flex: 1 }}>
                {[...Array(15)].map((_, i) => (
                  <div key={i} style={{ background: i % 4 === 0 ? 'var(--color-primary)' : 'var(--bg-card)', borderRadius: '8px', opacity: i % 4 === 0 ? 0.8 : 0.4 }}></div>
                ))}
              </div>
            </div>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(129, 140, 248, 0.1)', color: 'var(--color-info)', borderRadius: '20px', marginBottom: '1rem', fontWeight: 'bold' }}>Inteligentny Planer</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Publikuj, gdy są online.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                Koniec ze zgadywaniem. Zobacz wizualizację kalendarza, która analizuje Twoich odbiorców i automatycznie sugeruje najlepsze godziny, aby zmaksymalizować zaangażowanie i zasięg.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', marginBottom: '1rem', fontWeight: 'bold' }}>Analityka, która ma znaczenie</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Statystyki, które wywołają uśmiech.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                Uproszczony panel skupiający się na tym, co naprawdę napędza wzrost. Śledź zaangażowanie, zasięg i konwersję w przejrzystym, intuicyjnym interfejsie.
              </p>
            </div>
            <div className="glass" style={{ flex: '1', minWidth: '300px', height: '400px', borderRadius: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '2rem' }}>
               <div style={{ fontSize: '5rem' }}>😁</div>
               <div style={{ display: 'flex', gap: '2rem' }}>
                 <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12.4k</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Obserwujących</div>
                 </div>
                 <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>+8.2%</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Zaangażowania</div>
                 </div>
               </div>
            </div>
          </div>

        </div>
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

