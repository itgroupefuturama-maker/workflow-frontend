import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Dossier {
  id: string;
  perimetre: string;
  type: string;
  suffixe: string;
  numero: number;
  dateCreation: string;
  updatedAt: string;
}

export interface NumerotationState {
  data: Dossier[];
  loading: boolean;
  error: string | null;
}

const initialState: NumerotationState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les dossiers
export const fetchDossiers = createAsyncThunk<
  { success: boolean; data: Dossier[] },
  void,
  { state: { auth: { token: string } } }
>('numerotation/fetchDossiers', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.get('/dossiers', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un dossier
export const createDossier = createAsyncThunk<
  { success: boolean; data: Dossier },
  { perimetre: string; type: string; suffixe: string; moduleId: string },
  { state: { auth: { token: string } } }
>('numerotation/createDossier', async (payload, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/dossiers', payload, {
      headers: { 
        Authorization: `Bearer ${auth.token}`, 
        'Content-Type': 'application/json' 
      },
    });

    if (response.data.success) {
      // ON NE FAIT PLUS dispatch(fetchDossiers()) ICI !
      return { success: true, data: response.data.data };
    }

    return rejectWithValue(response.data.message || 'Échec création');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Erreur réseau';
    return rejectWithValue(message);
  }
});

// Reset numérotation d'un dossier
export const resetDossier = createAsyncThunk<
  { success: boolean; data: Dossier },
  { id: string },
  { state: { auth: { token: string } } }
>('numerotation/resetDossier', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.patch(`/dossiers/${payload.id}/reset`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      dispatch(fetchDossiers());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec reset');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Reset numérotation globale (tous les dossiers)
export const resetAllDossiers = createAsyncThunk<
  { success: boolean },
  void,
  { state: { auth: { token: string } } }
>('numerotation/resetAllDossiers', async (_, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');
    const response = await axiosInstance.patch('/dossiers/reset-all', {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (response.data.success) {
      dispatch(fetchDossiers());
      return { success: true };
    }
    return rejectWithValue('Échec reset all');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const numerotationSlice = createSlice({
  name: 'numerotation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDossiers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDossiers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchDossiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDossier.pending, (state) => { state.loading = true; })
      .addCase(createDossier.fulfilled, (state) => { state.loading = false; })
      .addCase(createDossier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resetDossier.pending, (state) => { state.loading = true; })
      .addCase(resetDossier.fulfilled, (state) => { state.loading = false; })
      .addCase(resetDossier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resetAllDossiers.pending, (state) => { state.loading = true; })
      .addCase(resetAllDossiers.fulfilled, (state) => { state.loading = false; })
      .addCase(resetAllDossiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default numerotationSlice.reducer;