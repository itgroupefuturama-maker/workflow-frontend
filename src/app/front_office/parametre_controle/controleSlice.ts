// src/app/controle/controleSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface PjControle {
  id: string;
  type: string;
  url: string;
  controleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  code: string;
  nom: string;
  description: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
}

export interface fournisseur {
  id: string;
  code: string;
  libelle: string;
  dateApplication: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface user {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  pseudo: string;
  departement: string;
  createdAt: string;
  updatedAt: string;
}

export interface Controle {
  id: string;
  dateTransaction: string;
  transaction: string;
  statutTransaction: string;
  numDosCommun: string;
  numDosPrestation: string;
  origineLigne: string;
  prestation: string;
  commentaire: string;
  userId: string;
  moduleId: string;
  cmPuDevise: number;
  cmCuDevise: number;
  cmDevise: string;
  cmTauxChange: number;
  cmPuAriary: number;
  cmCuAriary: number;
  duree: string;
  quantite: number;
  cmMDevise: number;
  cmCDevise: number;
  cmMAriary: number;
  cmCAriary: number;
  fcPuDevise: number;
  fcCuDevise: number;
  fcDevise: string;
  fcTauxChange: number;
  fcPuAriary: number;
  fcCuAriary: number;
  fcMDevise: number;
  fcCDevise: number;
  fcMAriary: number;
  fcCAriary: number;
  dateBC: string;
  refBC: string;
  statusBC: string;
  dateFc: string;
  refFc: string;
  statusFc: string;
  dateReglement: string;
  refReglement: string;
  fournisseurId: string;
  consulatId: string | null;
  createdAt: string;
  updatedAt: string;
  module: Module;
  fournisseur: fournisseur | null;
  consulat: { id: string; nom: string } | null;
  user: user;
  pjControle: PjControle[];
  clientBeneficiaire: ClientBeneficiaire [] | null;
  clientFacture : ClientFacture;
  tauxTaxe: number;
  montantTaxeDevise: number;
  montantTaxeAriary: number;
  aeroportDepart: string;
  aeroportArrivee: string;
}

export interface BilletInfo {
  id: string;
  numeroBillet: string | null;
}

export interface ClientBeneficiaireInfo {
  id: string;
  nom: string;
  prenom: string;
  billet: BilletInfo[];
}

export interface ClientBeneficiaire {
  id: string;
  code: string;
  libelle: string;
  createdAt: string;
  updatedAt: string;
  clientbeneficiaireInfo?: ClientBeneficiaireInfo[];
}

export interface ClientFacture {
  id: string;
  code: string;
  libelle: string;
  createdAt: string;
  updatedAt: string;
}

// ── Meta de pagination renvoyée par le serveur ────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Paramètres du thunk ───────────────────────────────────────────────────────
export interface FetchControlesParams {
  page: number;
  limit: number;
}

export interface FetchControlesByDossierParams {
  page: number;
  limit: number;
  numDosCommun?: string;
  module?: string;
}

interface ControleState {
  list: Controle[];
  meta: PaginationMeta;
  loading: boolean;
  error: string | null;
  // Liste scopée par dossier (EvolutionClientTable.tsx uniquement) — distincte de `list`
  // ci-dessus, qui reste la vue générale non filtrée utilisée par PageControle.tsx.
  dossierList: Controle[];
  dossierMeta: PaginationMeta;
  dossierLoading: boolean;
  dossierError: string | null;
}

const initialState: ControleState = {
  list: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  error: null,
  dossierList: [],
  dossierMeta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  dossierLoading: false,
  dossierError: null,
};

export const fetchControles = createAsyncThunk(
  'controle/fetchPaginated',
  async ({ page, limit }: FetchControlesParams, { rejectWithValue }) => {
    try {
      const response = await axios.get('/controle/paginated', {
        params: { page, limit },
      });
      if (!response.data?.success) {
        return rejectWithValue(response.data?.message || 'Réponse invalide');
      }
      // response.data = { success, data: { data: [...], meta: {...} } }
      const payload = response.data.data;
      return {
        data: payload.data as Controle[],
        meta: payload.meta as PaginationMeta,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Erreur lors du chargement'
      );
    }
  }
);

// Fetch scopé par dossier + module (EvolutionClientTable.tsx uniquement)
export const fetchControlesByDossier = createAsyncThunk(
  'controle/fetchByDossier',
  async ({ page, limit, numDosCommun, module }: FetchControlesByDossierParams, { rejectWithValue }) => {
    try {
      const response = await axios.get('/controle/paginated', {
        params: { page, limit, numDosCommun, module },
      });
      if (!response.data?.success) {
        return rejectWithValue(response.data?.message || 'Réponse invalide');
      }
      const payload = response.data.data;
      return {
        data: payload.data as Controle[],
        meta: payload.meta as PaginationMeta,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Erreur lors du chargement'
      );
    }
  }
);

const controleSlice = createSlice({
  name: 'controle',
  initialState,
  reducers: {
    clearControles(state) {
      state.list = [];
      state.meta = initialState.meta;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchControles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchControles.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchControles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchControlesByDossier.pending, (state) => {
        state.dossierLoading = true;
        state.dossierError = null;
      })
      .addCase(fetchControlesByDossier.fulfilled, (state, action) => {
        state.dossierLoading = false;
        state.dossierList = action.payload.data;
        state.dossierMeta = action.payload.meta;
      })
      .addCase(fetchControlesByDossier.rejected, (state, action) => {
        state.dossierLoading = false;
        state.dossierError = action.payload as string;
      });
  },
});

export const { clearControles } = controleSlice.actions;
export default controleSlice.reducer;