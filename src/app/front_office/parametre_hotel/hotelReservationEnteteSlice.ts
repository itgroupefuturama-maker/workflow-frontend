// src/app/front_office/parametre_hotel/hotelReservationEnteteSlice.ts
// (ou dans un dossier plus logique selon ton naming)

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios'; // ton instance axios

export interface CreateHotelReservationPayload {
  hotelLigneId: string;
  numeroResa: string;
  puResaNuiteHotelDevise: number;
  resaTauxChange: number;
  puResaNuiteHotelAriary: number;
  puResaMontantDevise: number;
  puResaMontantAriary: number;
  pourcentageCommission: number;
  commissionUnitaire: number;
  passagers: Array<{
    clientbeneficiaireInfoId: string;
    clientBeneficiaireId: string;
    servicePreferenceIds: string[];
  }>;
  objet?: string;
  moment?: string;
  googleAccountId?: string;
}

// Dans hotelReservationEnteteSlice.ts — remplacer HotelLigne et HotelReservationEntete

export interface DeviseHotel {
  id: string;
  deviseId: string;
  nuiteDevise: number;
  nuiteAriary: number;
  montantDevise: number;
  montantAriary: number;
  tauxChange: number;
  devise: { id: string; devise: string; status: string };
}

export interface BenchService {
  id: string;
  serviceSpecifiqueId: string;
  serviceSpecifique: {
    id: string;
    code: string;
    libelle: string;
    typeService: string;
  };
}

export interface BenchmarkingEntete {
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
  dateLimitePaiement: string | null;
  benchService: BenchService[];
}

export interface BenchmarkingLigne {
  id: string;
  hotel: string;
  nombreChambre: number;
  isRefundable: boolean;
  dateLimiteAnnulation: string | null;
  plateforme: { id: string; code: string; nom: string };
  typeChambre: { id: string; type: string; capacite: number };
  deviseHotel: DeviseHotel[];
  benchmarkingEntete: BenchmarkingEntete;
}

// Dans hotelReservationEnteteSlice.ts — remplacer HotelPassager

export interface HotelPassager {
  id: string;
  clientbeneficiaireInfoId: string;
  clientbeneficiaireId: string | null;       // ← null dans la vraie réponse
  entityLineId: string;
  entity: string;
  servicePreference: string[];               // ← tableau de labels string, pas d'objets
  createdAt: string;
  updatedAt: string;
  // ← clé en minuscules comme dans la vraie réponse API
  clientbeneficiaireInfo?: {
    id: string;
    nom: string;
    prenom: string;
    nationalite: string;
    referenceDoc: string;
    typeDoc: string;
    dateDelivranceDoc: string;
    dateValiditeDoc: string;
    clientType: string | null;
    tel: string | null;
    whatsapp: string | null;
  };
}

export interface HotelLigne {
  id: string;
  HotelEnteteId: string;
  benchmarkingLigneId: string;
  referenceLine: string;
  numeroResa: string | null;
  statut: string;
  statusLigne: string;
  puResaMontantAriary: number;
  commissionUnitaire: number;
  puResaNuiteHotelDevise: number;
  resaTauxChange: number;
  puResaNuiteHotelAriary: number;
  puResaMontantDevise: number;
  pourcentageCommission: number;
  puConfPrixNuitHotelAriary: number;
  puConfMontantNuitHotelAriary: number;
  puConfPrixNuitClientArary: number;
  puConfMontantNuitClientAriary: number;
  confirmationCommissionAriary: number;
  passagers: HotelPassager[];
  BenchmarkingLigne: BenchmarkingLigne;
}

export interface HotelReservationEntete {
  id: string;
  statut: string;
  totalHotel: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
  HotelProspectionEntete: {
    numeroEntete: string;
    fournisseur: { code: string; libelle: string };
    prestation: { numeroDos: string };
  };
  hotelLigne: HotelLigne[];
}

interface State {
  items: HotelReservationEntete[];
  selectedDetail: HotelReservationEntete | null;
  loading: boolean;
  error: string | null;
  detailLoading: boolean;
  detailError: string | null;
}

const initialState: State = {
  items: [],
  selectedDetail: null,
  loading: false,
  error: null,
  detailLoading: false,
  detailError: null,
};

