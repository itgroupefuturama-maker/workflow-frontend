import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Piece {
  id: string;
  codeDoc: string;
  document: string;
  status: string;
  dateActivation: string | null;
  dateDesactivation: string | null;
  dateApplication: string;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    code: string;
    nom: string;
    description: string;
    status: string;
    dateActivation: string | null;
    dateDesactivation: string | null;
  }[];
}

export interface PiecesState {
  data: Piece[];
  loading: boolean;
  error: string | null;
}

const initialState: PiecesState = {
  data: [],
  loading: false,
  error: null,
};

// Fetch toutes les pièces
export const fetchPieces = createAsyncThunk<
  { success: boolean; data: Piece[] },
  void,
  { state: { auth: { token: string } } }
>('pieces/fetchPieces', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.get('/pieces', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec récupération des pièces');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Créer une pièce
export const createPiece = createAsyncThunk<
  { success: boolean; data: Piece },
  { document: string },
  { state: { auth: { token: string } } }
>('pieces/createPiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post('/pieces', payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec création de la pièce');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Update une pièce
export const updatePiece = createAsyncThunk<
  { success: boolean; data: Piece },
  { id: string; document: string },
  { state: { auth: { token: string } } }
>('pieces/updatePiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.put(`/pieces/${payload.id}`, {
      document: payload.document,
    }, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec mise à jour');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Activate
export const activatePiece = createAsyncThunk<
  { success: boolean; data: Piece },
  { id: string },
  { state: { auth: { token: string } } }
>('pieces/activatePiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/pieces/${payload.id}/activate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec activation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Deactivate
export const deactivatePiece = createAsyncThunk<
  { success: boolean; data: Piece },
  { id: string },
  { state: { auth: { token: string } } }
>('pieces/deactivatePiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.patch(`/pieces/${payload.id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec désactivation');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// Delete
export const deletePiece = createAsyncThunk<
  { success: boolean; data: string },
  { id: string },
  { state: { auth: { token: string } } }
>('pieces/deletePiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/pieces/${payload.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: payload.id };
    }
    return rejectWithValue('Échec suppression');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// NOUVEAU: Ajouter un module à une pièce
export const addModuleToPiece = createAsyncThunk<
  { success: boolean; data: Piece },
  { pieceId: string; moduleId: string },
  { state: { auth: { token: string } } }
>('pieces/addModuleToPiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.post(`/pieces/${payload.pieceId}/add-module/${payload.moduleId}`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec ajout du module');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

// NOUVEAU: Supprimer un module d'une pièce
export const removeModuleFromPiece = createAsyncThunk<
  { success: boolean; data: Piece },
  { pieceId: string; moduleId: string },
  { state: { auth: { token: string } } }
>('pieces/removeModuleFromPiece', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('Token manquant');

    const response = await axiosInstance.delete(`/pieces/${payload.pieceId}/module/${payload.moduleId}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.data.success) {
      dispatch(fetchPieces());
      return { success: true, data: response.data.data };
    }
    return rejectWithValue('Échec suppression du module');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur réseau');
  }
});

const piecesSlice = createSlice({
  name: 'pieces',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPieces.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPieces.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) state.data = action.payload.data;
      })
      .addCase(fetchPieces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPiece.pending, (state) => { state.loading = true; })
      .addCase(createPiece.fulfilled, (state) => { state.loading = false; })
      .addCase(createPiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updatePiece.pending, (state) => { state.loading = true; })
      .addCase(updatePiece.fulfilled, (state) => { state.loading = false; })
      .addCase(updatePiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(activatePiece.pending, (state) => { state.loading = true; })
      .addCase(activatePiece.fulfilled, (state) => { state.loading = false; })
      .addCase(activatePiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deactivatePiece.pending, (state) => { state.loading = true; })
      .addCase(deactivatePiece.fulfilled, (state) => { state.loading = false; })
      .addCase(deactivatePiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deletePiece.pending, (state) => { state.loading = true; })
      .addCase(deletePiece.fulfilled, (state) => { state.loading = false; })
      .addCase(deletePiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      // NOUVEAUX CASES
      .addCase(addModuleToPiece.pending, (state) => { state.loading = true; })
      .addCase(addModuleToPiece.fulfilled, (state) => { state.loading = false; })
      .addCase(addModuleToPiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(removeModuleFromPiece.pending, (state) => { state.loading = true; })
      .addCase(removeModuleFromPiece.fulfilled, (state) => { state.loading = false; })
      .addCase(removeModuleFromPiece.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default piecesSlice.reducer;