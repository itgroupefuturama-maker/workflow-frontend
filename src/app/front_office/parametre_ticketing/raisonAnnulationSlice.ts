// src/app/front_office/parametre_ticketing/raisonAnnulationSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios'; // ton instance axios

export interface RaisonAnnulation {
  id: string;
  libelle: string;
  statut: 'CREER' | 'ACTIF' | 'INACTIF'; // à adapter selon tes vrais statuts
  createdAt: string;
  updatedAt: string;
}

interface RaisonState {
  items: RaisonAnnulation[];
  loading: boolean;
  error: string | null;
  // on ajoute pour le formulaire
  createLoading: boolean;
  createError: string | null;
}

const initialState: RaisonState = {
  items: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
};

export const fetchRaisonsAnnulation = createAsyncThunk(
  'raisonAnnulation/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/raison-annulation`);
      if (!response.data.success) throw new Error('Réponse invalide');
      return response.data.data as RaisonAnnulation[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);
// ── CREATE ────────────────────────────────
export const createRaisonAnnulation = createAsyncThunk(
  'raisonAnnulation/create',
  async (libelle: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/raison-annulation`, {
        libelle,
      });
      if (!response.data.success) throw new Error('Échec création');
      return response.data.data as RaisonAnnulation; // on suppose que le serveur renvoie l'objet créé
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

const raisonAnnulationSlice = createSlice({
  name: 'raisonAnnulation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRaisonsAnnulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRaisonsAnnulation.fulfilled, (state, action: PayloadAction<RaisonAnnulation[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRaisonsAnnulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // create
      .addCase(createRaisonAnnulation.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createRaisonAnnulation.fulfilled, (state, action: PayloadAction<RaisonAnnulation>) => {
        state.createLoading = false;
        state.items.unshift(action.payload); // ajout en haut de liste
      })
      .addCase(createRaisonAnnulation.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload as string;
      });
  },
});

export default raisonAnnulationSlice.reducer;