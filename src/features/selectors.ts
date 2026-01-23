import type { RootState } from '../app/store';

export const getUser = (state: RootState) => state.auth.user;  // Pointe vers ton auth.user

// Autres sélecteurs si besoin
export const getIsAuthenticated = (state: RootState) => !!state.auth.token;