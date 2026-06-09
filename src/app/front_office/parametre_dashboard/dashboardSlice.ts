import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

// ─── Interfaces ───────────────────────────────────────────────

export interface ModuleEvolution {
  moduleId: string;
  moduleName: string;
  nombreDossiers: number;
  chiffreAffaire: number;
  engagementFournisseur: number;
  commission: number;
}

export interface MoisEvolution {
  mois: number;
  ca: number;
  fc: number;
  commission: number;
  dossiers: number;
  modules: ModuleEvolution[];
}

export interface StatLigne {
  id: string;
  numDosCommun: string;
  numDosPrestation: string;
  clientFacture: { id: string; code: string; libelle: string };
  prestation: string;
  dateTransaction: string;
  cmMAriary: number;
  cmCAriary: number;
  fcCAriary: number;
  fcMAriary: number;
  commissionAppliquer: number;
  commission: number;
  module: { id: string; nom: string };
}

export interface StatResultat {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: StatLigne[];
}

export interface StatParams {
  numDosCommun: string;
  clientFacture?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  limit?: number;
}

export interface EtatVenteLigne {
  id: string;
  numDosCommun: string;
  numDosPrestation: string;
  clientFacture: { id: string; code: string; libelle: string };
  prestation: string;
  dateTransaction: string;
  createdAt: string;
  cmCAriary: number;
  fcCAriary: number;
  commissionAppliquer: number;
  commission: number;
  module: { id: string; nom: string };
}

export interface EtatVenteResultat {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: EtatVenteLigne[];
}

export interface EtatVenteParams {
  dateDebut?: string;
  dateFin?: string;
  moduleId?: string;
  clientFacture?: string;
  page?: number;
  limit?: number;
}

// ─── State ────────────────────────────────────────────────────

interface DashboardState {
  evolutionCurrentYear: MoisEvolution[];
  evolutionPreviousYear: MoisEvolution[];
  loadingEvolutionCurrent: boolean;
  loadingEvolutionPrevious: boolean;
  errorEvolutionCurrent: string | null;
  errorEvolutionPrevious: string | null;

  statResultat: StatResultat | null;
  loadingStat: boolean;
  errorStat: string | null;

  etatVenteResultat: EtatVenteResultat | null;
  loadingEtatVente: boolean;
  errorEtatVente: string | null;
}

const initialState: DashboardState = {
  evolutionCurrentYear: [],
  evolutionPreviousYear: [],
  loadingEvolutionCurrent: false,
  loadingEvolutionPrevious: false,
  errorEvolutionCurrent: null,
  errorEvolutionPrevious: null,

  statResultat: null,
  loadingStat: false,
  errorStat: null,

  etatVenteResultat: null,
  loadingEtatVente: false,
  errorEtatVente: null,
};

// ─── Thunks ───────────────────────────────────────────────────

export const fetchEvolutionCurrentYear = createAsyncThunk(
  'dashboard/fetchEvolutionCurrentYear',
  async (year: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/dashboard/evolution-mensuelle?year=${year}`);
      if (!res.data.success) throw new Error();
      return res.data.data as MoisEvolution[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement évolution année courante');
    }
  }
);

export const fetchEvolutionPreviousYear = createAsyncThunk(
  'dashboard/fetchEvolutionPreviousYear',
  async (year: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/dashboard/evolution-mensuelle?year=${year}`);
      if (!res.data.success) throw new Error();
      return res.data.data as MoisEvolution[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement évolution année précédente');
    }
  }
);

export const fetchStatParDossier = createAsyncThunk(
  'dashboard/fetchStatParDossier',
  async (params: StatParams, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set('numDosCommun', params.numDosCommun);
      if (params.clientFacture) query.set('clientFacture', params.clientFacture);
      if (params.dateDebut)     query.set('dateDebut',     params.dateDebut);
      if (params.dateFin)       query.set('dateFin',       params.dateFin);
      query.set('page',  String(params.page  ?? 1));
      query.set('limit', String(params.limit ?? 100));

      const res = await axiosInstance.get(`/dashboard/liste-par-num-dossier-commun?${query.toString()}`);
      if (!res.data.success) throw new Error();
      return res.data.data as StatResultat;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement statistiques');
    }
  }
);

export const fetchEtatVente = createAsyncThunk(
  'dashboard/fetchEtatVente',
  async (params: EtatVenteParams, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.dateDebut)     query.set('dateDebut',     params.dateDebut);
      if (params.dateFin)       query.set('dateFin',       params.dateFin);
      if (params.moduleId)      query.set('moduleId',      params.moduleId);
      if (params.clientFacture) query.set('clientFacture', params.clientFacture);
      query.set('page',  String(params.page  ?? 1));
      query.set('limit', String(params.limit ?? 100));

      const res = await axiosInstance.get(`/dashboard/liste-par-periode-module-client?${query.toString()}`);
      if (!res.data.success) throw new Error();
      return res.data.data as EtatVenteResultat;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement état de vente');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvolutionCurrentYear.pending, (state) => {
        state.loadingEvolutionCurrent = true;
        state.errorEvolutionCurrent = null;
      })
      .addCase(fetchEvolutionCurrentYear.fulfilled, (state, action) => {
        state.loadingEvolutionCurrent = false;
        state.evolutionCurrentYear = action.payload;
      })
      .addCase(fetchEvolutionCurrentYear.rejected, (state, action) => {
        state.loadingEvolutionCurrent = false;
        state.errorEvolutionCurrent = action.payload as string;
      })

      .addCase(fetchEvolutionPreviousYear.pending, (state) => {
        state.loadingEvolutionPrevious = true;
        state.errorEvolutionPrevious = null;
      })
      .addCase(fetchEvolutionPreviousYear.fulfilled, (state, action) => {
        state.loadingEvolutionPrevious = false;
        state.evolutionPreviousYear = action.payload;
      })
      .addCase(fetchEvolutionPreviousYear.rejected, (state, action) => {
        state.loadingEvolutionPrevious = false;
        state.errorEvolutionPrevious = action.payload as string;
      })

      .addCase(fetchStatParDossier.pending, (state) => {
        state.loadingStat = true;
        state.errorStat = null;
      })
      .addCase(fetchStatParDossier.fulfilled, (state, action) => {
        state.loadingStat = false;
        state.statResultat = action.payload;
      })
      .addCase(fetchStatParDossier.rejected, (state, action) => {
        state.loadingStat = false;
        state.errorStat = action.payload as string;
      })

      .addCase(fetchEtatVente.pending, (state) => {
        state.loadingEtatVente = true;
        state.errorEtatVente = null;
      })
      .addCase(fetchEtatVente.fulfilled, (state, action) => {
        state.loadingEtatVente = false;
        state.etatVenteResultat = action.payload;
      })
      .addCase(fetchEtatVente.rejected, (state, action) => {
        state.loadingEtatVente = false;
        state.errorEtatVente = action.payload as string;
      });
  },
});

export default dashboardSlice.reducer;