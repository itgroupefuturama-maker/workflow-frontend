import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface VisaParam {
  id: string;
  code: string;
  description: string;
  paysId: string;
  visaTypeId: string;
  visaDureeId: string;
  visaEntreeId: string;
  dureeTraitement: number;
  pVenteAriary: number;
  puAchatDevise: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  visaType?: { nom: string };
  visaDuree?: { duree: number };
  visaEntree?: { entree: string };
  pays?: { pays: string; photo: string };
  visaDoc?: Array<{ 
    id: string;
    visaDocParams: {
      id: string;
      code: string;
      document: string;
    }
  }>;
}

interface VisaParamState { data: VisaParam[]; loading: boolean; error: string | null; }
const initialState: VisaParamState = { data: [], loading: false, error: null };

export const fetchVisaParams = createAsyncThunk('visaParam/fetchAll', async () => {
  const res = await axios.get('/visa-params/visa-param');
  return res.data.data;
});

const visaParamSlice = createSlice({
  name: 'visaParam',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaParams.pending, (state) => { state.loading = true; })
      .addCase(fetchVisaParams.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchVisaParams.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erreur'; });
  },
});

export default visaParamSlice.reducer;