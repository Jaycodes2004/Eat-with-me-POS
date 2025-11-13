import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  permission?: string | string[];
}

export const ProtectedRoute = ({ permission }: ProtectedRouteProps) => {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    // Optional: Redirect to a dedicated 'Unauthorized' page or back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // Render the child route component if authorized
};