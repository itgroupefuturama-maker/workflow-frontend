import axios from 'axios';
import { API_URL } from './env'; // Ton fallback pour .env
import { store } from '../app/store'; // Importe ton Redux store (assure-toi que c'est exporté depuis app/store.ts)
import { login, logout } from '../app/authSlice'; // Importe les actions Redux

const axiosInstance = axios.create({
  baseURL: API_URL,
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
        // Le refresh token vit désormais dans un cookie httpOnly (restreint au path /auth),
        // envoyé automatiquement grâce à `withCredentials`. Le refresh token est tourné à
        // chaque appel côté serveur — on ne le lit/stocke plus depuis le localStorage.
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        if (refreshResponse.data.success) {
          const { access_token, refresh_token: newRefreshToken, expiresIn } = refreshResponse.data.data;

          // Met à jour Redux et localStorage avec le nouveau token
          store.dispatch(
            login({
              token: access_token,
              user: store.getState().auth.user || { id: 'unknown', email: '', nom: '', prenom: '', pseudo: '', departement: '', dateCreation: '', dateActivation: '', dateDesactivation: '', status: '', profiles: [], autorisation: []}, // Garde l'user existant
            })
          );
          localStorage.setItem('token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          localStorage.setItem('token_expiresIn', expiresIn.toString());

          // Met à jour le header de la requête originale
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Traite la file d'attente
          processQueue();

          // Retry la requête originale
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
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