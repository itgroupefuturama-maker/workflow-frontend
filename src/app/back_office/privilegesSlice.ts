import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; 
import axiosInstance from '../../service/Axios'; // Assure-toi que baseURL est '/api' pour le proxy

// Types (basés sur ta réponse API)
// export interface Autorisation {
//   id: string;
//   nom: string;
//   status: string;
//   module: Module;
// }

// export interface Module {
//   id: string;
//   nom: string;
// }

export interface Privilege {
  id: string;
  privilege: string;
  fonctionnalite: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
}

export interface PrivilegesState {
  data: Privilege[];
  loading: boolean;
  error: string | null;
}

// Async thunk pour fetch les privilèges (récupère le token depuis le store via extraArgument)
export const fetchPrivileges = createAsyncThunk<
  { success: boolean; data: Privilege[] }, // Return type
  void, // Args (aucun)
  { state: { auth: { token: string } } } // Extra pour accéder au store
>(
  'privileges/fetchPrivileges',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.get('/privileges', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (response.data.success) {
        console.log('Privilèges récupérés:', response.data.data); // Afficher les privilèges dans le console.log
        return { success: true, data: response.data.data };
      } else {
        return rejectWithValue('Échec de la récupération des privilèges');
      }
    } catch (error: any) {
      console.error('Erreur fetch privilèges:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Nouveau thunk pour créer un privilège
export const createPrivilege = createAsyncThunk<
  { success: boolean; data: Privilege },
  { privilege: string; fonctionnalite: string },
  { state: { auth: { token: string } } }
>(
  'privileges/createPrivilege',
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.post('/privileges', payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      // CORRECTION ICI : la réponse est { success: true, data: { privilège } }
      if (response.data.success) {
        // Optionnel : re-fetch pour cohérence (comme dans les autres slices)
        // dispatch(fetchPrivileges());

        return { success: true, data: response.data.data };
      }

      return rejectWithValue('Échec de la création du privilège');
    } catch (error: any) {
      console.error('Erreur create privilege:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

export const updatePrivilege = createAsyncThunk<
  { success: boolean; data: Privilege },
  { id: string; privilege: string; fonctionnalite: string },
  { state: { auth: { token: string } } }
>(
  'privileges/updatePrivilege',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }
      const response = await axiosInstance.patch(`/privileges/${payload.id}`, {
        privilege: payload.privilege,
        fonctionnalite: payload.fonctionnalite,
      }, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        dispatch(fetchPrivileges()); // Re-fetch pour cohérence
        return { success: true, data: response.data.data };
      } else {
        return rejectWithValue('Échec de la modification');
      }
    } catch (error: any) {
      console.error('Erreur update privilege:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

export const deletePrivilege = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>(
  'privileges/deletePrivilege',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue('Token manquant');
      const response = await axiosInstance.delete(`/privileges/${payload.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (response.data.success) {
        dispatch(fetchPrivileges());
        return { success: true, data: payload.id };
      }
      return rejectWithValue('Échec suppression');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour activer un privilège
export const activatePrivilege = createAsyncThunk<
  { success: boolean; data: Privilege },
  { id: string },
  { state: { auth: { token: string } } }
>(
  'privileges/activatePrivilege',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue('Token manquant');
      const response = await axiosInstance.patch(`/privileges/${payload.id}/activate`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (response.data.success) {
        dispatch(fetchPrivileges());
        return { success: true, data: response.data.data };
      }
      return rejectWithValue('Échec activation');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour désactiver un privilège
export const deactivatePrivilege = createAsyncThunk<
  { success: boolean; data: Privilege },
  { id: string },
  { state: { auth: { token: string } } }
>(
  'privileges/deactivatePrivilege',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue('Token manquant');
      const response = await axiosInstance.patch(`/privileges/${payload.id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (response.data.success) {
        dispatch(fetchPrivileges());
        return { success: true, data: response.data.data };
      }
      return rejectWithValue('Échec désactivation');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour récupérer les autorisations liées à un privilège
// export const fetchAutorisationsByPrivilege = createAsyncThunk<
//   { success: boolean; data: Autorisation[] },
//   { id: string },
//   { state: { auth: { token: string } } }
// >(
//   'privileges/fetchAutorisationsByPrivilege',
//   async (payload, { getState, rejectWithValue }) => {
//     try {
//       const { auth } = getState();
//       if (!auth.token) return rejectWithValue('Token manquant');
//       const response = await axiosInstance.get(`/privileges/${payload.id}/autorisations`, {
//         headers: { Authorization: `Bearer ${auth.token}` },
//       });
//       if (response.data.success) {
//         return { success: true, data: response.data.data };
//       }
//       return rejectWithValue('Échec récupération autorisations');
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
//     }
//   }
// );

const initialState: PrivilegesState = {
  data: [],
  loading: false,
  error: null,
};

const privilegesSlice = createSlice({
  name: 'privileges',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrivileges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrivileges.fulfilled, (state, action: PayloadAction<{ success: boolean; data: Privilege[] }>) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = action.payload.data;
          console.log('Privilèges stockés dans le store:', state.data); // Afficher les privilèges dans le console.log
        }
      })
      .addCase(fetchPrivileges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Nouveaux cases pour createPrivilege
      .addCase(createPrivilege.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPrivilege.fulfilled, (state, action: PayloadAction<{ success: boolean; data: Privilege }>) => {
        state.loading = false;
        if (action.payload.success) {
          // Ajoute le nouveau privilège à la liste (optimistic update)
          state.data.push(action.payload.data);
        }
      })
      .addCase(createPrivilege.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePrivilege.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePrivilege.fulfilled, (state, action: PayloadAction<{ success: boolean; data: Privilege }>) => {
        state.loading = false;
        if (action.payload.success) {
          const index = state.data.findIndex(p => p.id === action.payload.data.id);
          if (index !== -1) {
            state.data[index] = action.payload.data;
          }
        }
      })
      .addCase(updatePrivilege.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePrivilege.pending, (state) => { state.loading = true; })
      .addCase(deletePrivilege.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(p => p.id !== action.payload.data);
      })
      .addCase(deletePrivilege.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(activatePrivilege.pending, (state) => { state.loading = true; })
      .addCase(activatePrivilege.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(p => p.id === action.payload.data.id);
        if (index !== -1) state.data[index] = action.payload.data;
      })
      .addCase(activatePrivilege.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deactivatePrivilege.pending, (state) => { state.loading = true; })
      .addCase(deactivatePrivilege.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(p => p.id === action.payload.data.id);
        if (index !== -1) state.data[index] = action.payload.data;
      })
      .addCase(deactivatePrivilege.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // .addCase(fetchAutorisationsByPrivilege.pending, (state) => { state.loading = true; })
      // .addCase(fetchAutorisationsByPrivilege.fulfilled, (state) => { state.loading = false; })
      // .addCase(fetchAutorisationsByPrivilege.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.payload as string;
      // });
  },
});

export const { clearError } = privilegesSlice.actions;
export default privilegesSlice.reducer;