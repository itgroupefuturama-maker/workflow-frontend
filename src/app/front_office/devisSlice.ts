import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

export interface AnnulationPayload {
  raisonAnnul: string;
  lignes: {
    id: string;
    puPenaliteCompagnieDevise: number;
    montantPenaliteCompagnieDevise: number;
    conditionAnnul: string;
  }[];
}

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
  statut: string;
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
    numeroEntete: string;
    commissionPropose: string;
    commissionAppliquer: string;
    prestation: {
        id: string;
        numeroDos: string;
        status: string;
    }
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

// Thunk : Changer le statut de l'entête (ex: vers "A Approuver")
export const updateApprouverDevisStatut = createAsyncThunk(
  'billet/updateEnteteStatut',
  async (
    { enteteId }: { enteteId: string},
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/devis/${enteteId}/envoyer`);
      console.log(enteteId);
      if (!response.data?.success) {
        throw new Error('Échec du changement de statut');
      }
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du changement de statut'
      );
    }
  }
);
// Thunk : Changer le statut de l'entête (ex: vers "A Approuver")
export const updateValidateDevisStatut = createAsyncThunk(
  'billet/updateEnteteStatut',
  async (
    { enteteId }: { enteteId: string},
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/devis/${enteteId}/approuver`);
      console.log(enteteId);
      if (!response.data?.success) {
        throw new Error('Échec du changement de statut');
      }
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du changement de statut'
      );
    }
  }
);

// Thunk pour annuler un devis
export const annulerDevis = createAsyncThunk(
  'devis/annuler',
  async (
    { devisId, payload }: { devisId: string; payload: AnnulationPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(`/devis/${devisId}/annuler`, payload);
      
      if (!response.data?.success) {
        throw new Error('Échec de l\'annulation du devis');
      }
      
      return { devisId, ...response.data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'annulation du devis'
      );
    }
  }
);

// Thunk : Envoyer à la direction → génère et sauvegarde le PDF commission
export const approuverDirectionDevis = createAsyncThunk(
  'devis/approuverDirection',
  async (
    { devisId, client, facture }: { devisId: string; client: string; facture: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/devis/${devisId}/commission/pdf/save`, {
        client,
        facture,
      });

      if (!response.data?.success) {
        throw new Error('Échec de la génération du PDF commission');
      }

      return response.data; // on renvoie toute la réponse pour accéder à data.filepath
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'envoi à la direction'
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
      })
      .addCase(annulerDevis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(annulerDevis.fulfilled, (state, action) => {
        state.loading = false;
        // Option 1 : retirer le devis annulé de la liste
        state.items = state.items.filter(d => d.id !== action.payload.devisId);
        
        // Option 2 (alternative) : mettre à jour le statut si l'API le renvoie
        // const updatedDevis = action.payload.data; // si l'API renvoie le devis mis à jour
        // const index = state.items.findIndex(d => d.id === updatedDevis.id);
        // if (index !== -1) state.items[index] = updatedDevis;
      })
      .addCase(annulerDevis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default devisSlice.reducer;