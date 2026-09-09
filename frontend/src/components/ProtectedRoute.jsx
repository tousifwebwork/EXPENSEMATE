import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppChrome from './AppChrome';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppChrome>{children}</AppChrome>;
}
