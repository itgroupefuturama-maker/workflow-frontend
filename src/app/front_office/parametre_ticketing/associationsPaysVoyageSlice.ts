// src/app/front_office/parametre_ticketing/associationsPaysVoyageSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface AssociationPaysVoyage {
  id: string;
  paysId: string;
  exigenceVoyageId: string;
  createdAt: string;
  updatedAt: string;
  pays: {
    id: string;
    pays: string;
    photo: string;
  };
  exigenceVoyage: {
    id: string;
    type: string;
    description: string;
    perimetre: string;
  };
}

interface AssociationsState {
  items: AssociationPaysVoyage[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: AssociationsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

export const fetchAssociationsPaysVoyage = createAsyncThunk(
  'associationsPaysVoyage/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/exigence-destination/pays-voyage');
      return res.data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement associations');
    }
  }
);

export interface CreateAssociationPayload {
  paysId: string;
  exigenceVoyageId: string;
}

export const createAssociation = createAsyncThunk<
  AssociationPaysVoyage,
  CreateAssociationPayload,
  { rejectValue: string }
>(
  'associationsPaysVoyage/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/exigence-destination/pays-voyage', payload);
      const created = response.data.data || response.data;

      if (!created?.id) {
        return rejectWithValue('Réponse invalide du serveur');
      }

      return created as AssociationPaysVoyage;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de l\'association'
      );
    }
  }
);

const slice = createSlice({
  name: 'associationsPaysVoyage',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchAssociationsPaysVoyage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssociationsPaysVoyage.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAssociationsPaysVoyage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createAssociation.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAssociation.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload); // ajout en haut
      })
      .addCase(createAssociation.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
  },
});

export default slice.reducer;