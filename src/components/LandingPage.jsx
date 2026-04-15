import React from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'

const LandingPage = () => {
  return (
    <div className="landing-page">
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
        <div className="nav-links" style={{ display: 'flex', gap: '2rem' }}>
          <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Features</a>
          <Link to="/login" className="btn-primary">Get Started</Link>
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
        padding: '0 1rem',
        background: `radial-gradient(circle at 50% 50%, hsla(260, 100%, 10%, 0.8), var(--bg-dark)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div className="hero-content animate-float" style={{ maxWidth: '800px', zIndex: 1 }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '700' }}>
            Elevate Your <span className="gradient-text">Social Presence</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
            The all-in-one AI platform to design, schedule, and analyze your social media content with stunning aesthetics and maximum impact.
          </p>
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
          zIndex: 0
        }}></div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '8rem 2rem', background: 'var(--bg-darker)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Powerful Features</h2>
            <p style={{ color: 'var(--text-muted)' }}>Everything you need to grow your digital footprint.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { title: 'AI Copywriter', desc: 'Generate high-converting captions and hashtags in seconds.', icon: '✍️' },
              { title: 'Visual Studio', desc: 'Create stunning visuals with our integrated design tools.', icon: '🎨' },
              { title: 'Smart Scheduler', desc: 'Post at the perfect time when your audience is most active.', icon: '🕒' }
            ].map((f, i) => (
              <div key={i} className="glass" style={{ padding: '3rem', borderRadius: '24px', transition: 'var(--transition-smooth)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
