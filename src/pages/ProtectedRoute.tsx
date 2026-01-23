import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // DEBUG : Regardez ce qui s'affiche dans la console
  console.log("Chemin actuel:", window.location.pathname);
  console.log("Admin Only requis:", adminOnly);
  console.log("Profils utilisateur:", user?.profiles?.map((p: any) => p.profile?.profil));

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAdminProfile = user?.profiles?.some(
    (p: any) => p.profile?.profil === 'ADMIN'
  );

  if (adminOnly && !hasAdminProfile) {
    console.warn("Accès Admin refusé -> Redirection vers /");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;