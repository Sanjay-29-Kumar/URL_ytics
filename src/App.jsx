import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorPage from './pages/ErrorPage.jsx';
import PasswordUnlockPage from './pages/PasswordUnlockPage.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { getMe } from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [linkError, setLinkError] = useState(null); // 'link_disabled' | 'link_expired' | 'not_found' | 'server_error'
  const [unlockCode, setUnlockCode] = useState(null); // shortCode for password-protected links
  const navigate = useNavigate();

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
      const data = await getMe(authToken);
      setUser(data.user);
    } catch (e) {
      console.warn('Could not verify session with server, keeping local session cache');
      // If we got an error that is not a connection issue, handle logout
      if (e.message && e.message !== 'Failed to verify session') {
        handleLogout();
      }
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
    navigate('/');
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
        onGoHome={() => {
          setUnlockCode(null);
          navigate('/');
        }}
      />
    );
  }

  // Show error page if redirected with an error param
  if (linkError) {
    return (
      <ErrorPage
        errorType={linkError}
        onGoHome={() => {
          setLinkError(null);
          navigate('/');
        }}
      />
    );
  }

  return (
    <AppRoutes
      user={user}
      token={token}
      handleAuthSuccess={handleAuthSuccess}
      handleLogout={handleLogout}
    />
  );
}

export default App;
