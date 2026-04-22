import React, { useState } from 'react'
import { auth, googleProvider } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { useNavigate, Link } from 'react-router-dom'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Theme State - Default to dark
  const [isDark] = useState(localStorage.getItem('theme') !== 'light');

  React.useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDark]);

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-app)',
      padding: '1rem'
    }}>
      <div className="premium-border" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '3.5rem 3rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '700' }}>
          {isRegistering ? 'Stwórz konto' : 'Witaj ponownie'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          {isRegistering ? 'Rozpocznij swoją przygodę już dziś' : 'Zaloguj się, aby zarządzać swoimi treściami'}
        </p>

        {error && <div style={{ color: '#ef4444', marginBottom: '1.2rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '10px' }}>{error}</div>}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Adres E-mail</label>
            <input 
              type="email" 
              required 
              value={email}
              placeholder="twoj@email.com"
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Hasło</label>
            <input 
              type="password" 
              required 
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '1rem'
              }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1.1rem', borderRadius: '15px', fontSize: '1rem', fontWeight: '700' }}>
            {isRegistering ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>LUB</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          className="btn-secondary" 
          style={{ 
            width: '100%', 
            padding: '1rem', 
            borderRadius: '12px', 
            color: 'var(--text-main)', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-white)'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
          Kontynuuj przez Google
        </button>

        <p style={{ marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isRegistering ? 'Masz już konto?' : "Nie masz jeszcze konta?"}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary)', 
              marginLeft: '0.5rem', 
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            {isRegistering ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </p>
        
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8 }}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_back</span>
          Powrót do strony głównej
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
