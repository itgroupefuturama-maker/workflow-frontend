import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';
import type {
  MessageParam, MessageParamPayload,
  CadeauParam,  CadeauParamPayload,
} from '../../../pages/front_office/dossiers-communs/module.anniversaire/types';

interface AnnivParamsState {
  messageParams: MessageParam[];
  cadeauParams:  CadeauParam[];
  loading: boolean;
  error:   string | null;
}

const initialState: AnnivParamsState = {
  messageParams: [],
  cadeauParams:  [],
  loading: false,
  error:   null,
};

export const fetchMessageParams = createAsyncThunk(
  'annivParams/fetchMessageParams',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/anniv-params/message-params');
      if (!res.data.success) throw new Error();
      return res.data.data as MessageParam[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement message params');
    }
  }
);

export const fetchCadeauParams = createAsyncThunk(
  'annivParams/fetchCadeauParams',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/anniv-params/cadeau');
      if (!res.data.success) throw new Error();
      return res.data.data as CadeauParam[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement cadeau params');
    }
  }
);

export const createMessageParam = createAsyncThunk(
  'annivParams/createMessageParam',
  async (payload: MessageParamPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/anniv-params/message-params', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as MessageParam;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création message param');
    }
  }
);

export const createCadeauParam = createAsyncThunk(
  'annivParams/createCadeauParam',
  async (payload: CadeauParamPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/anniv-params/cadeau', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as CadeauParam;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création cadeau param');
    }
  }
);

export const updateMessageParam = createAsyncThunk(
  'annivParams/updateMessageParam',
  async ({ id, payload }: { id: string; payload: MessageParamPayload }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/anniv-params/message-params/${id}`, payload);
      if (!res.data.success) throw new Error();
      return res.data.data as MessageParam;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur mise à jour message param');
    }
  }
);

export const updateCadeauParam = createAsyncThunk(
  'annivParams/updateCadeauParam',
  async ({ id, payload }: { id: string; payload: CadeauParamPayload }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/anniv-params/cadeau/${id}`, payload);
      if (!res.data.success) throw new Error();
      return res.data.data as CadeauParam;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur mise à jour cadeau param');
    }
  }
);

const annivParamsSlice = createSlice({
  name: 'annivParams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const pending  = (state: AnnivParamsState) => { state.loading = true; state.error = null; };
    const rejected = (state: AnnivParamsState, action: PayloadAction<any>) => {
      state.loading = false; state.error = action.payload as string;
    };
    builder
      .addCase(fetchMessageParams.pending,   pending)
      .addCase(fetchMessageParams.fulfilled, (state, action: PayloadAction<MessageParam[]>) => {
        state.loading = false; state.messageParams = action.payload;
      })
      .addCase(fetchMessageParams.rejected,  rejected)

      .addCase(fetchCadeauParams.pending,    pending)
      .addCase(fetchCadeauParams.fulfilled,  (state, action: PayloadAction<CadeauParam[]>) => {
        state.loading = false; state.cadeauParams = action.payload;
      })
      .addCase(fetchCadeauParams.rejected,   rejected)

      .addCase(createMessageParam.pending,   pending)
      .addCase(createMessageParam.fulfilled, (state, action: PayloadAction<MessageParam>) => {
        state.loading = false; state.messageParams.unshift(action.payload);
      })
      .addCase(createMessageParam.rejected,  rejected)

      .addCase(createCadeauParam.pending,    pending)
      .addCase(createCadeauParam.fulfilled,  (state, action: PayloadAction<CadeauParam>) => {
        state.loading = false; state.cadeauParams.unshift(action.payload);
      })
      .addCase(createCadeauParam.rejected,   rejected)

      .addCase(updateMessageParam.pending,   pending)
      .addCase(updateMessageParam.fulfilled, (state, action: PayloadAction<MessageParam>) => {
        state.loading = false;
        const idx = state.messageParams.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.messageParams[idx] = action.payload;
      })
      .addCase(updateMessageParam.rejected,  rejected)

      .addCase(updateCadeauParam.pending,    pending)
      .addCase(updateCadeauParam.fulfilled,  (state, action: PayloadAction<CadeauParam>) => {
        state.loading = false;
        const idx = state.cadeauParams.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.cadeauParams[idx] = action.payload;
      })
      .addCase(updateCadeauParam.rejected,   rejected);
  },
});

export default annivParamsSlice.reducer;