import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface RequirePasswordChangeProps {
  children: React.ReactNode;
}

export function RequirePasswordChange({ children }: RequirePasswordChangeProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.mustChangePassword) {
    return <Navigate to="/set-new-password" replace />;
  }

  return <>{children}</>;
}
