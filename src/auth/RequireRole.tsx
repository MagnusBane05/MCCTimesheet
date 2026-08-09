import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../domain/user';
import { useAuth } from './AuthContext';

function homeRouteFor(role: UserRole): string {
  return role === 'EMPLOYEE' ? '/timesheets' : '/admin/by-employee';
}

/**
 * Front-end route guard for prototype UX only — it hides pages a role
 * shouldn't see. It is NOT a security boundary: the future Django API must
 * independently enforce authorization on every protected operation, since a
 * client can always bypass front-end routing.
 */
export function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={homeRouteFor(currentUser.role)} replace />;
  }
  return <Outlet />;
}
