// src/app/milesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Miles {
  id: string;
  numMiles: string;
  dateApplication: string;
  status: 'CREER' | 'ACTIF' | 'INACTIF';
  dateActivation: string | null;
  dateDesactivation: string | null;
  taux: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
    dateActivation: string | null;
    dateDesactivation: string | null;
  };
}

export interface MilesState {
  data: Miles[];
  loading: boolean;
  error: string | null;
}

const initialState: MilesState = {
  data: [],
  loading: false,
  error: null,
};

// ── GET /miles ──
export const fetchMiles = createAsyncThunk(
  'miles/fetchMiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/miles');
      if (response.data.success) return response.data.data;
      return rejectWithValue('Échec récupération des miles');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// ── POST /miles ──
export const createMiles = createAsyncThunk(
  'miles/createMiles',
  async (
    payload: { moduleId: string; taux: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/miles', payload);
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec création du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// ── PUT /miles/:id ──
export const updateMiles = createAsyncThunk(
  'miles/updateMiles',
  async (
    { id, taux }: { id: string; taux: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/miles/${id}`, { taux });
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec mise à jour du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// ── PATCH /miles/:id/activate ──
export const activateMiles = createAsyncThunk(
  'miles/activateMiles',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/miles/${id}/activate`);
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec activation du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// ── PATCH /miles/:id/deactivate ──
export const deactivateMiles = createAsyncThunk(
  'miles/deactivateMiles',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/miles/${id}/deactivate`);
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec désactivation du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// ── Helper pour générer les 3 cases (pending/fulfilled/rejected) ──
function addLoadingCases(builder: any, thunk: any) {
  builder
    .addCase(thunk.pending, (state: MilesState) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state: MilesState) => {
      state.loading = false;
    })
    .addCase(thunk.rejected, (state: MilesState, action: any) => {
      state.loading = false;
      state.error = action.payload as string;
    });
}

const milesSlice = createSlice({
  name: 'miles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchMiles — cas spécial car il met à jour state.data
    builder
      .addCase(fetchMiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMiles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    addLoadingCases(builder, createMiles);
    addLoadingCases(builder, updateMiles);
    addLoadingCases(builder, activateMiles);
    addLoadingCases(builder, deactivateMiles);
  },
});

export default milesSlice.reducer;