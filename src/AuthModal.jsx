import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import loginSvg from './assets/login.svg';
import shortenerSvg from './assets/link_shortener.svg';

export default function AuthModal({ isOpen, onClose, onSuccess, activeTab: initialTab }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync activeTab state with trigger source tab from App.jsx
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
      setError('');
      // Reset input fields when open
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save token and user details to local storage
      localStorage.setItem('urlytics_token', data.token);
      localStorage.setItem('urlytics_user', JSON.stringify(data.user));

      onSuccess(data.token, data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Left Column (Form Pane) */}
        <div className="auth-modal-left">
          {/* Close button */}
          <button className="modal-close" onClick={onClose} style={{ top: '1.5rem', right: '1.5rem' }}>
            <X size={20} />
          </button>

          {/* Brand Logo Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2.2rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-cursive)' }}>
              URL<span style={{ color: 'var(--purple)' }}>ytics</span>
            </span>
          </div>

          {/* Form Header Titles */}
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--black)', marginBottom: '0.2rem' }}>
            {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.8rem' }}>
            Please enter your details
          </p>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {activeTab === 'signup' && (
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Controls: Remember checkbox / Forgot link */}
            <div className="form-extra-row">
              <label className="form-checkbox-label">
                <input type="checkbox" style={{ accentColor: 'var(--purple)' }} />
                <span>Remember</span>
              </label>
              <span className="form-link" onClick={() => alert('Password reset feature is mock simulated!')}>
                Forgot password
              </span>
            </div>

            {/* Primary Sign In / Sign Up Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              style={{
                padding: '0.8rem',
                borderRadius: '12px',
                marginTop: '0',
                backgroundColor: 'var(--purple)'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : activeTab === 'login' ? 'Sign in' : 'Create account'}
            </button>

            {/* Google OAuth Button */}
            <button type="button" className="btn-google" onClick={() => alert('Google authentication is mock simulated!')}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {activeTab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
          </form>

          {/* Auth Tab Switching Link */}
          <div style={{ marginTop: '1.8rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray)' }}>
            {activeTab === 'login' ? (
              <span>
                Don't have an account?{' '}
                <span className="form-link" onClick={() => { setActiveTab('signup'); setError(''); }}>
                  Sign up
                </span>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <span className="form-link" onClick={() => { setActiveTab('login'); setError(''); }}>
                  Log in
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right Column (Illustration Pane) */}
        <div className="auth-modal-right">
          <img
            src={activeTab === 'login' ? loginSvg : shortenerSvg}
            className="auth-illustration"
            alt="Authentication Illustration"
          />
        </div>
      </div>
    </div>
  );
}
