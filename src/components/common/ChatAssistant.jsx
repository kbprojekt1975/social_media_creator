import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../../firebase';

const ChatAssistant = ({ API_BASE_URL, subscriptionStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

  // Only show for paid users
  if (subscriptionStatus !== 'active') return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = { role: 'user', parts: [{ text: message }] };
    const displayMessage = { role: 'user', text: message };
    
    setChatHistory(prev => [...prev, displayMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const token = await auth.currentUser.getIdToken();
      
      // Convert display history back to Gemini format for the API
      // (Gemini expects { role: 'user'|'model', parts: [{ text: '...' }] })
      const apiHistory = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await axios.post(`${API_BASE_URL}/chat-assistant`, {
        message: message,
        history: apiHistory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const aiResponse = { role: 'model', text: response.data.response };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = { role: 'model', text: 'Przepraszam, wystąpił błąd podczas łączenia z asystentem. Upewnij się, że masz wystarczająco tokenów.', isError: true };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleToggleChat = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleChat', handleToggleChat);
    return () => window.removeEventListener('toggleChat', handleToggleChat);
  }, []);

  const handleResetChat = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić historię rozmowy?')) {
      setChatHistory([]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        className="desktop-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '7rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(var(--color-primary-rgb), 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0)'}
      >
        <span className="material-icons" style={{ fontSize: '2rem' }}>
          {isOpen ? 'close' : 'chat_bubble'}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window glass" style={{
          position: 'fixed',
          bottom: '11.5rem',
          right: '2rem',
          width: '380px',
          height: '550px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
          background: 'rgba(23, 23, 23, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          borderRadius: '12px'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.2rem 1.5rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="material-icons" style={{ fontSize: '1.8rem' }}>chat_bubble</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>SMC Assistant</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Twój ekspert od Social Media</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleResetChat}
                title="Resetuj czat"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>delete_sweep</span>
              </button>
              <button 
                className="mobile-only-chat-close"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '8px',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.6 }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Cześć! W czym mogę Ci dzisiaj pomóc?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'center', marginTop: '1rem' }}>
                  {['Jak stworzyć wideo?', 'Plan kampanii', 'Pomysł na post'].map(hint => (
                    <button 
                      key={hint}
                      onClick={() => setMessage(hint)}
                      className="chip"
                      style={{ padding: '0.6rem 1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '1rem 1.2rem',
                  borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  border: msg.isError ? '1px solid #ef4444' : 'none'
                }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '1rem 1.2rem', background: 'rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 2px' }}>
                <div className="dot-flashing"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '1rem',
            background: 'rgba(10, 10, 10, 0.5)'
          }}>
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Zadaj pytanie..."
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '1rem 1.2rem',
                color: 'white',
                outline: 'none',
                fontSize: '1rem'
              }}
            />
            <button 
              type="submit"
              disabled={isLoading || !message.trim()}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: message.trim() ? 'pointer' : 'default',
                opacity: message.trim() ? 1 : 0.5
              }}
            >
              <span className="material-icons" style={{ fontSize: '1.5rem' }}>send</span>
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .chat-window {
            width: 100% !important;
            height: 100% !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 0 !important;
            z-index: 100000 !important;
          }
          .mobile-only-chat-close {
            display: flex !important;
          }
        }

        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--color-primary);
          color: var(--color-primary);
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0.5s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: "";
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--color-primary);
          color: var(--color-primary);
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--color-primary);
          color: var(--color-primary);
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 1s;
        }
        @keyframes dot-flashing {
          0% { background-color: var(--color-primary); }
          50%, 100% { background-color: rgba(var(--color-primary-rgb), 0.2); }
        }
      `}</style>
    </>
  );
};

export default ChatAssistant;
