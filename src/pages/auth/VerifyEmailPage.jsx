import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ success: false, message: '' });

  const { verifyEmail } = useAuth();

  useEffect(() => {
    const doVerify = async () => {
      if (!token) {
        setStatus({ success: false, message: 'No verification token provided in URL.' });
        setLoading(false);
        return;
      }

      try {
        const res = await verifyEmail(token);
        setStatus({ success: true, message: res.message || 'Email verified successfully!' });
      } catch (err) {
        setStatus({ success: false, message: err.message || 'Invalid or expired verification token.' });
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token, verifyEmail]);

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-card text-center">
        <div className="auth-header">
          <div className="auth-brand-logo">{status.success ? '✅' : '✉️'}</div>
          <h2>Email Verification</h2>
        </div>

        {loading ? (
          <div style={{ padding: '2rem' }}>
            <span className="spinner spinner-lg" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem' }}>Verifying your email address...</p>
          </div>
        ) : (
          <div>
            <div className={`alert-banner ${status.success ? 'success' : 'danger'}`} style={{ marginBottom: '1.5rem' }}>
              {status.message}
            </div>

            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