export const fetchHotelReservations = createAsyncThunk(
  'hotelReservation/fetchEntetes',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/hotel/entete/prestation/${prestationId}`); // ← adapte si query différente
      return res.data.data; // on prend le tableau data[]
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement résas hôtel');
    }
  }
);

export const fetchHotelReservationDetail = createAsyncThunk(
  'hotelReservation/fetchDetail',
  async (enteteId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/hotel/entete/${enteteId}`);
      // L'API retourne directement un objet, pas un tableau
      return res.data.data;  // ✅ Pas besoin de [0]
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement détail réservation');
    }
  }
);

export const createHotelReservation = createAsyncThunk(
  'hotelReservation/createReservation',
  async (
    { ligneId, payload }: { ligneId: string; payload: CreateHotelReservationPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.patch(`/hotel/ligne/${ligneId}/reservation`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur création réservation');
    }
  }
);

export const approuverHotelReservation = createAsyncThunk(
  'hotelReservation/approuver',
  async (
    { id, totalHotel, totalCommission }: { id: string; totalHotel: number; totalCommission: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`/hotel/${id}/bc-a-approuver`, {
        totalHotel,
        totalCommission,
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur approbation réservation');
    }
  }
);

export const confirmerHotelLigne = createAsyncThunk(
  'hotelReservation/confirmerLigne',
  async (
    {
      ligneId,
      payload,
    }: {
      ligneId: string;
      payload: {
        hotelLigneId: string;
        tauxConfirmation: number;
        puConfPrixNuitHotelAriary: number;
        puConfMontantNuitHotelAriary: number;
        puConfPrixNuitClientArary: number;
        puConfMontantNuitClientAriary: number;
        confirmationCommissionAriary: number;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.patch(`/hotel/ligne/${ligneId}/confirmation`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur confirmation ligne');
    }
  }
);

export const emissionBilletHotel = createAsyncThunk(
  'hotelReservation/emissionBillet',
  async (
    {
      id,
      payload,
    }: {
      id: string;
      payload: {
        referenceBcClient: string;
        totalHotel: number;
        totalCommission: number;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`/hotel/${id}/emission-billet-hotel`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur émission billet');
    }
  }
);

export const emissionFactureHotel = createAsyncThunk(
  'hotelReservation/emissionFacture',
  async (
    {
      id,
      payload,
    }: {
      id: string;
      payload: { referenceFacClient: string };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`/hotel/${id}/emission-facture-hotel`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur émission facture');
    }
  }
);

export const reglerFactureHotel = createAsyncThunk(
  'hotelReservation/reglerFacture',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/hotel/${id}/regler-facture`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur règlement facture');
    }
  }
);

export const annulerHotelEntete = createAsyncThunk(
  'hotelReservation/annuler',
  async (
    {
      id,
      payload,
    }: {
      id: string;
      payload: {
        rasionAnnulationId: string;
        conditionAnnul: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.delete(`/hotel/entete/${id}/annuler`, { data: payload });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur annulation');
    }
  }
);

const slice = createSlice({
  name: 'hotelReservationEntete',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchHotelReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHotelReservationDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchHotelReservationDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDetail = action.payload;
      })
      .addCase(fetchHotelReservationDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(approuverHotelReservation.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(approuverHotelReservation.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDetail = action.payload;
      })
      .addCase(approuverHotelReservation.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(confirmerHotelLigne.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(confirmerHotelLigne.fulfilled, (state, action) => {
        state.detailLoading = false;
      })
      .addCase(confirmerHotelLigne.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      // Emission Billet
      .addCase(emissionBilletHotel.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(emissionBilletHotel.fulfilled, (state) => {
        state.detailLoading = false;
      })
      .addCase(emissionBilletHotel.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      // Emission Facture
      .addCase(emissionFactureHotel.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(emissionFactureHotel.fulfilled, (state) => {
        state.detailLoading = false;
      })
      .addCase(emissionFactureHotel.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      // Régler Facture
      .addCase(reglerFactureHotel.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(reglerFactureHotel.fulfilled, (state) => {
        state.detailLoading = false;
      })
      .addCase(reglerFactureHotel.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(annulerHotelEntete.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(annulerHotelEntete.fulfilled, (state) => {
        state.detailLoading = false;
      })
      .addCase(annulerHotelEntete.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      });
  },
});

export default slice.reducer;