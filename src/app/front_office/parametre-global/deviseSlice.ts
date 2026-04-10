import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export type Devise = {
  id: string;
  devise: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type DeviseState = {
  items: Devise[];
  loading: boolean;
  error: string | null;
};

type CreateDevisePayload = { devise: string };
type UpdateDevisePayload = { id: string; devise: string; status: string };

const initialState: DeviseState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchDevises = createAsyncThunk(
  'devise/fetchDevises',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/devise');
      if (!response.data.success) throw new Error('Réponse non réussie');
      return response.data.data as Devise[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement devises');
    }
  }
);

export const createDevise = createAsyncThunk(
  'devise/createDevise',
  async (data: CreateDevisePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/devise', data);
      if (!response.data.success) throw new Error('Échec création');
      return response.data.data as Devise;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur création devise');
    }
  }
);

export const updateDevise = createAsyncThunk(
  'devise/updateDevise',
  async ({ id, ...data }: UpdateDevisePayload, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/devise/${id}`, data);
      if (!response.data.success) throw new Error('Échec modification');
      return response.data.data as Devise;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur modification devise');
    }
  }
);

export const deleteDevise = createAsyncThunk(
  'devise/deleteDevise',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/devise/${id}`);
      if (!response.data.success) throw new Error('Échec suppression');
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur suppression devise');
    }
  }
);

const deviseSlice = createSlice({
  name: 'devise',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ── Fetch ──
      .addCase(fetchDevises.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDevises.fulfilled, (state, action: PayloadAction<Devise[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDevises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ── Create ──
      .addCase(createDevise.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createDevise.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.items.push(action.payload);
      })
      .addCase(createDevise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ── Update ──
      .addCase(updateDevise.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateDevise.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateDevise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ── Delete ──
      .addCase(deleteDevise.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteDevise.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.items = state.items.filter(d => d.id !== action.payload);
      })
      .addCase(deleteDevise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default deviseSlice.reducer;