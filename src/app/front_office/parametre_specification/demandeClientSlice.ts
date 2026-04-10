import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ──────────────────────────────────────────────────────────────────
export type CreateDemandeClientBatchPayload = {
  prestationId: string;
  numero: number;
  fields: {
    demandeClientAttributId: string; // vide "" si nouvel attribut
    nom: string;
    valeur: string;
  }[];
};


export type DemandeClientAttribut = {
  id: string;
  nom: string;
  type: string;
  valeurType: string;
  createdAt: string;
  updatedAt: string;
};

export type DemandeClientItem = {
  id: string;
  valeur: string;
  numero: number;
  prestationId: string;
  demandeClientAttributId: string;
  createdAt: string;
  updatedAt: string;
  demandeClientAttribut: DemandeClientAttribut;
};

export type DemandeClientGroupe = {
  numero: number;
  items: DemandeClientItem[];
};

type DemandeClientState = {
  groupesParPrestation: Record<string, DemandeClientGroupe[]>; // ← Record au lieu de tableau
  activeTabParPrestation: Record<string, number>;
  loading: boolean;
  creating: boolean;
  error: string | null;
};

const initialState: DemandeClientState = {
  groupesParPrestation: {} as Record<string, DemandeClientGroupe[]>, // ← cast explicite
  activeTabParPrestation: {} as Record<string, number>,
  loading: false,
  creating: false,
  error: null,
};

// ── Thunk ──────────────────────────────────────────────────────────────────

export const fetchDemandeClient = createAsyncThunk(
  'demandeClient/fetchByPrestation',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/demande-clients/prestation/${prestationId}`);
      if (!response.data.success) throw new Error('Réponse invalide');
      return { prestationId, groupes: response.data.data as DemandeClientGroupe[] }; // ← retourne les deux
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur chargement demandes client'
      );
    }
  }
);

export const createDemandeClientBatch = createAsyncThunk(
  'demandeClient/createBatch',
  async (payload: CreateDemandeClientBatchPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/demande-clients/batch', payload);
      if (!response.data.success) throw new Error('Réponse invalide');
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur création demande client'
      );
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const demandeClientSlice = createSlice({
  name: 'demandeClient',
  initialState,
  reducers: {
    clearDemandeClient: (state) => {
      state.groupesParPrestation = {}; // ← reset l'objet entier
      state.activeTabParPrestation = {};
      state.error = null;
    },
    setActiveTabForPrestation: (state, action) => {
      const { prestationId, numero } = action.payload;
      if (!state.activeTabParPrestation) {
        state.activeTabParPrestation = {};
      }
      state.activeTabParPrestation[prestationId] = numero;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDemandeClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDemandeClient.fulfilled, (state, action) => {
        state.loading = false;
        const { prestationId, groupes } = action.payload;
        if (!state.groupesParPrestation) {
          state.groupesParPrestation = {}; // ← garde si undefined
        }
        state.groupesParPrestation[prestationId] = groupes;
      })
      .addCase(fetchDemandeClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createDemandeClientBatch — inchangé
      .addCase(createDemandeClientBatch.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createDemandeClientBatch.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createDemandeClientBatch.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDemandeClient, setActiveTabForPrestation } = demandeClientSlice.actions;
export default demandeClientSlice.reducer;