import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaEntree {
  id: string;
  entree: string;
  createdAt: string;
  updatedAt: string;
}

interface VisaEntreeState { data: VisaEntree[]; loading: boolean; error: string | null; }
const initialState: VisaEntreeState = { data: [], loading: false, error: null };

export const fetchVisaEntrees = createAsyncThunk('visaEntree/fetchAll', async () => {
  const res = await axios.get('/visa-params/visa-entree');
  return res.data.data;
});

const visaEntreeSlice = createSlice({
  name: 'visaEntree',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaEntrees.pending, (state) => { state.loading = true; })
      .addCase(fetchVisaEntrees.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaEntrees.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaEntreeSlice.reducer;