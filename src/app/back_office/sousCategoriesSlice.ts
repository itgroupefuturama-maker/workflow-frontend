import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface SousCategorie {
  id: string;
  codeSousCategorie: string;
  libelleSousCategorie: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  categorieId: string;
  categorie: {
    id: string;
    achat: 'OUI' | 'NON';
    vente: 'OUI' | 'NON';
    moduleId: string;
    module: {
      id: string;
      code: string;
      nom: string;
      description: string;
    };
  };
  article: any[]; // À typer plus tard
}

export interface SousCategoriesState {
  data: SousCategorie[];
  loading: boolean;
  error: string | null;
}

const initialState: SousCategoriesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les sous-catégories
export const fetchSousCategories = createAsyncThunk<
  { success: boolean; data: SousCategorie[] },
  void
>('sousCategories/fetchSousCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/sous-categories');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer
export const createSousCategorie = createAsyncThunk<
  { success: boolean; data: SousCategorie },
  { libelleSousCategorie: string; categorieId: string }
>('sousCategories/createSousCategorie', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/sous-categories', payload);
    if (response.data.success) {
      dispatch(fetchSousCategories());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PUT)
export const updateSousCategorie = createAsyncThunk<
  { success: boolean; data: SousCategorie },
  { id: string; libelleSousCategorie: string; categorieId: string }
>('sousCategories/updateSousCategorie', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...data } = payload;
    const response = await axiosInstance.put(`/sous-categories/${id}`, data);
    if (response.data.success) {
      dispatch(fetchSousCategories());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateSousCategorie = createAsyncThunk<
  { success: boolean; data: SousCategorie },
  string
>('sousCategories/activateSousCategorie', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/sous-categories/${id}/activate`);
    if (response.data.success) {
      dispatch(fetchSousCategories());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateSousCategorie = createAsyncThunk<
  { success: boolean; data: SousCategorie },
  string
>('sousCategories/deactivateSousCategorie', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/sous-categories/${id}/deactivate`);
    if (response.data.success) {
      dispatch(fetchSousCategories());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteSousCategorie = createAsyncThunk<
  { success: boolean; data: string },
  string
>('sousCategories/deleteSousCategorie', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/sous-categories/${id}`);
    if (response.data.success) {
      dispatch(fetchSousCategories());
      return { success: true, data: id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const sousCategoriesSlice = createSlice({
  name: 'sousCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSousCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSousCategories.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchSousCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default sousCategoriesSlice.reducer;