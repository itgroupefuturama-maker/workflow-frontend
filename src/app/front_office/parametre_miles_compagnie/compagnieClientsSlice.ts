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

interface CompagnieClientsState {
  items: CompagnieClient[];
  searchResults: CompagnieClient[];   // ← nouveau
  loadingSearch: boolean;  
  loading: boolean;
  error: string | null;
}

const initialState: CompagnieClientsState = {
  items: [],
  searchResults: [],
  loadingSearch: false,
  loading: false,
  error: null,
};

export const fetchCompagnieClients = createAsyncThunk(
  'compagnieClients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/compagnie-clients');
      if (!res.data.success) throw new Error();
      return res.data.data as CompagnieClient[];
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
  async (payload: CreateCompagnieClientPayload, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/compagnie-clients', payload);
      if (!res.data.success) throw new Error();
      dispatch(fetchCompagnieClients());
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
  async (payload: AddMilesPayload, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/compagnie-clients/miles', payload);
      if (!res.data.success) throw new Error();
      dispatch(fetchCompagnieClients());
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur ajout miles');
    }
  }
);

export const updateMilesCompagnie = createAsyncThunk(
  'compagnieClients/updateMiles',
  async ({ id, miles }: { id: string; miles: number }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/compagnie-clients/miles/${id}`, { miles });
      if (!res.data.success) throw new Error();
      dispatch(fetchCompagnieClients());
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
      .addCase(fetchCompagnieClients.fulfilled, (state, action: PayloadAction<CompagnieClient[]>) => {
        state.loading = false;
        state.items = action.payload;
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