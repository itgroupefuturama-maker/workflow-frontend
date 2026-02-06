import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

export interface AnnulationBilletPayload {
  tauxChange: number;
  resaCommissionEnDevise: number;
  resaCommissionEnAriary: number;
  emissionCommissionEnDevise: number;
  emissionCommissionEnAriary: number;
  rasionAnnulationId: string;     // ← CHANGEMENT ici
  type: string;                   // "SIMPLE" | "COM" | "PEN" | "COM_PEN" ?
  lignes: {
    id: string;
    puResaPenaliteCompagnieDevise: number;
    puResaMontantPenaliteCompagnieDevise: number;
    conditionAnnul: string;
  }[];
}

export interface AnnulationEmissionPayload {
  raisonAnnul: string;
  lignes: {
    id: string;
    puResaPenaliteCompagnieDevise: number;
    puResaMontantPenaliteCompagnieDevise: number;
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

// ────────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────────
export interface ReservationPayload {
  nombre: number;
  clientbeneficiaireInfoId: string;                    // ← NOUVEAU et obligatoire
  reservation: string;
  puResaBilletCompagnieDevise: number;
  puResaServiceCompagnieDevise: number;
  puResaPenaliteCompagnieDevise: number;
  devise: string;
  resaTauxEchange: number;
  puResaMontantBilletCompagnieDevise: number;         // calculé ou saisi
  puResaMontantServiceCompagnieDevise: number;
  puResaMontantPenaliteCompagnieDevise: number;
  // Optionnels / calculés côté front ou back selon besoin
  puResaBilletClientDevise?: number;
  puResaServiceClientDevise?: number;
  puResaPenaliteClientDevise?: number;
  puResaMontantBilletClientDevise?: number;
  puResaMontantServiceClientDevise?: number;
  puResaMontantPenaliteClientDevise?: number;
  conditionModif?: string | null;
  conditionAnnul?: string | null;
  raisonAnnul?: string | null;
}

export interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  dateApplication: string;
  status: string;
  dateActivation: string;
  dateDesactivation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prestation {
  id: string;
  numeroDos: string;
  status: string;
  dossierCommunColabId: string;
  dossierId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectionEntete {
  id: string;
  prestationId: string;
  numeroEntete: string;
  fournisseurId: string;
  credit: string;
  typeVol: string;
  commissionPropose: number;
  commissionAppliquer: number;
  createdAt: string;
  updatedAt: string;
  prestation: Prestation;
  fournisseur: Fournisseur;
}

export interface ProspectionLigne {
  id: string;
  numeroDosRef: string;
  numeroVol: string | null;
  prospectionEnteteId: string;
  status: string;
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
  conditionModif: string | null;
  conditionAnnul: string | null;
  puBilletCompagnieDevise: number;
  puServiceCompagnieDevise: number;
  puPenaliteCompagnieDevise: number;
  devise: string;
  tauxEchange: number;
  puBilletCompagnieAriary: number;
  puServiceCompagnieAriary: number;
  puPenaliteCompagnieAriary: number;
  montantBilletCompagnieDevise: number;
  montantServiceCompagnieDevise: number;
  montantPenaliteCompagnieDevise: number;
  montantBilletCompagnieAriary: number;
  montantServiceCompagnieAriary: number;
  montantPenaliteCompagnieAriary: number;
  montantBilletClientDevise: number;
  montantServiceClientDevise: number;
  montantPenaliteClientDevise: number;
  montantBilletClientAriary: number;
  montantServiceClientAriary: number;
  montantPenaliteClientAriary: number;
  commissionEnDevise: number;
  commissionEnAriary: number;
  dateDevis: string;
  devisId: string;
  createdAt: string;
  updatedAt: string;
  serviceProspectionLigne: ServiceProspectionLigne[];
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

export interface BilletLigne {
  id: string;
  statut: string;
  origineLine: string | null;
  prospectionLigneId: string;
  billetEnteteId: string;
  nombre: number;
  reservation: string | null;
  puResaBilletCompagnieDevise?: number;
  puResaServiceCompagnieDevise?: number;
  puResaPenaliteCompagnieDevise?: number;
  devise?: string;
  resaTauxEchange?: number;
  puResaBilletCompagnieAriary?: number;
  puResaServiceCompagnieAriary?: number;
  puResaPenaliteCompagnieAriary?: number;
  puResaBilletClientDevise?: number;
  puResaServiceClientDevise?: number;
  puResaPenaliteClientDevise?: number;
  puResaBilletClientAriary?: number;
  puResaServiceClientAriary?: number;
  puResaPenaliteClientAriary?: number;
  conditionModif?: string | null;
  conditionAnnul?: string | null;
  raisonAnnul?: string | null;
  puResaMontantBilletCompagnieDevise?: number;
  puResaMontantServiceCompagnieDevise?: number;
  puResaMontantPenaliteCompagnieDevise?: number;
  puResaMontantBilletCompagnieAriary?: number;
  puResaMontantServiceCompagnieAriary?: number;
  puResaMontantPenaliteCompagnieAriary?: number;
  puResaMontantBilletClientDevise?: number;
  puResaMontantServiceClientDevise?: number;
  puResaMontantPenaliteClientDevise?: number;
  puResaMontantBilletClientAriary?: number;
  puResaMontantServiceClientAriary?: number;
  puResaMontantPenaliteClientAriary?: number;
  resaCommissionEnDevise?: number;
  resaCommissionEnAriary?: number;
  emissionTauxChange?: number;
  puEmissionBilletCompagnieAriary?: number;
  puEmissionServiceCompagnieAriary?: number;
  puEmissionPenaliteCompagnieAriary?: number;
  puEmissionBilletClientAriary?: number;
  puEmissionServiceClientAriary?: number;
  puEmissionPenaliteClientAriary?: number;
  emissionMontantBilletCompagnieAriary?: number;
  emissionMontantServiceCompagnieAriary?: number;
  emissionMontantPenaliteCompagnieAriary?: number;
  emissionMontantBilletClientAriary?: number;
  emissionMontantServiceClientAriary?: number;
  emissionMontantPenaliteClientAriary?: number;
  emissionCommissionEnDevise?: number;
  emissionCommissionEnAriary?: number;
  prospectionLigne: ProspectionLigne;
  createdAt: string;
  updatedAt: string;
}

export interface BilletEntete {
  id: string;
  numeroBillet: string;
  devisId: string;
  prospectionEnteteId: string;
  statut: string;
  // Le total de la compagnie peut être 0
  totalCompagnie: number;
  commissionPropose: number;
  commissionAppliquer: number;
  totalCommission: number;
  raisonAnnul: string | null;
  createdAt: string;
  updatedAt: string;
  prospectionEntete: ProspectionEntete;
  billetLigne: BilletLigne[];
  passager: any[]; // à typer plus tard si besoin
}

export interface EmissionPayload {
  emissionTauxChange: number;
  numeroBillet: string;                  // ← NOUVEAU
  pjBillet?: File;                       // ← Fichier PDF optionnel (selon besoin)
  puEmissionBilletCompagnieAriary?: number;
  puEmissionServiceCompagnieAriary?: number;
  puEmissionPenaliteCompagnieAriary?: number;
  puEmissionBilletClientAriary?: number;
  puEmissionServiceClientAriary?: number;
  puEmissionPenaliteClientAriary?: number;
  emissionMontantBilletCompagnieAriary?: number;
  emissionMontantServiceCompagnieAriary?: number;
  emissionMontantPenaliteCompagnieAriary?: number;
  emissionMontantBilletClientAriary?: number;
  emissionMontantServiceClientAriary?: number;
  emissionMontantPenaliteClientAriary?: number;
}

interface BilletState {
  current: BilletEntete | null;
  list: BilletEntete[];               // ← NOUVEAU : liste des billets du dossier
  loadingList: boolean;               // ← séparé du loading du current
  errorList: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: BilletState = {
  current: null,
  list: [],
  loadingList: false,
  errorList: null,
  loading: false,
  error: null,
};

// ────────────────────────────────────────────────
// Thunk : Récupérer un billet par ID
// ────────────────────────────────────────────────

// billetSlice.ts

export const fetchBilletById = createAsyncThunk(
  'billet/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/billet/entete/${id}/devis`);
      
      // LOG DE DÉBOGAGE CRITIQUE : 
      // Regarde bien dans la console si c'est "response.data" ou "response" qui contient ton JSON
      console.log("DEBUG RESPONSE AXIOS:", response);

      // Extraction ultra-sécurisée
      // On cherche l'ID soit dans response.data.data.id, soit dans response.data.id
      const billetData = response.data?.data?.id ? response.data.data :
                         response.data?.id ? response.data : null;

      if (!billetData || !billetData.id) {
        console.error("Format de données invalide. Contenu de response.data:", response.data);
        throw new Error('Aucun billet trouvé dans la réponse du serveur');
      }

      return billetData as BilletEntete;
    } catch (err: any) {
      console.error('Erreur capturée dans fetchBilletById:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Thunk : Ajouter/réserver une ligne
export const addReservationToLigne = createAsyncThunk(
  'billet/addReservationToLigne',
  async (
    { ligneId, payload }: { ligneId: string; payload: ReservationPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/billet/ligne/${ligneId}/addreservation`, payload);
      console.log(`la reponse du serveur: ${response.data}`);
      if (!response.data?.success) {
        throw new Error('Échec de la réservation');
      }
      return response.data; // ou juste { ligneId } si tu veux minimal
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'ajout de la réservation'
      );
    }
  }
);

// Thunk : Changer le statut de l'entête (ex: vers "A Approuver")
export const updateApprouverBilletEnteteStatut = createAsyncThunk(
  'billet/updateEnteteStatut',
  async (
    { enteteId }: { enteteId: string},
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/billet/${enteteId}/a-approuver`);
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

// Thunk : Changer le statut de l'entête (ex: vers "RESERVE")
export const updateBilletEnteteStatut = createAsyncThunk(
  'billet/updateEnteteStatut',
  async (
    { billetId, referenceFacClient }: { billetId: string; referenceFacClient: string },
    { rejectWithValue }
  ) => {
    try {
      const payload = { referenceFacClient };
      const response = await axios.put(`/billet/${billetId}/emettre`, payload);

      if (!response.data?.success) {
        throw new Error('Échec de l\'émission de la facture');
      }

      // On renvoie idéalement le billet mis à jour si le back le renvoie
      return response.data.data || { billetId, referenceFacClient };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'émission de la facture'
      );
    }
  }
);

// Thunk pour émettre une ligne
export const emitBilletLigne = createAsyncThunk<
  { ligneId: string; updatedData: any },
  { ligneId: string; payload: EmissionPayload },
  { rejectValue: string }
>(
  'billet/emitLigne',
  async ({ ligneId, payload }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Champs texte
      formData.append('emissionTauxChange', payload.emissionTauxChange.toString());
      formData.append('numeroBillet', payload.numeroBillet);

      // Fichier PDF (si fourni)
      if (payload.pjBillet) {
        formData.append('pjBillet', payload.pjBillet);
      }

      // Autres champs numériques (si tu les envoies)
      if (payload.puEmissionBilletCompagnieAriary !== undefined) {
        formData.append('puEmissionBilletCompagnieAriary', payload.puEmissionBilletCompagnieAriary.toString());
      }
      // ... même chose pour tous les autres puEmission* et emissionMontant*

      const response = await axios.put(`/billet/ligne/${ligneId}/achat`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data?.success) {
        throw new Error('Échec de l\'émission');
      }

      return { ligneId, updatedData: response.data.data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'émission du billet'
      );
    }
  }
);

// THUNK : Récupérer tous les billets d'un dossier commun
export const fetchBilletsByDossierCommun = createAsyncThunk<
  BilletEntete[],
  string,  // dossierCommunId
  { rejectValue: string }
>(
  'billet/fetchByDossierCommun',
  async (dossierCommunId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/billet/dossier-commun/${dossierCommunId}`);
      
      if (!response.data?.success || !Array.isArray(response.data?.data)) {
        throw new Error('Format de réponse invalide pour les billets');
      }

      return response.data.data as BilletEntete[];
    } catch (err: any) {
      console.error('Erreur fetchBilletsByDossierCommun:', err);
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement des billets'
      );
    }
  }
);

// ────────────────────────────────────────────────
// Thunk : Émettre la facture client (PUT /billet/{id}/emettre-facture)
// ────────────────────────────────────────────────
export const emettreFactureClient = createAsyncThunk(
  'billet/emettreFacture',
  async (
    { billetId, referenceFacClient }: { billetId: string; referenceFacClient: string },
    { rejectWithValue }
  ) => {
    try {
      const payload = { referenceFacClient };
      const response = await axios.put(`/billet/${billetId}/emettre-facture`, payload);

      if (!response.data?.success) {
        throw new Error('Échec de l\'émission de la facture');
      }

      // On renvoie idéalement le billet mis à jour si le back le renvoie
      return response.data.data || { billetId, referenceFacClient };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'émission de la facture'
      );
    }
  }
);

// ────────────────────────────────────────────────
// Thunk : Marquer la facture comme réglée (PUT /billet/{id}/regler-facture)
// ────────────────────────────────────────────────
export const reglerFactureClient = createAsyncThunk(
  'billet/reglerFacture',
  async (
    billetId: string,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/billet/${billetId}/regler-facture`);

      if (!response.data?.success) {
        throw new Error('Échec du règlement de la facture');
      }

      return response.data.data || { billetId };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du règlement de la facture'
      );
    }
  }
);

// Thunk annulation réservation (avant émission)
export const annulerBillet = createAsyncThunk(
  'billet/annuler',
  async (
    { billetId, payload }: { billetId: string; payload: AnnulationBilletPayload },
    { rejectWithValue }
  ) => {
    try {
      // On renomme le champ pour matcher l'API
      // const apiPayload = {
      //   ...payload,
      //   rasionAnnulationId: payload.raisonAnnulationId,   // ← le nom attendu par le back
      // };

      const res = await axios.post(`/billet/${billetId}/annuler`, payload);
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Échec annulation billet');
      }
      
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de l\'annulation du billet'
      );
    }
  }
);

// Thunk annulation émission (après émission)
export const annulerEmissionBillet = createAsyncThunk(
  'billet/annulerEmission',
  async (
    { billetId, payload }: { billetId: string; payload: AnnulationEmissionPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.patch(`/billet/${billetId}/annuler-emission`, payload);
      if (!res.data?.success) throw new Error('Échec annulation émission');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur annulation émission');
    }
  }
);

export const reprogrammerLigne = createAsyncThunk(
  'billet/reprogrammer',
  async ({ billetId, payload }: { billetId: string; payload: any }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/billet/${billetId}/reprogrammer`, payload);
      if (!res.data?.success) throw new Error('Échec reprogrammation');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur reprogrammation');
    }
  }
);

const billetSlice = createSlice({
  name: 'billet',
  initialState,
  reducers: {
    // Tu pourras ajouter des reducers synchrones plus tard (ex: clearCurrent)
    clearCurrent: (state) => {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBilletById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBilletById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchBilletById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addReservationToLigne.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(addReservationToLigne.fulfilled, (state) => {
      state.loading = false;
      // On ne met pas à jour manuellement → on re-fetch après
    })
    .addCase(addReservationToLigne.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })

    .addCase(updateBilletEnteteStatut.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateBilletEnteteStatut.fulfilled, (state, action) => {
      state.loading = false;
      // Si le serveur renvoie le billet mis à jour dans action.payload.data
      if (action.payload?.data) {
        state.current = action.payload.data;
      }
    })
    .addCase(updateBilletEnteteStatut.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    .addCase(emitBilletLigne.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(emitBilletLigne.fulfilled, (state, action) => {
      state.loading = false;
      // Option 1 : mise à jour manuelle (si tu préfères éviter re-fetch)
      if (state.current && action.payload) {
        const ligneIndex = state.current.billetLigne.findIndex(l => l.id === action.payload.ligneId);
        if (ligneIndex !== -1) {
          state.current.billetLigne[ligneIndex] = {
            ...state.current.billetLigne[ligneIndex],
            ...action.payload.updatedData,
          };
        }
      }
    })
    .addCase(emitBilletLigne.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    // fetchBilletsByDossierCommun
    .addCase(fetchBilletsByDossierCommun.pending, (state) => {
      state.loadingList = true;
      state.errorList = null;
    })
    .addCase(fetchBilletsByDossierCommun.fulfilled, (state, action) => {
      state.loadingList = false;
      state.list = action.payload;
    })
    .addCase(fetchBilletsByDossierCommun.rejected, (state, action) => {
      state.loadingList = false;
      state.errorList = action.payload as string;
      state.list = [];
    })
    // Émettre facture
    .addCase(emettreFactureClient.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(emettreFactureClient.fulfilled, (state, action) => {
      state.loading = false;
      // Si le back renvoie le billet complet → mise à jour
      if (action.payload && 'numeroBillet' in action.payload) {
        state.current = action.payload;
      }
      // Sinon on re-fetchera de toute façon (voir composant)
    })
    .addCase(emettreFactureClient.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })

    // Régler facture
    .addCase(reglerFactureClient.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(reglerFactureClient.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload && 'numeroBillet' in action.payload) {
        state.current = action.payload;
      }
    })
    .addCase(reglerFactureClient.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    // ────────────────────────────────────────────────
    // Annulation de la réservation (avant émission)
    // ────────────────────────────────────────────────
    .addCase(annulerBillet.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(annulerBillet.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;

      // Pas de mise à jour manuelle ici → on recharge via fetchBilletById
    })
    .addCase(annulerBillet.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })

    // ────────────────────────────────────────────────
    // Annulation de l'émission (après émission)
    // ────────────────────────────────────────────────
    .addCase(annulerEmissionBillet.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(annulerEmissionBillet.fulfilled, (state, action) => {
      state.loading = false;
      
      // Même logique que ci-dessus
      if (state.current && action.meta.arg.payload.lignes.length > 0) {
        state.current.billetLigne = state.current.billetLigne.map(ligne => {
          const updated = action.meta.arg.payload.lignes.find(u => u.id === ligne.id);
          if (updated) {
            return {
              ...ligne,
              statut: 'ANNULE_EMISSION',     // adapte au vrai statut
              // mise à jour éventuelle des champs
            };
          }
          return ligne;
        });
      }
    })
    .addCase(annulerEmissionBillet.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Échec annulation émission';
    });
  },
});

export const { clearCurrent } = billetSlice.actions;
export default billetSlice.reducer;