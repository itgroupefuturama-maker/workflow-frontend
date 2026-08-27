import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
// types/authTypes.ts ou directement dans le slice

interface PrivilegeDetail {
  id: string;
  privilege: string;
  fonctionnalite: string;
  status: string; // "CREER" | "ACTIF" | etc.
  dateActivation: string | null;
  dateDesactivation: string | null;
}

interface Privilege {
  profileId: string;
  privilegeId: string;
  dateAttribution: string;
  status: string; // "ACTIF"
  privilege: PrivilegeDetail;
}

interface ModuleDetail {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string; // "CREER" | etc.
  dateActivation: string | null;
  dateDesactivation: string | null;
}

interface Module {
  profileId: string;
  moduleId: string;
  dateAttribution: string;
  status: string;
  module: ModuleDetail;
}

interface ProfileDetail {
  id: string;
  profil: string; // nom du profil comme "ADMIN", "AGENT SIMPLE"
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string;
  privileges: Privilege[];
  modules: Module[];
  autorisations: any[]; // vide pour l'instant
}

interface UserProfile {
  userId: string;
  profileId: string;
  dateAffectation: string;
  status: string; // "ACTIF"
  profile: ProfileDetail;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  departement: string;
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string; // "INACTIF" | "ACTIF"
  profiles: UserProfile[];
  autorisation: any[]; // vide
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}

// `isAuthenticated`/`user` sont persistés via redux-persist (state normal). `token` en est
// explicitement exclu (voir le transform dans app/store.ts) : il ne doit jamais être écrit sur
// disque — seulement gardé en mémoire le temps de la session, requis pour l'auth du handshake
// Socket.io. L'authentification HTTP repose sur le cookie httpOnly, pas sur ce token.
const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;