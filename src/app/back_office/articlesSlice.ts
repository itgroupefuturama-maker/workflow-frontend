import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Article {
  id: string;
  codeArticle: string;
  libelleArticle: string;
  dateApplication: string;
  status: 'ACTIF' | 'INACTIF';
  dateActivation: string | null;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  sousCategorieId: string;
  sousCategorie: {
    id: string;
    codeSousCategorie: string;
    libelleSousCategorie: string;
    status: string;
    categorie: {
      id: string;
      achat: 'OUI' | 'NON';
      vente: 'OUI' | 'NON';
      moduleId: string;
      module: {
        id: string;
        nom: string | null;
        code: string;
      };
    };
  };
}

export interface ArticlesState {
  data: Article[];
  loading: boolean;
  error: string | null;
}

const initialState: ArticlesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les articles
export const fetchArticles = createAsyncThunk<
  { success: boolean; data: Article[] },
  void
>('articles/fetchArticles', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/articles');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des articles');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un article
export const createArticle = createAsyncThunk<
  { success: boolean; data: Article },
  { libelleArticle: string; sousCategorieId: string }
>('articles/createArticle', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/articles', payload);
    if (response.data.success) {
      dispatch(fetchArticles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PUT)
export const updateArticle = createAsyncThunk<
  { success: boolean; data: Article },
  { id: string; libelleArticle: string; sousCategorieId: string }
>('articles/updateArticle', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...data } = payload;
    const response = await axiosInstance.put(`/articles/${id}`, data);
    if (response.data.success) {
      dispatch(fetchArticles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateArticle = createAsyncThunk<
  { success: boolean; data: Article },
  string
>('articles/activateArticle', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/articles/${id}/activate`);
    if (response.data.success) {
      dispatch(fetchArticles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateArticle = createAsyncThunk<
  { success: boolean; data: Article },
  string
>('articles/deactivateArticle', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/articles/${id}/deactivate`);
    if (response.data.success) {
      dispatch(fetchArticles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteArticle = createAsyncThunk<
  { success: boolean; data: string },
  string
>('articles/deleteArticle', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/articles/${id}`);
    if (response.data.success) {
      dispatch(fetchArticles());
      return { success: true, data: id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default articlesSlice.reducer;