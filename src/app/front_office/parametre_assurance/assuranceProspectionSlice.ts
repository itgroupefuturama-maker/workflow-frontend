import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';
import type { AssuranceParams } from './assuranceParamsSlice';


export interface AssuranceDoc {
  id: string;
  codeDoc: string;
  document: string;
  assuranceDocId: string;
  assuranceParamsId: string;
  createdAt: string;
  assuranceParams?: AssuranceParams;
}

export interface AssuranceTarifPlein {
  id: string;
  borneInf: number;
  borneSup: number;
  prixAssureurDevise: number;
  commissionDevise: number;
  prixClientDevise: number;
  prixAssureurAriary: number;
  commissionAriary: number;
  prixClientAriary: number;
  devise: string;
  assuranceParamsId: string;
  createdAt: string;
  assuranceParams?: AssuranceParams;
}

export interface AssuranceTarifReduit {
  id: string;
  borneInf: number;
  borneSup: number;
  tauxApplique: number;
  assuranceParamsId: string;
  createdAt: string;
  assuranceParams?: AssuranceParams;
}
// ── Types ──────────────────────────────────────────────────────────────────

export interface AssuranceProspectionLigne {
  id: string;
  assuranceProspectionEnteteId: string;
  assuranceParamsId: string;
  dateDepart: string;
  dateRetour: string;
  duree: number;
  dateDevis: string | null;
  referenceDevis: string | null;
  tauxChange: number;
  createdAt: string;
  assuranceTarifPlein:   AssuranceTarifPlein;
  assuranceParams: {
    id: string;
    zoneDestination: string;
    status: string;
    dateApplication: string;
    assuranceDocParams:    AssuranceDoc[];
    assuranceTarifReduit:  AssuranceTarifReduit[];
  };
}

export interface AssuranceProspectionEntete {
  id: string;
  prestationId: string;
  fournisseurId: string;
  createdAt: string;
  prestation: {
    id: string;
    numeroDos: string;
    status: string;
    createdAt: string;
  };
  fournisseur: {
    id: string;
    code: string;
    libelle: string;
    status: string;
  };
  assuranceProspectionLigne: AssuranceProspectionLigne[];
}

export interface AssuranceDevisDetail {
  devis: {
    id: string;
    reference: string;
    totalGeneral: number;
    statut: string;
    url1: string | null;
    url2: string | null;
    createdAt: string;
  };
  prospectionAssurance: {
    id: string;
    prestationId: string;
    fournisseurId: string;
    clientFacture: string;
    numeroDossierCommun: number;
    createdAt: string;
    prestation: {
      id: string;
      numeroDos: string;
      status: string;
      createdAt: string;
    };
    fournisseur: {
      id: string;
      code: string;
      libelle: string;
      status: string;
    };
  };
  assuranceProspectionLignes: {
    id: string;
    duree: number;
    dateDepart: string;
    dateRetour: string;
    tauxChange: number;
    referenceDevis: string | null;
    dateDevis: string | null;
    assuranceParamsId: string;
    createdAt: string;
  }[];
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
    createdAt: string;
  };
}

// dans State
interface State {
  list:        AssuranceProspectionEntete[];
  devisDetail: AssuranceDevisDetail | null; // ← ajouter
  loading:     boolean;
  loadingDevis: boolean;                    // ← ajouter
  creating:    boolean;
  error:       string | null;
  createError: string | null;
  actioning:   boolean;
  actionError: string | null;
  actionSuccess: string | null;
}

const initialState: State = {
  list:         [],
  devisDetail:  null,
  loading:      false,
  loadingDevis: false,
  creating:     false,
  error:        null,
  createError:  null,
  actioning:    false,
  actionError:  null,
  actionSuccess: null,
};

export const fetchAssuranceDevisDetail = createAsyncThunk(
  'assuranceProspection/fetchDevisDetail',
  async (assuranceProspectionEnteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/assurance/devis/${assuranceProspectionEnteteId}`);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur chargement devis');
    }
  }
);

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchAssuranceProspections = createAsyncThunk(
  'assuranceProspection/fetchAll',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/assurance/prospection-entete/prestation/${prestationId}`);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur chargement');
    }
  }
);

export const createAssuranceProspection = createAsyncThunk(
  'assuranceProspection/create',
  async (body: { prestationId: string; fournisseurId: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/assurance/prospection-entete', body);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur création');
    }
  }
);

export const createAssuranceProspectionLigne = createAsyncThunk(
  'assuranceProspection/createLigne',
  async (body: {
    assuranceProspectionEnteteId: string;
    assuranceParamsId: string;
    dateDepart: string;
    dateRetour: string;
    duree: number;
    tauxChange: number;
  }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/assurance/prospection-ligne', body);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur création ligne');
    }
  }
);

export const createAssuranceDevis = createAsyncThunk(
  'assuranceProspection/createDevis',
  async (body: {
    assuranceProspectionEnteteId: string;
    assuranceProspectionLigneIds: string[];
    totalGeneral: number;
  }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/assurance/devis', body);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur création devis');
    }
  }
);

