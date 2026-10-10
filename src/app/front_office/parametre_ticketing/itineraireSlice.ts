// src/app/front_office/parametre_ticketing/itineraireSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export interface ItineraireRef {
  id: string;
  pays: string;
}

export interface VilleRef {
  id: string;
  code: string;
  ville: string;
}

export interface Itineraire {
  id: string;
  odooId: number | null;
  code: string;
  libelle: string;
  paysDepartId: string;
  paysDepart: ItineraireRef;
  villeDepartId: string;
  villeDepart: VilleRef;
  paysArriveeId: string;
  paysArrivee: ItineraireRef;
  villeArriveeId: string;
  villeArrivee: VilleRef;
  statut: 'ACTIF' | 'INACTIF';
  createdAt: string;
  updatedAt: string;
}

export interface ItineraireMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchItinerairesParams {
  page?: number;
  limit?: number;
  search?: string;
  statut?: 'ACTIF' | 'INACTIF' | '';
  paysDepartId?: string;
  villeDepartId?: string;
  paysArriveeId?: string;
  villeArriveeId?: string;
}

export interface ItinerairePayload {
  villeDepartId: string;
  villeArriveeId: string;
  libelle?: string;
  statut?: 'ACTIF' | 'INACTIF';
}

interface ItineraireState {
  items: Itineraire[];
  meta: ItineraireMeta;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  // Villes par pays, mises en cache pour les sélecteurs départ/arrivée indépendants du
  // formulaire (toutes les villes du pays, pas seulement celles ayant déjà un itinéraire).
  villesByPaysId: Record<string, VilleRef[]>;
  villesLoading: boolean;
}

const initialState: ItineraireState = {
  items: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
  villesByPaysId: {},
  villesLoading: false,
};

export const fetchItineraires = createAsyncThunk(
  'itineraire/fetchItineraires',
  async (params: FetchItinerairesParams = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/itineraire', { params });
      if (!response.data?.success) {
        return rejectWithValue('Échec de récupération des itinéraires');
      }
      // Comme les autres listes paginées de l'app (voir fetchClientBeneficiairesPaginated) :
      // response.data.data = { data: Itineraire[], meta: ItineraireMeta }
      const payload = response.data.data;
      return { data: (payload.data ?? []) as Itineraire[], meta: payload.meta as ItineraireMeta };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement des itinéraires');
    }
  }
);

export const fetchVillesByPays = createAsyncThunk(
  'itineraire/fetchVillesByPays',
  async (paysId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/exigence-destination/destination/pays/${paysId}`);
      return { paysId, villes: (response.data?.data ?? []) as VilleRef[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement des villes');
    }
  }
);

export const createItineraire = createAsyncThunk<Itineraire, ItinerairePayload, { rejectValue: string }>(
  'itineraire/createItineraire',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/itineraire', payload);
      return response.data.data as Itineraire;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Erreur lors de la création de l'itinéraire");
    }
  }
);

export const updateItineraire = createAsyncThunk<
  Itineraire,
  { id: string } & Partial<ItinerairePayload>,
  { rejectValue: string }
>('itineraire/updateItineraire', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`/itineraire/${id}`, payload);
    return response.data.data as Itineraire;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Erreur lors de la modification de l'itinéraire");
  }
});

export const deleteItineraire = createAsyncThunk<string, string, { rejectValue: string }>(
  'itineraire/deleteItineraire',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/itineraire/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Erreur lors de la suppression de l'itinéraire");
    }
  }
);

const itineraireSlice = createSlice({
  name: 'itineraire',
  initialState,
  reducers: {
    clearItineraireError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItineraires.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItineraires.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload.data) ? action.payload.data : [];
        state.meta = action.payload.meta ?? initialState.meta;
      })
      .addCase(fetchItineraires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchVillesByPays.pending, (state) => {
        state.villesLoading = true;
      })
      .addCase(fetchVillesByPays.fulfilled, (state, action) => {
        state.villesLoading = false;
        state.villesByPaysId[action.payload.paysId] = action.payload.villes;
      })
      .addCase(fetchVillesByPays.rejected, (state) => {
        state.villesLoading = false;
      })

      .addCase(createItineraire.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createItineraire.fulfilled, (state) => {
        state.creating = false;
        // La liste paginée est re-fetchée par l'appelant après succès plutôt que mise à
        // jour localement ici — plus simple à garder cohérent avec tri/filtres serveur.
      })
      .addCase(createItineraire.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })

      .addCase(updateItineraire.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateItineraire.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateItineraire.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })

      .addCase(deleteItineraire.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteItineraire.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteItineraire.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearItineraireError } = itineraireSlice.actions;
export default itineraireSlice.reducer;
