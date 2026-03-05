import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';
import { unwrapApiResponse } from '../../../service/apiHelper';

// ── Types ──────────────────────────────────────────────────────────────────

export interface VisaDevisDetail {
  devis: {
    id: string;
    reference: string;
    totalGeneral: number;
    statut: string;
    url1: string | null;
    url2: string | null;
    createdAt: string;
    updatedAt: string;
  };
  prospectionVisa: {
    id: string;
    prestationId: string;
    prestation: {
      id: string;
      numeroDos: string;
      status: string;
      dossierId: string;
      dossierCommunColabId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  visaProspectionLignes: Array<{
    id: string;
    devise: string;
    nombre: number;
    etatVisa: string;
    etatPiece: boolean;
    dateDepart: string;
    dateRetour: string;
    tauxEchange: number;
    puClientAriary: number;
    puClientDevise: number;
    puConsulatAriary: number;
    puConsulatDevise: number;
    consulatId: string;
    visaParamsId: string;
    visaProspectionEnteteId: string;
    createdAt: string;
    updatedAt: string;
    consulat: {
      id: string;
      nom: string;
      createdAt: string;
      updatedAt: string;
    };
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
      pays: { id: string; pays: string; photo: string };
      visaType: { id: string; nom: string; description: string };
      visaDuree: { id: string; duree: number };
      visaEntree: { id: string; entree: string };
    };
  }>;
  suivi: {
    id: string;
    evolution: string;
    entity: string;
    statut: string;
    origineLigne: string;
    dateEnvoieDevis: string | null;
    dateApprobation: string | null;
    referenceBcClient: string | null;
    dateCreationBc: string | null;
    dateSoumisBc: string | null;
    dateApprobationBc: string | null;
    referenceFacClient: string | null;
    dateCreationFac: string | null;
    dateReglement: string | null;
    dateAnnulation: string | null;
    dateModification: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface VisaDevisState {
  detail: VisaDevisDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: VisaDevisState = {
  detail: null,
  loading: false,
  error: null,
};

// ── Thunk ──────────────────────────────────────────────────────────────────

export const fetchVisaDevis = createAsyncThunk(
  'visaDevis/fetchDetail',
  async (enteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/visa/devis/${enteteId}`);
      return unwrapApiResponse<VisaDevisDetail>(res.data, 'Erreur chargement devis');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur chargement devis');
    }
  }
);

export const envoyerDevis = createAsyncThunk(
  'visaDevis/envoyer',
  async (devisId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/visa/devis/envoyer/${devisId}`);
      return unwrapApiResponse<VisaDevisDetail>(res.data, "Erreur lors de l'envoi du devis");
    } catch (err: any) {
      return rejectWithValue(err.message || "Erreur lors de l'envoi du devis");
    }
  }
);

export const approuverDevis = createAsyncThunk(
  'visaDevis/approuver',
  async (devisId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/visa/devis/approuver/${devisId}`);
      return unwrapApiResponse<VisaDevisDetail>(res.data, "Erreur lors de l'approbation du devis");
    } catch (err: any) {
      return rejectWithValue(err.message || "Erreur lors de l'approbation du devis");
    }
  }
);

export const creerVisaEntete = createAsyncThunk(
  'visaDevis/creerVisaEntete',
  async (
    payload: { visaProspectionEnteteId: string; devisModuleId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post('/visa/entete', payload);
      return unwrapApiResponse(res.data, 'Erreur lors de la création du visa');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur lors de la création du visa');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const visaDevisSlice = createSlice({
  name: 'visaDevis',
  initialState,
  reducers: {
    clearVisaDevis: (state) => { state.detail = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaDevis.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchVisaDevis.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
      .addCase(fetchVisaDevis.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
      // ── envoyerDevis ──
      .addCase(envoyerDevis.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(envoyerDevis.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
      .addCase(envoyerDevis.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })

      // ── approuverDevis ──
      .addCase(approuverDevis.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(approuverDevis.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
      .addCase(approuverDevis.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })

      // ── creerVisaEntete ──
      .addCase(creerVisaEntete.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(creerVisaEntete.fulfilled, (state) => { state.loading = false; })
      .addCase(creerVisaEntete.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
  },
});

export const { clearVisaDevis } = visaDevisSlice.actions;
export default visaDevisSlice.reducer;