import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface Passager {
  dateDepart: string;
  owner: string;
  pnr: string;
  nom: string;
  typeVol: string;
  numeroVol: string;
  itineraire: string;
  heureDepart: string;
  heureArrive: string;
  status: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchPassagersByDateRangeParams {
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
  search?: string;
  statut?: string;
}

interface BilletState {
  passagers: Passager[];
  meta: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const initialState: BilletState = {
  passagers: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  error: null,
};

// ─── Thunk ────────────────────────────────────────────────────────────────────

// Fetch paginé + recherche/filtre côté serveur (startDate/endDate restent toujours
// requis) — seul consommateur : PageListePassage.tsx (table à l'écran). L'export/
// aperçu PDF de cet écran, lui, appelle l'API directement en mode legacy (sans
// page/limit) pour récupérer l'intégralité de la période — voir PageListePassage.tsx.
export const fetchPassagersByDateRange = createAsyncThunk(
  'billet/fetchByDateRange',
  async (params: FetchPassagersByDateRangeParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/billet/search-by-date-range', {
        params,
      });
      if (!res.data.success) throw new Error();
      // Mode paginé : response.data.data = { data: Passager[], meta: PaginationMeta }
      const payload = res.data.data;
      return { data: payload.data as Passager[], meta: payload.meta as PaginationMeta };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur chargement passagers'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const passagerListeSlice = createSlice({
  name: 'passagerListe',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPassagersByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPassagersByDateRange.fulfilled,
        (state, action: PayloadAction<{ data: Passager[]; meta: PaginationMeta }>) => {
          state.loading = false;
          state.passagers = action.payload.data;
          state.meta = action.payload.meta;
        }
      )
      .addCase(fetchPassagersByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default passagerListeSlice.reducer;