import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Transaction {
  id: string;
  moduleId: string;
  transactionId: string;
  fournisseurId: string;
  dateApplication: string;
  status: string;
  dateActivation: string;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
  }
}

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  dateApplication: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[] | null;
}

export interface FournisseursState {
  data: Fournisseur[];
  loading: boolean;
  error: string | null;
}

const initialState: FournisseursState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les fournisseurs
export const fetchFournisseurs = createAsyncThunk<
  { success: boolean; data: Fournisseur[] },
  void
>('fournisseurs/fetchFournisseurs', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/fournisseurs');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des fournisseurs');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un fournisseur avec transactions optionnelles
export const createFournisseur = createAsyncThunk<
  { success: boolean; data: Fournisseur },
  { libelle: string; transactionIds?: string[] }
>('fournisseurs/createFournisseur', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { transactionIds = [], ...rest } = payload;
    const body: any = { ...rest };
    if (transactionIds.length > 0) {
      body.transactionIds = transactionIds;
    }

    const response = await axiosInstance.post('/fournisseurs', body);
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Mettre à jour les transactions d'un fournisseur existant
export const updateFournisseurTransactions = createAsyncThunk<
  { success: boolean; data: any },
  { fournisseurId: string; transactionIds: string[] }
>('fournisseurs/updateTransactions', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(`/fournisseurs/${payload.fournisseurId}/transactions`, {
      transactionIds: payload.transactionIds,
    });
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour des transactions');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update libellé uniquement (on garde l'ancien pour compatibilité, mais on peut l'utiliser pour libellé uniquement)
export const updateFournisseur = createAsyncThunk<
  { success: boolean; data: Fournisseur },
  { id: string; libelle: string }
>('fournisseurs/updateFournisseur', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...data } = payload;
    const response = await axiosInstance.put(`/fournisseurs/${id}`, data);
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour du libellé');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateFournisseur = createAsyncThunk<
  { success: boolean; data: Fournisseur },
  string
>('fournisseurs/activateFournisseur', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/fournisseurs/${id}/activate`);
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateFournisseur = createAsyncThunk<
  { success: boolean; data: Fournisseur },
  string
>('fournisseurs/deactivateFournisseur', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/fournisseurs/${id}/deactivate`);
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteFournisseur = createAsyncThunk<
  { success: boolean; data: string },
  string
>('fournisseurs/deleteFournisseur', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/fournisseurs/${id}`);
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Supprimer des transactions d'un fournisseur
export const removeFournisseurTransactions = createAsyncThunk<
  { success: boolean; data: any },
  { fournisseurId: string; transactionIds: string[] }
>('fournisseurs/removeTransactions', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/fournisseurs/${payload.fournisseurId}/transactions`, {
      data: { transactionIds: payload.transactionIds },
    });
    if (response.data.success) {
      dispatch(fetchFournisseurs());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec suppression des transactions');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const fournisseursSlice = createSlice({
  name: 'fournisseurs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFournisseurs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFournisseurs.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchFournisseurs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createFournisseur.pending, (state) => { state.loading = true; })
      .addCase(createFournisseur.fulfilled, (state) => { state.loading = false; })
      .addCase(createFournisseur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateFournisseurTransactions.pending, (state) => { state.loading = true; })
      .addCase(updateFournisseurTransactions.fulfilled, (state) => { state.loading = false; })
      .addCase(updateFournisseurTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(removeFournisseurTransactions.pending, (state) => { state.loading = true; })
      .addCase(removeFournisseurTransactions.fulfilled, (state) => { state.loading = false; })
      .addCase(removeFournisseurTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default fournisseursSlice.reducer;