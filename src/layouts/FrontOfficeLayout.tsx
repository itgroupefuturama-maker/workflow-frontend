import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import io, { Socket } from 'socket.io-client';
import AppBar from '../components/AppBar'; // ton AppBar actuelle
import { store } from '../app/store';
import type { RootState, AppDispatch } from '../app/store';
import { setSocketConnected } from '../app/uiSlice';
import AppLoader from './AppLoader';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function FrontOfficeLayout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // Gestion du socket global
  useEffect(() => {
    if (!token || !user?.id) return;

    const socket: Socket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      // Fonction plutôt qu'objet statique : chaque tentative de connexion/reconnexion
      // (y compris la reconnexion automatique interne de Socket.io) relit le token
      // courant dans le store, au lieu de renvoyer celui figé à la création du socket.
      auth: (cb) => cb({ token: store.getState().auth.token }),
    });

    // Indicateur "hors ligne" (AppBar) — reflète l'état réel de la connexion socket,
    // y compris les coupures/reprises réseau après la connexion initiale.
    socket.on('connect', () => dispatch(setSocketConnected(true)));
    socket.on('disconnect', () => dispatch(setSocketConnected(false)));
    socket.on('connect_error', () => dispatch(setSocketConnected(false)));

    return () => {
      socket.disconnect();
    };
  }, [token, user?.id, dispatch]);

  return (
    <AppLoader>
      <div className="flex flex-col h-screen bg-slate-300">
        <AppBar isBackOffice={false} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AppLoader>
  );
}