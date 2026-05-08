import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';
import type { AnnivClient } from '../../../pages/front_office/dossiers-communs/module.anniversaire/types';

interface AnnivClientsState {
  items:   AnnivClient[];
  loading: boolean;
  error:   string | null;
}

const initialState: AnnivClientsState = {
  items:   [],
  loading: false,
  error:   null,
};

export const fetchAnnivClients = createAsyncThunk(
  'annivClients/fetchByRange',
  async (
    { startDate, endDate }: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get('/anniversaire/by-range', {
        params: { startDate, endDate },
      });
      if (!res.data.success) throw new Error();
      return res.data.data as AnnivClient[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement clients anniversaire');
    }
  }
);

export const sendAnnivMessage = createAsyncThunk(
  'annivClients/sendMessage',
  async (annivId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/anniversaire/send-message/${annivId}`);
      if (!res.data.success) throw new Error();
      return annivId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur envoi message anniversaire');
    }
  }
);

export const sendAnnivCadeau = createAsyncThunk(
  'annivClients/sendCadeau',
  async ({ id, cadeauId }: { id: string; cadeauId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/anniversaire/send-cadeau/${id}`, { cadeauId });
      if (!res.data.success) throw new Error();
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur envoi cadeau');
    }
  }
);

export const sendGroupSms = createAsyncThunk(
  'annivClients/sendGroupSms',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/anniversaire/send-messages', { ids });
      if (!res.data.success) throw new Error();
      return ids;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur envoi groupe SMS');
    }
  }
);

const annivClientsSlice = createSlice({
  name: 'annivClients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(fetchAnnivClients.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(fetchAnnivClients.fulfilled, (state, action: PayloadAction<AnnivClient[]>) => {
            state.loading = false;
            state.items   = action.payload;
        })
        .addCase(fetchAnnivClients.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        })
        .addCase(sendAnnivMessage.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(sendAnnivMessage.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(sendAnnivMessage.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        })
        .addCase(sendAnnivCadeau.pending, (state) => {
            state.loading = true;
            state.error   = null;
        })
        .addCase(sendAnnivCadeau.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(sendAnnivCadeau.rejected, (state, action) => {
            state.loading = false;
            state.error   = action.payload as string;
        })
        .addCase(sendGroupSms.pending, (state) => {
          state.loading = true;
          state.error   = null;
        })
        .addCase(sendGroupSms.fulfilled, (state) => {
          state.loading = false;
        })
        .addCase(sendGroupSms.rejected, (state, action) => {
          state.loading = false;
          state.error   = action.payload as string;
        });
  },
});

export default annivClientsSlice.reducer;