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

    let cancelled = false;
    let attempt = 0;

    const attemptRefresh = () => {
      refreshAccessToken()
        .then(() => {
          if (!cancelled) setBootstrapping(false);
        })
        .catch((error) => {
          if (cancelled) return;

          // Pas de réponse du serveur (timeout, wifi coupé, backend injoignable) : ce n'est
          // pas une session invalide, juste une coupure réseau. On ne déconnecte pas —
          // on retente avec un backoff, comme le fait déjà Socket.io pour le temps réel.
          const isNetworkError = !error?.response;
          if (isNetworkError) {
            attempt += 1;
            const delay = Math.min(3000 * attempt, 15000);
            setTimeout(() => {
              if (!cancelled) attemptRefresh();
            }, delay);
            return;
          }

          // Le serveur a répondu (401/403...) : le cookie refresh_token est bien absent/expiré,
          // l'utilisateur n'est en fait plus authentifié malgré isAuthenticated=true persisté.
          dispatch(logout());
          setBootstrapping(false);
        });
    };

    attemptRefresh();

    return () => {
      cancelled = true;
    };
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
