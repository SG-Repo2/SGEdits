import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePortal } from '../app/providers/PortalProvider';

export function RequireAuth() {
  const { currentProfile } = usePortal();
  const location = useLocation();

  if (!currentProfile) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}

export function RequireRole({ role }) {
  const { currentProfile } = usePortal();

  if (!currentProfile) {
    return <Navigate replace to="/login" />;
  }

  if (currentProfile.role !== role) {
    return <Navigate replace to={currentProfile.homePath} />;
  }

  return <Outlet />;
}

export function RoleHomeRedirect() {
  const { currentProfile } = usePortal();

  if (!currentProfile) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to={currentProfile.homePath} />;
}
