import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AssuranceDocParams {
  id: string;
  assuranceDocId: string;
  assuranceParamsId: string;
  createdAt: string;
  assuranceDoc: {
    id: string;
    codeDoc: string;
    document: string;
  }
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
}

export interface AssuranceTarifReduit {
  id: string;
  borneInf: number;
  borneSup: number;
  tauxApplique: number;
  assuranceParamsId: string;
  createdAt: string;
}

export interface AssuranceParams {
  id: string;
  fournisseurId: string;
  zoneDestination: string;
  status: string;
  dateApplication: string;
  createdAt: string;
  assuranceDocParams:   AssuranceDocParams[];
  assuranceTarifPlein:  AssuranceTarifPlein[];
  assuranceTarifReduit: AssuranceTarifReduit[];
}

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
  assuranceParams: AssuranceParams;
}

export interface AssuranceLigne {
  id: string;
  numeroDossier: string | null;
  assuranceEnteteId: string;
  assuranceProspectionLigneId: string;
  referenceLine: string | null;
  statut: string;
  statusLigne: string;
  tauxChangeFacture: number | null;
  puFactureAssureurDevise: number | null;
  puFactureAssureurAriary: number | null;
  puFactureClientAriary: number | null;
  commissionFactureAriary: number | null;
  numeroPolice: string | null;
  numeroQuittance: string | null;
  clientBeneficiaireId: string | null;
  clientAssuranceFormId: string | null;
  createdAt: string;
  assuranceProspectionLigne: AssuranceProspectionLigne;
}

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  status: string;
  dateApplication: string;
}

export interface AssuranceProspectionEntete {
  id: string;
  prestationId: string;
  fournisseurId: string;
  createdAt: string;
  fournisseur: Fournisseur;
  prestation: {
    id: string;
    numeroDos: string;
    status: string;
  };
}

export interface AssuranceEntete {
  id: string;
  assuranceProspectionEnteteId: string;
  statut: string;
  statutEntete: string;
  pdfLogin: string | null;
  createdAt: string;
  updatedAt: string;
  assuranceProspectionEntete: AssuranceProspectionEntete;
  assurance: AssuranceLigne[];
}

interface State {
  entetes:  AssuranceEntete[];
  loading:  boolean;
  error:    string | null;
}

const initialState: State = {
  entetes:  [],
  loading:  false,
  error:    null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchAssuranceEntetes = createAsyncThunk(
  'assuranceEntete/fetchByPrestation',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      return (await axios.get(`/assurance/entete/prestation/${prestationId}`)).data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const slice = createSlice({
  name: 'assuranceEntete',
  initialState,
  reducers: {
    clearAssuranceEntetes: (s) => { s.entetes = []; s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssuranceEntetes.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchAssuranceEntetes.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(fetchAssuranceEntetes.fulfilled, (s, a) => { s.loading = false; s.entetes = a.payload; });
  },
});

export const { clearAssuranceEntetes } = slice.actions;
export default slice.reducer;