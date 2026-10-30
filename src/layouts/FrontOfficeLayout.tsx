import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import io, { Socket } from 'socket.io-client';
import AppBar from '../components/AppBar'; // ton AppBar actuelle
import { store } from '../app/store';
import type { RootState, AppDispatch } from '../app/store';
import { setSocketConnected, notificationReceived } from '../app/uiSlice';
import { emitBilletStatut, emitNotification, type BilletStatutEvent } from '../service/notifications';
import AppLoader from './AppLoader';
import PageLoader from '../components/PageLoader';
import { toast } from '../components/Toast/toast';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function FrontOfficeLayout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // true dès qu'une coupure a été détectée — sert à distinguer la connexion initiale
  // (silencieuse) d'une reconnexion après coupure (qui déclenche le toast ci-dessous).
  const wasDisconnected = useRef(false);

  // Gestion du socket global
  useEffect(() => {
    if (!token || !user?.id) return;

    const socket: Socket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      // Pas de reconnectionAttempts : Socket.io retente indéfiniment (défaut = Infinity).
      // Avec un plafond fini, le client abandonnait après ~15-20s et restait bloqué en
      // "Hors ligne" si le serveur mettait plus longtemps à revenir (nécessitait un F5).
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      // Fonction plutôt qu'objet statique : chaque tentative de connexion/reconnexion
      // (y compris la reconnexion automatique interne de Socket.io) relit le token
      // courant dans le store, au lieu de renvoyer celui figé à la création du socket.
      auth: (cb) => cb({ token: store.getState().auth.token }),
    });

    // Indicateur "hors ligne" (AppBar) — reflète l'état réel de la connexion socket,
    // y compris les coupures/reprises réseau après la connexion initiale.
    socket.on('connect', () => {
      dispatch(setSocketConnected(true));
      if (wasDisconnected.current) {
        toast.success('Connexion au serveur rétablie.');
        wasDisconnected.current = false;
      }
    });
    socket.on('disconnect', () => {
      dispatch(setSocketConnected(false));
      wasDisconnected.current = true;
    });
    socket.on('connect_error', () => {
      dispatch(setSocketConnected(false));
      wasDisconnected.current = true;
    });

    // Notifications temps réel (cloche AppBar) — voir FRONTEND_PROMPT_REASSIGNATION_COLAB.md
    // Si la notification complète est jointe (nouveau format), la cloche l'ajoute directement en tête ;
    // sinon (ancien format), elle recharge sa liste — voir FRONTEND_PROMPT_NOTIFICATIONS_ODOO_BILLET.md
    socket.on('notification', (data: any) => {
      if (data?.entityType === 'NOTIFICATION' && data?.action === 'CREATE' && data?.receiverId === user.id) {
        if (data.notification) emitNotification(data.notification);
        else dispatch(notificationReceived());
      }
    });

    // Changement de statut d'un billet par Odoo (envoyé à tous) : la page Billet se recharge si concernée
    socket.on('billet:statut', (data: BilletStatutEvent) => emitBilletStatut(data));

    return () => {
      socket.disconnect();
    };
  }, [token, user?.id, dispatch]);

  return (
    <AppLoader>
      <div className="flex flex-col h-screen bg-slate-300">
        <AppBar isBackOffice={false} />
        <main className="flex-1 min-h-0 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </AppLoader>
  );
}