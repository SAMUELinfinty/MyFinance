import React from 'react';

export const EmptyState = ({ title = 'No Data Available', message = 'Get started by creating your first entry.', actionLabel, onAction, icon = '📊' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        background: 'var(--glass-bg)',
        border: '1px border-dashed var(--border-secondary)',
        borderRadius: 'var(--radius-xl)',
        margin: '1rem 0',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.85 }}>{icon}</div>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: actionLabel ? '1.5rem' : '0' }}>{message}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
