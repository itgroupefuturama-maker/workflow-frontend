import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import { refreshAccessToken } from '../service/Axios';
import { logout } from '../app/authSlice';
import PageLoader from '../components/PageLoader';

function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  // Le token n'est jamais persisté (voir app/store.ts) : au rechargement de la page,
  // `isAuthenticated`/`user` reviennent via redux-persist mais `token` est vide tant qu'on n'a
  // pas redemandé un access_token frais via le cookie httpOnly refresh_token. Sans ça, ni
  // AppLoader (fetch initial gaté par `token`) ni Socket.io ne démarreraient.
  const [bootstrapping, setBootstrapping] = useState(isAuthenticated && !token);

  useEffect(() => {
    if (!isAuthenticated || token) {
      setBootstrapping(false);
      return;
    }
    refreshAccessToken()
      .catch(() => {
        // Cookie absent/expiré : l'utilisateur n'est en fait plus authentifié malgré
        // isAuthenticated=true persisté — sans ça il resterait bloqué en bootstrapping infini
        // ou passerait à travers avec un token toujours vide.
        dispatch(logout());
      })
      .finally(() => setBootstrapping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (bootstrapping) return <PageLoader />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAdminProfile = user?.profiles?.some(
    (p: any) => p.profile?.profil === 'ADMIN'
  );

  if (adminOnly && !hasAdminProfile) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
