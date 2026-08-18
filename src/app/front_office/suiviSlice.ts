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
  // Liste paginée (Billet.tsx uniquement) — distincte de `list` ci-dessus.
  listData: Suivi[];
  listMeta: PaginationMeta;
  listLoading: boolean;
  listError: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchSuivisPaginatedParams {
  page: number;
  limit: number;
  search?: string;
  statut?: string;
  entity?: string;
}

const initialState: SuiviState = {
  list: [],
  loading: false,
  error: null,
  current: null,
  listData: [],
  listMeta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  listLoading: false,
  listError: null,
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

// Fetch paginé + recherche/filtre côté serveur (écran Billet.tsx uniquement).
// NB : `fetchSuivis` ci-dessus n'est en réalité jamais lu dans l'UI (aucun composant
// ne sélectionne `state.suivi.list`) — voir le useEffect dans Billet.tsx. On bascule
// tout de même ce fetch global sur la pagination pour éviter de rapatrier toute la
// table à chaque changement d'entête, mais il n'y a pas de tableau à brancher sur
// `listMeta`/<Pagination> côté écran.
export const fetchSuivisPaginated = createAsyncThunk(
  'suivi/fetchSuivisPaginated',
  async (params: FetchSuivisPaginatedParams, { rejectWithValue }) => {
    try {
      const response = await axios.get('/suivi', { params });
      if (!response.data?.success) {
        return rejectWithValue('Échec récupération des suivis');
      }
      // response.data.data = { data: Suivi[], meta: PaginationMeta }
      const payload = response.data.data;
      return { data: payload.data as Suivi[], meta: payload.meta as PaginationMeta };
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
      })

      // fetchSuivisPaginated
      .addCase(fetchSuivisPaginated.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchSuivisPaginated.fulfilled, (state, action) => {
        state.listLoading = false;
        state.listData = action.payload.data;
        state.listMeta = action.payload.meta;
      })
      .addCase(fetchSuivisPaginated.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      });
  },
});

export default suiviSlice.reducer;