import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface MilesCompagnie {
  compagnie: {
    id: string;
    code: string;
    libelle: string;
    dateApplication: string;
    status: string;
  };
  miles: number;
  idCompagnieClient: string;
}

export interface ClientMiles {
  beneficiaire: {
    id: string;
    code: string;
    libelle: string;
    statut: string;
    dateApplication: string;
    dateCreation: string;
    updatedAt: string;
    typeClient: string;
  };
  milesCompagnie: MilesCompagnie[];
  milesABT: number;
}

interface ClientMilesState {
  items: ClientMiles[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientMilesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAllMiles = createAsyncThunk(
  'clientMiles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/client-beneficiaires/all-miles');
      if (!res.data.success) throw new Error();
      return res.data.data as ClientMiles[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement miles');
    }
  }
);

const clientMilesSlice = createSlice({
  name: 'clientMiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMiles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default clientMilesSlice.reducer;