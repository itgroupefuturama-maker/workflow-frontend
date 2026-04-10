import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ─── Types ────────────────────────────────────────────────
export type TypeService = 'TICKET' | 'HOTEL';

export interface CreateServicePreferenceDto {
  preference: string;
  serviceSpecifiqueId: string;
}

export interface ServicePreference {
  id: string;
  preference: string;
  serviceSpecifiqueId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSpecifique {
  id: string;
  code: string;
  libelle: string;
  type: 'SERVICE' | 'SPECIFIQUE' | null;
  typeService: TypeService;
  createdAt: string;
  updatedAt: string;
  servicePreference: ServicePreference[];
}

export interface CreateServiceSpecifiqueDto {
  libelle: string;
  type: 'SERVICE' | 'SPECIFIQUE';
  typeService: TypeService;
}

interface ServiceState {
  items: ServiceSpecifique[];
  itemsByType: Record<TypeService, ServiceSpecifique[]>; // ← nouveau
  loading: boolean;
  error: string | null;
}

const initialState: ServiceState = {
  items: [],
  itemsByType: { TICKET: [], HOTEL: [] }, // ← doit être présent
  loading: false,
  error: null,
};
// ─── Thunks ───────────────────────────────────────────────

// Fetch filtré par typeService (TICKET ou HOTEL)
export const fetchServicesByType = createAsyncThunk(
  'serviceSpecifique/fetchByType',
  async (typeService: TypeService, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/service-specifique/type-service/${typeService}`);
      if (!response.data.success) throw new Error('Réponse serveur invalide');
      return response.data.data as ServiceSpecifique[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement des services'
      );
    }
  }
);

export const createServiceSpecifique = createAsyncThunk(
  'serviceSpecifique/create',
  async (data: CreateServiceSpecifiqueDto, { rejectWithValue }) => {
    try {
      const response = await axios.post('/service-specifique', data);
      if (!response.data.success) throw new Error('Échec de la création');
      return response.data.data as ServiceSpecifique;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création du service'
      );
    }
  }
);

export const createServicePreference = createAsyncThunk(
  'serviceSpecifique/createPreference',
  async (data: CreateServicePreferenceDto, { rejectWithValue }) => {
    try {
      const response = await axios.post('/service-specifique/preference', data);
      if (!response.data.success) throw new Error('Échec de la création');
      return response.data.data as ServicePreference;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de la préférence'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────
const serviceSpecifiqueSlice = createSlice({
  name: 'serviceSpecifique',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Cas communs pour fetchAll et fetchByType
    const handlePending = (state: ServiceState) => {
      state.loading = true;
      state.error = null;
    };
    const handleFulfilled = (state: ServiceState, action: PayloadAction<ServiceSpecifique[]>) => {
      state.loading = false;
      state.items = action.payload;
    };
    const handleRejected = (state: ServiceState, action: any) => {
      state.loading = false;
      state.error = action.payload as string;
    };

    builder
      .addCase(fetchServicesByType.pending, handlePending)
      .addCase(fetchServicesByType.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        const typeService = action.meta.arg;
        
        // ← S'assurer que itemsByType existe avant d'écrire
        if (!state.itemsByType) {
          state.itemsByType = { TICKET: [], HOTEL: [] };
        }
        
        state.itemsByType[typeService] = action.payload.map((item) => ({
          ...item,
          servicePreference: item.servicePreference ?? [],
        }));
      })

      .addCase(fetchServicesByType.rejected, handleRejected)

      .addCase(createServiceSpecifique.pending, handlePending)
      .addCase(createServiceSpecifique.fulfilled, (state, action: PayloadAction<ServiceSpecifique>) => {
        state.loading = false;
        state.items.unshift(action.payload);

        // ← Même protection
        if (!state.itemsByType) {
          state.itemsByType = { TICKET: [], HOTEL: [] };
        }

        const type = action.payload.typeService;
        state.itemsByType[type].unshift({
          ...action.payload,
          servicePreference: action.payload.servicePreference ?? [],
        });
      })

      .addCase(createServiceSpecifique.rejected, handleRejected)

      .addCase(createServicePreference.pending, handlePending)
      .addCase(createServicePreference.fulfilled, (state, action: PayloadAction<ServicePreference>) => {
        state.loading = false;

        const service = state.items.find(s => s.id === action.payload.serviceSpecifiqueId);
        if (service) {
          service.servicePreference.push(action.payload);
        }

        // ← Même protection
        if (!state.itemsByType) {
          state.itemsByType = { TICKET: [], HOTEL: [] };
          return;
        }

        for (const type of Object.keys(state.itemsByType) as TypeService[]) {
          const serviceInType = state.itemsByType[type].find(
            s => s.id === action.payload.serviceSpecifiqueId
          );
          if (serviceInType) {
            serviceInType.servicePreference.push(action.payload);
            break;
          }
        }
      })
      .addCase(createServicePreference.rejected, handleRejected);
  },
});

export default serviceSpecifiqueSlice.reducer;