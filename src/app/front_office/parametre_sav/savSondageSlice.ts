import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface SavSondage {
  id: string;
  lienSondageId: string;
  clientBeneficiaireId: string;
  dateRappel: string;
  status: 'INACHEVE' | 'ACHEVE' | 'INACTIF';
  createdAt: string;
  updatedAt: string;
  // ── Champs envoi ──
  dateEnvoie: string | null;
  numeroEnvoie: number | null;
  whatsappBeneficiaire: string;
  whatsappFacture: string;
  lienSondage: {
    id: string;
    lienSondage: string;
    texte: string;
    statut: string;
    dateApplication: string;
    createdAt: string;
    updatedAt: string;
  };
  clientBeneficiaire: {
    id: string;
    code: string;
    libelle: string;
    statut: string;
    dateApplication: string;
    dateCreation: string;
    updatedAt: string;
    typeClient: string;
  };
}

interface SavSondageState {
  items: SavSondage[];
  loading: boolean;
  sending: string | null; // id en cours d'envoi
  error: string | null;
}

const initialState: SavSondageState = {
  items: [],
  loading: false,
  sending: null,
  error: null,
};

export const fetchSavSondages = createAsyncThunk(
  'savSondage/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/sav/sondage');
      if (!res.data.success) throw new Error('Erreur chargement sondages');
      return res.data.data as SavSondage[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement sondages');
    }
  }
);

export const updateSavSondageStatus = createAsyncThunk(
  'savSondage/updateStatus',
  async (
    {
      id,
      status,
      lienSondageId,
      clientBeneficiaireId,
      numeroEnvoie,
    }: {
      id: string;
      status: 'ACHEVE' | 'INACHEVE';
      lienSondageId: string;
      clientBeneficiaireId: string;
      numeroEnvoie: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(`/sav/sondage/${id}`, {
        status,
        lienSondageId,
        clientBeneficiaireId,
        numeroEnvoie,
      });
      if (!res.data.success) throw new Error();
      return res.data.data as SavSondage;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur mise à jour statut');
    }
  }
);

// ── Nouveau thunk : envoi avec numéro ────────────────────────────────────────
export const envoyerSondage = createAsyncThunk(
  'savSondage/envoyer',
  async (
    { id, status, dateEnvoie, numeroEnvoie }: {
      id: string;
      status: 'ACHEVE';
      dateEnvoie: string;
      numeroEnvoie: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(`/sav/sondage/${id}`, {
        status, dateEnvoie, numeroEnvoie,
      });
      if (!res.data.success) throw new Error();
      return res.data.data as SavSondage;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur envoi sondage');
    }
  }
);

const savSondageSlice = createSlice({
  name: 'savSondage',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavSondages.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSavSondages.fulfilled, (state, action: PayloadAction<SavSondage[]>) => {
        state.loading = false; state.items = action.payload;
      })
      .addCase(fetchSavSondages.rejected,  (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      .addCase(updateSavSondageStatus.pending,   (state) => { state.loading = true; })
      .addCase(updateSavSondageStatus.fulfilled, (state, action: PayloadAction<SavSondage>) => {
        state.loading = false;
        const i = state.items.findIndex(x => x.id === action.payload.id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(updateSavSondageStatus.rejected,  (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // ── envoyerSondage ──
      .addCase(envoyerSondage.pending,   (state, action) => { state.sending = action.meta.arg.id; })
      .addCase(envoyerSondage.fulfilled, (state, action: PayloadAction<SavSondage>) => {
        state.sending = null;
        const i = state.items.findIndex(x => x.id === action.payload.id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(envoyerSondage.rejected,  (state, action) => {
        state.sending = null; state.error = action.payload as string;
      });
  },
});

export default savSondageSlice.reducer;