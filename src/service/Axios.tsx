import axios from 'axios';
import { API_PROXY_URL } from './env'; // Ton fallback pour .env
import { store } from '../app/store'; // Importe ton Redux store (assure-toi que c'est exporté depuis app/store.ts)
import { login, logout } from '../app/authSlice'; // Importe les actions Redux

const axiosInstance = axios.create({
  baseURL: API_PROXY_URL,
  withCredentials: true, // envoie/reçoit les cookies httpOnly d'auth (access_token, refresh_token, csrf_token)
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  },
});

// Variable pour éviter les refreshes multiples en parallèle
let isRefreshing = false;
let failedQueue: any[] = []; // File d'attente des requêtes échouées à retenter après refresh

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Demande un nouvel access_token via le cookie httpOnly refresh_token (rotation gérée côté
// serveur). Ne touche jamais au localStorage — le token vit uniquement en mémoire (Redux),
// nécessaire pour l'auth du handshake Socket.io. Réutilisée par l'intercepteur 401 ci-dessous et
// par ProtectedRoute.tsx (bootstrap au chargement, quand la page a été rechargée et que le token
// n'est plus en mémoire).
export async function refreshAccessToken(): Promise<string> {
  // Appel axios "brut" (pas axiosInstance) : ne passe pas par l'intercepteur de requête qui pose
  // X-CSRF-Token, donc on le fait ici à la main — POST /auth/refresh est une requête mutante,
  // rejetée en 403 sans ce header dès qu'un cookie d'auth est présent.
  const csrfToken = getCookie('csrf_token');
  const refreshResponse = await axios.post(`${API_PROXY_URL}/auth/refresh`, {}, {
    withCredentials: true,
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
  });

  if (!refreshResponse.data.success) {
    throw new Error('Refresh failed');
  }

  const { access_token } = refreshResponse.data.data;

  store.dispatch(
    login({
      token: access_token,
      user: store.getState().auth.user || { id: 'unknown', email: '', nom: '', prenom: '', pseudo: '', departement: '', dateCreation: '', dateActivation: '', dateDesactivation: '', status: '', profiles: [], autorisation: []},
    })
  );

  return access_token;
}

const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];

// Intercepteur de REQUÊTE : Ajoute le token Authorization (mode dual, en cours de transition
// vers les cookies httpOnly) et le header CSRF requis dès qu'un cookie d'auth est présent.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token; // Récupère le token depuis Redux
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method && MUTATING_METHODS.includes(config.method)) {
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de RÉPONSE : Gère les erreurs 401
axiosInstance.interceptors.response.use(
  (response) => response, // Si succès, passe directement
  async (error) => {
    const originalRequest = error.config;

    // Vérifie si c'est une erreur 401 "Invalid token" et que ce n'est pas déjà une retry
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === 'Invalid token' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, mets la requête en attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest)) // Retry après refresh réussi
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true; // Marque comme retry pour éviter boucle infinie
      isRefreshing = true;

      try {
        const access_token = await refreshAccessToken();

        // Met à jour le header de la requête originale
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Traite la file d'attente
        processQueue();

        // Retry la requête originale
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("ALERTE : Le refresh a échoué, tentative de déconnexion !", refreshError);
        processQueue(refreshError);
        store.dispatch(logout()); // Commentez temporairement cette ligne pour tester
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Si ce n'est pas géré, rejette l'erreur normalement
    return Promise.reject(error);
  }
);

export default axiosInstance;