// src/app/front_office/parametre_ticketing/exigenceSlice.ts
// (j’ai mis le chemin complet que tu utilises dans ton code)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios'; // ton instance axios

export interface Exigence {
  id: string;
  type: string;
  description: string;
  perimetre: string;
  createdAt: string;
  updatedAt: string;
  paysVoyage: any[]; // à typer mieux plus tard si besoin
}

interface ExigenceState {
  items: Exigence[];
  loading: boolean;
  error: string | null;
  // optionnel : on peut ajouter un état pour la création si besoin
  creating: boolean;
}

const initialState: ExigenceState = {
  items: [],
  loading: false,
  error: null,
  creating: false,
};

// ─── FETCH ────────────────────────────────────────────────
export const fetchExigences = createAsyncThunk(
  'exigence/fetchExigences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/exigence-destination/exigence');
      return response.data.data ?? [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement exigences');
    }
  }
);

// ─── CREATE ───────────────────────────────────────────────
export interface CreateExigencePayload {
  type: string;
  description: string;
  perimetre: string;
}

export const createExigence = createAsyncThunk(
  'exigence/createExigence',
  async (data: CreateExigencePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/exigence-destination/exigence', data);
      return response.data.data; // on attend que le serveur renvoie l'objet créé
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur création exigence');
    }
  }
);

const exigenceSlice = createSlice({
  name: 'exigence',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder
      .addCase(fetchExigences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExigences.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExigences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createExigence.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createExigence.fulfilled, (state, action) => {
        state.creating = false;
        state.items.push(action.payload); // on ajoute directement dans la liste
      })
      .addCase(createExigence.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
  },
});

export default exigenceSlice.reducer;