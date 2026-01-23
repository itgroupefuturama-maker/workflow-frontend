import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface ClientBeneficiaireInfo {
  id: string;
  clientbeneficiaireId: string;
  prenom: string;
  nom: string;
  nationalite: string;
  clientType: 'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE';
  typeDoc: 'LAISSE_PASSER' | 'PASSEPORT';
  referenceDoc: string;
  referenceCin?: string | null;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
  dateDelivranceCin?: string | null;
  dateValiditeCin?: string | null;
  whatsapp?: string | null;
  tel?: string | null;
  document?: string | null;     // chemin du fichier
  cin?: string | null;          // chemin du fichier
  statut: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBeneficiaireInfosState {
  list: ClientBeneficiaireInfo[];    // Toutes les infos du bénéficiaire
  current?: ClientBeneficiaireInfo | null;  // Pour édition future
  loading: boolean;
  loadingList: boolean;
  error: string | null;
}

const initialState: ClientBeneficiaireInfosState = {
  list: [],
  current: null,
  loading: false,
  loadingList: false,
  error: null,
};

// Thunk : Récupérer toutes les infos d'un bénéficiaire
export const fetchClientBeneficiaireInfos = createAsyncThunk<
  ClientBeneficiaireInfo[],
  string, // clientbeneficiaireId
  { rejectValue: string }
>('clientBeneficiaireInfos/fetchByClient', async (clientbeneficiaireId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/clientbeneficiaire-infos/clientbeneficiaire/${clientbeneficiaireId}`);
    if (response.data.success) {
      return response.data.data;
    }
    return rejectWithValue(response.data.message || 'Échec récupération');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Thunk : Créer (déjà corrigé avec multipart)
export const createClientBeneficiaireInfos = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaireInfo },
  {
    clientbeneficiaireId: string;
    prenom: string;
    nom: string;
    nationalite: string;
    clientType: 'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE';
    typeDoc: 'LAISSE_PASSER' | 'PASSEPORT';
    referenceDoc: string;
    referenceCin?: string;
    dateDelivranceDoc: string;
    dateValiditeDoc: string;
    dateDelivranceCin?: string;
    dateValiditeCin?: string;
    whatsapp?: string;
    tel?: string;
    document?: File;
    cin?: File;
  },
  { state: { auth: { token: string } } }
>('clientBeneficiaireInfos/create', async (payload, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const formData = new FormData();
    formData.append('clientbeneficiaireId', payload.clientbeneficiaireId);
    formData.append('prenom', payload.prenom);
    formData.append('nom', payload.nom);
    formData.append('nationalite', payload.nationalite);
    formData.append('clientType', payload.clientType);
    formData.append('typeDoc', payload.typeDoc);
    formData.append('referenceDoc', payload.referenceDoc);
    if (payload.referenceCin) formData.append('referenceCin', payload.referenceCin);
    formData.append('dateDelivranceDoc', payload.dateDelivranceDoc);
    formData.append('dateValiditeDoc', payload.dateValiditeDoc);
    if (payload.dateDelivranceCin) formData.append('dateDelivranceCin', payload.dateDelivranceCin);
    if (payload.dateValiditeCin) formData.append('dateValiditeCin', payload.dateValiditeCin);
    if (payload.whatsapp) formData.append('whatsapp', payload.whatsapp);
    if (payload.tel) formData.append('tel', payload.tel);
    if (payload.document) formData.append('document', payload.document);
    if (payload.cin) formData.append('cin', payload.cin);

    const response = await axiosInstance.post('/clientbeneficiaire-infos', formData, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'multipart/form-data', // ← Important, comme dans modeles
      },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue(response.data.message || 'Échec création infos');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

export const updateClientBeneficiaireInfo = createAsyncThunk<
  { success: boolean; data: ClientBeneficiaireInfo },
  {
    id: string;
    prenom: string;
    nom: string;
    nationalite: string;
    clientType: 'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE';
    typeDoc: 'LAISSE_PASSER' | 'PASSEPORT';
    referenceDoc: string;
    referenceCin?: string;
    dateDelivranceDoc: string;
    dateValiditeDoc: string;
    dateDelivranceCin?: string;
    dateValiditeCin?: string;
    whatsapp?: string;
    tel?: string;
    document?: File;  // Nouveau fichier ou undefined (pas de suppression pour l'instant)
    cin?: File;
  },
  { state: { auth: { token: string } } }
>('clientBeneficiaireInfos/update', async (payload, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const formData = new FormData();
    formData.append('prenom', payload.prenom);
    formData.append('nom', payload.nom);
    formData.append('nationalite', payload.nationalite);
    formData.append('clientType', payload.clientType);
    formData.append('typeDoc', payload.typeDoc);
    formData.append('referenceDoc', payload.referenceDoc);
    if (payload.referenceCin) formData.append('referenceCin', payload.referenceCin);
    formData.append('dateDelivranceDoc', payload.dateDelivranceDoc);
    formData.append('dateValiditeDoc', payload.dateValiditeDoc);
    if (payload.dateDelivranceCin) formData.append('dateDelivranceCin', payload.dateDelivranceCin);
    if (payload.dateValiditeCin) formData.append('dateValiditeCin', payload.dateValiditeCin);
    if (payload.whatsapp) formData.append('whatsapp', payload.whatsapp);
    if (payload.tel) formData.append('tel', payload.tel);
    if (payload.document) formData.append('document', payload.document);
    if (payload.cin) formData.append('cin', payload.cin);

    const response = await axiosInstance.put(`/clientbeneficiaire-infos/${payload.id}`, formData, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue(response.data.message || 'Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const clientBeneficiaireInfosSlice = createSlice({
  name: 'clientBeneficiaireInfos',
  initialState,
  reducers: {
    clearCurrentInfo: (state) => {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchClientBeneficiaireInfos.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchClientBeneficiaireInfos.fulfilled, (state, action) => {
        state.loadingList = false;
        state.list = action.payload;
      })
      .addCase(fetchClientBeneficiaireInfos.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload || 'Erreur';
      })
      .addCase(updateClientBeneficiaireInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(updateClientBeneficiaireInfo.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
            const updated = action.payload.data;
            state.list = state.list.map(item => item.id === updated.id ? updated : item);
            state.current = updated;
        }
        })
        .addCase(updateClientBeneficiaireInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        })
      // Create
      .addCase(createClientBeneficiaireInfos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClientBeneficiaireInfos.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.list.push(action.payload.data); // Ajoute à la liste locale
          state.current = action.payload.data;
        }
      })
      .addCase(createClientBeneficiaireInfos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentInfo } = clientBeneficiaireInfosSlice.actions;
export default clientBeneficiaireInfosSlice.reducer;