import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Categorie {
  id: string;
  moduleId: string;
  achat: 'OUI' | 'NON';
  vente: 'OUI' | 'NON';
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
  };
  sousCategorie: any[]; // À développer plus tard si besoin
}

export interface CategoriesState {
  data: Categorie[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les catégories
export const fetchCategories = createAsyncThunk<
  { success: boolean; data: Categorie[] },
  void
>('categories/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/categories');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des catégories');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer une catégorie
export const createCategorie = createAsyncThunk<
  { success: boolean; data: Categorie },
  { moduleId: string; achat: 'OUI' | 'NON'; vente: 'OUI' | 'NON' }
>('categories/createCategorie', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/categories', payload);
    if (response.data.success) {
      dispatch(fetchCategories());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PUT)
export const updateCategorie = createAsyncThunk<
  { success: boolean; data: Categorie },
  { id: string; moduleId: string; achat: 'OUI' | 'NON'; vente: 'OUI' | 'NON' }
>('categories/updateCategorie', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...data } = payload;
    const response = await axiosInstance.put(`/categories/${id}`, data);
    if (response.data.success) {
      dispatch(fetchCategories());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteCategorie = createAsyncThunk<
  { success: boolean; data: string },
  string
>('categories/deleteCategorie', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/categories/${id}`);
    if (response.data.success) {
      dispatch(fetchCategories());
      return { success: true, data: id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default categoriesSlice.reducer;