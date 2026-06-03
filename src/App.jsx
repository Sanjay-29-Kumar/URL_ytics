import { useState, useEffect } from 'react';
import LandingPage from './LandingPage.jsx';
import Dashboard from './Dashboard.jsx';
import AuthPage from './AuthPage.jsx';
import ErrorPage from './ErrorPage.jsx';
import PasswordUnlockPage from './PasswordUnlockPage.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'signup'
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [linkError, setLinkError] = useState(null); // 'link_disabled' | 'link_expired' | 'not_found' | 'server_error'
  const [unlockCode, setUnlockCode] = useState(null); // shortCode for password-protected links

  // Detect ?error= and ?unlock= params from redirect controller
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const unlock = params.get('unlock');
    if (error) {
      setLinkError(error);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (unlock) {
      setUnlockCode(unlock);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check auth session on load
  useEffect(() => {
    const storedToken = localStorage.getItem('urlytics_token');
    const storedUser = localStorage.getItem('urlytics_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verify session integrity with server
      verifySession(storedToken);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifySession = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok) {
        // Token is invalid/expired
        handleLogout();
      } else {
        setUser(data.user);
      }
    } catch (e) {
      console.warn('Could not verify session with server, keeping local session cache');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    // User is redirect to dashboard automatically
  };

  const handleLogout = () => {
    localStorage.removeItem('urlytics_token');
    localStorage.removeItem('urlytics_user');
    setToken(null);
    setUser(null);
    setCurrentView('landing');
  };

  if (checkingAuth) {
    return (
      <div className="modal-overlay" style={{ background: '#f8fafc' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Show password unlock page if redirected from a protected link
  if (unlockCode) {
    return (
      <PasswordUnlockPage
        shortCode={unlockCode}
        onGoHome={() => setUnlockCode(null)}
      />
    );
  }

  // Show error page if redirected with an error param
  if (linkError) {
    return (
      <ErrorPage
        errorType={linkError}
        onGoHome={() => setLinkError(null)}
      />
    );
  }

  // Dashboard takes precedence if logged in
  if (user && token) {
    return (
      <Dashboard 
        user={user} 
        token={token} 
        onLogout={handleLogout} 
      />
    );
  }

  // Standalone full page routing for guest sessions
  if (currentView === 'login' || currentView === 'signup') {
    return (
      <AuthPage 
        mode={currentView}
        onBack={() => setCurrentView('landing')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // Default to Landing Page
  return (
    <LandingPage 
      onOpenAuth={(tab) => setCurrentView(tab)} 
    />
  );
}

export default App;
