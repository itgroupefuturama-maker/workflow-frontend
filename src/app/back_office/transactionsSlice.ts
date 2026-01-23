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

export interface Module {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string;
}

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  dateApplication: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string;
}

export interface Transaction {
  id: string;
  moduleId: string;
  transactionId: string;
  dateApplication: string;
  status: string;
  fournisseurId: string;
  dateActivation: string;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  module: Module;
  fournisseur: Fournisseur | null;
  transactiontype: TransactionType | null;
}

export interface TransactionsState {
  data: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les transactions
export const fetchTransactions = createAsyncThunk<
  { success: boolean; data: Transaction[] },
  void,
  { state: { auth: { token: string } } }
>('transactions/fetchTransactions', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.get('/transactions', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des transactions');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer une transaction (avec fournisseur optionnel)
export const createTransaction = createAsyncThunk<
  { success: boolean; data: Transaction },
  { 
    moduleId: string; 
    transactionId: string; 
    dateApplication: string; 
    fournisseurId?: string;  // Nouveau champ optionnel
    status?: string 
  },
  { state: { auth: { token: string } } }
>('transactions/createTransaction', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    // On construit le body proprement : on n'envoie fournisseurId que s'il est défini
    const body: any = {
      moduleId: payload.moduleId,
      transactionId: payload.transactionId,
      dateApplication: payload.dateApplication,
    };
    if (payload.fournisseurId) {
      body.fournisseurId = payload.fournisseurId;
    }
    if (payload.status) {
      body.status = payload.status;
    }

    const response = await axiosInstance.post('/transactions', body, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchTransactions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création de la transaction');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (modification) - maintenant avec fournisseurId optionnel
export const updateTransaction = createAsyncThunk<
  { success: boolean; data: Transaction },
  { 
    id: string; 
    moduleId?: string; 
    transactionId?: string; 
    dateApplication?: string; 
    fournisseurId?: string;  // ← Nouveau : on peut changer le fournisseur
    status?: string 
  },
  { state: { auth: { token: string } } }
>('transactions/updateTransaction', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const { id, ...updates } = payload;

    // On construit le body uniquement avec les champs fournis
    const body: any = {};
    if (updates.moduleId !== undefined) body.moduleId = updates.moduleId;
    if (updates.transactionId !== undefined) body.transactionId = updates.transactionId;
    if (updates.dateApplication !== undefined) body.dateApplication = updates.dateApplication;
    if (updates.fournisseurId !== undefined) body.fournisseurId = updates.fournisseurId; // ← Envoi même si vide (pour désassocier)
    if (updates.status !== undefined) body.status = updates.status;

    const response = await axiosInstance.put(`/transactions/${id}`, body, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchTransactions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateTransaction = createAsyncThunk<
  { success: boolean; data: Transaction },
  { id: string },
  { state: { auth: { token: string } } }
>('transactions/activateTransaction', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.patch(`/transactions/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      dispatch(fetchTransactions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateTransaction = createAsyncThunk<
  { success: boolean; data: Transaction },
  { id: string },
  { state: { auth: { token: string } } }
>('transactions/deactivateTransaction', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.patch(`/transactions/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      dispatch(fetchTransactions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteTransaction = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('transactions/deleteTransaction', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.delete(`/transactions/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      dispatch(fetchTransactions());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = action.payload.data;
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTransaction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateTransaction.pending, (state) => { state.loading = true; })
      .addCase(updateTransaction.fulfilled, (state) => { state.loading = false; })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Activate / Deactivate / Delete
      .addCase(activateTransaction.pending, (state) => { state.loading = true; })
      .addCase(activateTransaction.fulfilled, (state) => { state.loading = false; })
      .addCase(activateTransaction.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deactivateTransaction.pending, (state) => { state.loading = true; })
      .addCase(deactivateTransaction.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateTransaction.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteTransaction.pending, (state) => { state.loading = true; })
      .addCase(deleteTransaction.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteTransaction.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default transactionsSlice.reducer;