import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000, action = null) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type, duration, action }]);

    if (duration !== Infinity) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = (msg) => addNotification(msg, 'success');
  const showError = (msg) => addNotification(msg, 'error', 8000);
  const showWarning = (msg) => addNotification(msg, 'warning');
  const showInfo = (msg) => addNotification(msg, 'info');

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '400px',
      width: 'calc(100% - 3rem)'
    }}>
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const { message, type } = notification;

  const styles = {
    error: {
      background: '#fef2f2',
      border: '1px solid #fee2e2',
      color: '#991b1b',
      icon: 'error',
      iconColor: '#ef4444'
    },
    success: {
      background: '#f0fdf4',
      border: '1px solid #dcfce7',
      color: '#166534',
      icon: 'check_circle',
      iconColor: '#22c55e'
    },
    warning: {
      background: '#fffbeb',
      border: '1px solid #fef3c7',
      color: '#92400e',
      icon: 'warning',
      iconColor: '#f59e0b'
    },
    info: {
      background: '#eff6ff',
      border: '1px solid #dbeafe',
      color: '#1e40af',
      icon: 'info',
      iconColor: '#3b82f6'
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className="glass" style={{
      padding: '1rem',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: currentStyle.background,
      border: currentStyle.border,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      animation: 'slideIn 0.3s ease-out forwards',
      position: 'relative'
    }}>
      <span className="material-icons" style={{ color: currentStyle.iconColor, fontSize: '1.5rem' }}>
        {currentStyle.icon}
      </span>
      <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: '500', color: currentStyle.color }}>
        {message}
      </div>
      {notification.action && (
        <button 
          onClick={() => {
            notification.action.onClick();
            onClose();
          }}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginLeft: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          {notification.action.label}
        </button>
      )}
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'currentColor',
          opacity: 0.5,
          cursor: 'pointer',
          padding: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.2rem' }}>close</span>
      </button>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
