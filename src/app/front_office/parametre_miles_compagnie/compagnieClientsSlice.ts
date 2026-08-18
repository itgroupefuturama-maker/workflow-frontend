import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface MilesCompagnie {
  id: string;
  miles: number;
  dateExpiration: string;
  compagnieClientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompagnieClient {
  id: string;
  identifiant: string;
  motDePasse: string;
  numeroCarte: string;
  clientBeneficiaireId: string;
  fournisseurId: string;
  createdAt: string;
  updatedAt: string;
  milesCompagnie: MilesCompagnie[];
  clientBeneficiaire: {
    id: string;
    code: string;
    libelle: string;
    statut: string;
    typeClient: string;
  };
  fournisseur: {
    id: string;
    code: string;
    libelle: string;
    status: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchCompagnieClientsParams {
  page: number;
  limit: number;
  search?: string;
}

interface CompagnieClientsState {
  items: CompagnieClient[];
  meta: PaginationMeta;
  searchResults: CompagnieClient[];   // ← nouveau
  loadingSearch: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CompagnieClientsState = {
  items: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  searchResults: [],
  loadingSearch: false,
  loading: false,
  error: null,
};

// Fetch paginé + recherche côté serveur (page/limit/search) — seul consommateur :
// PageMilesCompagnie.tsx (aucun autre écran n'utilise ce thunk ni `items`).
export const fetchCompagnieClients = createAsyncThunk(
  'compagnieClients/fetchAll',
  async (params: FetchCompagnieClientsParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/compagnie-clients', { params });
      if (!res.data.success) throw new Error();
      // Mode paginé : response.data.data = { data: CompagnieClient[], meta: PaginationMeta }
      const payload = res.data.data;
      return { data: payload.data as CompagnieClient[], meta: payload.meta as PaginationMeta };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement compagnie clients');
    }
  }
);

export interface CreateCompagnieClientPayload {
  identifiant: string;
  motDePasse: string;
  numeroCarte: string;
  clientBeneficiaireId: string;
  fournisseurId: string;
  miles: { miles: number; dateExpiration: string }[];
}

export const createCompagnieClient = createAsyncThunk(
  'compagnieClients/create',
  async (payload: CreateCompagnieClientPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/compagnie-clients', payload);
      if (!res.data.success) throw new Error();
      // Le rechargement de la liste paginée est géré par l'écran appelant (loadList()).
      return res.data.data as CompagnieClient;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création compagnie client');
    }
  }
);

export interface AddMilesPayload {
  miles: number;
  dateExpiration: string;
  compagnieClientId: string;
}

export const addMilesCompagnie = createAsyncThunk(
  'compagnieClients/addMiles',
  async (payload: AddMilesPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/compagnie-clients/miles', payload);
      if (!res.data.success) throw new Error();
      // Le rechargement de la liste paginée est géré par l'écran appelant (loadList()).
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur ajout miles');
    }
  }
);

export const updateMilesCompagnie = createAsyncThunk(
  'compagnieClients/updateMiles',
  async ({ id, miles }: { id: string; miles: number }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/compagnie-clients/miles/${id}`, { miles });
      if (!res.data.success) throw new Error();
      // Le rechargement de la liste paginée est géré par l'écran appelant (loadList()).
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur mise à jour miles');
    }
  }
);

export const searchCompagnieClientsByBenef = createAsyncThunk(
  'compagnieClients/searchByBenef',
  async (clientBeneficiaireId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/compagnie-clients/search/${clientBeneficiaireId}`);
      if (!res.data.success) throw new Error();
      return res.data.data as CompagnieClient[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur recherche');
    }
  }
);

const compagnieClientsSlice = createSlice({
  name: 'compagnieClients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompagnieClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompagnieClients.fulfilled, (state, action: PayloadAction<{ data: CompagnieClient[]; meta: PaginationMeta }>) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCompagnieClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createCompagnieClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompagnieClient.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCompagnieClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addMilesCompagnie.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMilesCompagnie.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addMilesCompagnie.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateMilesCompagnie.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateMilesCompagnie.fulfilled, (state) => { state.loading = false; })
      .addCase(updateMilesCompagnie.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchCompagnieClientsByBenef.pending, (state) => {
        state.loadingSearch = true;
        state.error = null;
      })
      .addCase(searchCompagnieClientsByBenef.fulfilled, (state, action: PayloadAction<CompagnieClient[]>) => {
        state.loadingSearch = false;
        state.searchResults = action.payload;
      })
      .addCase(searchCompagnieClientsByBenef.rejected, (state, action) => {
        state.loadingSearch = false;
        state.error = action.payload as string;
      });
  },
});

export default compagnieClientsSlice.reducer;