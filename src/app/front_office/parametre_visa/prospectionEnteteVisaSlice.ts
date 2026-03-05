import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface VisaProspectionLigne {
  id: string;
  visaProspectionEnteteId: string;
  visaParamsId: string;
  nombre: number;
  dateDepart: string;
  dateRetour: string;
  etatPiece: boolean;
  etatVisa: string;
  consulatId: string;
  puConsulatDevise: number;
  puConsulatAriary: number;
  puClientDevise: number;
  puClientAriary: number;
  devise: string;
  tauxEchange: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisaProspectionEntete {
  id: string;
  prestationId: string;
  prestation: {
    id: string;
    numeroDos: string;
    status: string;
    dossierCommunColab: {
      dossierCommun: {
        referenceTravelPlaner: string;
        numero: number;
        description: string;
        contactPrincipal: string;
      };
    };
  };
  visaProspectionLigne: VisaProspectionLigne[];
}

interface VisaProspectionEnteteState {
  data: VisaProspectionEntete[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: VisaProspectionEnteteState = {
  data: [],
  loading: false,
  creating: false,
  error: null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchProspectionEntetes = createAsyncThunk(
  'visaProspectionEntete/fetchAll',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/visa/prospection-entete/prestation/${prestationId}`);
      return res.data.data as VisaProspectionEntete[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement prospections');
    }
  }
);

export const createProspectionEntete = createAsyncThunk(
  'visaProspectionEntete/create',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post('/visa/prospection-entete', { prestationId });
      return res.data.data as VisaProspectionEntete;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur création prospection');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const visaProspectionEnteteSlice = createSlice({
  name: 'visaProspectionEntete',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProspectionEntetes.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchProspectionEntetes.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchProspectionEntetes.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(createProspectionEntete.pending,   (state) => { state.creating = true;  state.error = null; })
      .addCase(createProspectionEntete.fulfilled, (state, action) => { state.creating = false; state.data.unshift(action.payload); })
      .addCase(createProspectionEntete.rejected,  (state, action) => { state.creating = false; state.error = action.payload as string; });
  },
});

export default visaProspectionEnteteSlice.reducer;