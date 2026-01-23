import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction }from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

// Types basés sur la réponse API
export interface Profile {
  id: string;
  profil: string;
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string;
  autorisations: any[]; // Simplifié ; étends si besoin
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  departement: string;
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string;
  motDePasse: string; // Ne l'affiche pas en UI
  profileId: string | null;
  profile: Profile | null;
}

export interface UsersState {
  data: User[];
  loading: boolean;
  error: string | null;
}

// Async thunk pour fetch les utilisateurs
export const fetchUsers = createAsyncThunk<
  { success: boolean; data: User[] },
  void,
  { state: { auth: { token: string } } }
>(
  'users/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.get('/users', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return rejectWithValue('Échec de la récupération des utilisateurs');
      }
    } catch (error: any) {
      console.error('Erreur fetch users:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour créer un utilisateur (gestion nested)
export const createUser = createAsyncThunk<
  { success: boolean; data: User },
  { email: string; motDePasse: string; nom: string; prenom: string; pseudo: string; departement: string },
  { state: { auth: { token: string } } }
>(
  'users/createUser',
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.post('/users', payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      let newUserData: User;
      if (response.data.data && response.data.data.success) {
        // Nested comme autorisations/profiles
        newUserData = response.data.data.data;
      } else if (response.data.success) {
        // Simple comme fetch
        newUserData = response.data.data;
      } else {
        return rejectWithValue('Échec de la création de l\'utilisateur');
      }

      return { success: true, data: newUserData };
    } catch (error: any) {
      console.error('Erreur create user:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

export const updateUser = createAsyncThunk<
  { success: boolean; data: User },
  { id: string; email: string; nom: string; prenom: string; pseudo: string; departement: string; status: string },
  { state: { auth: { token: string } } }
>(
  'users/updateUser',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }
      const response = await axiosInstance.patch(`/users/${payload.id}`, {
        email: payload.email,
        nom: payload.nom,
        prenom: payload.prenom,
        pseudo: payload.pseudo,
        departement: payload.departement,
        status: payload.status,
      }, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        dispatch(fetchUsers()); // Re-fetch pour cohérence
        return { success: true, data: response.data.data };
      } else {
        return rejectWithValue('Échec de la modification');
      }
    } catch (error: any) {
      console.error('Erreur update user:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour assigner un profil à un utilisateur
export const assignProfileToUser = createAsyncThunk<
  { success: boolean; data: User }, // Return type (updated user)
  { userId: string; profileId: string }, // Args
  { state: { auth: { token: string } } } // Extra pour token
>(
  'users/assignProfileToUser',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.patch(`/users/${payload.userId}/assign-profile/${payload.profileId}`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      // Assume réponse nested ou simple ; adapte si besoin (ex: response.data.data.data)
      let updatedUser: User;
      if (response.data.data && response.data.data.success) {
        updatedUser = response.data.data.data;
      } else if (response.data.success) {
        updatedUser = response.data.data;
      } else {
        return rejectWithValue('Échec de l\'assignation');
      }

      // Re-fetch pour cohérence (met à jour toute la liste)
      dispatch(fetchUsers());

      return { success: true, data: updatedUser };
    } catch (error: any) {
      console.error('Erreur assign profile:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour activer un utilisateur
export const activateUser = createAsyncThunk<
  { success: boolean; data: User },
  { userId: string },
  { state: { auth: { token: string } } }
>(
  'users/activateUser',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.patch(`/users/activate/${payload.userId}`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      let updatedUser: User;
      if (response.data.data && response.data.data.success) {
        updatedUser = response.data.data.data;
      } else if (response.data.success) {
        updatedUser = response.data.data;
      } else {
        return rejectWithValue('Échec de l\'activation');
      }

      // Re-fetch pour cohérence
      dispatch(fetchUsers());

      return { success: true, data: updatedUser };
    } catch (error: any) {
      console.error('Erreur activate user:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour désactiver un utilisateur
export const deactivateUser = createAsyncThunk<
  { success: boolean; data: User },
  { userId: string },
  { state: { auth: { token: string } } }
>(
  'users/deactivateUser',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.patch(`/users/deactivate/${payload.userId}`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      let updatedUser: User;
      if (response.data.data && response.data.data.success) {
        updatedUser = response.data.data.data;
      } else if (response.data.success) {
        updatedUser = response.data.data;
      } else {
        return rejectWithValue('Échec de la désactivation');
      }

      // Re-fetch pour cohérence
      dispatch(fetchUsers());

      return { success: true, data: updatedUser };
    } catch (error: any) {
      console.error('Erreur deactivate user:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

// Async thunk pour supprimer un utilisateur
export const deleteUser = createAsyncThunk<
  { success: boolean; data: string }, // Return ID supprimé
  { userId: string },
  { state: { auth: { token: string } } }
>(
  'users/deleteUser',
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('Token manquant');
      }

      const response = await axiosInstance.delete(`/users/${payload.userId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (response.data.success) {
        // Re-fetch pour cohérence (supprime de la liste)
        dispatch(fetchUsers());
        return { success: true, data: payload.userId };
      } else {
        return rejectWithValue('Échec de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur delete user:', error);
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

const initialState: UsersState = {
  data: [],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<{ success: boolean; data: User[] }>) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = action.payload.data;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<{ success: boolean; data: User }>) => {
        state.loading = false;
        if (action.payload.success) {
          state.data.push(action.payload.data);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(assignProfileToUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignProfileToUser.fulfilled, (state, action: PayloadAction<{ success: boolean; data: User }>) => {
        state.loading = false;
        if (action.payload.success) {
          // Optionnel : Met à jour l'utilisateur spécifique localement (avant re-fetch)
          const index = state.data.findIndex(u => u.id === action.payload.data.id);
          if (index !== -1) {
            state.data[index] = action.payload.data;
          }
        }
      })
      .addCase(assignProfileToUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(activateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateUser.fulfilled, (state, action: PayloadAction<{ success: boolean; data: User }>) => {
        state.loading = false;
        if (action.payload.success) {
          const index = state.data.findIndex(u => u.id === action.payload.data.id);
          if (index !== -1) {
            state.data[index] = action.payload.data;
          }
        }
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deactivateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateUser.fulfilled, (state, action: PayloadAction<{ success: boolean; data: User }>) => {
        state.loading = false;
        if (action.payload.success) {
          const index = state.data.findIndex(u => u.id === action.payload.data.id);
          if (index !== -1) {
            state.data[index] = action.payload.data;
          }
        }
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<{ success: boolean; data: string }>) => {
        state.loading = false;
        if (action.payload.success) {
          state.data = state.data.filter(u => u.id !== action.payload.data);
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<{ success: boolean; data: User }>) => {
        state.loading = false;
        if (action.payload.success) {
          const index = state.data.findIndex(u => u.id === action.payload.data.id);
          if (index !== -1) {
            state.data[index] = action.payload.data;
          }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;