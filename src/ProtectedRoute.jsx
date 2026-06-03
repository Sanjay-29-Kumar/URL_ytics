import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ user, token, children }) {
  const location = useLocation();

  if (!user || !token) {
    // Redirect to login page and save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
