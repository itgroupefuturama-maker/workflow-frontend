import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';  // ton instance axios
import type { RootState } from '../../store';

export type GeneratePdfDirectionPayload = {
  benchmarkingId: string;
  montantTotalClient: number;
  tauxCommission: number;
  montantTotalCommission: number;
};

export type SendDevisPayload = {
  benchmarkingId: string;
  dataBooking: {
    benchmarkingEnteteId: string;
    hotel: string;
    plateformeId: string;
    typeChambreId: string;
    nuiteDevise: number;
    devise: string;
    tauxChange: number;
    nuiteAriary: number;
    montantDevise: number;
    montantAriary: number;
  };
  dataClient: {
    benchmarkingEnteteId: string;
    hotel: string;
    plateformeId: string;
    typeChambreId: string;
    nuiteDevise: number;
    devise: string;
    tauxChange: number;
    nuiteAriary: number;
    montantDevise: number;
    montantAriary: number;
  };
  dataCommission: {
    tauxPrixUnitaire: number;
    forfaitaireUnitaire: number;
    forfaitaireGlobal: number;
    montantCommission: number;
  };
};


export type CreateBenchmarkingLignePayload = {
  benchmarkingEnteteId: string;
  hotel: string;
  plateformeId: string;
  typeChambreId: string;
  nuiteDevise: number;
  nuiteAriary: number;
  montantDevise: number;
  montantAriary: number;
  devise: string;
  tauxChange: number;
};

export type CreateBenchmarkingPayload = {
  numero: string;
  hotelProspectionEnteteId: string;
  du: string;           // ISO string ex: "2026-02-13T00:00:00.000Z"
  au: string;
  nuite: number;
  pays: string;
  ville: string;
  serviceHotelIds: string[];
};

// Types simplifiés (on garde l'essentiel pour l'affichage)
export type FournisseurLight = {
  id: string;
  code: string;
  libelle: string;
};

export type PrestationLight = {
  id: string;
  numeroDos: string;
};

export type BenchService = {
  id: string;
  serviceHotelId: string;
  serviceHotel: {
    id: string;
    service: string;
  };
};

export type BenchmarkingEntete = {
  id: string;
  numero: string;
  du: string;
  au: string;
  nuite: number;
  pays: string;
  ville: string;
  tauxPrixUnitaire: number;
  forfaitaireUnitaire: number;
  forfaitaireGlobal: number;
  montantCommission: number;
  benchService: BenchService[];
  benchmarkingLigne: Array<{
    id: string;
    hotel: string;
    plateforme: { id: string; code: string; nom: string; status: string };
    typeChambre: { id: string; type: string; capacite: number };
    nuiteDevise: number;
    nombreChambre: number;
    devise: string;
    tauxChange: number;
    nuiteAriary: number;
    montantDevise: number;
    montantAriary: number;
    isBenchMark: boolean;
  }>;
};

export type HotelProspectionEntete = {
  id: string;
  numeroEntete: string;
  prestationId: string;
  fournisseurId: string;
  isDevis: boolean;
  createdAt: string;
  prestation?: PrestationLight;
  fournisseur?: FournisseurLight;
  benchmarkingEntete: BenchmarkingEntete[];
};

export type BenchmarkingDetail = {
  id: string;
  numero: string;
  du: string;
  au: string;
  nuite: number;
  pays: string;
  ville: string;
  hotelProspectionEnteteId: string;
  tauxPrixUnitaire: number;
  forfaitaireUnitaire: number;
  forfaitaireGlobal: number;
  montantCommission: number;
  createdAt: string;
  updatedAt: string;
  hotelProspectionEntete?: {
    id: string;
    numeroEntete: string;
    isDevis: boolean;
  };
  benchmarkingLigne: Array<{
    id: string;
    hotel: string;
    plateforme: { id: string; code: string; nom: string; status: string };
    typeChambre: { id: string; type: string; capacite: number };
    nuiteDevise: number;
    nombreChambre: number;
    devise: string;
    tauxChange: number;
    nuiteAriary: number;
    montantDevise: number;
    montantAriary: number;
    isBenchMark: boolean;
  }>;
  benchService: Array<{
    id: string;
    serviceHotel: { id: string; service: string };
  }>;
};

// État pour le détail
type BenchmarkingDetailState = {
  detail: BenchmarkingDetail | null;
  loadingDetail: boolean;
  errorDetail: string | null;
};

type HotelProspectionState = {
  items: HotelProspectionEntete[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
};

const initialState: HotelProspectionState & BenchmarkingDetailState = {
  items: [],
  selectedId: null,
  loading: false,
  error: null,
  creating: false,
  detail: null,
  loadingDetail: false,
  errorDetail: null,
};

export const fetchHotelProspectionEntetes = createAsyncThunk(
  'hotelProspection/fetchEntetes',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/hotel/benchmarking/prestation/${prestationId}`);
      if (!response.data.success) throw new Error('Réponse invalide');
      return response.data.data as HotelProspectionEntete[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Dossier vide'
      );
    }
  }
);

// Thunk pour fetch détail
export const fetchBenchmarkingDetail = createAsyncThunk(
  'hotelProspection/fetchBenchmarkingDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/hotel/benchmarking/${id}`);
      if (!response.data.success) {
        throw new Error('Réponse invalide');
      }
      return response.data.data as BenchmarkingDetail;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur chargement détail benchmarking'
      );
    }
  }
);

