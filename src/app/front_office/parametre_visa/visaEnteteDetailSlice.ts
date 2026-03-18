import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';
import { unwrapApiResponse } from '../../../service/apiHelper';
import type { VisaEntete } from './visaEnteteSlice';

interface VisaEnteteDetailState {
  detail: VisaEntete | null;
  loading: boolean;
  error: string | null;
}

const initialState: VisaEnteteDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export const fetchVisaEnteteDetail = createAsyncThunk(
  'visaEnteteDetail/fetch',
  async (visaEnteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/visa/entete/${visaEnteteId}`);
      return unwrapApiResponse<VisaEntete>(res.data, 'Erreur chargement détail visa');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur chargement détail visa');
    }
  }
);

export const generateAccesPortail = createAsyncThunk(
  'visaEnteteDetail/generateAccesPortail',
  async (visaEnteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/visa/entete/${visaEnteteId}/generate-acces-portail`);
      if (!res.data.success) return rejectWithValue(res.data.message || "Erreur génération accès portail");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Erreur génération accès portail");
    }
  }
);

export const submitVisaLigne = createAsyncThunk(
  'visaEnteteDetail/submitLigne',
  async (
    payload: {
      id: string;
      soummissionTauxChange: number;
      soummissionPuConsilatAriary: number;
      soummissionPuClientAriary: number;
      soummissionCommissionAriary: number;
      limiteSoummision: string;
      referenceSoummision: string;
      limitePaiement: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = payload;
      const res = await axios.post(`/visa/ligne/${id}/submit`, body);
      return unwrapApiResponse(res.data, 'Erreur soumission ligne');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur soumission ligne');
    }
  }
);

export const sendVisa = createAsyncThunk(
  'visaEnteteDetail/send',
  async (
    payload: { id: string; referenceDossier: string; dateSoummission: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = payload;
      // console.log(payload);
      
      const res = await axios.post(`/visa/${id}/send`, body);
      console.log(`tonga eto ${res}`);
      
      return unwrapApiResponse(res.data, 'Erreur envoi visa');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur envoi visa');
    }
  }
);

export const payVisa = createAsyncThunk(
  'visaEnteteDetail/pay',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/visa/${id}/pay`);
      return unwrapApiResponse(res.data, 'Erreur paiement visa');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur paiement visa');
    }
  }
);

export const decisionVisa = createAsyncThunk(
  'visaEnteteDetail/decision',
  async (
    payload: { id: string; type: string; motif: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = payload;
      const res = await axios.post(`/visa/${id}/decision`, body);
      console.log(`id envoyer ${id}`);
      
      console.log('Réponse serveur:', res.data); // ← voir le JSON exact
      return unwrapApiResponse(res.data, 'Erreur décision visa');
    } catch (err: any) {
      // unwrapApiResponse throw une Error normale, pas une erreur Axios
      return rejectWithValue(err.message || 'Erreur décision visa');
    }
  }
);

const visaEnteteDetailSlice = createSlice({
  name: 'visaEnteteDetail',
  initialState,
  reducers: {
    clearVisaEnteteDetail: (state) => { state.detail = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaEnteteDetail.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchVisaEnteteDetail.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; })
      .addCase(fetchVisaEnteteDetail.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(generateAccesPortail.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(generateAccesPortail.fulfilled, (state) => { state.loading = false; })
      .addCase(generateAccesPortail.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(submitVisaLigne.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(submitVisaLigne.fulfilled, (state) => { state.loading = false; })
      .addCase(submitVisaLigne.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(sendVisa.pending,     (state) => { state.error = null; })
      .addCase(sendVisa.fulfilled,   (state) => { state.loading = false; })
      .addCase(sendVisa.rejected,    (state, action) => { state.error = action.payload as string; })

      .addCase(payVisa.pending,      (state) => { state.error = null; })
      .addCase(payVisa.fulfilled,    (state) => { state.loading = false; })
      .addCase(payVisa.rejected,     (state, action) => { state.error = action.payload as string; })

      .addCase(decisionVisa.pending,   (state) => { state.error = null; })
      .addCase(decisionVisa.fulfilled, (state) => { state.loading = false; })
      .addCase(decisionVisa.rejected,  (state, action) => { state.error = action.payload as string; })
  },
});

export const { clearVisaEnteteDetail } = visaEnteteDetailSlice.actions;
export default visaEnteteDetailSlice.reducer;