import { Navigate, Outlet } from 'react-router-dom';
import { useAuthorization } from '../hooks/useAuthorization';

interface ModuleRouteProps {
  module: string;
}

// Bloque l'accès à un module entier si l'utilisateur n'a pas au moins le niveau CONSULTATION
// dessus (aucun de ses profils actifs n'y donne accès). À utiliser en plus de ProtectedRoute,
// pas à la place — ProtectedRoute gère déjà l'authentification/l'accès back-office.
function ModuleRoute({ module }: ModuleRouteProps) {
  const { canConsult } = useAuthorization();

  if (!canConsult(module)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ModuleRoute;
