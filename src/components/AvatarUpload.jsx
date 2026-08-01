import React, { useState, useRef } from 'react';
import { profileApi } from '../services/profileApi';

export const AvatarUpload = ({ avatarUrl, userName, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const backendHost = 'http://localhost:5000';
  const fullAvatarUrl = avatarUrl?.startsWith('/uploads/')
    ? `${backendHost}${avatarUrl}`
    : avatarUrl;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await profileApi.uploadAvatar(formData);
      if (onUploadSuccess) {
        onUploadSuccess(res.data.avatar, res.data.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="avatar-upload-container">
      <div
        className={`avatar-preview-wrapper ${uploading ? 'uploading' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        title="Click to change profile picture"
      >
        {fullAvatarUrl ? (
          <img src={fullAvatarUrl} alt={userName || 'Avatar'} className="avatar-img" />
        ) : (
          <div className="avatar-fallback">{getInitials(userName)}</div>
        )}

        <div className="avatar-overlay">
          <svg className="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="upload-text">Change</span>
        </div>

        {uploading && <div className="avatar-spinner"></div>}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      {error && <p className="avatar-error-text">{error}</p>}
    </div>
  );
};

export default AvatarUpload;
