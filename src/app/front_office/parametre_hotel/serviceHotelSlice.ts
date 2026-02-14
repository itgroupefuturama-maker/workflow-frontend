import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export type ServiceHotel = {
  id: string;
  service: string;
  createdAt: string;
  updatedAt: string;
};

type ServiceHotelState = {
  items: ServiceHotel[];
  loading: boolean;
  error: string | null;
};

type CreateServicePayload = {
  service: string;
};

const initialState: ServiceHotelState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchServicesHotel = createAsyncThunk(
  'serviceHotel/fetchServicesHotel',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/hotel-params/service-hotel');
      if (!response.data.success) {
        throw new Error('Réponse non réussie');
      }
      return response.data.data as ServiceHotel[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement des services hôtel'
      );
    }
  }
);

export const createServiceHotel = createAsyncThunk(
  'serviceHotel/createServiceHotel',
  async (data: CreateServicePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/hotel-params/service-hotel', data);
      if (!response.data.success) throw new Error('Échec création');
      return response.data.data as ServiceHotel;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur création service'
      );
    }
  }
);

const serviceHotelSlice = createSlice({
  name: 'serviceHotel',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServicesHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServicesHotel.fulfilled, (state, action: PayloadAction<ServiceHotel[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServicesHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createServiceHotel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createServiceHotel.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.items.push(action.payload);
      })
      .addCase(createServiceHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default serviceHotelSlice.reducer;