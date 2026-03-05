import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface VisaLigne {
  id: string;
  numeroDossier: string | null;
  rasionAnnulationId: string | null;
  visaEnteteId: string;
  visaProspectionLigneId: string;
  origineLine: string | null;
  referenceLine: string;
  statut: string;
  statusLigne: string;
  statusVisa: string;
  variante: string | null;
  soummissionTauxChange: number | null;
  soummissionPuConsilatAriary: number | null;
  soummissionPuClientAriary: number | null;
  soummissionCommissionAriary: number | null;
  limiteSoummision: string | null;
  referenceSoummision: string | null;
  limitePaiement: string | null;
  resultatVisa: string | null;
  createdAt: string;
  updatedAt: string;
  RaisonAnnulation: null;
  visaProspectionLigne: {
    id: string;
    nombre: number;
    dateDepart: string;
    dateRetour: string;
    etatPiece: boolean;
    etatVisa: string;
    devise: string;
    tauxEchange: number;
    puConsulatDevise: number;
    puConsulatAriary: number;
    puClientDevise: number;
    puClientAriary: number;
    consulatId: string;
    visaParamsId: string;
    visaProspectionEnteteId: string;
    createdAt: string;
    updatedAt: string;
    visaParams: {
      id: string;
      code: string;
      description: string;
      status: string;
      paysId: string;
      pVenteAriary: number;
      puAchatDevise: number;
      dureeTraitement: number;
      visaTypeId: string;
      visaDureeId: string;
      visaEntreeId: string;
      createdAt: string;
      updatedAt: string;
      visaType: { id: string; nom: string; description: string };
      visaDuree: { id: string; duree: number };
      visaEntree: { id: string; entree: string };
      pays: { id: string; pays: string; photo: string };
    };
    consulat: { id: string; nom: string; createdAt: string; updatedAt: string };
  };
}

export interface VisaEntete {
  id: string;
  visaProspectionEnteteId: string;
  rasionAnnulationId: string | null;
  statut: string;
  statutEntete: string;
  pdfLogin: string | null;
  createdAt: string;
  updatedAt: string;
  RaisonAnnulation: null;
  visaProspectionEntete: {
    id: string;
    prestationId: string;
    prestation: {
      id: string;
      numeroDos: string;
      status: string;
      dossierCommunColabId: string;
      dossierId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  visaLigne: VisaLigne[];
}

interface VisaEnteteState {
  data: VisaEntete[];
  loading: boolean;
  error: string | null;
}

const initialState: VisaEnteteState = {
  data: [],
  loading: false,
  error: null,
};

// ── Thunk ──────────────────────────────────────────────────────────────────

export const fetchVisaEntetes = createAsyncThunk(
  'visaEntete/fetchAll',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/visa/entete/prestation/${prestationId}`);
      return res.data.data as VisaEntete[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement visa');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const visaEnteteSlice = createSlice({
  name: 'visaEntete',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaEntetes.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchVisaEntetes.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaEntetes.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default visaEnteteSlice.reducer;