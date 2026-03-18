import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AssuranceDoc {
  id:        string;
  codeDoc:   string;
  document:  string;
  createdAt: string;
  updatedAt: string;
}

export interface AssuranceDocParams {
  id:                string;
  assuranceDocId:    string;
  assuranceParamsId: string;
  createdAt:         string;
  updatedAt:         string;
  assuranceDoc:      AssuranceDoc;
}

export interface UpdateFacturePayload {
  assuranceId:             string;
  tauxChangeFacture:       number;
  puFactureAssureurDevise: number;
  puFactureAssureurAriary: number;
  puFactureClientAriary:   number;
  commissionFactureAriary: number;
  numeroPolice:            string;
  numeroQuittance:         string;
}

export interface AssuranceTarifPlein {
  id:                  string;
  borneInf:            number;
  borneSup:            number;
  prixAssureurDevise:  number;
  commissionDevise:    number;
  prixClientDevise:    number;
  prixAssureurAriary:  number;
  commissionAriary:    number;
  prixClientAriary:    number;
  devise:              string;
  assuranceParamsId:   string;
  createdAt:           string;
  updatedAt:           string;
}

export interface AssuranceTarifReduit {
  id:                string;
  borneInf:          number;
  borneSup:          number;
  tauxApplique:      number;
  assuranceParamsId: string;
  createdAt:         string;
  updatedAt:         string;
}

export interface Fournisseur {
  id:                 string;
  code:               string;
  libelle:            string;
  dateApplication:    string;
  status:             string;
  dateActivation:     string | null;
  dateDesactivation:  string | null;
  createdAt:          string;
  updatedAt:          string;
}

export interface AssuranceParams {
  id:                   string;
  fournisseurId:        string;
  zoneDestination:      string;
  status:               string;
  dateApplication:      string;
  createdAt:            string;
  updatedAt:            string;
  fournisseur:          Fournisseur;
  assuranceDocParams:   AssuranceDocParams[];
  assuranceTarifPlein:  AssuranceTarifPlein[];
  assuranceTarifReduit: AssuranceTarifReduit[];
}

export interface AssuranceProspectionLigne {
  id:                          string;
  assuranceProspectionEnteteId: string;
  assuranceParamsId:           string;
  dateDepart:                  string;
  dateRetour:                  string;
  duree:                       number;
  dateDevis:                   string | null;
  referenceDevis:              string | null;
  tauxChange:                  number;
  createdAt:                   string;
  updatedAt:                   string;
  assuranceParams:             AssuranceParams;
}

export interface AssuranceEnteteRef {
  id:                          string;
  assuranceProspectionEnteteId: string;
  rasionAnnulationId:          string | null;
  statut:                      string;
  statutEntete:                string;
  devisModuleId:               string | null;
  pdfLogin:                    string | null;
  createdAt:                   string;
  updatedAt:                   string;
}

export interface ClientBeneficiaire {
  id:                         string;
  code:                        string;
  libelle:                     string;
  createdAt:                  string;
  updatedAt:                  string;
}

export interface AssuranceLigneDetail {
  id:                         string;
  numeroDossier:              string | null;
  rasionAnnulationId:         string | null;
  assuranceEnteteId:          string;
  assuranceProspectionLigneId: string;
  origineLine:                string | null;
  referenceLine:              string | null;
  statut:                     string;
  statusLigne:                string;
  tauxChangeFacture:          number | null;
  puFactureAssureurDevise:    number | null;
  puFactureAssureurAriary:    number | null;
  puFactureClientAriary:      number | null;
  commissionFactureAriary:    number | null;
  numeroPolice:               string | null;
  numeroQuittance:            string | null;
  clientBeneficiaireId:       string | null;
  clientAssuranceFormId:      string | null;
  createdAt:                  string;
  updatedAt:                  string;
  assuranceEntete:            AssuranceEnteteRef;
  assuranceProspectionLigne:  AssuranceProspectionLigne;
  clientBeneficiaire: ClientBeneficiaire;
}

// ── State ──────────────────────────────────────────────────────────────────

interface State {
  detail:  AssuranceLigneDetail | null;
  loading: boolean;
  error:   string | null;
}

const initialState: State = { detail: null, loading: false, error: null };

// ── Thunk ──────────────────────────────────────────────────────────────────

export const fetchAssuranceEnteteDetail = createAsyncThunk(
  'assuranceEnteteDetail/fetch',
  async (ligneId: string, { rejectWithValue }) => {
    try {
      return (await axios.get(`/assurance/${ligneId}`)).data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur');
    }
  }
);

export const addPassagerToAssurance = createAsyncThunk(
  'assuranceEnteteDetail/addPassager',
  async (
    { assuranceEnteteId, passagers }: {
      assuranceEnteteId: string;
      passagers: { assuranceId: string; passagerId: string }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(
        `/assurance/portail/passager/${assuranceEnteteId}`,
        passagers
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur ajout passager');
    }
  }
);

export const genererPortailAssurance = createAsyncThunk(
  'assuranceEnteteDetail/genererPortail',
  async (assuranceEnteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `/assurance/portail/generer/${assuranceEnteteId}`
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur génération portail');
    }
  }
);

export const updateAssuranceFacture = createAsyncThunk(
  'assuranceEnteteDetail/updateFacture',
  async (payload: UpdateFacturePayload, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/assurance/facture`, payload);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erreur mise à jour facture');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const slice = createSlice({
  name: 'assuranceEnteteDetail',
  initialState,
  reducers: {
    clearAssuranceEnteteDetail: (s) => { s.detail = null; s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssuranceEnteteDetail.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchAssuranceEnteteDetail.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(fetchAssuranceEnteteDetail.fulfilled, (s, a) => { s.loading = false; s.detail = a.payload; })

      .addCase(addPassagerToAssurance.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(addPassagerToAssurance.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(addPassagerToAssurance.fulfilled, (s, a) => { s.loading = false; s.detail = a.payload; })

      .addCase(genererPortailAssurance.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(genererPortailAssurance.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(genererPortailAssurance.fulfilled, (s, a) => { s.loading = false; s.detail = a.payload; })

      .addCase(updateAssuranceFacture.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(updateAssuranceFacture.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(updateAssuranceFacture.fulfilled, (s, a) => { s.loading = false; s.detail = a.payload; })
    },
});

export const { clearAssuranceEnteteDetail } = slice.actions;
export default slice.reducer;