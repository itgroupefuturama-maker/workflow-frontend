import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../service/Axios'; // ton instance axios configurée

type LigneAnnulation = {
  id: string;
  numeroDossierCommun: number;
  numeroDossierBillet: string;
  compagnie: string;
  itineraire: string;
};

type JourAnnulation = {
  date: string;
  lignes: LigneAnnulation[];
};

type MoisAnnulation = {
  mois: string;           // ex: "2026-02"
  jours: JourAnnulation[];
  totalMois: number;
};

type EtatAnnulationData = {
  dateDebut: string;
  dateFin: string;
  fournisseurId: string;
  mois: MoisAnnulation[];
  totalGeneral: number | null;
};

type EtatAnnulationState = {
  data: EtatAnnulationData | null;
  loading: boolean;
  error: string | null;
};

const initialState: EtatAnnulationState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchEtatAnnulation = createAsyncThunk(
  'etatAnnulation/fetchEtatAnnulation',
  async (
    { dateDebut, dateFin, fournisseurId }: { dateDebut: string; dateFin: string; fournisseurId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get('/etat-vente/etat-annulation', {
        params: { dateDebut, dateFin, fournisseurId },
      });
      if (!response.data.success) {
        throw new Error('Réponse non réussie');
      }
      return response.data.data as EtatAnnulationData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des annulations');
    }
  }
);

const etatAnnulationSlice = createSlice({
  name: 'etatAnnulation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEtatAnnulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEtatAnnulation.fulfilled, (state, action: PayloadAction<EtatAnnulationData>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchEtatAnnulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default etatAnnulationSlice.reducer;