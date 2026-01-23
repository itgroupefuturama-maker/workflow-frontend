import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';
import type { Action } from '@reduxjs/toolkit';

// Interfaces détaillées
export interface PrivilegeAttribution {
  profileId: string;
  privilegeId: string;
  dateAttribution: string;
  status: 'ACTIF' | 'INACTIF';
  privilege: {
    id: string;
    privilege: string;
    fonctionnalite: string;
    status: string;
  };
}

export interface ModuleAttribution {
  profileId: string;
  moduleId: string;
  dateAttribution: string;
  status: 'ACTIF' | 'INACTIF';
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
  };
}

export interface UserAttribution {
  userId: string;
  profileId: string;
  dateAffectation: string;
  status: 'ACTIF' | 'INACTIF';
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    pseudo: string;
    departement: string;
    status: string;
  };
}

export interface Profil {
  id: string;
  profil: string;
  dateCreation: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  status: string;
  privileges: PrivilegeAttribution[];
  modules: ModuleAttribution[];
  users: UserAttribution[];
}

export interface ProfilesState {
  data: Profil[];
  loading: boolean;
  error: string | null;
}

const initialState: ProfilesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les profils
export const fetchProfiles = createAsyncThunk<
  { success: boolean; data: Profil[] },
  void
>('profiles/fetchProfiles', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/profiles');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des profils');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un profil
export const createProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profil: string }
>('profiles/createProfil', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/profiles', payload);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PATCH)
export const updateProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { id: string; profil: string; status?: string }
>('profiles/updateProfil', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...data } = payload;
    const response = await axiosInstance.patch(`/profiles/${id}`, data);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteProfil = createAsyncThunk<
  { success: boolean; data: string },
  string
>('profiles/deleteProfil', async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/profiles/${id}`);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Assign / Deactivate Privilege
export const assignPrivilegeToProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profilId: string; privilegeId: string }
>('profiles/assignPrivilege', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/profiles/${payload.profilId}/assign-privilege/${payload.privilegeId}`);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec attribution');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

export const deactivatePrivilegeFromProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profilId: string; privilegeId: string }
>('profiles/deactivatePrivilege', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/profiles/${payload.profilId}/deactivate-privilege/${payload.privilegeId}`);
    if (response.data.success) {
      dispatch(fetchProfiles());      
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Assign / Deactivate Module
export const assignModuleToProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profilId: string; moduleId: string }
>('profiles/assignModule', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/profiles/${payload.profilId}/assign-module/${payload.moduleId}`);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec attribution');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

export const deactivateModuleFromProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profilId: string; moduleId: string }
>('profiles/deactivateModule', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/profiles/${payload.profilId}/deactivate-module/${payload.moduleId}`);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Assign / Deactivate User
export const assignUserToProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profilId: string; userId: string }
>('profiles/assignUser', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/profiles/${payload.profilId}/assign-user/${payload.userId}`);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec attribution');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

export const deactivateUserFromProfil = createAsyncThunk<
  { success: boolean; data: Profil },
  { profilId: string; userId: string }
>('profiles/deactivateUser', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/profiles/${payload.profilId}/deactivate-user/${payload.userId}`);
    if (response.data.success) {
      dispatch(fetchProfiles());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.success) {
          state.data = action.payload.data;
        }
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement des profils';
      })

      // Autres actions (create, update, delete, assignations...)
      .addMatcher(
        (action) =>
          [
            createProfil.fulfilled.type,
            updateProfil.fulfilled.type,
            deleteProfil.fulfilled.type,
            assignPrivilegeToProfil.fulfilled.type,
            deactivatePrivilegeFromProfil.fulfilled.type,
            assignModuleToProfil.fulfilled.type,
            deactivateModuleFromProfil.fulfilled.type,
            assignUserToProfil.fulfilled.type,
            deactivateUserFromProfil.fulfilled.type,
          ].includes(action.type),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action): action is Action & { error: Error } => 
          [
            fetchProfiles.rejected.type,
            createProfil.rejected.type,
            updateProfil.rejected.type,
            deleteProfil.rejected.type,
            assignPrivilegeToProfil.rejected.type,
            deactivatePrivilegeFromProfil.rejected.type,
            assignModuleToProfil.rejected.type,
            deactivateModuleFromProfil.rejected.type,
            assignUserToProfil.rejected.type,
            deactivateUserFromProfil.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'Une erreur est survenue';
        }
      );
  },
});

export default profilesSlice.reducer;