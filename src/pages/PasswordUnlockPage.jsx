import { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function PasswordUnlockPage({ shortCode, onGoHome }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/r/${shortCode}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.longUrl) {
        // Redirect to the destination URL in same tab
        window.location.href = data.longUrl;
      } else {
        setError(data.error || 'Incorrect password. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="error-page-container">
      {/* Decorative blobs */}
      <div className="error-blob error-blob--1" />
      <div className="error-blob error-blob--2" />

      <div className="error-card" style={{ maxWidth: '420px' }}>
        {/* Icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(139,92,246,0.35)'
        }}>
          <Shield size={36} color="white" />
        </div>

        <h1 className="error-title" style={{ color: '#1e1b4b', fontSize: '1.6rem', marginBottom: '0.4rem' }}>
          Password Required
        </h1>
        <p className="error-subtitle" style={{ marginBottom: '0.3rem' }}>
          This short link is password protected.
        </p>
        <p className="error-detail" style={{ marginBottom: '1.75rem' }}>
          Enter the password shared with you by the link owner to access the destination.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
              style={{
                fontSize: '1rem',
                paddingRight: '2.8rem',
                borderRadius: '12px',
                border: error ? '1.5px solid #ef4444' : '1.5px solid var(--border-color)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              style={{
                position: 'absolute', right: '0.85rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--gray)', padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.85rem', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.8rem 1.5rem',
              background: loading ? '#a78bfa' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying…</>
            ) : (
              <>Unlock <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
