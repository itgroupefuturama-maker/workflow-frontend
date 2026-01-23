// src/app/front_office/parametre_ticketing/destinationSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

interface Pays {
  id: string;
  pays: string;
  photo: string;
  // ... autres champs si besoin
}

export interface Destination {
  id: string;
  code: string;
  ville: string;
  createdAt: string;
  updatedAt: string;
  paysVoyage: Pays | null;  // relation avec pays
}

interface DestinationState {
  items: Destination[];
  loading: boolean;
  error: string | null;
  creating: boolean;
}

const initialState: DestinationState = {
  items: [],
  loading: false,
  error: null,
  creating: false,
};

// ─── FETCH ────────────────────────────────────────────────
export const fetchDestinations = createAsyncThunk(
  'destination/fetchDestinations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/exigence-destination/destination');
      return response.data.data ?? [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement destinations');
    }
  }
);

// ─── CREATE ───────────────────────────────────────────────
export interface CreateDestinationPayload {
  ville: string;
  paysId: string;
}

export const createDestination = createAsyncThunk<
  Destination,
  CreateDestinationPayload,
  { rejectValue: string }
>(
  'destination/createDestination',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/exigence-destination/destination', payload);

      // On suppose que le serveur renvoie directement l'objet créé ou { data: {...} }
      const created = response.data.data || response.data;

      if (!created?.id) {
        return rejectWithValue('Réponse serveur invalide');
      }

      return created as Destination;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de la destination'
      );
    }
  }
);

const destinationSlice = createSlice({
  name: 'destination',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder
      .addCase(fetchDestinations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDestinations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDestinations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createDestination.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createDestination.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload); // ajout en haut de liste
      })
      .addCase(createDestination.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
  },
});

export default destinationSlice.reducer;