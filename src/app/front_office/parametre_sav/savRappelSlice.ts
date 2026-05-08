import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface SavRappel {
  id: string;
  billetLigneId: string;
  clientBeneficiaireId: string;
  texte: string;
  dateRappel: string;
  numeroEnvoie: string;
  texteReenvoie: string;
  dateEnvoie: string;
  dateReenvoie: string;
  status: 'INACHEVE' | 'ACHEVE' | 'INACTIF';
  createdAt: string;
  updatedAt: string;
  billetLigne: {
    id: string;
    statut: string;
    statusLigne: string;
    referenceLine: string;
    reservation: string;
    devise: string;
    puResaBilletClientDevise: number;
    puResaServiceClientDevise: number;
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
  whatsappBeneficiaire: string;
  whatsappFacture: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface EnvoiPayload {
  id: string;
  texte: string;
  status: 'ACHEVE';
  dateEnvoie: string;
  numeroEnvoie: number; // ← number
}

export interface ReenvoiPayload {
  id: string;
  texteReenvoie: string;
  dateReenvoie: string;
  numeroEnvoie: number; // ← number
}

// ─── State ────────────────────────────────────────────────────────────────────

interface SavRappelState {
  items: SavRappel[];
  loading: boolean;
  sending: string | null;   // id de la ligne en cours d'envoi
  resending: string | null; // id de la ligne en cours de renvoi
  error: string | null;
}

const initialState: SavRappelState = {
  items: [],
  loading: false,
  sending: null,
  resending: null,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSavRappels = createAsyncThunk(
  'savRappel/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/sav/rappel-ticketing');
      if (!res.data.success) throw new Error();
      return res.data.data as SavRappel[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement rappels');
    }
  }
);

export const envoyerRappel = createAsyncThunk(
  'savRappel/envoyer',
  async ({ id, ...body }: EnvoiPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/sav/rappel-ticketing/${id}`, body);
      if (!res.data.success) throw new Error();
      return res.data.data as SavRappel;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Erreur lors de l'envoi");
    }
  }
);

export const reenvoyerRappel = createAsyncThunk(
  'savRappel/reenvoyer',
  async ({ id, ...body }: ReenvoiPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/sav/rappel-ticketing/${id}`, body);
      if (!res.data.success) throw new Error();
      return res.data.data as SavRappel;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur lors du renvoi');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const savRappelSlice = createSlice({
  name: 'savRappel',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchSavRappels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavRappels.fulfilled, (state, action: PayloadAction<SavRappel[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSavRappels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ENVOYER
      .addCase(envoyerRappel.pending, (state, action) => {
        state.sending = action.meta.arg.id;
      })
      .addCase(envoyerRappel.fulfilled, (state, action: PayloadAction<SavRappel>) => {
        state.sending = null;
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(envoyerRappel.rejected, (state, action) => {
        state.sending = null;
        state.error = action.payload as string;
      })

      // REENVOYER
      .addCase(reenvoyerRappel.pending, (state, action) => {
        state.resending = action.meta.arg.id;
      })
      .addCase(reenvoyerRappel.fulfilled, (state, action: PayloadAction<SavRappel>) => {
        state.resending = null;
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(reenvoyerRappel.rejected, (state, action) => {
        state.resending = null;
        state.error = action.payload as string;
      });
  },
});

export default savRappelSlice.reducer;