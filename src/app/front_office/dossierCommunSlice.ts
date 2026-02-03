import { createSlice, createAsyncThunk, createAction, type PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

// Interfaces restantes (nettoyées)
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  departement: string;
  status: string;
}

export interface ClientFacture {
  id: string;
  code: string;
  libelle: string;
  profilRisque: string;
  statut: string;
}

export interface Prestation {
  id: string;
  numeroDos: string;
  status: string;
  dossierCommunColabId: string;
  dossierId: string;
  createdAt: string;
}

export interface DossierCommunColab {
  id: string;
  status: string;
  userId: string;
  moduleId: string;
  user: User;
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
  };
  prestation: Prestation[];
}

// Interface principale (sans dossierCommunClient)
export interface DossierCommun {
  id: string;
  numero: number;
  status: string;
  description: string;
  contactPrincipal: string;
  whatsapp: string;
  referenceTravelPlaner: string | null;
  dateAnnulation: string | null;
  raisonAnnulation: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  clientfacture: ClientFacture;
  dossierCommunColab: DossierCommunColab[];
}

// Payload de création (sans clients)
interface CreateDossierCommunPayload {
  referenceTravelPlaner?: string;
  description: string;
  contactPrincipal: string;
  whatsapp?: string;
  clientFactureId: string;
  colabs: Array<{
    userId: string;
    moduleId: string;
  }>;
}

interface DossierCommunState {
  data: DossierCommun[];
  currentClientFactureId: DossierCommun | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createSuccess: boolean;
  createError: string | null;
}

const initialState: DossierCommunState = {
  data: [],
  currentClientFactureId: null,
  loading: false,
  error: null,
  creating: false,
  createSuccess: false,
  createError: null,
};

export const setCurrentClientFactureId = createAction<DossierCommun | null>(
  'dossierCommun/setCurrentClientFactureId', 
);

// Thunks (inchangés)
export const fetchDossiersCommuns = createAsyncThunk(
  'dossierCommun/fetchDossiersCommuns',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/dossier-commun');
      if (response.data.success) {
        return response.data.data as DossierCommun[];
      }
      return rejectWithValue(response.data.message);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

export const createDossierCommun = createAsyncThunk(
  'dossierCommun/create',
  async (payload: CreateDossierCommunPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/dossier-commun', payload);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur création');
    }
  }
);

// Slice
const dossierCommunSlice = createSlice({
  name: 'dossierCommun',
  initialState,
  reducers: {
    setCurrentClientFactureId: (state, action: PayloadAction<DossierCommun | null>) => {
      state.currentClientFactureId = action.payload;
    },
    resetCreateStatus: (state) => {
      state.creating = false;
      state.createSuccess = false;
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDossiersCommuns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDossiersCommuns.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDossiersCommuns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createDossierCommun.pending, (state) => {
        state.creating = true;
        state.createSuccess = false;
        state.createError = null;
      })
      .addCase(createDossierCommun.fulfilled, (state, action) => {
        state.creating = false;
        state.createSuccess = true;
        state.data.unshift(action.payload);
      })
      .addCase(createDossierCommun.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload as string;
      });
  },
});

export const { setCurrentClientFacture, resetCreateStatus } = dossierCommunSlice.actions;
export default dossierCommunSlice.reducer;