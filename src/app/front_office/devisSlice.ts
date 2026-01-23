import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

export interface ServiceSpecifique {
  id: string;
  code: string;                    // ex: "SP-1", "SP-2"
  libelle: string;                 // ex: "Choix Siège", "Pet"
  type: 'SERVICE' | 'SPECIFIQUE';
  createdAt: string;
  updatedAt: string;
}

export interface Devis {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  prospectionEnteteId: string;
  totalGeneral: number;
  url: string | null;
  data: {
    entete: Entete;           // tu peux typer plus finement si besoin
    lignes: Ligne[];         // idem
    dateCreation: string;
    totalGeneral: number;
  };
}

export interface Entete {
    id : string;
    credit: string;
    typeVol: string;
    fournisseur: {
        id: string;
        code: string;
        libelle: string;
    }
}

export interface ServiceProspectionLigne {
  id: string;
  prospectionLigneId: string;
  serviceSpecifiqueId: string;
  valeur: string;                  // "true", "false", "23Kg", "rien", etc.
  createdAt: string;
  updatedAt: string;

  // Relation incluse (très utile pour l'affichage)
  serviceSpecifique?: ServiceSpecifique;  // ← souvent présent dans la réponse
}

export interface Ligne{
    id: string;
    numeroDosRef: string;                    // ex: "DOSTICK_11_1_2"
    numeroVol: string;
    prospectionEnteteId: string;
    status: string;                          // ex: "CREER"
    avion: string | null;
    itineraire: string | null;
    classe: string;                          // ex: "ECONOMIE"
    typePassager: string;                    // ex: "ENFANT", "ADULTE"
    
    dateHeureDepart: string;                 // ISO string
    dateHeureArrive: string | null;
    dureeVol: string | null;                 // ex: "11h30"
    dureeEscale: string | null;              // ex: "2h00"
    
    // Conditions (souvent null)
    conditionModif: string | null;
    conditionAnnul: string | null;

    // Prix unitaires compagnie (devise originale)
    puBilletCompagnieDevise: number;
    puServiceCompagnieDevise: number;
    puPenaliteCompagnieDevise: number;

    devise: string;                          // ex: "EUR"
    tauxEchange: number;                     // ex: 4800

    // Prix unitaires en Ariary (calculés)
    puBilletCompagnieAriary: number;
    puServiceCompagnieAriary: number;
    puPenaliteCompagnieAriary: number;

    // Montants totaux compagnie
    montantBilletCompagnieDevise: number;
    montantServiceCompagnieDevise: number;
    montantPenaliteCompagnieDevise: number;

    montantBilletCompagnieAriary: number;
    montantServiceCompagnieAriary: number;
    montantPenaliteCompagnieAriary: number;

    // Montants totaux client (incluant marges)
    montantBilletClientDevise: number;
    montantServiceClientDevise: number;
    montantPenaliteClientDevise: number;

    montantBilletClientAriary: number;
    montantServiceClientAriary: number;
    montantPenaliteClientAriary: number;

    // Commissions calculées
    commissionEnDevise: number;
    commissionEnAriary: number;

    dateDevis: string | null;
    devisId: string | null;

    createdAt: string;
    updatedAt: string;

    // Relation devis (souvent null dans l'exemple)
    devis: any | null;  // à typer plus précisément si besoin

    // Le plus important : les services spécifiques attachés
    serviceProspectionLigne: ServiceProspectionLigne[];
}

interface DevisState {
  items: Devis[];
  loading: boolean;
  error: string | null;
}

const initialState: DevisState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchDevisByEntete = createAsyncThunk(
  'devis/fetchByEntete',
  async (enteteId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/devis/entete/${enteteId}`);
      if (!response.data.success) {
        throw new Error('Réponse invalide');
      }
      return response.data.data as Devis[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement des devis'
      );
    }
  }
);

const devisSlice = createSlice({
  name: 'devis',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevisByEntete.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevisByEntete.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDevisByEntete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default devisSlice.reducer;