import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface TransactionType {
  id: string;
  transactionType: string;
  event: string;
  approbation_BC_Client: string;
  creation_Facture_Client: string;
  creation_BC_Fournisseur: string;
  approbation_BC_Fournisseur: string;
  creation_BR_Fournisseur: string;
  creation_Facture_Fournisseur: string;
  status: string;
  dateActivation: string;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionTypesState {
  data: TransactionType[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionTypesState = {
  data: [],
  loading: false,
  error: null,
};

// Thunk : Récupérer tous les types de transaction
export const fetchTransactionTypes = createAsyncThunk<
  { success: boolean; data: TransactionType[] },
  void,
  { state: { auth: { token: string } } }
>('transactionTypes/fetchTransactionTypes', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/workflow-rules', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des types de transaction');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Thunk : Créer un nouveau type de transaction
export const createTransactionType = createAsyncThunk<
  { success: boolean; data: TransactionType },
  { 
    transactionType: string; 
    event: string; 
    approbation_BC_Client: string; 
    creation_Facture_Client: string; 
    creation_BC_Fournisseur: string; 
    approbation_BC_Fournisseur: string; 
    creation_BR_Fournisseur: string; 
    creation_Facture_Fournisseur: string 
  },
  { state: { auth: { token: string } } }
>('transactionTypes/createTransactionType', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/workflow-rules', payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("Payload sent:", payload);
    console.log("Response:", response.data);
    
    if (response.data.success) {
      // Re-fetch pour avoir la liste à jour
      dispatch(fetchTransactionTypes());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création du type de transaction');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateTransactionType = createAsyncThunk<
  { success: boolean; data: TransactionType },
  { id: string },
  { state: { auth: { token: string } } }
>('transactionTypes/activate', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/workflow-rules/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchTransactionTypes());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateTransactionType = createAsyncThunk<
  { success: boolean; data: TransactionType },
  { id: string },
  { state: { auth: { token: string } } }
>('transactionTypes/deactivate', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/workflow-rules/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchTransactionTypes());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteTransactionType = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('transactionTypes/delete', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/workflow-rules/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchTransactionTypes());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const transactionTypesSlice = createSlice({
  name: 'transactionTypes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTransactionTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionTypes.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = action.payload.data;
        }
      })
      .addCase(fetchTransactionTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createTransactionType.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTransactionType.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          // La liste est déjà re-fetchée dans le thunk
        }
      })
      .addCase(createTransactionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Activate
      .addCase(activateTransactionType.pending, (state) => { state.loading = true; })
      .addCase(activateTransactionType.fulfilled, (state) => { state.loading = false; })
      .addCase(activateTransactionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Deactivate
      .addCase(deactivateTransactionType.pending, (state) => { state.loading = true; })
      .addCase(deactivateTransactionType.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateTransactionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete
      .addCase(deleteTransactionType.pending, (state) => { state.loading = true; })
      .addCase(deleteTransactionType.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = state.data.filter(t => t.id !== action.payload.data);
        }
      })
      .addCase(deleteTransactionType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionTypesSlice.reducer;