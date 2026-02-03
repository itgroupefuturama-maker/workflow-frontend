import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

type CompagnieData = {
  [compagnie: string]: number;  // ex: "AIR MAD": 450000
};

type AnneeData = {
  annee: number;
  total: number;
  pourcentageTotal: number;
  compagnies: CompagnieData;
  pourcentages: CompagnieData;
};

type DestinationData = {
  code: string;
  nom: string;
  annees: AnneeData[];
};

type EtatMensuelDestinationResponse = {
  destinationId: string | null;
  companies: string[] | null;             // attention: "compagnies" dans la réponse
  destinations: DestinationData[];
};

type EtatMensuelDestinationState = {
  data: EtatMensuelDestinationResponse | null;
  loading: boolean;
  error: string | null;
};

const initialState: EtatMensuelDestinationState = {
  data: null,
  loading: false,
  error: null,
};

// src/app/etatMensuelDestinationSlice.ts  (ou front_office/...)

export const fetchEtatMensuelDestination = createAsyncThunk(
  'etatMensuelDestination/fetch',
  async (destinationId: string | null = null, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      if (destinationId) {
        params.destinationId = destinationId;
      }
      // → Pas de dateDebut, dateFin, fournisseurId

      const response = await axios.get('/etat-vente/etat-mensuel-destination', { params });

      if (!response.data.success) {
        throw new Error('Réponse non réussie');
      }

      return response.data.data as EtatMensuelDestinationResponse;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement de l’état mensuel par destination'
      );
    }
  }
);

const etatMensuelDestinationSlice = createSlice({
  name: 'etatMensuelDestination',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEtatMensuelDestination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEtatMensuelDestination.fulfilled, (state, action: PayloadAction<EtatMensuelDestinationResponse>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchEtatMensuelDestination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default etatMensuelDestinationSlice.reducer;