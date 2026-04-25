import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sprawdź czy użytkownik już zaakceptował cookies na stałe
    const consent = localStorage.getItem('cookie-consent');
    if (consent !== 'accepted') {
      // Jeśli nie, pokaż panel po krótkim opóźnieniu
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleClose = () => {
    // Zamyka tylko dla tej sesji (nie ustawia localStorage)
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-panel glass" style={{
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(94%, 500px)',
      background: 'rgba(10, 10, 10, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: '1.5rem',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🍪</span>
          <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '0.5px' }}>POLITYKA COOKIES</span>
        </div>
        <button 
          onClick={handleClose} 
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer', 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="material-icons" style={{ fontSize: '1.1rem' }}>close</span>
        </button>
      </div>
      
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
        Nasza strona korzysta z plików cookies w celu zapewnienia najwyższej jakości usług, w tym w sposób dostosowany do indywidualnych potrzeb. Korzystanie z witryny bez zmiany ustawień dotyczących cookies oznacza, że będą one zamieszczane w Twoim urządzeniu.
      </p>

      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <button 
          onClick={handleAccept} 
          className="btn-primary" 
          style={{ 
            flex: 1, 
            padding: '0.8rem', 
            fontSize: '0.9rem', 
            fontWeight: '600',
            borderRadius: '12px'
          }}
        >
          Zrozumiałem, nie pokazuj więcej
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
