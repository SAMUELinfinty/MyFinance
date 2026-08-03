import React, { useEffect } from 'react';

export const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={`alert-banner ${type}`}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        boxShadow: 'var(--shadow-xl)',
        minWidth: '280px',
        maxWidth: '450px',
      }}
    >
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'currentColor',
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
