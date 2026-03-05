import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaConsultat {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

interface VisaConsultatState { data: VisaConsultat[]; loading: boolean; error: string | null; }
const initialState: VisaConsultatState = { data: [], loading: false, error: null };

export const fetchVisaConsultats = createAsyncThunk('visaConsultat/fetchAll', async () => {
  const res = await axios.get('/visa-params/consultat');
  return res.data.data;
});

const visaConsultatSlice = createSlice({
  name: 'visaConsultat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaConsultats.pending, (state) => { state.loading = true; })
      .addCase(fetchVisaConsultats.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaConsultats.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaConsultatSlice.reducer;