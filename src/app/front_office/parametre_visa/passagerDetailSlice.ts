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

export interface UserDocument {
  id: string;
  idVisadocClient: string;
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
  idVisaAbstract: string;
  actif: boolean;
  isValidate: boolean;
  createdAt: string;
  clientBeneficiaireForms: ClientBeneficiaireForm[];
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

// ── Thunk ──────────────────────────────────────────────────────────────────

export const fetchPassagerDetail = createAsyncThunk(
  'passagerDetail/fetch',
  async (idVisaAbstract: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/portail-client/client-form/visa-abstract/${idVisaAbstract}`);
      return unwrapApiResponse<PassagerDetail>(res.data, 'Erreur chargement détail passager');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur chargement détail passager');
    }
  }
);
export const validateClientForm = createAsyncThunk(
  'passagerDetail/validateForm',
  async (formId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/portail-client/client-form/${formId}/validate`);
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
      const res = await axios.patch(`/portail-client/document/${documentId}/validate`);
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
      const res = await axios.post(`/portail-client/sync-info/${idVisaAbstract}`);
      if (!res.data.success) return rejectWithValue(res.data.message || 'Erreur synchronisation');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur synchronisation');
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
    builder
        .addCase(fetchPassagerDetail.pending,   (state) => { state.loading = true;  state.error = null; })
        .addCase(fetchPassagerDetail.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
        .addCase(fetchPassagerDetail.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
        // ── validateClientForm ──
        .addCase(validateClientForm.pending,   (state) => { state.loading = true;  state.error = null; })
        .addCase(validateClientForm.fulfilled, (state) => { state.loading = false; })
        .addCase(validateClientForm.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })

        // ── validateDocument ──
        .addCase(validateDocument.pending,   (state) => { state.loading = true;  state.error = null; })
        .addCase(validateDocument.fulfilled, (state) => { state.loading = false; })
        .addCase(validateDocument.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })

        // ── syncPassagerInfo ──
        .addCase(syncPassagerInfo.pending,   (state) => { state.loading = true;  state.error = null; })
        .addCase(syncPassagerInfo.fulfilled, (state) => { state.loading = false; })
        .addCase(syncPassagerInfo.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
  },
});

export const { clearPassagerDetail } = passagerDetailSlice.actions;
export default passagerDetailSlice.reducer;