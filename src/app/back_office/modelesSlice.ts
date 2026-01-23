import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface ModuleRef {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string;
}

export interface Modele {
  id: string;
  moduleId: string;
  fonctionnalite: string;
  modeleDocument: string; // chemin du PDF
  modeleIntroduction: string | null;
  dateApplication: string;
  dateCreation: string;
  dateModification: string;
  status: string;
  module: ModuleRef;
}

export interface ModelesState {
  data: Modele[];
  loading: boolean;
  error: string | null;
}

const initialState: ModelesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les modèles
export const fetchModeles = createAsyncThunk<
  { success: boolean; data: Modele[] },
  void,
  { state: { auth: { token: string } } }
>('modeles/fetchModeles', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/modeles', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des modèles');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un modèle (multipart avec fichier PDF)
export const createModele = createAsyncThunk<
  { success: boolean; data: Modele },
  { moduleId: string; fonctionnalite: string; dateApplication: string; modeleIntroduction: string; status: string; pdf: File },
  { state: { auth: { token: string } } }
>('modeles/createModele', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const formData = new FormData();
    formData.append('moduleId', payload.moduleId);
    formData.append('fonctionnalite', payload.fonctionnalite);
    formData.append('modeleIntroduction', payload.modeleIntroduction);
    formData.append('dateApplication', payload.dateApplication);
    formData.append('status', payload.status);
    formData.append('pdf', payload.pdf);

    const response = await axiosInstance.post('/modeles', formData, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      dispatch(fetchModeles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création du modèle');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteModele = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('modeles/deleteModele', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/modeles/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchModeles());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (modification)
export const updateModele = createAsyncThunk<
  { success: boolean; data: Modele },
  { id: string; moduleId: string; fonctionnalite: string; modeleIntroduction: string; dateApplication: string; status: string; pdf?: File },
  { state: { auth: { token: string } } }
>('modeles/updateModele', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const formData = new FormData();
    formData.append('moduleId', payload.moduleId);
    formData.append('fonctionnalite', payload.fonctionnalite);
    formData.append('modeleIntroduction', payload.modeleIntroduction);
    formData.append('dateApplication', payload.dateApplication);
    formData.append('status', payload.status);
    if (payload.pdf) {
      formData.append('pdf', payload.pdf);
    }

    const response = await axiosInstance.patch(`/modeles/${payload.id}`, formData, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      dispatch(fetchModeles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateModele = createAsyncThunk<
  { success: boolean; data: Modele },
  { id: string },
  { state: { auth: { token: string } } }
>('modeles/activateModele', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/modeles/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchModeles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateModele = createAsyncThunk<
  { success: boolean; data: Modele },
  { id: string },
  { state: { auth: { token: string } } }
>('modeles/deactivateModele', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/modeles/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchModeles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const modelesSlice = createSlice({
  name: 'modeles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModeles.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchModeles.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchModeles.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      .addCase(createModele.pending, (state) => { state.loading = true; })
      .addCase(createModele.fulfilled, (state) => { state.loading = false; })
      .addCase(createModele.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      .addCase(deleteModele.pending, (state) => { state.loading = true; })
      .addCase(deleteModele.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteModele.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(updateModele.pending, (state) => { state.loading = true; })
      .addCase(updateModele.fulfilled, (state) => { state.loading = false; })
      .addCase(updateModele.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(activateModele.pending, (state) => { state.loading = true; })
      .addCase(activateModele.fulfilled, (state) => { state.loading = false; })
      .addCase(activateModele.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(deactivateModele.pending, (state) => { state.loading = true; })
      .addCase(deactivateModele.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateModele.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default modelesSlice.reducer;