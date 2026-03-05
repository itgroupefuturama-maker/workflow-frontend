import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaType {
  id: string;
  nom: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface VisaTypeState {
  data: VisaType[];
  loading: boolean;
  error: string | null;
}

const initialState: VisaTypeState = { data: [], loading: false, error: null };

export const fetchVisaTypes = createAsyncThunk('visaType/fetchAll', async () => {
  const res = await axios.get('/visa-params/visa-type');
  return res.data.data;
});

const visaTypeSlice = createSlice({
  name: 'visaType',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaTypes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchVisaTypes.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaTypes.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaTypeSlice.reducer;