import React from 'react';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
  return (
    <div className="success-page" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem',
      background: 'var(--bg-dark)'
    }}>
      <div className="glass" style={{
        padding: '4rem',
        borderRadius: '30px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>✅</div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Płatność udana!</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          Dziękujemy za subskrypcję. Twoje konto zostało zaktualizowane i możesz teraz korzystać z pełnej mocy generatora AI.
        </p>
        <Link to="/dashboard" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
          Zacznij tworzyć
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;
