import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface MilesModule {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: 'ACTIF' | 'INACTIF';
  dateActivation: string | null;
  dateDesactivation: string | null;
}

export interface MilesTransaction {
  id: string;
  description: string;
  numeroCommande: string | null;
  montantCommande: number | null;
  montantCadeaux: number | null;
  gainMiles: number;
  soldeMiles: number;
  date: string;
  status: 'ACTIF' | 'INACTIF';
  moduleId: string | null;
  clientBeneficiaireId: string;
  createdAt: string;
  updatedAt: string;
  module: MilesModule | null;
}

export interface MilesTransactionPayload {
  description: string;
  montantCadeaux: number;
//   moduleId: string;
  clientBeneficiaireId: string;
}

interface MilesTransactionState {
  items:     MilesTransaction[];
  loading:   boolean;
  error:     string | null;
  clientId:  string | null;
}

const initialState: MilesTransactionState = {
  items:    [],
  loading:  false,
  error:    null,
  clientId: null,
};

export const fetchMilesTransactions = createAsyncThunk(
  'milesTransaction/fetchByClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/miles-transaction/client/${clientId}`);
      if (!res.data.success) throw new Error();
      return { clientId, data: res.data.data as MilesTransaction[] };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement transactions miles');
    }
  }
);

export const createMilesTransaction = createAsyncThunk(
  'milesTransaction/create',
  async (payload: MilesTransactionPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/miles-transaction', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as MilesTransaction;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création transaction miles');
    }
  }
);

export const resetClientMiles = createAsyncThunk(
  'milesTransaction/resetClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/miles-transaction/reset/${clientId}`);
      if (!res.data.success) throw new Error();
      return clientId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur réinitialisation client');
    }
  }
);

export const resetAllMiles = createAsyncThunk(
  'milesTransaction/resetAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/miles-transaction/reset-all');
      if (!res.data.success) throw new Error();
      return true;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur réinitialisation globale');
    }
  }
);

const milesTransactionSlice = createSlice({
  name: 'milesTransaction',
  initialState,
  reducers: {
    clearMilesTransactions: (state) => {
      state.items    = [];
      state.clientId = null;
      state.error    = null;
    },
  },
  extraReducers: (builder) => {
    builder
        .addCase(fetchMilesTransactions.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(fetchMilesTransactions.fulfilled, (state, action: PayloadAction<{ clientId: string; data: MilesTransaction[] }>) => {
            state.loading  = false;
            state.items    = action.payload.data;
            state.clientId = action.payload.clientId;
        })
        .addCase(fetchMilesTransactions.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        })
        .addCase(createMilesTransaction.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(createMilesTransaction.fulfilled, (state, action: PayloadAction<MilesTransaction>) => {
            state.loading = false;
            state.items.unshift(action.payload);
        })
        .addCase(createMilesTransaction.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        })
        .addCase(resetClientMiles.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(resetClientMiles.fulfilled, (state) => {
            state.loading = false;
            state.items   = [];
        })
        .addCase(resetClientMiles.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        })

        .addCase(resetAllMiles.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(resetAllMiles.fulfilled, (state) => {
            state.loading = false;
            state.items   = [];
        })
        .addCase(resetAllMiles.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        });
  },
});

export const { clearMilesTransactions } = milesTransactionSlice.actions;
export default milesTransactionSlice.reducer;