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

export interface EtatVenteBilletInfo {
  id: string;
  numeroBillet: string | null;
}

export interface EtatVenteClientBeneficiaireInfo {
  id: string;
  nom: string;
  prenom: string;
  billet: EtatVenteBilletInfo[];
}

export interface EtatVenteClientBeneficiaire {
  id: string;
  code: string;
  libelle: string;
  clientbeneficiaireInfo?: EtatVenteClientBeneficiaireInfo[];
}

export interface EtatVenteLigne {
  id: string;
  numDosCommun: string;
  statutTransaction: string;
  numDosPrestation: string;
  clientFacture: { id: string; code: string; libelle: string };
  fournisseur: { id: string; code: string; libelle: string };
  clientBeneficiaire?: EtatVenteClientBeneficiaire[];
  prestation: string;
  dateTransaction: string;
  createdAt: string;
  cmCAriary: number;
  fcCAriary: number;
  commissionAppliquer: number;
  commission: number;
  tauxTaxe: number;
  montantTaxeDevise: number;
  montantTaxeAriary: number;
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
  year?: number;
  month?: number;
  quinzaine?: 1 | 2;
  moduleId?: string;
  fournisseurId?: string;
  clientFacture?: string;
  page?: number;
  limit?: number;
}

export interface TypeChambrePF {
  type: string;
  capacite: number;
}

export interface FournisseurPF {
  libelle: string;
  code: string;
}

export interface PlateformeInfo {
  id: string;
  code: string;
  nom: string;
}

export interface PlateformeReservation {
  id: string;
  referenceLine: string;
  numeroResa: string | null;
  hotel: string;
  typeChambre: TypeChambrePF;
  nombreChambre: number;
  fournisseur: FournisseurPF;
  pays: string;
  ville: string;
  du: string;
  au: string;
  nuite: number;
  statut: string;
  statusLigne: string;
  devise: string;
  puResaNuiteHotelDevise: number;
  puResaNuiteHotelAriary: number;
  puResaMontantDevise: number;
  puResaMontantAriary: number;
  pourcentageCommission: number;
  tauxConfirmation: number;
  puConfPrixNuitHotelAriary: number;
  puConfMontantNuitHotelAriary: number;
  puConfPrixNuitClientArary: number;
  puConfMontantNuitClientAriary: number;
  confirmationCommissionAriary: number;
  createdAt: string;
}

export interface PlateformeStat {
  plateforme: PlateformeInfo;
  nombreReservations: number;
  montantResaAriary: number;
  montantConfirmationAriary: number;
  commissionTotaleAriary: number;
  reservations: PlateformeReservation[];
}

export interface EtatVenteParPlateformeResultat {
  periode: { du: string; au: string };
  totalReservations: number;
  plateformes: PlateformeStat[];
}

export interface EtatVenteParPlateformeParams {
  du?: string;
  au?: string;
  statut?: string;
}

// ─── State ────────────────────────────────────────────────────

interface DashboardState {
  evolutionCurrentYear: MoisEvolution[];
  evolutionPreviousYear: MoisEvolution[];
  loadingEvolutionCurrent: boolean;
  loadingEvolutionPrevious: boolean;
  errorEvolutionCurrent: string | null;
  errorEvolutionPrevious: string | null;

  evolutionByYear: Record<number, MoisEvolution[]>;
  loadingYears: Record<number, boolean>;
  errorYears: Record<number, string | null>;

  statResultat: StatResultat | null;
  loadingStat: boolean;
  errorStat: string | null;

  etatVenteResultat: EtatVenteResultat | null;
  loadingEtatVente: boolean;
  errorEtatVente: string | null;

  etatVenteParPlateformeResultat: EtatVenteParPlateformeResultat | null;
  loadingEtatVenteParPlateforme: boolean;
  errorEtatVenteParPlateforme: string | null;
}

const initialState: DashboardState = {
  evolutionCurrentYear: [],
  evolutionPreviousYear: [],
  loadingEvolutionCurrent: false,
  loadingEvolutionPrevious: false,
  errorEvolutionCurrent: null,
  errorEvolutionPrevious: null,

  evolutionByYear: {},
  loadingYears: {},
  errorYears: {},

  statResultat: null,
  loadingStat: false,
  errorStat: null,

  etatVenteResultat: null,
  loadingEtatVente: false,
  errorEtatVente: null,

  etatVenteParPlateformeResultat: null,
  loadingEtatVenteParPlateforme: false,
  errorEtatVenteParPlateforme: null,
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

export const fetchEvolutionByYear = createAsyncThunk(
  'dashboard/fetchEvolutionByYear',
  async (year: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/dashboard/evolution-mensuelle?year=${year}`);
      if (!res.data.success) throw new Error();
      return { year, data: res.data.data as MoisEvolution[] };
    } catch (err: any) {
      return rejectWithValue({
        year,
        message: err?.response?.data?.message || `Erreur chargement évolution ${year}`,
      });
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
      if (params.year)          query.set('year',          String(params.year));
      if (params.month)         query.set('month',         String(params.month));
      if (params.quinzaine)     query.set('quinzaine',     String(params.quinzaine));
      if (params.moduleId)      query.set('moduleId',      params.moduleId);
      if (params.fournisseurId) query.set('fournisseurId', params.fournisseurId);
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

export const fetchEtatVenteParPlateforme = createAsyncThunk(
  'dashboard/fetchEtatVenteParPlateforme',
  async (params: EtatVenteParPlateformeParams, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.du) query.set('du', params.du);
      if (params.au) query.set('au', params.au);
      if (params.statut) query.set('statut', params.statut);

      const res = await axiosInstance.get(`/hotel/stats/plateforme/par-date?${query.toString()}`);
      if (!res.data.success) throw new Error();
      return res.data.data as EtatVenteParPlateformeResultat;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement état de vente par plateforme');
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

      .addCase(fetchEvolutionByYear.pending, (state, action) => {
        if (!state.loadingYears) state.loadingYears = {};
        if (!state.errorYears) state.errorYears = {};
        const year = action.meta.arg;
        state.loadingYears[year] = true;
        state.errorYears[year] = null;
      })
      .addCase(fetchEvolutionByYear.fulfilled, (state, action) => {
        if (!state.loadingYears) state.loadingYears = {};
        if (!state.evolutionByYear) state.evolutionByYear = {};
        const { year, data } = action.payload;
        state.loadingYears[year] = false;
        state.evolutionByYear[year] = data;
      })
      .addCase(fetchEvolutionByYear.rejected, (state, action) => {
        if (!state.loadingYears) state.loadingYears = {};
        if (!state.errorYears) state.errorYears = {};
        const year = action.meta.arg;
        const payload = action.payload as { year: number; message: string } | undefined;
        state.loadingYears[year] = false;
        state.errorYears[year] = payload?.message ?? 'Erreur chargement évolution';
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
      })
      .addCase(fetchEtatVenteParPlateforme.pending, (state) => {
        state.loadingEtatVenteParPlateforme = true;
        state.errorEtatVenteParPlateforme = null;
      })
      .addCase(fetchEtatVenteParPlateforme.fulfilled, (state, action) => {
        state.loadingEtatVenteParPlateforme = false;
        state.etatVenteParPlateformeResultat = action.payload;
      })
      .addCase(fetchEtatVenteParPlateforme.rejected, (state, action) => {
        state.loadingEtatVenteParPlateforme = false;
        state.errorEtatVenteParPlateforme = action.payload as string;
      });
  },
});

export default dashboardSlice.reducer;