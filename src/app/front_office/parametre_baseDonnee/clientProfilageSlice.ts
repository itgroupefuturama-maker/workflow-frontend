import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from '../../../service/Axios';

export interface ClientProfilage {
  clientBeneficiaireId: string;
  code: string;
  libelle: string;
  nomComplet: string;
  typeClient: 'BRONZE' | 'SILVER' | 'GOLD' | 'SILVER' | 'PLATINIUM' | 'SIMPLE';
  modules: {
    ticketing: number;
    hotel: number;
    visa: number;
    attestation: number;
    assurance: number;
    total: number;
  };
  parAnnee: {
    annee: string;
    ticketing: number;
    hotel: number;
    visa: number;
    attestation: number;
    assurance: number;
    total: number;
  }[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchAllProfilagePaginatedParams {
  page: number;
  limit: number;
  search?: string;
}

interface State {
  data:    ClientProfilage | null;
  all:     ClientProfilage[];
  loading: boolean;
  error:   string | null;
  // Liste paginée (PageProfilage.tsx uniquement) — distincte de `all` ci-dessus.
  listData:    ClientProfilage[];
  listMeta:    PaginationMeta;
  listLoading: boolean;
  listError:   string | null;
}

const initialState: State = {
  data: null,
  all: [],
  loading: false,
  error: null,
  listData: [],
  listMeta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  listLoading: false,
  listError: null,
};

export const fetchClientProfilage = createAsyncThunk(
  "clientProfilage/fetch",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/profilage/client/${id}`);
      return res.data.data as ClientProfilage;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? "Erreur serveur");
    }
  }
);

export const fetchAllProfilage = createAsyncThunk(
  "clientProfilage/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/profilage/all');
      return res.data.data as ClientProfilage[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? "Erreur serveur");
    }
  }
);

// Fetch paginé + recherche côté serveur (écran PageProfilage.tsx uniquement).
// Chaque page déclenche un calcul de profil par client côté serveur (coûteux) —
// l'écran doit privilégier une `limit` raisonnable (10-20).
export const fetchAllProfilagePaginated = createAsyncThunk(
  "clientProfilage/fetchAllPaginated",
  async (params: FetchAllProfilagePaginatedParams, { rejectWithValue }) => {
    try {
      const res = await axios.get('/profilage/all', { params });
      if (!res.data.success) return rejectWithValue('Échec récupération du profilage');
      // res.data.data = { data: ClientProfilage[], meta: PaginationMeta }
      const payload = res.data.data;
      return { data: payload.data as ClientProfilage[], meta: payload.meta as PaginationMeta };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? "Erreur serveur");
    }
  }
);

const slice = createSlice({
  name: "clientProfilage",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientProfilage.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchClientProfilage.fulfilled, (s, a: PayloadAction<ClientProfilage>) => { s.loading = false; s.data = a.payload; })
      .addCase(fetchClientProfilage.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchAllProfilage.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchAllProfilage.fulfilled, (s, a: PayloadAction<ClientProfilage[]>) => { s.loading = false; s.all = a.payload; })
      .addCase(fetchAllProfilage.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchAllProfilagePaginated.pending,   (s) => { s.listLoading = true;  s.listError = null; })
      .addCase(fetchAllProfilagePaginated.fulfilled, (s, a) => {
        s.listLoading = false;
        s.listData = a.payload.data;
        s.listMeta = a.payload.meta;
      })
      .addCase(fetchAllProfilagePaginated.rejected,  (s, a) => { s.listLoading = false; s.listError = a.payload as string; });
  },
});

export default slice.reducer;