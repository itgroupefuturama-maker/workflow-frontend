import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios'; // ton instance axios configurée

export interface AttestationSuivi {
  id: string;
  evolution: string;           // ex: "DEVIS"
  entity: string;              // ex: "DEVISMODULE"
  statut: string;              // ex: "CREER"
  origineLigne: string | null;
  dateEnvoieDevis: string | null;
  dateApprobation: string | null;
  referenceBcClient: string | null;
  dateCreationBc: string | null;
  dateSoumisBc: string | null;
  dateApprobationBc: string | null;
  referenceFacClient: string | null;
  dateCreationFac: string | null;
  dateReglement: string | null;
  dateAnnulation: string | null;
  dateModification: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttestationEnteteDto {
  prestationId: string;
  fournisseurId: string;
}

export interface FournisseurMini {
  id: string;
  code: string;
  libelle: string;
  status: string;
}

export interface PrestationMini {
  id: string;
  numeroDos: string;
  status: string;
}

export interface AttestationLigne {
  id: string;
  numeroDosRef: string;
  numeroVol: string;
  avion: string;
  itineraire: string;
  departId: string;
  destinationId: string;
  classe: string;
  typePassager: string;
  dateHeureDepart: string;
  dateHeureArrive: string;
  dureeVol: string;
  dureeEscale: string;
  puAriary: number;
  numeroReservation: string;
  attestationEnteteId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  destinationVoyage?: { id: string; code: string; ville: string; /* ... */ };
  attestationPassager?: Array<{
    id: string;
    clientbeneficiaireInfoId: string;
    clientbeneficiaireInfo: ClientBeneficiaireInfo;
  }>;
}

export interface ClientBeneficiaireInfo {
  id: string;
  nom: string;
  prenom: string;
  nationalite: string;
  typeDoc: string;
  referenceDoc: string;
  dateDelivranceDoc: string;
  statut: string;
}

export interface AttestationEntete {
  id: string;
  prestationId: string;
  numeroEntete: string;
  fournisseurId: string;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
  prestation: PrestationMini;
  fournisseur: FournisseurMini;
  attestationLigne: AttestationLigne[];
  devisModules?: {
    id: string;
    reference: string;
    totalGeneral: number;
    statut: string;
    entity: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DevisDetailResponse {
  clientBeneficiaire: ClientBeneficiaireInfo & {
    // tous les autres champs que tu as vus dans l'exemple de réponse
    document?: string;
    referenceCin?: string;
    cin?: string;
    // etc.
  };
  attestationEntete: {
    id: string;
    numeroEntete: string;
    fournisseurId: string;
    totalCommission: number;
    prestation: PrestationMini;
    fournisseur: FournisseurMini;
  };
  devisModule: {
    id: string;
    reference: string;
    totalGeneral: number;
    statut: string;
    entity: string;
    entityId: string;
    createdAt: string;
    updatedAt: string;
    // url1, url2, etc. si tu les utilises plus tard
  };
  lignes: Array<{
    id: string;
    numeroVol: string;
    avion: string;
    itineraire: string;
    classe: string;
    puAriary: number;
    // ... autres champs utiles
  }>;
}

interface AttestationEnteteState {
  items: AttestationEntete[];
  selectedId: string | null;
  selectedDetail: AttestationEntete | null;
  selectedSuivi: AttestationSuivi | null;
  selectedDevisDetail: DevisDetailResponse | null;   // ← NOUVEAU
  loading: boolean;
  error: string | null;
}

const initialState: AttestationEnteteState = {
  items: [],
  selectedId: null,
  selectedDetail: null,
  selectedSuivi: null,
  selectedDevisDetail: null,   // ← NOUVEAU
  loading: false,
  error: null,
};

export const fetchAttestationEntetes = createAsyncThunk(
  'attestationEntete/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/attestation/entete`);
      if (!response.data.success) {
        throw new Error('Réponse serveur invalide');
      }
      return response.data.data as AttestationEntete[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des entêtes');
    }
  }
);

// Thunk de création
export const createAttestationEntete = createAsyncThunk(
  'attestationEntete/create',
  async (data: CreateAttestationEnteteDto, { rejectWithValue }) => {
    try {
      const response = await axios.post('/attestation/entete', data);
      
      if (!response.data.success) {
        throw new Error('Échec de la création');
      }
      
      // On retourne l'entête créée (pour l'ajouter directement à la liste si tu veux)
      return response.data.data as AttestationEntete;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de l\'entête'
      );
    }
  }
);

// ─── Créer une ligne ────────────────────────────────────────────────
export const createAttestationLigne = createAsyncThunk<
  AttestationLigne,
  {
    attestationEnteteId: string;
    numeroVol: string;
    avion: string;
    itineraire: string;
    departId: string;
    destinationId: string;
    classe: string;
    typePassager: string;
    dateHeureDepart: string;
    dateHeureArrive: string;
    dureeVol: string;
    dureeEscale: string;
    puAriary: number;
    numeroReservation: string;
    passagerIds: string[];
  },
  { rejectValue: string }
>(
  'attestationLigne/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/attestation/ligne', payload);
      if (!response.data.success) {
        throw new Error('Échec création ligne');
      }
      return response.data.data as AttestationLigne;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur création ligne attestation');
    }
  }
);

