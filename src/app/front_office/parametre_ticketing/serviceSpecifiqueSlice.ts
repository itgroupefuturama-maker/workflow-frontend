import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios'; // ton instance axios configurée

// ─── Types ────────────────────────────────────────────────
export interface ServiceSpecifique {
  id: string;
  code: string;
  libelle: string;
  type: 'SERVICE' | 'SPECIFIQUE';
  createdAt: string;
  updatedAt: string;
}

interface ServiceState {
  items: ServiceSpecifique[];
  loading: boolean;
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────
const initialState: ServiceState = {
  items: [],
  loading: false,
  error: null,
};

// ─── Types (ajouts) ───────────────────────────────────────
export interface CreateServiceSpecifiqueDto {
  libelle: string;
  type: 'SERVICE' | 'SPECIFIQUE';
}

// ─── Async thunks ─────────────────────────────────────────
export const fetchServiceSpecifiques = createAsyncThunk(
  'serviceSpecifique/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/service-specifique');
      if (!response.data.success) {
        throw new Error('Réponse serveur invalide');
      }
      return response.data.data as ServiceSpecifique[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des services');
    }
  }
);

// ─── Async thunks (ajout) ─────────────────────────────────
export const createServiceSpecifique = createAsyncThunk(
  'serviceSpecifique/create',
  async (data: CreateServiceSpecifiqueDto, { rejectWithValue }) => {
    try {
      const response = await axios.post('/service-specifique', data);
      if (!response.data.success) {
        throw new Error('Échec de la création');
      }
      return response.data.data as ServiceSpecifique; // on suppose que le serveur renvoie l'entité créée
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création du service'
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
    builder
        .addCase(fetchServiceSpecifiques.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchServiceSpecifiques.fulfilled, (state, action: PayloadAction<ServiceSpecifique[]>) => {
            state.loading = false;
            state.items = action.payload;
        })
        .addCase(fetchServiceSpecifiques.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(createServiceSpecifique.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createServiceSpecifique.fulfilled, (state, action: PayloadAction<ServiceSpecifique>) => {
            state.loading = false;
            state.items.unshift(action.payload); // on ajoute en début de liste
        })
        .addCase(createServiceSpecifique.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
  },
});

export default serviceSpecifiqueSlice.reducer;