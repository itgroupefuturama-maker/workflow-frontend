// src/app/front_office/hotel/hotelDevisSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ─── Types mis à jour selon la nouvelle réponse API ───────────────────────────

export interface ServiceHotel {
  id: string;
  service: string;
}

export interface BenchService {
  id: string;
  serviceHotelId: string;
  benchmarkingEnteteId: string;
  serviceHotel: ServiceHotel;
}

export interface Plateforme {
  id: string;
  code: string;
  nom: string;
  status: string;
}

export interface TypeChambre {
  id: string;
  type: string;
  capacite: number;
}

export interface LigneClient {
  id: string;
  hotel: string;
  devise: string;
  plateforme: Plateforme;
  tauxChange: number;
  isBenchMark: boolean;
  nuiteAriary: number;
  nuiteDevise: number;
  typeChambre: TypeChambre;
  plateformeId: string;
  montantAriary: number;
  montantDevise: number;
  nombreChambre: number;
  typeChambreId: string;
  benchmarkingEnteteId: string;
}

export interface BenchmarkingEntete {
  id: string;
  au: string;
  du: string;
  pays: string;
  nuite: number;
  ville: string;
  numero: string;
  createdAt: string;
  updatedAt: string;
  ligneClient: LigneClient | null;
  benchService: BenchService[];
  tauxPrixUnitaire: number;
  forfaitaireGlobal: number;
  montantCommission: number;
  forfaitaireUnitaire: number;
  hotelProspectionEnteteId: string;
}

export interface ProspectionHotel {
  id: string;
  numeroEntete: string;
  prestationId: string;
  fournisseurId: string;
  prestation: { id: string; numeroDos: string; status: string };
  fournisseur: { id: string; code: string; libelle: string };
  RaisonAnnulation: null;
}

export interface DevisData {
  prospectionHotel: ProspectionHotel;
  benchmarkingEntetes: BenchmarkingEntete[];
}

export interface HotelDevisData {
  devis: {
    id: string;
    reference: string;
    totalGeneral: number;
    url1: string | null;
    url2: string | null;
    statut: string;
    entity: string;
    entityId: string;
    createdAt: string;
    updatedAt: string;
    data: DevisData; // ← nouveau champ imbriqué
  } | null;
}

interface HotelDevisState {
  data: HotelDevisData | null;
  loading: boolean;
  error: string | null;
  actionLoading: 'envoi' | 'approbation' | 'transformation' | 'pdfClient' | 'pdfDirection' | null; // ← AJOUT
  actionError: string | null;
  transformed: boolean;
  pdfClientUrl: string | null;     // ← AJOUT
  pdfDirectionUrl: string | null;  // ← AJOUT
}

const initialState: HotelDevisState = {
  data: null,
  loading: false,
  error: null,
  actionLoading: null,
  actionError: null,
  transformed: false,
  pdfClientUrl: null,
  pdfDirectionUrl: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchHotelWithDevis = createAsyncThunk(
  'hotelDevis/fetchWithDevis',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/hotel/prospection/${id}/with-devis`);
      if (!response.data?.success) return rejectWithValue(response.data?.message || 'Réponse invalide');
      return response.data.data as HotelDevisData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Erreur de chargement');
    }
  }
);

export const envoyerDevis = createAsyncThunk(
  'hotelDevis/envoyer',
  async (devisId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/hotel/benchmarking/${devisId}/envoyer-devis`);
      if (!response.data?.success) return rejectWithValue(response.data?.message || 'Réponse invalide');
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Erreur lors de l'envoi");
    }
  }
);

export const approuverDevis = createAsyncThunk(
  'hotelDevis/approuver',
  async (devisId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/hotel/benchmarking/${devisId}/approuver-devis`);
      if (!response.data?.success) return rejectWithValue(response.data?.message || 'Réponse invalide');
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Erreur lors de l'approbation");
    }
  }
);

export const transformerEnHotel = createAsyncThunk(
  'hotelDevis/transformer',
  async (
    payload: { hotelProspectionEnteteId: string; devisModuleId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post('/hotel/entete', payload);
      if (!response.data?.success) return rejectWithValue(response.data?.message || 'Réponse invalide');
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Erreur lors de la transformation');
    }
  }
);

// ─── Thunk : générer PDF client ───────────────────────────────────────────────
export const genererPdfClient = createAsyncThunk(
  'hotelDevis/genererPdfClient',
  async (enteteId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/hotel/benchmarking/${enteteId}/pdf-client`);
      if (!response.data?.success) return rejectWithValue(response.data?.message || 'Réponse invalide');
      return response.data.data as string; // "uploads/hotel-devis/DM-2-client.pdf"
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Erreur génération PDF client');
    }
  }
);

