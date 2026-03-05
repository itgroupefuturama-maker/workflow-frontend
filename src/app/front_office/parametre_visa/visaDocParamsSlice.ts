import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaDocParams {
  id: string;
  code: string;
  document: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface VisaDocParamsState { data: VisaDocParams[]; loading: boolean; error: string | null; }
const initialState: VisaDocParamsState = { data: [], loading: false, error: null };

export const fetchVisaDocParams = createAsyncThunk('visaDocParams/fetchAll', async () => {
  const res = await axios.get('/visa-params/visa-doc-params');
  return res.data.data;
});

const visaDocParamsSlice = createSlice({
  name: 'visaDocParams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaDocParams.pending, (state) => { state.loading = true; })
      .addCase(fetchVisaDocParams.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaDocParams.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaDocParamsSlice.reducer;