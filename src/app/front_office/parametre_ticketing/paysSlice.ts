// src/app/front_office/parametre_ticketing/paysSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface Pays {
  id: string;
  pays: string;
  photo: string;
  createdAt: string;
  updatedAt: string;
  DestinationVoyage: Array<{
    id: string;
    code: string;
    ville: string;
    createdAt: string;
    updatedAt: string;
    paysId: string;
  }>;
}

export interface PaysDetails extends Pays {
  paysVoyage: Array<{
    id: string;
    paysId: string;
    exigenceVoyageId: string;
    createdAt: string;
    updatedAt: string;
    exigenceVoyage: {
      id: string;
      type: string;
      description: string;
      perimetre: string;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

interface PaysState {
  items: Pays[];
  selectedPaysId: string | null;
  selectedPaysDetails: PaysDetails | null;
  loading: boolean;
  detailsLoading: boolean;
  error: string | null;
  creating: boolean;
}

const initialState: PaysState = {
  items: [],
  selectedPaysId: null,
  selectedPaysDetails: null,
  loading: false,
  detailsLoading: false,
  error: null,
  creating: false,
};

// FETCH TOUS LES PAYS
export const fetchPays = createAsyncThunk(
  'pays/fetchPays',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/exigence-destination/pays');
      return response.data.data ?? [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement pays');
    }
  }
);

// FETCH DÉTAILS D'UN PAYS (destinations + exigences)
export const fetchPaysDetails = createAsyncThunk(
  'pays/fetchPaysDetails',
  async (paysId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/exigence-destination/pays/${paysId}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data as PaysDetails;
      }
      return rejectWithValue('Réponse invalide');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement détails pays');
    }
  }
);

// CREATE (déjà présent)
export interface CreatePaysPayload {
  pays: string;
  photo: File;
}

export const createPays = createAsyncThunk<
  Pays,
  CreatePaysPayload,
  { rejectValue: string }
>('pays/createPays', async (payload, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('pays', payload.pays);
    formData.append('photo', payload.photo);

    const response = await axios.post('/exigence-destination/pays', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data?.success && response.data?.data) {
      return response.data.data as Pays;
    }
    return rejectWithValue('Réponse invalide');
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Erreur création pays');
  }
});

const paysSlice = createSlice({
  name: 'pays',
  initialState,
  reducers: {
    clearSelectedPays: (state) => {
      state.selectedPaysId = null;
      state.selectedPaysDetails = null;
    },
    // Optionnel : setSelectedPaysId si tu veux gérer l'état localement avant fetch
  },
  extraReducers: (builder) => {
    // fetchPays ...
    builder
      .addCase(fetchPays.pending, (state) => { state.loading = true; })
      .addCase(fetchPays.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchPaysDetails
      .addCase(fetchPaysDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchPaysDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedPaysDetails = action.payload;
      })
      .addCase(fetchPaysDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload as string;
      })

      // createPays ...
      .addCase(createPays.pending, (state) => { state.creating = true; })
      .addCase(createPays.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
      })
      .addCase(createPays.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedPays } = paysSlice.actions;
export default paysSlice.reducer;