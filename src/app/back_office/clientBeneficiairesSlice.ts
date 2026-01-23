import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface factures{
  clientFactureId: string;
  clientBeneficiaireId: string;
  clientFacture : {
    id: string;
    code: string;
    libelle: string;
    profilRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE';
    tauxBase: number;
    volDomestique: number;
    volRegional: number;
    longCourrier: number;
    auComptant: number;
    credit15jrs: number;
    credit30jrs: number;
    credit60jrs: number;
    credit90jrs: number;
    statut: string;
    dateApplication: string;
  };
}

export interface ClientBeneficiaire {
  id: string;
  code: string;
  libelle: string;
  statut: string;
  dateApplication: string;
  dateCreation: string;
  updatedAt: string;
  factures: factures[]; // À typer plus tard si besoin
}

export interface ClientBeneficiairesState {
  data: ClientBeneficiaire[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientBeneficiairesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch tous les clients bénéficiaires
export const fetchClientBeneficiaires = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaire[] },
  void,
  { state: { auth: { token: string } } }
>('clientBeneficiaires/fetchClientBeneficiaires', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/client-beneficiaires', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des clients bénéficiaires');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un client bénéficiaire
export const createClientBeneficiaire = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaire },
  { libelle: string; statut: string; dateApplication: string },
  { state: { auth: { token: string } } }
>('clientBeneficiaires/createClientBeneficiaire', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/client-beneficiaires', payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchClientBeneficiaires());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création du client bénéficiaire');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PATCH)
export const updateClientBeneficiaire = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaire },
  { id: string; libelle: string; statut: string },
  { state: { auth: { token: string } } }
>('clientBeneficiaires/updateClientBeneficiaire', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-beneficiaires/${payload.id}`, {
      libelle: payload.libelle,
      statut: payload.statut,
    }, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchClientBeneficiaires());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateClientBeneficiaire = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaire },
  { id: string },
  { state: { auth: { token: string } } }
>('clientBeneficiaires/activateClientBeneficiaire', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-beneficiaires/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientBeneficiaires());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateClientBeneficiaire = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaire },
  { id: string },
  { state: { auth: { token: string } } }
>('clientBeneficiaires/deactivateClientBeneficiaire', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-beneficiaires/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientBeneficiaires());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteClientBeneficiaire = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('clientBeneficiaires/deleteClientBeneficiaire', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/client-beneficiaires/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientBeneficiaires());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const clientBeneficiairesSlice = createSlice({
  name: 'clientBeneficiaires',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientBeneficiaires.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientBeneficiaires.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchClientBeneficiaires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClientBeneficiaire.pending, (state) => { state.loading = true; })
      .addCase(createClientBeneficiaire.fulfilled, (state) => { state.loading = false; })
      .addCase(createClientBeneficiaire.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateClientBeneficiaire.pending, (state) => { state.loading = true; })
      .addCase(updateClientBeneficiaire.fulfilled, (state) => { state.loading = false; })
      .addCase(updateClientBeneficiaire.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(activateClientBeneficiaire.pending, (state) => { state.loading = true; })
      .addCase(activateClientBeneficiaire.fulfilled, (state) => { state.loading = false; })
      .addCase(activateClientBeneficiaire.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deactivateClientBeneficiaire.pending, (state) => { state.loading = true; })
      .addCase(deactivateClientBeneficiaire.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateClientBeneficiaire.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteClientBeneficiaire.pending, (state) => { state.loading = true; })
      .addCase(deleteClientBeneficiaire.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteClientBeneficiaire.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default clientBeneficiairesSlice.reducer;