// ─── Récupérer entête détaillée avec lignes + devis ──────────────────────
export const fetchAttestationEnteteDetail = createAsyncThunk<
  AttestationEntete,
  string, // enteteId
  { rejectValue: string }
>(
  'attestationEntete/fetchDetailWithDevis',
  async (enteteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/attestation/entete/${enteteId}/with-devis`);
      if (!response.data.success) {
        throw new Error('Entête non trouvée');
      }
      return response.data.data as AttestationEntete;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement détail entête');
    }
  }
);

export const fetchAttestationSuivi = createAsyncThunk<
  AttestationSuivi,
  string, // enteteId
  { rejectValue: string }
>(
  'attestationEntete/fetchSuivi',
  async (enteteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/attestation/entete/${enteteId}/suivi`);
      if (!response.data.success) {
        throw new Error('Suivi non trouvé');
      }
      return response.data.data as AttestationSuivi;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement du suivi'
      );
    }
  }
);

// Action 1 : Devis à approuver
export const patchDevisAMettreAApprouver = createAsyncThunk<
  void,
  { devisModuleId: string; suiviId: string },
  { rejectValue: string }
>(
  'attestationEntete/patchDevisAMettreAApprouver',
  async ({ devisModuleId, suiviId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/devis-module/${devisModuleId}/devis-a-approuver`, { suiviId });
      if (!response.data.success) throw new Error('Échec');
      return;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur');
    }
  }
);

// Action 2 : Devis approuvé
export const patchDevisApprouve = createAsyncThunk<
  void,
  { devisModuleId: string; suiviId: string },
  { rejectValue: string }
>(
  'attestationEntete/patchDevisApprouve',
  async ({ devisModuleId, suiviId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/devis-module/${devisModuleId}/devis-approuve`, { suiviId });
      if (!response.data.success) throw new Error('Échec');
      return;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur');
    }
  }
);

// Action 3 : BC à approuver
export const patchBcClientAMettreAApprouver = createAsyncThunk<
  void,
  { devisModuleId: string; suiviId: string },
  { rejectValue: string }
