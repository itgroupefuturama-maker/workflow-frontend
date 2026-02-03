import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type{ PayloadAction } from '@reduxjs/toolkit';
import axios from '../../service/Axios'; // ton instance axios avec baseURL + interceptors

type LigneVente = {
  id: string;
  itineraire: string;
  compagnie: string;
  tarifsMachine: number;
  commissions: number;
  tarifsTTC: number;
};

type JourVente = {
  date: string;           // ex: "2026-02-02"
  lignes: LigneVente[];
  total: {
    tarifsMachine: number;
    commissions: number;
    tarifsTTC: number;
  };
};

type EtatVenteData = {
  dateDebut: string;
  dateFin: string;
  fournisseurId: string;
  jours: JourVente[];
  totalGeneral: {
    tarifsMachine: number;
    commissions: number;
    tarifsTTC: number;
  };
};

type EtatVenteState = {
  data: EtatVenteData | null;
  loading: boolean;
  error: string | null;
};

const initialState: EtatVenteState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchEtatVente = createAsyncThunk(
  'etatVente/fetchEtatVente',
  async ({ dateDebut, dateFin, fournisseurId }: { dateDebut: string; dateFin: string; fournisseurId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/etat-vente/etat-vente', {
        params: { dateDebut, dateFin, fournisseurId },
      });
      if (!response.data.success) {
        throw new Error('Réponse non réussie');
      }
      return response.data.data as EtatVenteData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement de l’état des ventes');
    }
  }
);

const etatVenteSlice = createSlice({
  name: 'etatVente',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEtatVente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEtatVente.fulfilled, (state, action: PayloadAction<EtatVenteData>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchEtatVente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default etatVenteSlice.reducer;