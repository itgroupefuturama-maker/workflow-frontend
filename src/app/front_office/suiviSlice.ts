// src/app/front_office/suiviSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

// ─── Types ────────────────────────────────────────────────
export interface Suivi {
  id: string;
  evolution: string | null;
  statut: string;
  origineLigne: string;
  dateEnvoieDevis: string | null;
  dateApprobation: string | null;
  referenceBcClient: string | null;
  dateCreationBc: string | null;
  dateSoumisBc: string | null;
  dateApprobationBc: string | null;
  referenceFacClient: string | null;
  dateCreationFac: string | null;
  dateReglement: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SuiviState {
  list: Suivi[];
  loading: boolean;
  error: string | null;
  // Optionnel : si tu veux un suivi "actif" ou par ID
  current: Suivi | null;
}

const initialState: SuiviState = {
  list: [],
  loading: false,
  error: null,
  current: null,
};

// ─── Async Thunks ─────────────────────────────────────────
export const fetchSuivis = createAsyncThunk(
  'suivi/fetchSuivis',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/suivi'); // adapte si besoin : '/suivi?devisId=xxx'
      if (!response.data?.success) {
        throw new Error('Réponse invalide');
      }
      return response.data.data as Suivi[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des suivis');
    }
  }
);

// Optionnel : si tu veux fetch par devisId ou prospectionEnteteId plus tard
export const fetchSuivisByDevis = createAsyncThunk(
  'suivi/fetchSuivisByDevis',
  async (devisId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/suivi?devisId=${devisId}`); // adapte l'endpoint
      if (!response.data?.success) throw new Error('Erreur');
      return response.data.data as Suivi[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────
const suiviSlice = createSlice({
  name: 'suivi',
  initialState,
  reducers: {
    // Exemple : clearSuivis(state) { state.list = []; }
  },
  extraReducers: (builder) => {
    builder
      // fetchSuivis
      .addCase(fetchSuivis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuivis.fulfilled, (state, action: PayloadAction<Suivi[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSuivis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchSuivisByDevis (si tu l'utilises)
      .addCase(fetchSuivisByDevis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuivisByDevis.fulfilled, (state, action: PayloadAction<Suivi[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSuivisByDevis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default suiviSlice.reducer;