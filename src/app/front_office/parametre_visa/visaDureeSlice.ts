import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaDuree {
  id: string;
  duree: number;
  createdAt: string;
  updatedAt: string;
}

interface VisaDureeState { data: VisaDuree[]; loading: boolean; error: string | null; }
const initialState: VisaDureeState = { data: [], loading: false, error: null };

export const fetchVisaDurees = createAsyncThunk('visaDuree/fetchAll', async () => {
  const res = await axios.get('/visa-params/visa-duree');
  return res.data.data;
});

const visaDureeSlice = createSlice({
  name: 'visaDuree',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaDurees.pending, (state) => { state.loading = true; })
      .addCase(fetchVisaDurees.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaDurees.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaDureeSlice.reducer;