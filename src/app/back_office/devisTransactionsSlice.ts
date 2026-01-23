import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface DevisTransaction {
  id: string;
  moduleId: string;
  multiDevise: 'OUI' | 'NON';
  devisPrestataire: 'OUI' | 'NON';
  devisClient: 'OUI' | 'NON';
  bcPrestataire: 'OUI' | 'NON';
  bcClient: 'OUI' | 'NON';
  facturationClient: 'OUI' | 'NON';
  facturationPrestataire: 'OUI' | 'NON';
  status: string;
  dateApplication: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
  };
}

export interface DevisTransactionsState {
  data: DevisTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: DevisTransactionsState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les configurations devis
export const fetchDevisTransactions = createAsyncThunk<
  { success: boolean; data: DevisTransaction[] },
  void
>('devisTransactions/fetchDevisTransactions', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/devis-transactions');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer
export const createDevisTransaction = createAsyncThunk<
  { success: boolean; data: DevisTransaction },
  {
    moduleId: string;
    multiDevise: 'OUI' | 'NON';
    devisPrestataire: 'OUI' | 'NON';
    devisClient: 'OUI' | 'NON';
    bcPrestataire: 'OUI' | 'NON';
    bcClient: 'OUI' | 'NON';
    facturationClient: 'OUI' | 'NON';
    facturationPrestataire: 'OUI' | 'NON';
  }
>('devisTransactions/createDevisTransaction', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/devis-transactions', payload);
    if (response.data.success) {
      dispatch(fetchDevisTransactions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PATCH)
export const updateDevisTransaction = createAsyncThunk<
  { success: boolean; data: DevisTransaction },
  {
    id: string;
    moduleId: string;
    multiDevise: 'OUI' | 'NON';
    devisPrestataire: 'OUI' | 'NON';
    devisClient: 'OUI' | 'NON';
    bcPrestataire: 'OUI' | 'NON';
    bcClient: 'OUI' | 'NON';
    facturationClient: 'OUI' | 'NON';
    facturationPrestataire: 'OUI' | 'NON';
  }
>('devisTransactions/updateDevisTransaction', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...data } = payload;
    const response = await axiosInstance.put(`/devis-transactions/${id}`, data);
    if (response.data.success) {
      dispatch(fetchDevisTransactions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate / Deactivate / Delete
export const activateDevisTransaction = createAsyncThunk('devisTransactions/activate', async (id: string, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/devis-transactions/${id}/activate`);
    if (response.data.success) {
      dispatch(fetchDevisTransactions());
      return response.data.data;
    }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur');
  }
});

export const deactivateDevisTransaction = createAsyncThunk('devisTransactions/deactivate', async (id: string, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/devis-transactions/${id}/deactivate`);
    if (response.data.success) {
      dispatch(fetchDevisTransactions());
      return response.data.data;
    }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur');
  }
});

export const deleteDevisTransaction = createAsyncThunk('devisTransactions/delete', async (id: string, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/devis-transactions/${id}`);
    if (response.data.success) {
      dispatch(fetchDevisTransactions());
      return id;
    }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur');
  }
});

const devisTransactionsSlice = createSlice({
  name: 'devisTransactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevisTransactions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDevisTransactions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchDevisTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Les autres actions re-fetch automatiquement via dispatch dans les thunks
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected'),
        (state, action) => {
          if (action.type.includes('create') || action.type.includes('update') || action.type.includes('activate') || action.type.includes('deactivate') || action.type.includes('delete')) {
            state.loading = false;
          }
        }
      );
  },
});

export default devisTransactionsSlice.reducer;