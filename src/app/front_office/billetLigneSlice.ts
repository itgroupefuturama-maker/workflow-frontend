// src/app/front_office/billetLigneSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchBilletLignesPaginatedParams {
  page?: number;
  limit?: number;
  search?: string;
  statut?: string;
  statusLigne?: string;
  billetEnteteId?: string;
}

// Formes peu typées (any) côté relations imbriquées — même convention que devisSlice.ts
// (Devis.data.entete) pour les objets backend profondément imbriqués non documentés champ par champ.
export interface BilletLigne {
  id: string;
  statut: string;
  statusLigne: string;
  createdAt: string;
  updatedAt: string;
  prospectionLigne: any;
  billetEntete: any;
  billet: any[];
}

interface BilletLigneState {
  items: BilletLigne[];
  meta: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const initialState: BilletLigneState = {
  items: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  error: null,
};

// GET /billet/ligne — toutes les lignes de billet, tous dossiers confondus, toujours paginée.
// Même enveloppe double que le reste de l'app (vérifié sur GET /devis via Swagger, malgré
// ce que documente FRONTEND_API_PAGINATION_DEVIS_BILLET_LIGNE.http) :
// response.data = { success, data: { data: BilletLigne[], meta: PaginationMeta } }.
export const fetchBilletLignesPaginated = createAsyncThunk(
  'billetLigne/fetchBilletLignesPaginated',
  async (params: FetchBilletLignesPaginatedParams, { rejectWithValue }) => {
    try {
      const response = await axios.get('/billet/ligne', { params });
      if (!response.data?.success) {
        return rejectWithValue(response.data?.message || 'Erreur lors du chargement des lignes de billet');
      }
      const payload = response.data.data;
      return { data: (payload.data ?? []) as BilletLigne[], meta: payload.meta as PaginationMeta };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des lignes de billet');
    }
  }
);

const billetLigneSlice = createSlice({
  name: 'billetLigne',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBilletLignesPaginated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBilletLignesPaginated.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload.data) ? action.payload.data : [];
        state.meta = action.payload.meta ?? initialState.meta;
      })
      .addCase(fetchBilletLignesPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default billetLigneSlice.reducer;
