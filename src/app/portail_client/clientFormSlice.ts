import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_PORTAIL } from '../../service/env';
import axios from 'axios';

export interface ClientAssuranceFormPayload {
  nom: string;
  prenom: string;
  dateNaissance: string;
  numero: string;
  email: string;
  adresse: string;
  numeroPassport: string;
}

export interface ClientFormPayload {
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  etatCivil: string;
  numero: string;
  email: string;
  adresse: string;
  paysResidence: string;
  nomContactUrgence: string;
  prenomContactUrgence: string;
  numeroContactUrgence: string;
  emailContactUrgence: string;
  professionActuelle: string;
  nomEmployeur: string;
  numeroTelephone: string;
  emailProfessionnel: string;
  adresseProfessionnel: string;
  etablissement: string;
  diplome: string;
  referenceDoc: string;
  typeDoc: string;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
}

export interface ClientBeneficiairePerson {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  etatCivil: string;
  numero: string;
  email: string;
  adresse: string;
  paysResidence: string;
  typePerson: 'CONJOINT' | 'ENFANT';
  clientBeneficiaireFormId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Types ──────────────────────────────────────────────
export interface UserDocument {
  id: string;
  idVisadocClient: string;
  nomDoc: string;
  pj: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ClientBeneficiaireForm {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  etatCivil: string;
  numero: string;
  email: string;
  adresse: string;
  paysResidence: string;
  nomContactUrgence: string;
  prenomContactUrgence: string;
  numeroContactUrgence: string;
  emailContactUrgence: string;
  professionActuelle: string;
  nomEmployeur: string;
  numeroTelephone: string;
  emailProfessionnel: string;
  adresseProfessionnel: string;
  etablissement: string;
  diplome: string;
  referenceDoc: string;
  typeDoc: string;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  clientBeneficiairePerson: ClientBeneficiairePerson[];
}

export interface ClientPersonPayload {
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  etatCivil: string;
  numero: string;
  email: string;
  adresse: string;
  paysResidence: string;
  typePerson: 'CONJOINT' | 'ENFANT';
  clientBeneficiaireFormId: string;
}

export interface ClientAssuranceForm {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  numero: string;
  email: string;
  adresse: string;
  numeroPassport: string;
  createdAt: string;
  updatedAt: string;
  assuranceId: string;
}

export interface ClientAssurance {
  id: string;
  idAssuranceLigne: string;
  zoneDestination: string;
  destination: string;
  assureur: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  clientAssuranceForms: ClientAssuranceForm[];
}

export interface ClientData {
  id: string;
  nom: string;
  actif: boolean;
  isValidate: boolean;
  createdAt: string;
  clientBeneficiaireForms: ClientBeneficiaireForm[];
  userDocument: UserDocument[];
  sharedClientBeneficiaireForms: ClientBeneficiaireForm[];
  userType: 'VISA' | 'ASSURANCE';           
  assurance?: ClientAssurance;              
  clientAssuranceForms?: ClientAssuranceForm[]; 
  visa?: {
    id: string;
    idVisaAbstract: string;
    visaType: string;
    visaDescription: string;
    pays: string;
  };
}

interface ClientState {
  data: ClientData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  data: null,
  loading: false,
  error: null,
};

// ── Thunk ──────────────────────────────────────────────
export const fetchClientInfo = createAsyncThunk(
  'client/fetchClientInfo',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL_PORTAIL}/client-form/visa-abstract/${userId}`);
      return response.data.data as ClientData;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la récupération des données.'
      );
    }
  }
);

export const createClientForm = createAsyncThunk(
  'client/createClientForm',
  async (
    { beneficiaireId, userId, payload }: { beneficiaireId: string; userId: string; payload: ClientFormPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await axios.post(`${API_URL_PORTAIL}/client-form`, {
        ...payload,
        userId,
      });
      // Rafraîchit les données après création
      dispatch(fetchClientInfo(beneficiaireId));
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de la création du formulaire."
      );
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'client/uploadDocument',
  async (
    { userId, documentId, file }: { userId: string; documentId: string; file: File },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('pj', file);

      await axios.patch(`${API_URL_PORTAIL}/document/${documentId}`, formData, {  // 👈 PATCH + id dans l'URL
        
      });

      dispatch(fetchClientInfo(userId));
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de l'envoi du document."
      );
    }
  }
);

// ── Thunk ──────────────────────────────────────────────
export const createClientPerson = createAsyncThunk(
  'client/createClientPerson',
  async (
    { beneficiaireId, userId, payload }: { beneficiaireId: string; userId: string; payload: ClientPersonPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await axios.post(`${API_URL_PORTAIL}/client-person`, {
        ...payload,
        userId,
      });
      dispatch(fetchClientInfo(beneficiaireId));
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de l'ajout de la personne."
      );
    }
  }
);

export const updateClientForm = createAsyncThunk(
  'client/updateClientForm',
  async (
    { userId, id, payload }: { userId: string; id: string; payload: ClientFormPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await axios.patch(`${API_URL_PORTAIL}/client-form/${id}`, {
        ...payload
      });
      dispatch(fetchClientInfo(userId));
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de la mise à jour du formulaire."
      );
    }
  }
);

export const updateClientPerson = createAsyncThunk(
  'client/updateClientPerson',
  async (
    { beneficiaireId, id, payload }: { beneficiaireId: string; id: string; payload: Omit<ClientPersonPayload, 'clientBeneficiaireFormId'> },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await axios.patch(`${API_URL_PORTAIL}/client-person/${id}`, {
        ...payload,
      });
      dispatch(fetchClientInfo(beneficiaireId));
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de la mise à jour de la personne."
      );
    }
  }
);

export const createClientAssuranceForm = createAsyncThunk(
  'client/createClientAssuranceForm',
  async (
    { beneficiaireId, userId, payload }: { beneficiaireId: string; userId: string; payload: ClientAssuranceFormPayload },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const body = { ...payload, userId };
      console.log('🔍 payload envoyé:', JSON.stringify(body, null, 2));
      console.log('🔍 URL:', `${API_URL_PORTAIL}/client-assurance-form`);
      
      const response = await axios.post(
        `${API_URL_PORTAIL}/client-assurance-form`, 
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log(response);
      
      dispatch(fetchClientInfo(beneficiaireId));
    } catch (err: any) {
      console.log('❌ erreur complète:', err.response?.data);
      console.log('❌ status:', err.response?.status);
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de la création du formulaire d'assurance."
      );
    }
  }
);

// ── Slice ──────────────────────────────────────────────
const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    clearClientData(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchClientInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClientForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClientForm.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createClientForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClientPerson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClientPerson.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createClientPerson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateClientForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientForm.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateClientForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateClientPerson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientPerson.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateClientPerson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClientAssuranceForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClientAssuranceForm.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createClientAssuranceForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearClientData } = clientSlice.actions;
export default clientSlice.reducer;