import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-main)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <span className="material-icons" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }}>error_outline</span>
          <h1 style={{ marginBottom: '1rem' }}>Coś poszło nie tak</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px' }}>
            Wystąpił nieoczekiwany błąd aplikacji. Przepraszamy za utrudnienia. 
            Możesz spróbować odświeżyć stronę lub wrócić do panelu głównego.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
              style={{ padding: '0.8rem 1.5rem' }}
            >
              Odśwież stronę
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="btn-secondary"
              style={{ padding: '0.8rem 1.5rem' }}
            >
              Wróć do strony głównej
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              background: 'rgba(0,0,0,0.1)', 
              borderRadius: '8px',
              fontSize: '0.8rem',
              textAlign: 'left',
              maxWidth: '90vw',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