type CreateEntetePayload = {
  prestationId: string;
  fournisseurId: string;
};

export const createHotelProspectionEntete = createAsyncThunk(
  'hotelProspection/createEntete',
  async (data: CreateEntetePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/hotel/prospection', data);
      if (!response.data.success) throw new Error('Échec création');
      return response.data.data as HotelProspectionEntete;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de l\'entête'
      );
    }
  }
);

// Thunk Creation BenchMarking
export const createBenchmarking = createAsyncThunk(
  'hotelProspection/createBenchmarking',
  async (data: CreateBenchmarkingPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/hotel/benchmarking', data);
      if (!response.data.success) {
        throw new Error('Échec création benchmarking');
      }
      return response.data.data; // on suppose que le serveur renvoie l'objet créé
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création du benchmarking'
      );
    }
  }
);

// Thunk Creation BenchMarking Ligne
export const createBenchmarkingLigne = createAsyncThunk(
  'benchmarking/createLigne',
  async (data: CreateBenchmarkingLignePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/hotel/benchmarking-ligne', data);
      if (!response.data.success) {
        throw new Error('Échec création ligne benchmarking');
      }
      return response.data.data; // ← idéalement l'objet créé
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de la ligne'
      );
    }
  }
);

export const setBenchmarkOfficial = createAsyncThunk(
  'benchmarking/setBenchmarkOfficial',
  async (benchmarkingId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/hotel/benchmarking/${benchmarkingId}/set-benchmark`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de la mise en benchmark');
      }
      
      // Le serveur peut renvoyer les données mises à jour ou rien
      return response.data.data || { id: benchmarkingId, success: true };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la validation du benchmark'
      );
    }
  }
);

export const sendBenchmarkingDevis = createAsyncThunk(
  'benchmarking/sendDevis',
  async (payload: SendDevisPayload, { rejectWithValue }) => {
    try {
      const { benchmarkingId, ...data } = payload;
      const response = await axios.post(`/hotel/benchmarking/${benchmarkingId}/client-booking`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de l\'envoi du devis');
      }
      
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'envoi du devis'
      );
    }
  }
);

// Générer le devis
export const genererDevis = createAsyncThunk(
  'benchmarking/genererDevis',
  async (benchmarkingId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/hotel/benchmarking/${benchmarkingId}/pdf-client`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de la génération du devis');
      }
      
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la génération du devis'
      );
    }
  }
);

// Envoyer le devis
export const envoyerDevis = createAsyncThunk(
  'benchmarking/envoyerDevis',
  async (benchmarkingId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/hotel/benchmarking/${benchmarkingId}/envoyer-devis`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de l\'envoi du devis');
      }
      
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'envoi du devis'
      );
    }
  }
);

// Approuver le devis
export const approuverDevis = createAsyncThunk(
  'benchmarking/approuverDevis',
  async (benchmarkingId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/hotel/benchmarking/${benchmarkingId}/approuver-devis`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de l\'approbation du devis');
      }
      
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'approbation du devis'
      );
    }
  }
);

// Générer PDF Direction
export const generatePdfDirection = createAsyncThunk(
  'benchmarking/generatePdfDirection',
  async (payload: GeneratePdfDirectionPayload, { rejectWithValue }) => {
    try {
      const { benchmarkingId, ...data } = payload;
      const response = await axios.put(`/hotel/benchmarking/${benchmarkingId}/pdf-direction`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de la génération du PDF direction');
      }
      
      return response.data.data; // Retourne le chemin du PDF
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la génération du PDF direction'
      );
    }
  }
);

