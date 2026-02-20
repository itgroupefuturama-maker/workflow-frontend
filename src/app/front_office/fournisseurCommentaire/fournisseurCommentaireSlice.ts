// src/app/fournisseur/fournisseurCommentaireSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface LastComment {
  commentaire: string;
  alerte: string;
  dateEnregistrement: string;
}

interface FournisseurCommentaireState {
  lastComment: LastComment | null;
  loading: boolean;
  error: string | null;
  fournisseurId: string | null; // pour savoir quel fournisseur est actif
  confirmed: boolean;
}

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState: FournisseurCommentaireState = {
  lastComment: null,
  loading: false,
  error: null,
  fournisseurId: null,
  confirmed: false,
};

// ─── Thunk ───────────────────────────────────────────────────────────────────
export const fetchLastCommentaireFournisseur = createAsyncThunk(
  'fournisseurCommentaire/fetchLast',
  async (fournisseurId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/commentaires-fournisseur/fournisseur/${fournisseurId}/last`
      );

      if (!response.data?.success) {
        return rejectWithValue(response.data?.message || 'Réponse invalide');
      }

      const data = response.data.data;

      if (!data) return null; // pas de commentaire, c'est ok

      return {
        commentaire: data.commentaire || '—',
        alerte: data.alerte || 'INCONNU',
        dateEnregistrement: data.dateEnregistrement
          ? new Date(data.dateEnregistrement).toLocaleString('fr-FR')
          : '—',
      } as LastComment;

    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ||
        err.message ||
        'Impossible de charger le dernier commentaire'
      );
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const fournisseurCommentaireSlice = createSlice({
  name: 'fournisseurCommentaire',
  initialState,
  reducers: {
    // Appelé quand on change de fournisseur ou qu'on reset le dropdown
    clearCommentaireFournisseur(state) {
      state.lastComment = null;
      state.error = null;
      state.fournisseurId = null;
      state.confirmed = false;
    },
    confirmMalgréAlerte(state) {
      state.confirmed = true;
    },
    refuserMalgréAlerte(state) {
      state.lastComment = null;
      state.fournisseurId = null;
      state.confirmed = false;
    },
    // ✅ AJOUT : ferme le badge sans toucher à lastComment
    fermerBadgeTresEleve(state) {
      state.fournisseurId = null; // badge disparaît
      // lastComment conservé → isBlocked reste true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLastCommentaireFournisseur.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastComment = null;
        state.fournisseurId = action.meta.arg; // on garde l'id en cours
      })
      .addCase(fetchLastCommentaireFournisseur.fulfilled, (state, action) => {
        state.loading = false;
        state.lastComment = action.payload;
      })
      .addCase(fetchLastCommentaireFournisseur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.lastComment = null;
      });
  },
});

export const {
    clearCommentaireFournisseur,
    confirmMalgréAlerte,
    refuserMalgréAlerte,
    fermerBadgeTresEleve, // ← exporter
  } = fournisseurCommentaireSlice.actions;
export default fournisseurCommentaireSlice.reducer;