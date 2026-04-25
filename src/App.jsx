import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import PaymentPage from './components/PaymentPage'
import SuccessPage from './components/SuccessPage'
import GeneratorPage from './components/GeneratorPage'
import ErrorBoundary from './components/common/ErrorBoundary'
import { NotificationProvider } from './components/common/NotificationContext'
import CookieConsent from './components/common/CookieConsent'

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<LandingPage deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/cancel" element={<PaymentPage />} />
              <Route path="/dashboard" element={<GeneratorPage deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} />} />
            </Routes>
            <CookieConsent />
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App