export const envoyerAssuranceDevis = createAsyncThunk(
  'assuranceProspection/envoyerDevis',
  async (devisModuleId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/assurance/devis/envoyer/${devisModuleId}`);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur envoi devis');
    }
  }
);

export const approuverAssuranceDevis = createAsyncThunk(
  'assuranceProspection/approuverDevis',
  async (devisModuleId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/assurance/devis/approuver/${devisModuleId}`);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur approbation devis');
    }
  }
);

export const createAssuranceEntete = createAsyncThunk(
  'assuranceProspection/createEntete',
  async (body: {
    assuranceProspectionEnteteId: string;
    devisModuleId: string;
  }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/assurance/entete', body);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur création assurance');
    }
  }
);

export const genererDevisDirection = createAsyncThunk(
  'assuranceProspection/genererDevisDirection',
  async (assuranceProspectionEnteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/assurance/devis-direction/${assuranceProspectionEnteteId}`);
      return res.data.data as string;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur génération devis direction');
    }
  }
);

export const genererDevisClient = createAsyncThunk(
  'assuranceProspection/genererDevisClient',
  async (assuranceProspectionEnteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/assurance/devis-client/${assuranceProspectionEnteteId}`);
      return res.data.data as string;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur génération devis client');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const slice = createSlice({
  name: 'assuranceProspection',
  initialState,
  reducers: {
    clearAssuranceProspections: (s) => { s.list = []; s.error = null; },
    clearCreateError: (state) => {
      state.createError = null; 
    }
  },
  extraReducers: (builder) => {
    builder
        .addCase(fetchAssuranceProspections.pending,   (s) => { s.loading = true;  s.error = null; })
        .addCase(fetchAssuranceProspections.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
        .addCase(fetchAssuranceProspections.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
        
        .addCase(createAssuranceProspection.pending,   (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceProspection.rejected,  (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceProspection.fulfilled, (s, a) => { s.creating = false; s.list.push(a.payload); })

        .addCase(createAssuranceProspectionLigne.pending,   (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceProspectionLigne.rejected,  (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceProspectionLigne.fulfilled, (s) => { s.creating = false; })

        .addCase(createAssuranceDevis.pending,   (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceDevis.rejected,  (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceDevis.fulfilled, (s) => { s.creating = false; })

        .addCase(fetchAssuranceDevisDetail.pending,   (s) => { s.loadingDevis = true;  s.error = null; })
        .addCase(fetchAssuranceDevisDetail.rejected,  (s, a) => { s.loadingDevis = false; s.error = a.payload as string; })
        .addCase(fetchAssuranceDevisDetail.fulfilled, (s, a) => { s.loadingDevis = false; s.devisDetail = a.payload; })

        .addCase(envoyerAssuranceDevis.pending,    (s) => { s.actioning = true;  s.actionError = null; s.actionSuccess = null; })
        .addCase(envoyerAssuranceDevis.rejected,   (s, a) => { s.actioning = false; s.actionError = a.payload as string; })
        .addCase(envoyerAssuranceDevis.fulfilled,  (s) => { s.actioning = false; s.actionSuccess = 'Devis envoyé avec succès.'; })

        .addCase(approuverAssuranceDevis.pending,  (s) => { s.actioning = true;  s.actionError = null; s.actionSuccess = null; })
        .addCase(approuverAssuranceDevis.rejected, (s, a) => { s.actioning = false; s.actionError = a.payload as string; })
        .addCase(approuverAssuranceDevis.fulfilled,(s) => { s.actioning = false; s.actionSuccess = 'Devis approuvé avec succès.'; })

        .addCase(createAssuranceEntete.pending,   (s) => { s.actioning = true;  s.actionError = null; s.actionSuccess = null; })
        .addCase(createAssuranceEntete.rejected,  (s, a) => { s.actioning = false; s.actionError = a.payload as string; })
        .addCase(createAssuranceEntete.fulfilled, (s) => { s.actioning = false; s.actionSuccess = 'Assurance créée avec succès.'; })

        .addCase(genererDevisDirection.pending,   (s) => { s.actioning = true;  s.actionError = null; s.actionSuccess = null; })
        .addCase(genererDevisDirection.rejected,  (s, a) => { s.actioning = false; s.actionError = a.payload as string; })
        .addCase(genererDevisDirection.fulfilled, (s) => { s.actioning = false; })

        .addCase(genererDevisClient.pending,   (s) => { s.actioning = true;  s.actionError = null; s.actionSuccess = null; })
        .addCase(genererDevisClient.rejected,  (s, a) => { s.actioning = false; s.actionError = a.payload as string; })
        .addCase(genererDevisClient.fulfilled, (s) => { s.actioning = false; })
  },
});

export const { clearAssuranceProspections, clearCreateError } = slice.actions;
export default slice.reducer;