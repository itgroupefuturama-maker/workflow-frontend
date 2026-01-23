import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface ModuleRef {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string;
}

export interface Commission {
  id: string;
  moduleId: string;
  dateApplication: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  provenantOdoo: string;
  librePrixModule: string;
  forfaitUnite: string;
  DifPrixClientPrixModule: string;
  libre: string;
  createdAt: string;
  updatedAt: string;
  module: ModuleRef;
}

export interface CommissionsState {
  data: Commission[];
  loading: boolean;
  error: string | null;
}

const initialState: CommissionsState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les commissions
export const fetchCommissions = createAsyncThunk<
  { success: boolean; data: Commission[] },
  void,
  { state: { auth: { token: string } } }
>('commissions/fetchCommissions', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/commissions', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des commissions');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer une commission
export const createCommission = createAsyncThunk<
  { success: boolean; data: Commission },
  { moduleId: string; dateApplication: string; provenantOdoo: string; librePrixModule: string; forfaitUnite: string; DifPrixClientPrixModule: string; libre: string },
  { state: { auth: { token: string } } }
>('commissions/createCommission', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/commissions', payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchCommissions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (modification)
export const updateCommission = createAsyncThunk<
  { success: boolean; data: Commission },
  { id: string } & Partial<Commission>,
  { state: { auth: { token: string } } }
>('commissions/updateCommission', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.put(`/commissions/${payload.id}`, payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchCommissions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateCommission = createAsyncThunk<
  { success: boolean; data: Commission },
  { id: string },
  { state: { auth: { token: string } } }
>('commissions/activateCommission', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/commissions/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchCommissions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateCommission = createAsyncThunk<
  { success: boolean; data: Commission },
  { id: string },
  { state: { auth: { token: string } } }
>('commissions/deactivateCommission', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/commissions/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchCommissions());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteCommission = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('commissions/deleteCommission', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/commissions/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchCommissions());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const commissionsSlice = createSlice({
  name: 'commissions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommissions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCommissions.fulfilled, (state, action) => { state.loading = false; if (action.payload.success) state.data = action.payload.data; })
      .addCase(fetchCommissions.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createCommission.pending, (state) => { state.loading = true; })
      .addCase(createCommission.fulfilled, (state) => { state.loading = false; })
      .addCase(createCommission.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateCommission.pending, (state) => { state.loading = true; })
      .addCase(updateCommission.fulfilled, (state) => { state.loading = false; })
      .addCase(updateCommission.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(activateCommission.pending, (state) => { state.loading = true; })
      .addCase(activateCommission.fulfilled, (state) => { state.loading = false; })
      .addCase(activateCommission.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deactivateCommission.pending, (state) => { state.loading = true; })
      .addCase(deactivateCommission.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateCommission.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteCommission.pending, (state) => { state.loading = true; })
      .addCase(deleteCommission.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteCommission.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default commissionsSlice.reducer;