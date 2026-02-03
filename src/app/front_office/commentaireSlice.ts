// src/app/front_office/commentaireSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../service/Axios';

export interface Commentaire {
  id: string;
  commentaire: string;
  userId: string;
  prestationId: string;
  date: string;           // ou Date si tu préfères
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  prestation?: {
    id: string;
    numeroDos: string;
    status: string;
    // ... autres champs si besoin
  };
}

interface CommentaireState {
  list: Commentaire[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentaireState = {
  list: [],
  loading: false,
  error: null,
};

// Types (ajoute ceci si pas déjà présent)
export interface CreateCommentairePayload {
  commentaire: string;
  prestationId: string;
  date?: string; // optionnel – l’API peut le générer côté serveur
}

export interface UpdateCommentairePayload {
  id: string;
  commentaire: string;
  // date?: string;   ← à ajouter si tu veux permettre de modifier la date
}

// Thunk de création
export const createCommentaire = createAsyncThunk(
  'commentaire/create',
  async (payload: CreateCommentairePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/commentaire', payload);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Échec création commentaire');
      }
      
      // On retourne le nouveau commentaire créé (souvent l’API le renvoie)
      return response.data.data as Commentaire;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 
        err.message || 
        'Erreur lors de la création du commentaire'
      );
    }
  }
);

export const fetchCommentairesByPrestation = createAsyncThunk(
  'commentaire/fetchByPrestation',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/commentaire/prestation/${prestationId}`);
      console.log(`la reponse : ${response}`);
      
      if (!response.data?.success) {
        throw new Error('Réponse invalide');
      }
      return response.data.data as Commentaire[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement commentaires');
    }
  }
);

// Thunk pour la mise à jour
export const updateCommentaire = createAsyncThunk(
  'commentaire/update',
  async ({ id, commentaire }: UpdateCommentairePayload, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/commentaire/${id}`, {
        commentaire: commentaire.trim(),
        // date: ... si pertinent
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Échec modification');
      }

      // L’API renvoie généralement le commentaire mis à jour
      return response.data.data as Commentaire;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la modification du commentaire'
      );
    }
  }
);

// Thunk pour la suppression
export const deleteCommentaire = createAsyncThunk(
  'commentaire/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/commentaire/${id}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Échec suppression');
      }
      
      // On retourne seulement l'id supprimé pour le retirer de la liste
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la suppression du commentaire'
      );
    }
  }
);

const commentaireSlice = createSlice({
  name: 'commentaire',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(fetchCommentairesByPrestation.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchCommentairesByPrestation.fulfilled, (state, action) => {
            state.loading = false;
            state.list = action.payload;
        })
        .addCase(fetchCommentairesByPrestation.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        // createCommentaire
        .addCase(createCommentaire.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createCommentaire.fulfilled, (state, action) => {
            state.loading = false;
            // On ajoute le nouveau commentaire en haut de la liste
            state.list = [action.payload, ...state.list];
        })
        .addCase(createCommentaire.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        // updateCommentaire
        .addCase(updateCommentaire.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateCommentaire.fulfilled, (state, action) => {
            state.loading = false;
            // Remplace l’ancien commentaire par le nouveau dans la liste
            const index = state.list.findIndex((c) => c.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        })
        .addCase(updateCommentaire.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        // deleteCommentaire
        .addCase(deleteCommentaire.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteCommentaire.fulfilled, (state, action) => {
            state.loading = false;
            // On retire le commentaire supprimé de la liste
            state.list = state.list.filter((c) => c.id !== action.payload);
        })
        .addCase(deleteCommentaire.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
  },
});

export default commentaireSlice.reducer;