export const createHotelEnteteFromBenchmarking = createAsyncThunk(
  'hotelReservation/createFromBenchmarking',
  async (
    payload: {
      totalGeneral: number;
      prospectionHotelId: string;
      benchmarkingEnteteIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(`/hotel/devis`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur création devis depuis benchmarking');
    }
  }
);

const hotelProspectionSlice = createSlice({
  name: 'hotelProspectionEntete',
  initialState,
  reducers: {
    // ← NOUVEAU
    setSelectedEntete: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    
    // optionnel : clear quand on quitte la page par ex.
    clearSelectedEntete: (state) => {
      state.selectedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchHotelProspectionEntetes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelProspectionEntetes.fulfilled, (state, action: PayloadAction<HotelProspectionEntete[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchHotelProspectionEntetes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createHotelProspectionEntete.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createHotelProspectionEntete.fulfilled, (state, action: PayloadAction<HotelProspectionEntete>) => {
        state.creating = false;
        state.items.unshift(action.payload); // on ajoute en premier
      })
      .addCase(createHotelProspectionEntete.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(createBenchmarking.pending, (state) => { state.loading = true; })
      .addCase(createBenchmarking.fulfilled, (state) => { state.loading = false; })
      .addCase(createBenchmarking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBenchmarkingDetail.pending, (state) => {
      state.loadingDetail = true;
      state.errorDetail = null;
      })
      .addCase(fetchBenchmarkingDetail.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.detail = action.payload;
      })
      .addCase(fetchBenchmarkingDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.errorDetail = action.payload as string;
      })
      .addCase(createBenchmarkingLigne.pending, (state) => {
        state.loadingDetail = true; // ou un loadingLigne séparé
      })
      .addCase(createBenchmarkingLigne.fulfilled, (state, action) => {
        state.loadingDetail = false;
        // Option A : re-fetch complet (plus simple et sûr)
        // → on le fera dans le composant
        // Option B : ajout optimiste (si le serveur renvoie l'objet)
        if (action.payload && state.detail) {
          state.detail.benchmarkingLigne.push(action.payload);
        }
      })
      .addCase(createBenchmarkingLigne.rejected, (state, action) => {
        state.loadingDetail = false;
        state.errorDetail = action.payload as string;
      })
      .addCase(setBenchmarkOfficial.pending, (state) => {
      state.loadingDetail = true; // ou un loading spécifique
      state.errorDetail = null;
    })
    .addCase(setBenchmarkOfficial.fulfilled, (state, action) => {
      state.loadingDetail = false;
      // Si le serveur renvoie le benchmarking mis à jour → on le remplace
      if (action.payload && state.detail && state.detail.id === action.payload.id) {
        state.detail = { ...state.detail, ...action.payload };
      }
    })
    .addCase(setBenchmarkOfficial.rejected, (state, action) => {
      state.loadingDetail = false;
      state.errorDetail = action.payload as string;
    })
    .addCase(sendBenchmarkingDevis.pending, (state) => {
      state.loadingDetail = true;
      state.errorDetail = null;
    })
    .addCase(sendBenchmarkingDevis.fulfilled, (state) => {
      state.loadingDetail = false;
    })
    .addCase(sendBenchmarkingDevis.rejected, (state, action) => {
      state.loadingDetail = false;
      state.errorDetail = action.payload as string;
    })
    .addCase(genererDevis.pending, (state) => {
      state.loadingDetail = true;
      state.errorDetail = null;
    })
    .addCase(genererDevis.fulfilled, (state) => {
      state.loadingDetail = false;
    })
    .addCase(genererDevis.rejected, (state, action) => {
      state.loadingDetail = false;
      state.errorDetail = action.payload as string;
    })
    .addCase(envoyerDevis.pending, (state) => {
      state.loadingDetail = true;
      state.errorDetail = null;
    })
    .addCase(envoyerDevis.fulfilled, (state) => {
      state.loadingDetail = false;
    })
    .addCase(envoyerDevis.rejected, (state, action) => {
      state.loadingDetail = false;
      state.errorDetail = action.payload as string;
    })
    .addCase(approuverDevis.pending, (state) => {
      state.loadingDetail = true;
      state.errorDetail = null;
    })
    .addCase(approuverDevis.fulfilled, (state) => {
      state.loadingDetail = false;
    })
    .addCase(approuverDevis.rejected, (state, action) => {
      state.loadingDetail = false;
      state.errorDetail = action.payload as string;
    })
    .addCase(generatePdfDirection.pending, (state) => {
      state.loadingDetail = true;
      state.errorDetail = null;
    })
    .addCase(generatePdfDirection.fulfilled, (state) => {
      state.loadingDetail = false;
    })
    .addCase(generatePdfDirection.rejected, (state, action) => {
      state.loadingDetail = false;
      state.errorDetail = action.payload as string;
    })
    .addCase(createHotelEnteteFromBenchmarking.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createHotelEnteteFromBenchmarking.fulfilled, (state) => {
      state.loading = false;
    })
    .addCase(createHotelEnteteFromBenchmarking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Selector pour l'entête sélectionné
export const selectSelectedEntete = (state: RootState) => {
  const selectedId = state.hotelProspectionEntete.selectedId;
  if (!selectedId) return null;
  
  return state.hotelProspectionEntete.items.find(
    (entete) => entete.benchmarkingEntete.some((b) => b.id === selectedId)
  );
};

// Selector pour le benchmarking lui-même (plus précis)
export const selectSelectedBenchmarking = (state: RootState) => {
  const selectedId = state.hotelProspectionEntete.selectedId;
  if (!selectedId) return null;

  for (const entete of state.hotelProspectionEntete.items) {
    const bench = entete.benchmarkingEntete.find((b) => b.id === selectedId);
    if (bench) return bench;
  }
  return null;
};

export const { setSelectedEntete, clearSelectedEntete } = hotelProspectionSlice.actions;

export default hotelProspectionSlice.reducer;