import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../service/Axios';
export interface ServiceSpecifique {
  id: string;
  code: string;                    // ex: "SP-1", "SP-2"
  libelle: string;                 // ex: "Choix Siège", "Pet"
  type: 'SERVICE' | 'SPECIFIQUE';
  createdAt: string;
  updatedAt: string;
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

export interface ProspectionLigne {
  id: string;
  numeroDosRef: string;                    // ex: "DOSTICK_11_1_2"
  numeroVol: string;
  prospectionEnteteId: string;
  status: string;     
  origineLine: string | null;                     // ex: "CREER"
  avion: string | null;
  departId: string | null;
  destinationId: string | null;
  itineraire: string | null;
  classe: string;                          // ex: "ECONOMIE"
  typePassager: string;                    // ex: "ENFANT", "ADULTE"
  nombre: number;
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

// Pour le state Redux (inchangé, mais typé plus strictement)
export interface ProspectionLignesState {
  items: ProspectionLigne[];
  loading: boolean;
  error: string | null;
}

export const initialState: ProspectionLignesState = {
  items: [],
  loading: false,
  error: null,
};

export interface CreateProspectionLignePayload {
  prospectionEnteteId: string;
  numeroVol: string;
  avion: string;
  itineraire: string;
  classe: string;
  typePassager: string;
  dateHeureDepart: string;          // ISO string
  dateHeureArrive: string;          // ISO string
  dureeVol: string;
  dureeEscale: string;
  puBilletCompagnieDevise: number;
  puServiceCompagnieDevise: number;
  puPenaliteCompagnieDevise: number;
  devise: string;
  tauxEchange: number;
  montantBilletCompagnieDevise: number;
  montantServiceCompagnieDevise: number;
  montantPenaliteCompagnieDevise: number;
  montantBilletClientDevise: number;
  montantServiceClientDevise: number;
  montantPenaliteClientDevise: number;
}

// Thunk pour charger les lignes d'un entête
export const fetchProspectionLignes = createAsyncThunk(
  'prospectionsLignes/fetchByEntete',
  async (enteteId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/prospections/entetes/${enteteId}`);

      if (!response.data?.success) {
        throw new Error('Réponse serveur invalide');
      }

      const enteteData = response.data.data;

      // Protection : on s'assure d'avoir un tableau (même vide)
      const lignes = Array.isArray(enteteData?.prospectionLigne)
        ? enteteData.prospectionLigne
        : [];

      return lignes as ProspectionLigne[];
    } catch (err: any) {
      console.error('Erreur fetch lignes:', err);
      return rejectWithValue(
        err.response?.data?.message ||
        err.message ||
        'Erreur lors du chargement des lignes de prospection'
      );
    }
  }
);

// Thunk CREATE
export const createProspectionLigne = createAsyncThunk(
  'prospectionsLignes/createLigne',
  async (data: CreateProspectionLignePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/prospections/lignes', data);
      return response.data.data as ProspectionLigne; // on attend l'objet créé en retour
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de la ligne'
      );
    }
  }
);

const prospectionsLignesSlice = createSlice({
  name: 'prospectionsLignes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(fetchProspectionLignes.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchProspectionLignes.fulfilled, (state, action: PayloadAction<ProspectionLigne[]>) => {
            state.loading = false;
            state.items = action.payload;
        })
        .addCase(fetchProspectionLignes.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(createProspectionLigne.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createProspectionLigne.fulfilled, (state, action: PayloadAction<ProspectionLigne>) => {
            state.loading = false;
            state.items.push(action.payload); // ajout optimiste dans la liste
        })
        .addCase(createProspectionLigne.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
  },
});

export default prospectionsLignesSlice.reducer;