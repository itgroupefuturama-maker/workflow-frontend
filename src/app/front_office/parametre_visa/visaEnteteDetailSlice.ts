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
  },
});

export const { clearVisaEnteteDetail } = visaEnteteDetailSlice.actions;
export default visaEnteteDetailSlice.reducer;