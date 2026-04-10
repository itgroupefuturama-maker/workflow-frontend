import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL_PORTAIL } from '../../service/env';

export interface CreateClientFormPayload {
  userId: string;
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
  typePerson: string;
  clientBeneficiaireFormId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientBeneficiairePersonPayload {
  userId: string;
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
  typePerson: string;
  clientBeneficiaireFormId: string;
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
  clientBeneficiairePerson: ClientBeneficiairePerson[];
}

export interface UserDocument {
  id: string;
  type: string;
  nomDoc: string;
  pj: string;
  status: string;
}

export interface VisaData {
  id: string;
  visaType: string;
  visaDescription: string;
  pays: string;
  clientBeneficiaireForm: ClientBeneficiaireForm[];
}

export interface ClientFormData {
  id: string;
  nom: string;
  userType: 'VISA' | 'ASSURANCE' | string;
  actif: boolean;
  isValidate: boolean;
  createdAt: string;
  userDocument: UserDocument[];
  visa: VisaData | null;
  assurance: any | null;
  selectedClientBeneficiaireForm: ClientBeneficiaireForm | null;
}

interface ClientFormState {
  data: ClientFormData | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  creatingPerson: boolean;
  createPersonError: string | null;
  uploadingDocId: string | null;   // ← id du doc en cours d'upload
  uploadError: string | null;
}

const initialState: ClientFormState = {
  data: null,
  loading: false,
  error: null,
  creating: false,
  createError: null,
  creatingPerson: false,
  createPersonError: null,
  uploadingDocId: null,
  uploadError: null,
};

export const fetchClientFormByVisaAbstract = createAsyncThunk(
  'clientForm/fetchByVisaAbstract',
  async (idVisaAbstract: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL_PORTAIL}/client-form/visa-abstract/${idVisaAbstract}`
      );
      if (response.data?.success) {
        return response.data.data as ClientFormData;
      }
      return rejectWithValue('Réponse invalide du serveur');
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Erreur serveur');
    }
  }
);

export const createClientForm = createAsyncThunk(
  'clientForm/create',
  async (payload: CreateClientFormPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL_PORTAIL}/client-form`,
        payload
      );
      if (response.data?.success) {
        return response.data.data;
      }
      return rejectWithValue('Réponse invalide du serveur');
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err.message || 'Erreur serveur'
      );
    }
  }
);

export const createClientBeneficiairePerson = createAsyncThunk(
  'clientForm/createPerson',
  async (payload: CreateClientBeneficiairePersonPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL_PORTAIL}/client-person`,
        payload
      );
      if (response.data?.success) {
        return response.data.data;
      }
      return rejectWithValue('Réponse invalide du serveur');
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err.message || 'Erreur serveur'
      );
    }
  }
);

export const uploadDocumentPj = createAsyncThunk(
  'clientForm/uploadDocumentPj',
  async (
    { documentId, file }: { documentId: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('pj', file);

      const response = await axios.patch(
        `${API_URL_PORTAIL}/document/${documentId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        return { documentId, pj: response.data.data?.pj || 'uploaded' };
      }
      return rejectWithValue('Réponse invalide du serveur');
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Erreur lors de l'envoi du document."
      );
    }
  }
);

const clientFormSlice = createSlice({
  name: 'clientForm',
  initialState,
  reducers: {
    resetClientForm(state) {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientFormByVisaAbstract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientFormByVisaAbstract.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchClientFormByVisaAbstract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClientForm.pending, (state) => {
        state.creating = true;
        state.createError = null;
    })
    .addCase(createClientForm.fulfilled, (state) => {
        state.creating = false;
    })
    .addCase(createClientForm.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload as string;
    })
    .addCase(createClientBeneficiairePerson.pending, (state) => {
        state.creatingPerson = true;
        state.createPersonError = null;
    })
    .addCase(createClientBeneficiairePerson.fulfilled, (state) => {
        state.creatingPerson = false;
    })
    .addCase(createClientBeneficiairePerson.rejected, (state, action) => {
        state.creatingPerson = false;
        state.createPersonError = action.payload as string;
    })
    .addCase(uploadDocumentPj.pending, (state, action) => {
        state.uploadingDocId = action.meta.arg.documentId;
        state.uploadError = null;
    })
    .addCase(uploadDocumentPj.fulfilled, (state, action) => {
        state.uploadingDocId = null;
        // Mettre à jour le pj dans userDocument directement dans le store
        if (state.data) {
        const doc = state.data.userDocument.find(
            (d) => d.id === action.payload.documentId
        );
        if (doc) doc.pj = action.payload.pj;
        }
    })
    .addCase(uploadDocumentPj.rejected, (state, action) => {
        state.uploadingDocId = null;
        state.uploadError = action.payload as string;
    });
  },
});

export const { resetClientForm } = clientFormSlice.actions;
export default clientFormSlice.reducer;