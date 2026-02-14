import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export type TypeChambre = {
  id: string;
  type: string;
  capacite: number;
  createdAt: string;
  updatedAt: string;
};

type TypeChambreState = {
  items: TypeChambre[];
  loading: boolean;
  error: string | null;
};

type CreateTypeChambrePayload = {
  type: string;
  capacite: number;
};

const initialState: TypeChambreState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchTypesChambre = createAsyncThunk(
  'typeChambre/fetchTypesChambre',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/hotel-params/type-chambre');
      if (!response.data.success) {
        throw new Error('Réponse non réussie');
      }
      return response.data.data as TypeChambre[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement des types de chambre'
      );
    }
  }
);

export const createTypeChambre = createAsyncThunk(
  'typeChambre/createTypeChambre',
  async (data: CreateTypeChambrePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/hotel-params/type-chambre', data);
      if (!response.data.success) throw new Error('Échec création');
      return response.data.data as TypeChambre;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur création type de chambre'
      );
    }
  }
);

const typeChambreSlice = createSlice({
  name: 'typeChambre',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTypesChambre.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTypesChambre.fulfilled, (state, action: PayloadAction<TypeChambre[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTypesChambre.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTypeChambre.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createTypeChambre.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.items.push(action.payload);
      })
      .addCase(createTypeChambre.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default typeChambreSlice.reducer;