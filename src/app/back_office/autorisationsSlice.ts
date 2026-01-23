// src/app/autorisationsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Autorisation {
  id: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  profileId: string;
  userId: string | null;
  privilegeId: string | null;
  moduleId: string | null;
  numero: number;
  date: string;
  action: string;
  profile: {
    id: string;
    profil: string;
  };
}

export interface AutorisationsState {
  data: Autorisation[];
  loading: boolean;
  error: string | null;
}

const initialState: AutorisationsState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les autorisations
export const fetchAutorisations = createAsyncThunk<
  { success: boolean; data: Autorisation[] },
  void
>('autorisations/fetchAutorisations', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/autorisation');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des autorisations');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const autorisationsSlice = createSlice({
  name: 'autorisations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutorisations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAutorisations.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = action.payload.data;
        }
      })
      .addCase(fetchAutorisations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default autorisationsSlice.reducer;