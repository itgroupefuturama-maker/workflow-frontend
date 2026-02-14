import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../../service/Axios';

export type Plateforme = {
  id: string;
  code: string;
  nom: string;
  status: string;          // "CREER", "ACTIF", etc.
  createdAt: string;
  updatedAt: string;
};

type PlateformeState = {
  items: Plateforme[];
  loading: boolean;
  error: string | null;
};

type CreatePlateformePayload = {
  code: string;
  nom: string;
};

const initialState: PlateformeState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchPlateformes = createAsyncThunk(
  'plateforme/fetchPlateformes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/hotel-params/plateforme');
      if (!response.data.success) {
        throw new Error('Réponse non réussie');
      }
      return response.data.data as Plateforme[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors du chargement des plateformes'
      );
    }
  }
);

export const createPlateforme = createAsyncThunk(
  'plateforme/createPlateforme',
  async (data: CreatePlateformePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/hotel-params/plateforme', data);
      if (!response.data.success) {
        throw new Error('Échec de la création');
      }
      return response.data.data as Plateforme; // ou juste return true si pas besoin de l'objet retourné
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de la plateforme'
      );
    }
  }
);

const plateformeSlice = createSlice({
  name: 'plateforme',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlateformes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlateformes.fulfilled, (state, action: PayloadAction<Plateforme[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPlateformes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPlateforme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlateforme.fulfilled, (state, action) => {
        state.loading = false;
        // On peut ajouter l'élément directement si le serveur le renvoie
        if (action.payload) {
          state.items.push(action.payload);
        }
        // Sinon on laisse le re-fetch du useEffect s'en charger
      })
      .addCase(createPlateforme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default plateformeSlice.reducer;