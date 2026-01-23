import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export type TypeVol = 'NATIONAL' | 'REGIONAL' | 'LONG_COURRIER';

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  status: string;
}

export interface Devis {
  id: string;
  numeroVol: string;
  fournisseurId: string;
  prestationId: string;
  status: string;               // ex: "CREER"
  avion: string;
  itineraire: string;           // ex: "TANA - DUBAI"
  classe: string;               // "PREMIUM", "ECONOMIE", etc.
  typePassager: string;         // "ENFANT", "ADULTE"
  dateHeureDepart: string;      // ISO string
  dateHeureArrive: string;
  dureeVol: string;             // "12h00"
  dureeEscale: string;          // "2h00"
  conditionModif: string;
  conditionAnnul: string;
  puBilletCompagnieDevise: number;
  puServiceCompagnieDevise: number;
  puPenaliteCompagnieDevise: number;
  devise: string;               // "EUR"
  tauxEchange: number;
  puBilletCompagnieAriary: number;
  puServiceCompagnieAriary: number;
  puPenaliteCompagnieAriary: number;
  montantBilletCompagnieDevise: number,
  montantServiceCompagnieDevise: number,
  montantPenaliteCompagnieDevise: number,
  montantBilletCompagnieAriary: number,
  montantServiceCompagnieAriary: number,
  montantPenaliteCompagnieAriary: number,
  montantBilletClientDevise: number,
  montantServiceClientDevise: number,
  montantPenaliteClientDevise: number,
  montantBilletClientAriary: number,
  montantServiceClientAriary: number,
  montantPenaliteClientAriary: number,
  commissionEnDevise: number;
  commissionEnAriary: number;
  dateDevis: string;
  referenceDevis: string;
  typeVol: string;
  numeroDosRef: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  fournisseur?: Fournisseur;
}

export interface Entete {
  id: string;
  prestationId: string;
  typeVol: TypeVol;
  commissionPropose: number;
  commissionAppliquer: number;
  createdAt: string;
  updatedAt: string;
}

export interface DevisParType {
  data: Devis[];
  entete: Entete | null;
}

interface DevisState {
  byType: Record<TypeVol, DevisParType | null>;
  loading: boolean;
  error: string | null;
}

const initialState: DevisState = {
  byType: {
    NATIONAL: null,
    REGIONAL: null,
    LONG_COURRIER: null,
  },
  loading: false,
  error: null,
};

// Thunk
export const fetchDevisByPrestation = createAsyncThunk(
  'devisPrestation/fetchByPrestation',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/devis/prestation/${prestationId}`);
      if (!response.data.success) {
        return rejectWithValue('Erreur lors de la récupération des devis');
      }
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur réseau');
    }
  }
);

// -----------------------------------------------------------------
// Mise à jour de commissionAppliquer (PATCH /devis/prestation/{id}/commission)
// -----------------------------------------------------------------
export const updateCommissionAppliquee = createAsyncThunk(
  'devisPrestation/updateCommissionAppliquee',
  async (
    {
      enteteId,
      commissionAppliquer,
    }: { enteteId: string; commissionAppliquer: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.patch(
        `/devis/prestation/${enteteId}/commission`,
        { commissionAppliquer }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Échec de la mise à jour');
      }

      // On retourne l'enteteId pour pouvoir recharger seulement ce type après
      // (mais ici on recharge tout pour simplicité)
      return { enteteId, commissionAppliquer };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la mise à jour de la commission'
      );
    }
  }
);

const devisPrestationSlice = createSlice({
  name: 'devisPrestation',
  initialState,
  reducers: {
    clearDevis: (state) => {
      state.byType = { NATIONAL: null, REGIONAL: null, LONG_COURRIER: null };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch existant
      .addCase(fetchDevisByPrestation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevisByPrestation.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.byType = {
          NATIONAL: action.payload.NATIONAL || null,
          REGIONAL: action.payload.REGIONAL || null,
          LONG_COURRIER: action.payload.LONG_COURRIER || null,
        };
      })
      .addCase(fetchDevisByPrestation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── NOUVEAU ── update commission
      .addCase(updateCommissionAppliquee.pending, (state) => {
        state.loading = true;           // ou créer un loading spécifique si tu veux
        state.error = null;
      })
      .addCase(updateCommissionAppliquee.fulfilled, (state, action) => {
        state.loading = false;

        // Option 1 – la plus simple (recommandée au début) : on recharge tout
        // → dispatch(fetchDevisByPrestation(prestationId)) depuis le composant

        // Option 2 – mise à jour optimiste / locale (plus fluide mais plus risquée)
        const { enteteId, commissionAppliquer } = action.payload;

        // On cherche dans quel type se trouve cet entete
        (['NATIONAL', 'REGIONAL', 'LONG_COURRIER'] as TypeVol[]).forEach((type) => {
          const section = state.byType[type];
          if (section?.entete?.id === enteteId) {
            if (section.entete) {
              section.entete.commissionAppliquer = commissionAppliquer;

              // Option : recalculer les commissions des devis ici si tu veux update optimiste
              // section.data = section.data.map(d => ({
              //   ...d,
              //   commissionEnDevise: ... nouvelle logique ...
              // }));
            }
          }
        });
      })
      .addCase(updateCommissionAppliquee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDevis } = devisPrestationSlice.actions;
export default devisPrestationSlice.reducer;