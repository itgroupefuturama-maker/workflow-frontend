import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface MilesCompagnie {
  compagnie: {
    id: string;
    code: string;
    libelle: string;
    dateApplication: string;
    status: string;
  };
  miles: number;
  idCompagnieClient: string;
}

export interface ClientMiles {
  beneficiaire: {
    id: string;
    code: string;
    libelle: string;
    statut: string;
    dateApplication: string;
    dateCreation: string;
    updatedAt: string;
    typeClient: string;
  };
  milesCompagnie: MilesCompagnie[];
  milesABT: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchAllMilesParams {
  page: number;
  limit: number;
  search?: string;
  statut?: string;
  typeClient?: string;
}

interface ClientMilesState {
  items: ClientMiles[];
  meta: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const initialState: ClientMilesState = {
  items: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  error: null,
};

// Fetch paginé + recherche/filtre côté serveur. Seul consommateur de ce slice :
// TabMilesClient.tsx — pas besoin de dupliquer l'état, on transforme directement
// le thunk existant en version paginée.
export const fetchAllMiles = createAsyncThunk<
  { data: ClientMiles[]; meta: PaginationMeta },
  FetchAllMilesParams,
  { rejectValue: string }
>(
  'clientMiles/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/client-beneficiaires/all-miles', { params });
      if (!res.data.success) throw new Error();
      // Mode paginé : res.data.data = { data: ClientMiles[], meta: PaginationMeta }
      const payload = res.data.data;
      return { data: payload.data as ClientMiles[], meta: payload.meta as PaginationMeta };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement miles');
    }
  }
);

const clientMilesSlice = createSlice({
  name: 'clientMiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMiles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchAllMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default clientMilesSlice.reducer;