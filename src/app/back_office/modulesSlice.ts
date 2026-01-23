import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Module {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  autorisations: any[]; // À typer plus précisément si besoin plus tard
}

export interface ModulesState {
  data: Module[];
  loading: boolean;
  error: string | null;
}

const initialState: ModulesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les modules
export const fetchModules = createAsyncThunk<
  { success: boolean; data: Module[] },
  void,
  { state: { auth: { token: string } } }
>('modules/fetchModules', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/modules', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des modules');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un module
export const createModule = createAsyncThunk<
  { success: boolean; data: Module },
  { code: string; nom: string; description: string },
  { state: { auth: { token: string } } }
>('modules/createModule', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/modules', payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchModules());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création du module');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update
export const updateModule = createAsyncThunk<
  { success: boolean; data: Module },
  { id: string; code: string; nom: string; description: string },
  { state: { auth: { token: string } } }
>('modules/updateModule', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.put(`/modules/${payload.id}`, {
      code: payload.code,
      nom: payload.nom,
      description: payload.description,
    }, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchModules());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateModule = createAsyncThunk<
  { success: boolean; data: Module },
  { id: string },
  { state: { auth: { token: string } } }
>('modules/activateModule', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/modules/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchModules());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateModule = createAsyncThunk<
  { success: boolean; data: Module },
  { id: string },
  { state: { auth: { token: string } } }
>('modules/deactivateModule', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/modules/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchModules());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteModule = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('modules/deleteModule', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/modules/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchModules());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const modulesSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createModule.pending, (state) => { state.loading = true; })
      .addCase(createModule.fulfilled, (state) => { state.loading = false; })
      .addCase(createModule.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateModule.pending, (state) => { state.loading = true; })
      .addCase(updateModule.fulfilled, (state) => { state.loading = false; })
      .addCase(updateModule.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(activateModule.pending, (state) => { state.loading = true; })
      .addCase(activateModule.fulfilled, (state) => { state.loading = false; })
      .addCase(activateModule.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deactivateModule.pending, (state) => { state.loading = true; })
      .addCase(deactivateModule.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateModule.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteModule.pending, (state) => { state.loading = true; })
      .addCase(deleteModule.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteModule.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default modulesSlice.reducer;