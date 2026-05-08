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

interface State {
  data:    ClientProfilage | null;
  all:     ClientProfilage[];
  loading: boolean;
  error:   string | null;
}

const initialState: State = { data: null, all: [], loading: false, error: null };

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
      .addCase(fetchAllProfilage.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;