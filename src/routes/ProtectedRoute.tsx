import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/states/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Array<'CANDIDATE' | 'EVALUATOR' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Forbidden />;
  }

  return <>{children}</>;
};

/** Signed in but not allowed here: back to the dashboard with a note, not the landing page. */
const Forbidden: React.FC = () => {
  useEffect(() => {
    // Fixed id: StrictMode's double effect (or a quick re-render) shows a single toast
    toast.error("You don't have access to that page.", { id: 'forbidden-route' });
  }, []);
  return <Navigate to="/dashboard" replace />;
};
