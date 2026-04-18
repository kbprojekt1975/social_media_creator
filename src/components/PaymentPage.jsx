import React, { useState } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, onSnapshot } from 'firebase/firestore'

const PaymentPage = () => {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async (priceId) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Zaloguj się, aby kontynuować.');
      return;
    }

    setLoading(true);
    try {
      // 1. Dodaj dokument sesji płatności do Firestore
      const docRef = await addDoc(collection(db, 'customers', user.uid, 'checkout_sessions'), {
        price: priceId,
        success_url: window.location.origin + '/success',
        cancel_url: window.location.origin + '/payment',
      });

      // 2. Nasłuchuj na zmiany w dokumencie (rozszerzenie doda pole 'url')
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (!data) return;
        
        const { error, url } = data;
        if (error) {
          unsubscribe();
          setLoading(false);
          alert(`Błąd płatności: ${error.message}`);
        }
        if (url) {
          unsubscribe();
          window.location.assign(url);
        }
      });
    } catch (err) {
      console.error('Błąd inicjacji płatności:', err);
      setLoading(false);
      alert('Nie udało się zainicjować płatności. Spróbuj ponownie.');
    }
  }

  const plans = [
    {
      name: 'Plan Standardowy',
      price: '50 zł',
      validity: 'Ważny 30 dni lub do zużycia tokenów',
      features: [
        '60 postów AI (ze strategią)',
        '40 wysokiej jakości obrazów AI',
        '5 klipów wideo (Reels/TikTok)'
      ],
      id: 'price_1TLomfDXnXONl2svOFT20RGH', // Ten ID musi zgadzać się z ID produktu w Stripe
      popular: true
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: '8rem 2rem 4rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Wybierz swój <span className="gradient-text">Plan</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Zwiększ swoje możliwości tworzenia treści dzięki AI.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          {plans.map((plan, i) => (
            <div key={i} className="glass" style={{
              padding: '3rem',
              borderRadius: '30px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              border: plan.popular ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '30px',
                  background: 'var(--primary)',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}>NAJCZĘŚCIEJ WYBIERANY</div>
              )}
              <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: '700' }}>{plan.price}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{plan.validity}</div>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '3rem', flexGrow: 1 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ color: 'var(--secondary)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleCheckout(plan.id)}
                disabled={loading}
                className={plan.popular ? 'btn-primary' : 'glass'}
                style={{ 
                  width: '100%', 
                  padding: '1.1rem', 
                  borderRadius: '14px',
                  fontWeight: '600',
                  color: 'white',
                  border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Przekierowywanie...' : 'Zacznij teraz'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