>(
  'attestationEntete/patchBcClientAMettreAApprouver',
  async ({ devisModuleId, suiviId }, { rejectWithValue }) => {
    try {
      await axios.patch(`/devis-module/${devisModuleId}/bc-client-a-approuver`, { suiviId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur');
    }
  }
);

// Action 4 : Billet émis (avec référence BC)
export const patchBilletEmis = createAsyncThunk<
  void,
  { devisModuleId: string; suiviId: string; referenceBcClient: string },
  { rejectValue: string }
>(
  'attestationEntete/patchBilletEmis',
  async ({ devisModuleId, suiviId, referenceBcClient }, { rejectWithValue }) => {
    try {
      await axios.patch(`/devis-module/${devisModuleId}/billet-emis`, {
        suiviId,
        referenceBcClient,
      });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur');
    }
  }
);

// Action 5 : Facture émise (avec référence facture)
export const patchFactureEmise = createAsyncThunk<
  void,
  { devisModuleId: string; suiviId: string; referenceFacClient: string },
  { rejectValue: string }
>(
  'attestationEntete/patchFactureEmise',
  async ({ devisModuleId, suiviId, referenceFacClient }, { rejectWithValue }) => {
    try {
      await axios.patch(`/devis-module/${devisModuleId}/facture-emise`, {
        suiviId,
        referenceFacClient,
      });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur');
    }
  }
);

// Action 6 : Facture réglée
export const patchFactureReglee = createAsyncThunk<
  void,
  { devisModuleId: string; suiviId: string },
  { rejectValue: string }
>(
  'attestationEntete/patchFactureReglee',
  async ({ devisModuleId, suiviId }, { rejectWithValue }) => {
    try {
      await axios.patch(`/devis-module/${devisModuleId}/facture-reglee`, { suiviId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur');
    }
  }
);

export const fetchDevisForPassenger = createAsyncThunk<
  DevisDetailResponse,
  { clientBeneficiaireInfoId: string; attestationEnteteId: string },
  { rejectValue: string }
>(
  'attestationEntete/fetchDevisForPassenger',
  async ({ clientBeneficiaireInfoId, attestationEnteteId }, { rejectWithValue }) => {
    try {
      // ─── AJOUT DE LOGS ICI ────────────────────────────────────────
      console.log('fetchDevisForPassenger → Début appel API');
      console.log('clientBeneficiaireInfoId =', clientBeneficiaireInfoId);
      console.log('attestationEnteteId     =', attestationEnteteId);
      console.log('URL générée              =', `/attestation/list/${clientBeneficiaireInfoId}/${attestationEnteteId}`);

      if (!clientBeneficiaireInfoId || !attestationEnteteId) {
        console.error('ID manquant !', { clientBeneficiaireInfoId, attestationEnteteId });
        throw new Error('ID du bénéficiaire ou de l’entête manquant');
      }

      const response = await axios.get(
        `/attestation/list/${clientBeneficiaireInfoId}/${attestationEnteteId}`
      );

      console.log('Réponse brute API :', response.status, response.data);

      if (!response.data?.success) {
        console.warn('API a répondu success: false', response.data);
        throw new Error(response.data?.message || 'Réponse non successful');
      }

      return response.data.data as DevisDetailResponse;
    } catch (err: any) {
      console.error('Erreur complète lors de fetchDevisForPassenger :', err);

      // Log plus détaillé si c'est une erreur axios
      if (err.response) {
        console.error('Erreur réponse serveur :', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        });
      } else if (err.request) {
        console.error('Pas de réponse reçue (request existe) :', err.request);
      } else {
        console.error('Erreur de configuration axios :', err.message);
      }

      return rejectWithValue(
        err.response?.data?.message ||
        err.message ||
        'Erreur inconnue lors du chargement du devis'
      );
    }
  }
);

const attestationEnteteSlice = createSlice({
  name: 'attestationEntete',
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
      .addCase(fetchAttestationEntetes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttestationEntetes.fulfilled, (state, action: PayloadAction<AttestationEntete[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAttestationEntetes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAttestationEntete.pending, (state) => {
      state.loading = true;
      state.error = null;
      })
      .addCase(createAttestationEntete.fulfilled, (state, action: PayloadAction<AttestationEntete>) => {
        state.loading = false;
        // Option 1 : ajouter directement à la liste (recommandé si la réponse contient l'objet créé)
        state.items.unshift(action.payload); // ou .push() selon l'ordre voulu
        // Option 2 : ne rien faire ici et recharger fetchAttestationEntetes() après (voir plus bas)
      })
      .addCase(createAttestationEntete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAttestationLigne.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createAttestationLigne.fulfilled, (state, action) => {
      state.loading = false;
      // On ne met pas à jour ici → on recharge le détail complet après
    })
    .addCase(createAttestationLigne.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })

    .addCase(fetchAttestationEnteteDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchAttestationEnteteDetail.fulfilled, (state, action) => {
      state.loading = false;
      // On peut stocker le détail dans un champ dédié
      state.selectedDetail = action.payload;
    })
    .addCase(fetchAttestationEnteteDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    .addCase(fetchAttestationSuivi.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchAttestationSuivi.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSuivi = action.payload;
    })
    .addCase(fetchAttestationSuivi.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    .addCase(fetchDevisForPassenger.pending, (state) => {
      state.loading = true;
      state.error = null;
      // Option : state.selectedDevisDetail = null;   ← si tu veux reset à chaque nouvel appel
    })
    .addCase(fetchDevisForPassenger.fulfilled, (state, action: PayloadAction<DevisDetailResponse>) => {
      state.loading = false;
      state.selectedDevisDetail = action.payload;
    })
    .addCase(fetchDevisForPassenger.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.selectedDevisDetail = null;
    });
  },
});

export const { setSelectedEntete, clearSelectedEntete } = attestationEnteteSlice.actions;

export default attestationEnteteSlice.reducer;