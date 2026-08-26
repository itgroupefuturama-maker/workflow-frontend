import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import io, { Socket } from 'socket.io-client';
import AppBar from '../components/AppBar'; // ton AppBar actuelle
import { fetchDossiersCommuns } from '../app/front_office/dossierCommunSlice';
import { fetchPrivileges } from '../app/back_office/privilegesSlice';
import { fetchProfiles } from '../app/back_office/profilesSlice';
import { fetchAutorisations } from '../app/back_office/autorisationsSlice';
import { fetchUsers } from '../app/back_office/usersSlice';
import { fetchTransactionTypes } from '../app/back_office/transactionTypesSlice';
import { fetchTransactions } from '../app/back_office/transactionsSlice';
import { fetchModules } from '../app/back_office/modulesSlice';
import { fetchModeles} from '../app/back_office/modelesSlice';
import { fetchCommissions } from '../app/back_office/commissionsSlice';
import { fetchDossiers } from '../app/back_office/numerotationSlice';
import { fetchMiles } from '../app/back_office/milesSlice';
import { fetchPieces } from '../app/back_office/piecesSlice';
import { fetchClientBeneficiaires } from '../app/back_office/clientBeneficiairesSlice';
import { fetchDevisTransactions } from '../app/back_office/devisTransactionsSlice';
import { fetchClientFactures } from '../app/back_office/clientFacturesSlice';
import { fetchArticles } from '../app/back_office/articlesSlice';
import { fetchFournisseurs } from '../app/back_office/fournisseursSlice';
import { store } from '../app/store';
import type { RootState, AppDispatch } from '../app/store';
import { setSocketConnected, notificationReceived } from '../app/uiSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ParametreLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((state: RootState) => state.auth);

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

    // Écoute l'événement 'notification' (cloche AppBar, voir FRONTEND_PROMPT_REASSIGNATION_COLAB.md)
    socket.on('notification', (data: any) => {
      if (
        data.entityType === 'NOTIFICATION' &&
        data.action === 'CREATE' &&
        data.receiverId === user.id
      ) {
        dispatch(notificationReceived());

        // Optionnel : refresh des données concernées
        if (data.payload?.relatedEntity === 'DOSSIER_COMMUN') {
          dispatch(fetchDossiersCommuns());
        }
        // Tu peux ajouter des conditions pour d'autres entités (ex: 'CLIENT_FACTURE' → fetchClientFactures())
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.id, dispatch]);

  // Chargement initial des données globales
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Chargement conditionnel (seulement si pas déjà chargé)
    const loadGlobalData = () => {
      if (!token) return;

      dispatch(fetchDossiersCommuns());

      // Exemples : charge seulement si vide
      dispatch(fetchPrivileges());
      dispatch(fetchProfiles());
      dispatch(fetchAutorisations());
      dispatch(fetchUsers());
      dispatch(fetchTransactionTypes());
      dispatch(fetchTransactions());
      dispatch(fetchModules());
      dispatch(fetchModeles());
      dispatch(fetchCommissions());
      dispatch(fetchDossiers()); // numerotation
      dispatch(fetchMiles());
      dispatch(fetchPieces());
      dispatch(fetchClientBeneficiaires());
      dispatch(fetchDevisTransactions());
      dispatch(fetchClientFactures());
      dispatch(fetchArticles());
      dispatch(fetchFournisseurs());
    };

    loadGlobalData();

    // Optionnel : refresh toutes les X minutes
    // const interval = setInterval(loadGlobalData, 5 * 60 * 1000); // 5 min

    // return () => clearInterval(interval);
  }, [dispatch, token, navigate]);
  return (
    <div className="flex flex-col h-screen bg-slate-200">
      <AppBar isBackOffice={true} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
