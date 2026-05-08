import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface Passager {
  dateDepart: string;
  owner: string;
  pnr: string;
  nom: string;
  typeVol: string;
  numeroVol: string;
  itineraire: string;
  heureDepart: string;
  heureArrive: string;
  status: string;
}

interface BilletState {
  passagers: Passager[];
  loading: boolean;
  error: string | null;
}

const initialState: BilletState = {
  passagers: [],
  loading: false,
  error: null,
};

// ─── Thunk ────────────────────────────────────────────────────────────────────

export const fetchPassagersByDateRange = createAsyncThunk(
  'billet/fetchByDateRange',
  async (
    { startDate, endDate }: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get('/billet/search-by-date-range', {
        params: { startDate, endDate },
      });
      if (!res.data.success) throw new Error();
      return res.data.data as Passager[];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur chargement passagers'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const passagerListeSlice = createSlice({
  name: 'passagerListe',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPassagersByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPassagersByDateRange.fulfilled,
        (state, action: PayloadAction<Passager[]>) => {
          state.loading = false;
          state.passagers = action.payload;
        }
      )
      .addCase(fetchPassagersByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default passagerListeSlice.reducer;