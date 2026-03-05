import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaDoc {
  id: string;
  visaDocParamsId: string;
  visaParamsId: string;
  createdAt: string;
  updatedAt: string;
  visaDocParams?: { code: string; document: string; status: string };
  visaParams?: { code: string; description: string };
}

interface VisaDocState { data: VisaDoc[]; loading: boolean; error: string | null; }
const initialState: VisaDocState = { data: [], loading: false, error: null };

export const fetchVisaDocs = createAsyncThunk('visaDoc/fetchAll', async () => {
  const res = await axios.get('/visa-params/visa-doc');
  return res.data.data;
});

const visaDocSlice = createSlice({
  name: 'visaDoc',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaDocs.pending, (state) => { state.loading = true; })
      .addCase(fetchVisaDocs.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaDocs.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaDocSlice.reducer;