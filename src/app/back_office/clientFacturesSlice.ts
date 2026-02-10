import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';
import type { RootState } from '../store';

// Modifiez l'interface pour correspondre exactement à la réponse JSON de votre serveur
export interface BeneficiaireLink {
  clientFactureId: string;
  clientBeneficiaireId: string;
  clientBeneficiaire: {
    id: string;
    code: string;
    libelle: string;
    statut: string;
  };
}

export interface ClientFacture {
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
  statut: 'ACTIF' | 'INACTIF';
  dateApplication: string;
  beneficiaires: BeneficiaireLink[]; // Structure mise à jour
  user: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    departement?: string;
  } | null;
}

export interface ClientFactureDetail extends ClientFacture {
  beneficiaires: BeneficiaireLink[];
}

export interface ClientFacturesState {
  data: ClientFacture[];
  current: ClientFactureDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientFacturesState = {
  data: [],
  current: null,
  loading: false,
  error: null,
};

// Fetch tous les clients factures
export const fetchClientFactures = createAsyncThunk<
  { success: boolean; data: ClientFacture[] },
  void,
  { state: { auth: { token: string } } }
>('clientFactures/fetchClientFactures', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/client-factures', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des clients factures');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer un client facture
export const createClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  {
    code: string;
    libelle: string;
    profilRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE';
    tauxBase: number;
    volDomestique: number;
    volRegional: number;
    longCourrier: number;
    auComptant: number;
    credit15jrs: number;
    credit30jrs: number;
    credit60jrs: number;
    credit90jrs: number;
    statut: 'ACTIF' | 'INACTIF';
    dateApplication: string;
  },
  { state: { auth: { token: string } } }
>('clientFactures/createClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/client-factures', payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création du client facture');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update (PATCH)
export const updateClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  {
    id: string;
    code: string;
    libelle: string;
    profilRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE';
    tauxBase: number;
    volDomestique: number;
    volRegional: number;
    longCourrier: number;
    auComptant: number;
    credit15jrs: number;
    credit30jrs: number;
    credit60jrs: number;
    credit90jrs: number;
    statut: 'ACTIF' | 'INACTIF';
  },
  { state: { auth: { token: string } } }
>('clientFactures/updateClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-factures/${payload.id}`, payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activateClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  { id: string },
  { state: { auth: { token: string } } }
>('clientFactures/activateClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-factures/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivateClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  { id: string },
  { state: { auth: { token: string } } }
>('clientFactures/deactivateClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-factures/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deleteClientFacture = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('clientFactures/deleteClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/client-factures/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Ajouter un bénéficiaire
export const addBeneficiaireToClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  { id: string; beneficiaireId: string },
  { state: { auth: { token: string } } }
>('clientFactures/addBeneficiaireToClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/client-factures/${payload.id}/beneficiaires/${payload.beneficiaireId}`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec ajout du bénéficiaire');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Supprimer un bénéficiaire (assume DELETE)
export const removeBeneficiaireFromClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  { id: string; beneficiaireId: string },
  { state: { auth: { token: string } } }
>('clientFactures/removeBeneficiaireFromClientFacture', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/client-factures/${payload.id}/beneficiaires/${payload.beneficiaireId}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchClientFactures());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec suppression du bénéficiaire');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Assigner un utilisateur responsable
export const assignUserToClientFacture = createAsyncThunk<
  { success: boolean; data: ClientFacture },
  { id: string; userId: string },
  { state: { auth: { token: string } } }
>(
  'clientFactures/assignUserToClientFacture',
  async ({ id, userId }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue('Token manquant');

      const response = await axiosInstance.patch(
        `/client-factures/${id}/assign-user`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Recharge la liste complète pour avoir la version à jour
        dispatch(fetchClientFactures());
        return { success: true, data: response.data.data };
      }

      return rejectWithValue('Échec de l\'assignation de l\'utilisateur');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
    }
  }
);

export const fetchClientFactureById = createAsyncThunk<
  ClientFactureDetail,
  string,
  { state: RootState }
>(
  'clientFactures/fetchById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue('Token manquant');

      const response = await axiosInstance.get(`/client-factures/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      console.log("Réponse brute fetchById :", response.data); // ← log très important

      if (response.data.success && response.data.data) {
        return response.data.data as ClientFactureDetail;
      }
      return rejectWithValue('Client facture non trouvé ou réponse invalide');
    } catch (error: any) {
      console.error("Erreur fetchClientFactureById :", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la récupération du client facture'
      );
    }
  }
);

const clientFacturesSlice = createSlice({
  name: 'clientFactures',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientFactures.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientFactures.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchClientFactures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClientFacture.pending, (state) => { state.loading = true; })
      .addCase(createClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(createClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateClientFacture.pending, (state) => { state.loading = true; })
      .addCase(updateClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(updateClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(activateClientFacture.pending, (state) => { state.loading = true; })
      .addCase(activateClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(activateClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deactivateClientFacture.pending, (state) => { state.loading = true; })
      .addCase(deactivateClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivateClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteClientFacture.pending, (state) => { state.loading = true; })
      .addCase(deleteClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addBeneficiaireToClientFacture.pending, (state) => { state.loading = true; })
      .addCase(addBeneficiaireToClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(addBeneficiaireToClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(removeBeneficiaireFromClientFacture.pending, (state) => { state.loading = true; })
      .addCase(removeBeneficiaireFromClientFacture.fulfilled, (state) => { state.loading = false; })
      .addCase(removeBeneficiaireFromClientFacture.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(assignUserToClientFacture.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignUserToClientFacture.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(assignUserToClientFacture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchClientFactureById
      .addCase(fetchClientFactureById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientFactureById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchClientFactureById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.current = null;
      });
  },
});

export default clientFacturesSlice.reducer;