import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';
import { unwrapApiResponse } from '../../../service/apiHelper';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ClientBeneficiairePerson {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  etatCivil: string;
  numero: string;
  email: string;
  adresse: string;
  paysResidence: string;
  typePerson: string;
  clientBeneficiaireFormId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBeneficiaireForm {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  etatCivil: string;
  numero: string;
  email: string;
  adresse: string;
  paysResidence: string;
  nomContactUrgence: string;
  prenomContactUrgence: string;
  numeroContactUrgence: string;
  emailContactUrgence: string;
  professionActuelle: string;
  nomEmployeur: string;
  numeroTelephone: string;
  emailProfessionnel: string;
  adresseProfessionnel: string;
  etablissement: string;
  diplome: string;
  referenceDoc: string;
  typeDoc: string;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  clientBeneficiairePerson: ClientBeneficiairePerson[];
}

// ── Nouveau type pour l'assurance ──────────────────────────────────────────

export interface ClientAssuranceForm {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  numero: string;
  email: string;
  adresse: string;
  numeroPassport: string;
  status: string;
  assuranceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssuranceDetail {
  id: string;
  idAssuranceLigne: string;
  zoneDestination: string;
  destination: string;
  assureur: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  clientAssuranceForms: ClientAssuranceForm[];
}

export interface UserDocument {
  id: string;
  idVisadocClient: string;
  idAssuranceDoc?: string;       // présent pour ASSURANCE
  type?: string;                  // 'ASSURANCE' | 'VISA'
  nomDoc: string;
  pj: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface PassagerDetail {
  id: string;
  nom: string;
  motDePasse: string;
  idVisaAbstract?: string;
  clientBeneficiaireId?: string;
  userType: 'VISA' | 'ASSURANCE';   // ← nouveau champ
  actif: boolean;
  isValidate: boolean;
  createdAt: string;
  // VISA
  clientBeneficiaireForms: ClientBeneficiaireForm[];
  // ASSURANCE
  clientAssuranceForms: ClientAssuranceForm[];
  assurance: AssuranceDetail | null;
  userDocument: UserDocument[];
}

interface PassagerDetailState {
  detail: PassagerDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: PassagerDetailState = {
  detail: null,
  loading: false,
  error: null,
};

// ── Thunks communs ─────────────────────────────────────────────────────────

export const fetchPassagerDetail = createAsyncThunk(
  'passagerDetail/fetch',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/portail-client/client-form/information/${id}`);
      return unwrapApiResponse<PassagerDetail>(res.data, 'Erreur chargement détail passager');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur chargement détail passager');
    }
  }
);

// ── Thunks VISA ────────────────────────────────────────────────────────────

export const validateClientForm = createAsyncThunk(
  'passagerDetail/validateForm',
  async (formId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/portail-client/client-form/${formId}/validate-visa`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur validation formulaire');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur validation formulaire');
    }
  }
);

export const validateDocument = createAsyncThunk(
  'passagerDetail/validateDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/portail-client/document/${documentId}/validate-visa`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur validation document');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur validation document');
    }
  }
);

export const syncPassagerInfo = createAsyncThunk(
  'passagerDetail/sync',
  async (idVisaAbstract: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/portail-client/sync-info-visa/${idVisaAbstract}`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur synchronisation');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur synchronisation');
    }
  }
);

// ── Thunks ASSURANCE ───────────────────────────────────────────────────────

export const validateAssuranceForm = createAsyncThunk(
  'passagerDetail/validateAssuranceForm',
  async (formId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/portail-client/client-form/${formId}/validate-assurance`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur validation formulaire assurance');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur validation formulaire assurance');
    }
  }
);

export const validateAssuranceDocument = createAsyncThunk(
  'passagerDetail/validateAssuranceDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/portail-client/document/${documentId}/validate-assurance`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur validation document assurance');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur validation document assurance');
    }
  }
);

export const syncAssuranceInfo = createAsyncThunk(
  'passagerDetail/syncAssurance',
  async (idAssurance: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/portail-client/sync-info-assurance/${idAssurance}`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur synchronisation assurance');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur synchronisation assurance');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const passagerDetailSlice = createSlice({
  name: 'passagerDetail',
  initialState,
  reducers: {
    clearPassagerDetail: (state) => { state.detail = null; state.error = null; },
  },
  extraReducers: (builder) => {
    // helper pour réduire la répétition
    const addLoadingCases = (thunk: any) => {
      builder
        .addCase(thunk.pending,   (state) => { state.loading = true;  state.error = null; })
        .addCase(thunk.fulfilled, (state) => { state.loading = false; })
        .addCase(thunk.rejected,  (state, action: any) => { state.loading = false; state.error = action.payload as string; });
    };

    builder
      .addCase(fetchPassagerDetail.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchPassagerDetail.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
      .addCase(fetchPassagerDetail.rejected,  (state, action: any) => { state.loading = false; state.error = action.payload as string; });

    addLoadingCases(validateClientForm);
    addLoadingCases(validateDocument);
    addLoadingCases(syncPassagerInfo);
    addLoadingCases(validateAssuranceForm);
    addLoadingCases(validateAssuranceDocument);
    addLoadingCases(syncAssuranceInfo);
  },
});

export const { clearPassagerDetail } = passagerDetailSlice.actions;
export default passagerDetailSlice.reducer;