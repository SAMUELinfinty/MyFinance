import React from 'react';

export const LoadingSkeleton = ({ count = 4, height = '80px' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" style={{ height }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
