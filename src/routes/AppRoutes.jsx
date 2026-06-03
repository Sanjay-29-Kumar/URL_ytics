import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import AuthPage from '../pages/AuthPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function AppRoutes({
  user,
  token,
  handleAuthSuccess,
  handleLogout,
  urls,
  setUrls,
  hasFetchedUrls,
  setHasFetchedUrls
}) {
  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <LandingPage />
      } />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" onSuccess={handleAuthSuccess} />
      } />
      <Route path="/signup" element={
        user ? <Navigate to="/dashboard" replace /> : <AuthPage mode="signup" onSuccess={handleAuthSuccess} />
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute user={user} token={token}>
          <Dashboard
            user={user}
            token={token}
            onLogout={handleLogout}
            urls={urls}
            setUrls={setUrls}
            hasFetchedUrls={hasFetchedUrls}
            setHasFetchedUrls={setHasFetchedUrls}
          />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/:tab" element={
        <ProtectedRoute user={user} token={token}>
          <Dashboard
            user={user}
            token={token}
            onLogout={handleLogout}
            urls={urls}
            setUrls={setUrls}
            hasFetchedUrls={hasFetchedUrls}
            setHasFetchedUrls={setHasFetchedUrls}
          />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/:tab/:urlId" element={
        <ProtectedRoute user={user} token={token}>
          <Dashboard
            user={user}
            token={token}
            onLogout={handleLogout}
            urls={urls}
            setUrls={setUrls}
            hasFetchedUrls={hasFetchedUrls}
            setHasFetchedUrls={setHasFetchedUrls}
          />
        </ProtectedRoute>
      } />
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
