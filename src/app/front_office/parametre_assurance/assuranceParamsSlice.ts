import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  status: string;
  dateApplication: string;
}

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

export interface AssuranceParams {
  id: string;
  fournisseurId: string;
  zoneDestination: string;
  status: string;
  dateApplication: string;
  createdAt: string;
  fournisseur: Fournisseur;
  assuranceDocParams:    AssuranceDoc[];        // ← était assuranceDoc
  assuranceTarifPlein:   AssuranceTarifPlein[];
  assuranceTarifReduit:  AssuranceTarifReduit[];
}

interface State {
  params:       AssuranceParams[];
  docs:         AssuranceDoc[];
  tarifsPlein:  AssuranceTarifPlein[];
  tarifsReduit: AssuranceTarifReduit[];
  loading:      boolean;
  creating:     boolean;
  error:        string | null;
  createError:  string | null;
}

const initialState: State = {
  params:       [],
  docs:         [],
  tarifsPlein:  [],
  tarifsReduit: [],
  loading:      false,
  creating:     false,
  error:        null,
  createError:  null,
};

// ── Fetch Thunks ───────────────────────────────────────────────────────────

export const fetchAssuranceParams = createAsyncThunk(
  'assuranceParams/fetchParams',
  async (_, { rejectWithValue }) => {
    try { return (await axios.get('/assurance-params/params')).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur'); }
  }
);
export const fetchAssuranceDocs = createAsyncThunk(
  'assuranceParams/fetchDocs',
  async (_, { rejectWithValue }) => {
    try { return (await axios.get('/assurance-params/docs')).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur'); }
  }
);
export const fetchAssuranceTarifsPlein = createAsyncThunk(
  'assuranceParams/fetchTarifsPlein',
  async (_, { rejectWithValue }) => {
    try { return (await axios.get('/assurance-params/tarifs-plein')).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur'); }
  }
);
export const fetchAssuranceTarifsReduit = createAsyncThunk(
  'assuranceParams/fetchTarifsReduit',
  async (_, { rejectWithValue }) => {
    try { return (await axios.get('/assurance-params/tarifs-reduit')).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur'); }
  }
);

// ── Create Thunks ──────────────────────────────────────────────────────────

export const createAssuranceParams = createAsyncThunk(
  'assuranceParams/createParams',
  async (body: { fournisseurId: string; zoneDestination: string; status: string; dateApplication: string }, { rejectWithValue }) => {
    try { return (await axios.post('/assurance-params/params', body)).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur création'); }
  }
);
export const createAssuranceDoc = createAsyncThunk(
  'assuranceParams/createDoc',
  async (body: { codeDoc: string; document: string}, { rejectWithValue }) => {
    try { return (await axios.post('/assurance-params/docs', body)).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur création'); }
  }
);
export const createAssuranceTarifPlein = createAsyncThunk(
  'assuranceParams/createTarifPlein',
  async (body: {
    borneInf: number; borneSup: number;
    prixAssureurDevise: number; commissionDevise: number; prixClientDevise: number;
    prixAssureurAriary: number; commissionAriary: number; prixClientAriary: number;
    devise: string; assuranceParamsId: string;
  }, { rejectWithValue }) => {
    try { return (await axios.post('/assurance-params/tarifs-plein', body)).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur création'); }
  }
);
export const createAssuranceTarifReduit = createAsyncThunk(
  'assuranceParams/createTarifReduit',
  async (body: { borneInf: number; borneSup: number; tauxApplique: number; assuranceParamsId: string }, { rejectWithValue }) => {
    try { return (await axios.post('/assurance-params/tarifs-reduit', body)).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur création'); }
  }
);
export const linkDocToParams = createAsyncThunk(
  'assuranceParams/linkDocToParams',
  async (body: { assuranceDocId: string; assuranceParamsId: string }, { rejectWithValue }) => {
    try { return (await axios.post('/assurance-params', body)).data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? 'Erreur liaison'); }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const slice = createSlice({
  name: 'assuranceParams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        // fetch
        .addCase(fetchAssuranceParams.pending,         (s) => { s.loading = true;  s.error = null; })
        .addCase(fetchAssuranceParams.rejected,        (s, a) => { s.loading = false; s.error = a.payload as string; })
        .addCase(fetchAssuranceParams.fulfilled,       (s, a) => { s.loading = false; s.params = a.payload; })

        .addCase(fetchAssuranceDocs.pending,           (s) => { s.loading = true;  s.error = null; })
        .addCase(fetchAssuranceDocs.rejected,          (s, a) => { s.loading = false; s.error = a.payload as string; })
        .addCase(fetchAssuranceDocs.fulfilled,         (s, a) => { s.loading = false; s.docs = a.payload; })

        .addCase(fetchAssuranceTarifsPlein.pending,    (s) => { s.loading = true;  s.error = null; })
        .addCase(fetchAssuranceTarifsPlein.rejected,   (s, a) => { s.loading = false; s.error = a.payload as string; })
        .addCase(fetchAssuranceTarifsPlein.fulfilled,  (s, a) => { s.loading = false; s.tarifsPlein = a.payload; })

        .addCase(fetchAssuranceTarifsReduit.pending,   (s) => { s.loading = true;  s.error = null; })
        .addCase(fetchAssuranceTarifsReduit.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
        .addCase(fetchAssuranceTarifsReduit.fulfilled, (s, a) => { s.loading = false; s.tarifsReduit = a.payload; })

        // create
        .addCase(createAssuranceParams.pending,        (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceParams.rejected,       (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceParams.fulfilled,      (s, a) => { s.creating = false; s.params.push(a.payload); })

        .addCase(createAssuranceDoc.pending,           (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceDoc.rejected,          (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceDoc.fulfilled,         (s, a) => { s.creating = false; s.docs.push(a.payload); })

        .addCase(createAssuranceTarifPlein.pending,    (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceTarifPlein.rejected,   (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceTarifPlein.fulfilled,  (s, a) => { s.creating = false; s.tarifsPlein.push(a.payload); })

        .addCase(createAssuranceTarifReduit.pending,   (s) => { s.creating = true;  s.createError = null; })
        .addCase(createAssuranceTarifReduit.rejected,  (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(createAssuranceTarifReduit.fulfilled, (s, a) => { s.creating = false; s.tarifsReduit.push(a.payload); })

        .addCase(linkDocToParams.pending,   (s) => { s.creating = true;  s.createError = null; })
        .addCase(linkDocToParams.rejected,  (s, a) => { s.creating = false; s.createError = a.payload as string; })
        .addCase(linkDocToParams.fulfilled, (s) => { s.creating = false; })
  },
});

export default slice.reducer;