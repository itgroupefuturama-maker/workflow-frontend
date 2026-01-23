// src/app/milesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface BorneMiles {
  id?: string;
  borneCaInf: number;
  borneCaSup: number;
  miles: number;
}

export interface Miles {
  id: string;
  numMiles: string;
  dateApplication: string;
  status: 'CREER' | 'ACTIF' | 'INACTIF';
  dateActivation: string | null;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
  Module: Array<{ id: string; code: string; nom: string; description?: string }>;
  bornesMiles: BorneMiles[];
}

export interface MilesState {
  data: Miles[];
  loading: boolean;
  error: string | null;
}

const initialState: MilesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les miles
export const fetchMiles = createAsyncThunk(
  'miles/fetchMiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/miles');
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue('Échec récupération des miles');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Créer un miles avec bornes
export const createMiles = createAsyncThunk(
  'miles/createMiles',
  async (bornesMiles: BorneMiles[], { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/miles', {
        moduleIds: [],
        bornesMiles,
      });
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec création du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Mettre à jour les modules associés
export const updateModulesForMiles = createAsyncThunk(
  'miles/updateModules',
  async (
    { milesId, newModuleIds }: { milesId: string; newModuleIds: string[] },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get('/miles');
      const currentMiles = response.data.data.find((m: Miles) => m.id === milesId);
      if (!currentMiles) return rejectWithValue('Miles non trouvé');

      const currentModuleIds = currentMiles.Module.map((mod: { id: string }) => mod.id);
      const toAdd = newModuleIds.filter((id: string) => !currentModuleIds.includes(id));
      const toRemove = currentModuleIds.filter((id: string) => !newModuleIds.includes(id));

      if (toAdd.length > 0) {
        await axiosInstance.post(`/miles/${milesId}/modules`, { moduleIds: toAdd });
      }
      if (toRemove.length > 0) {
        await axiosInstance.delete(`/miles/${milesId}/modules`, { data: { moduleIds: toRemove } });
      }

      dispatch(fetchMiles());
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour des modules');
    }
  }
);

// Ajouter une nouvelle borne au barème le plus récent
export const addBorneToLatest = createAsyncThunk(
  'miles/addBorneToLatest',
  async (newBorne: { borneCaInf: number; borneCaSup: number; miles: number }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/miles/bornes/add', newBorne);
      if (response.data.success) {
        dispatch(fetchMiles()); // Re-fetch pour mettre à jour la liste
        return response.data.data;
      }
      return rejectWithValue('Échec ajout de la tranche');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Mettre à jour une borne existante
export const updateBorneMiles = createAsyncThunk(
  'miles/updateBorneMiles',
  async (
    { borneId, updates }: { borneId: string; updates: { borneCaInf: number; borneCaSup: number; miles: number } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/miles/bornes/${borneId}`, updates);
      if (response.data.success) {
        dispatch(fetchMiles()); // Re-fetch pour mettre à jour le barème
        return response.data.data;
      }
      return rejectWithValue('Échec mise à jour de la tranche');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Activer un barème Miles
export const activateMiles = createAsyncThunk(
  'miles/activateMiles',
  async (milesId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/miles/${milesId}/activate`);
      if (response.data.success) {
        dispatch(fetchMiles()); // Re-fetch pour mettre à jour le status
        return response.data.data;
      }
      return rejectWithValue('Échec activation du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Désactiver un barème Miles
export const deactivateMiles = createAsyncThunk(
  'miles/deactivateMiles',
  async (milesId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/miles/${milesId}/deactivate`);
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec désactivation du barème');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

export const deleteBorneMiles = createAsyncThunk(
  'miles/deleteBorneMiles',
  async (borneId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/miles/bornes/${borneId}`);
      if (response.data.success) {
        dispatch(fetchMiles());
        return response.data.data;
      }
      return rejectWithValue('Échec suppression de la tranche');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

const milesSlice = createSlice({
  name: 'miles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchMiles
      .addCase(fetchMiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMiles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // createMiles
      .addCase(createMiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(createMiles.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // updateModulesForMiles
      .addCase(updateModulesForMiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateModulesForMiles.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateModulesForMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // addBorneToLatest
      .addCase(addBorneToLatest.pending, (state) => {
        state.loading = true;
      })
      .addCase(addBorneToLatest.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addBorneToLatest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBorneMiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBorneMiles.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBorneMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
            // activateMiles
      .addCase(activateMiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(activateMiles.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(activateMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // deactivateMiles
      .addCase(deactivateMiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(deactivateMiles.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deactivateMiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default milesSlice.reducer;