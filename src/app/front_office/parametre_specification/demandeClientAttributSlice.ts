import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export type DemandeClientAttribut = {
  id: string;
  nom: string;
  type: string;
  valeurType: string;
  createdAt: string;
  updatedAt: string;
};

type DemandeClientAttributState = {
  items: DemandeClientAttribut[];
  loading: boolean;
  error: string | null;
};

const initialState: DemandeClientAttributState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchDemandeClientAttributs = createAsyncThunk(
  'demandeClientAttribut/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/demande-client-attributs');
      if (!response.data.success) throw new Error('Réponse invalide');
      return response.data.data as DemandeClientAttribut[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur chargement attributs'
      );
    }
  }
);

const demandeClientAttributSlice = createSlice({
  name: 'demandeClientAttribut',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDemandeClientAttributs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDemandeClientAttributs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDemandeClientAttributs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default demandeClientAttributSlice.reducer;