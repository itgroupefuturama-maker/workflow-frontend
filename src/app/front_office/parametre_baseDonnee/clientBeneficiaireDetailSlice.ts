import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from '../../../service/Axios';

export interface ClientBeneficiaireDetail {
  id: string;
  code: string;
  libelle: string;
  statut: string;
  dateApplication: string;
  dateCreation: string;
  updatedAt: string;
  clientbeneficiaireInfo: {
    id: string;
    nom: string;
    prenom: string;
    nationalite: string;
    document: string;
    referenceDoc: string;
    typeDoc: string;
    dateDelivranceDoc: string;
    dateValiditeDoc: string;
    tel: string;
    statut: string;
    createdAt: string;
    clientBeneficiaireForm: {
      id: string;
      nom: string; prenom: string; sexe: string;
      dateNaissance: string; lieuNaissance: string;
      nationalite: string; etatCivil: string;
      numero: string; email: string; adresse: string;
      paysResidence: string;
      nomContactUrgence: string; prenomContactUrgence: string;
      numeroContactUrgence: string; emailContactUrgence: string;
      professionActuelle: string; nomEmployeur: string;
      numeroTelephone: string; emailProfessionnel: string;
      adresseProfessionnel: string; etablissement: string; diplome: string;
      clientBeneficiairePerson: {
        id: string; nom: string; prenom: string;
        sexe: string; dateNaissance: string;
        nationalite: string; typePerson: string; numero: string;
      }[];
    };
  }[];
  clientAssuranceForm: {
    id: string;
    nom: string; prenom: string;
    dateNaissance: string; numero: string;
    email: string; adresse: string; numeroPassport: string;
    createdAt: string;
    assurance: {
      id: string;
      numeroPolice: string; numeroQuittance: string;
      statut: string; statusLigne: string;
      tauxChangeFacture: number;
      puFactureAssureurDevise: number;
      puFactureAssureurAriary: number;
      puFactureClientAriary: number;
      commissionFactureAriary: number;
      createdAt: string; updatedAt: string;
    }[];
  }[];
}

interface State {
  data: ClientBeneficiaireDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: State = { data: null, loading: false, error: null };

export const fetchClientBeneficiaireDetail = createAsyncThunk(
  "clientBeneficiaireDetail/fetch",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/client-beneficiaires/all-details/${id}`);
      return res.data.data as ClientBeneficiaireDetail;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? "Erreur serveur");
    }
  }
);

const slice = createSlice({
  name: "clientBeneficiaireDetail",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientBeneficiaireDetail.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchClientBeneficiaireDetail.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; })
      .addCase(fetchClientBeneficiaireDetail.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;