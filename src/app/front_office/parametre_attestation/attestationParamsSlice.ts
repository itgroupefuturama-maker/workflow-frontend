// src/app/front_office/parametre_attestation/attestationParamsSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';



export interface AttestationParam {
  id: string;
  prix: number;
  date_activation: string;
  date_desactivation: string | null;
  status: 'ACTIF' | 'INACTIF';
  createdAt: string;
  updatedAt: string;
}

interface AttestationParamsState {
  items: AttestationParam[];
  loading: boolean;
  error: string | null;
  creating: boolean;    // ← AJOUT
  createError: string | null; // ← AJOUT
}

const initialState: AttestationParamsState = {
  items: [],
  loading: false,
  error: null,
  creating: false,      // ← AJOUT
  createError: null,    // ← AJOUT
};

export const fetchAttestationParams = createAsyncThunk(
  'attestationParams/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/attestation-params');
      if (!response.data?.success) {
        return rejectWithValue(response.data?.message || 'Réponse invalide');
      }
      return response.data.data as AttestationParam[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Erreur de chargement'
      );
    }
  }
);

export const createAttestationParam = createAsyncThunk(
  'attestationParams/create',
  async (
    payload: {prix: number},
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post('/attestation-params', payload);
      if (!response.data?.success) {
        return rejectWithValue(response.data?.message || 'Réponse invalide');
      }
      return response.data.data as AttestationParam;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Erreur de création'
      );
    }
  }
);

const attestationParamsSlice = createSlice({
  name: 'attestationParams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttestationParams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttestationParams.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAttestationParams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAttestationParam.pending, (state) => {
        state.creating = true;
        state.createError = null;
        })
        .addCase(createAttestationParam.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload); // ajout en tête de liste
        })
        .addCase(createAttestationParam.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload as string;
        });
  },
});

export default attestationParamsSlice.reducer;