// ─── Thunk : générer PDF direction ───────────────────────────────────────────
export const genererPdfDirection = createAsyncThunk(
  'hotelDevis/genererPdfDirection',
  async (
    payload: {
      id: string; // enteteId
      montantTotalClient: number;
      tauxCommission: number;
      montantTotalCommission: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = payload;
      const response = await axios.put(`/hotel/prospection/${id}/pdf/direction`, body);
      if (!response.data?.success) return rejectWithValue(response.data?.message || 'Réponse invalide');
      return response.data.data as string; // "uploads/hotel-devis-direction/DM-2-direction.pdf"
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Erreur génération PDF direction');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const hotelDevisSlice = createSlice({
  name: 'hotelDevis',
  initialState,
  reducers: {
    clearHotelDevis(state) {
      state.data = null;
      state.error = null;
      state.actionError = null;
      state.transformed = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelWithDevis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelWithDevis.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHotelWithDevis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(envoyerDevis.pending, (state) => {
        state.actionLoading = 'envoi';
        state.actionError = null;
      })
      .addCase(envoyerDevis.fulfilled, (state, action) => {
        state.actionLoading = null;
        if (state.data?.devis) {
          state.data.devis.statut = action.payload?.statut ?? 'DEVIS_EN_ATTENTE';
          state.data.devis.updatedAt = action.payload?.updatedAt ?? new Date().toISOString();
        }
      })
      .addCase(envoyerDevis.rejected, (state, action) => {
        state.actionLoading = null;
        state.actionError = action.payload as string;
      })
      .addCase(approuverDevis.pending, (state) => {
        state.actionLoading = 'approbation';
        state.actionError = null;
      })
      .addCase(approuverDevis.fulfilled, (state, action) => {
        state.actionLoading = null;
        if (state.data?.devis) {
          state.data.devis.statut = action.payload?.statut ?? 'DEVIS_APPROUVE';
          state.data.devis.updatedAt = action.payload?.updatedAt ?? new Date().toISOString();
        }
      })
      .addCase(approuverDevis.rejected, (state, action) => {
        state.actionLoading = null;
        state.actionError = action.payload as string;
      })
      .addCase(transformerEnHotel.pending, (state) => {
        state.actionLoading = 'transformation';
        state.actionError = null;
      })
      .addCase(transformerEnHotel.fulfilled, (state) => {
        state.actionLoading = null;
        state.transformed = true;
      })
      .addCase(transformerEnHotel.rejected, (state, action) => {
        state.actionLoading = null;
        state.actionError = action.payload as string;
      })
      // PDF Client
      .addCase(genererPdfClient.pending, (state) => {
        state.actionLoading = 'pdfClient';
        state.actionError = null;
      })
      .addCase(genererPdfClient.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.pdfClientUrl = action.payload;
        // Mettre à jour url1 dans le devis aussi
        if (state.data?.devis) {
          state.data.devis.url1 = action.payload;
        }
      })
      .addCase(genererPdfClient.rejected, (state, action) => {
        state.actionLoading = null;
        state.actionError = action.payload as string;
      })

      // PDF Direction
      .addCase(genererPdfDirection.pending, (state) => {
        state.actionLoading = 'pdfDirection';
        state.actionError = null;
      })
      .addCase(genererPdfDirection.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.pdfDirectionUrl = action.payload;
        if (state.data?.devis) {
          state.data.devis.url2 = action.payload;
        }
      })
      .addCase(genererPdfDirection.rejected, (state, action) => {
        state.actionLoading = null;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearHotelDevis } = hotelDevisSlice.actions;
export default hotelDevisSlice.reducer;