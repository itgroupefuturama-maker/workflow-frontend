import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ────────────────────────────────────────────────────

type GoogleAccount = {
  id: string;
  email: string;
  calendarId: string;
  createdAt: string;
  updatedAt: string;
};

type Privilege = {
  id: string;
  privilege: string;
  fonctionnalite: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
};

type ProfilePrivilege = {
  profileId: string;
  privilegeId: string;
  dateAttribution: string;
  status: string;
  privilege: Privilege;
};

type Module = {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
};

type ProfileModule = {
  profileId: string;
  moduleId: string;
  dateAttribution: string;
  status: string;
  module: Module;
};

type Profile = {
  id: string;
  profil: string;
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string;
  privileges: ProfilePrivilege[];
  modules: ProfileModule[];
  autorisations: any[];
};

type UserProfile = {
  userId: string;
  profileId: string;
  dateAffectation: string;
  status: string;
  profile: Profile;
};

export type CurrentUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  departement: string;
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string;
  googleAccount: GoogleAccount[];
  profiles: UserProfile[];
  autorisation: any[];
};

type UserState = {
  data: CurrentUser | null;
  loading: boolean;
  error: string | null;
};

// ── Initial state ────────────────────────────────────────────

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
};

// ── Thunk ────────────────────────────────────────────────────

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/users/me');
      if (!response.data.success) throw new Error('Réponse non réussie');
      return response.data.data as CurrentUser;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement du profil utilisateur'
      );
    }
  }
);

export const fetchGoogleCalendarAuthUrl = createAsyncThunk(
  'user/fetchGoogleCalendarAuth',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/google-calendar/auth/${userId}`);
      if (!response.data.success) throw new Error('Réponse non réussie');
      return response.data.data.url as string;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la récupération du lien Google'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<CurrentUser>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;