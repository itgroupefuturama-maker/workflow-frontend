import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import axios from '../../service/Axios'; // ton instance axios configurée

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  // ... autres champs si besoin
}

interface Prestation {
  id: string;
  numeroDos: string;
  status: string;
  // ...
}

export interface ProspectionEntete {
  id: string;
  prestationId: string;
  numeroEntete: string;
  fournisseurId: string;
  credit: string;           // ex: "CREDIT_15"
  typeVol: string;          // ex: "LONG_COURRIER"
  commissionPropose: number;
  commissionAppliquer: number;
  createdAt: string;
  updatedAt: string;
  prestation: Prestation;
  fournisseur: Fournisseur;
  prospectionLigne: any[];  // tableau vide pour l'instant
}

interface ProspectionEntetesState {
  items: ProspectionEntete[];
  loading: boolean;
  error: string | null;
}

export interface UpdateEntetePayload {
  id: string;
  prestationId: string;
  fournisseurId: string;
  credit: string;
  typeVol: string;
  commissionPropose: number;
  commissionAppliquer: number;
}

export interface CreateEntetePayload {
  prestationId: string;
  fournisseurId: string;
  credit: string;
  typeVol: string;
}

// ────────────────────────────────────────────────
// Thunk
// ────────────────────────────────────────────────
export const fetchProspectionEntetes = createAsyncThunk(
  'prospectionsEntetes/fetchByPrestation',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/prospections/entetes/prestation/${prestationId}`);
      return response.data.data as ProspectionEntete[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des entêtes');
    }
  }
);

// Thunk UPDATE
export const updateProspectionEntete = createAsyncThunk(
  'prospectionsEntetes/updateEntete',
  async (data: UpdateEntetePayload, { rejectWithValue }) => {
    try {
      const { id, ...body } = data;
      const response = await axios.put(`/prospections/entetes/${id}`, body);
      return response.data.data as ProspectionEntete; // ou juste l'id si le serveur renvoie peu
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la mise à jour de l’entête'
      );
    }
  }
);

// Thunk CREATE
export const createProspectionEntete = createAsyncThunk(
  'prospectionsEntetes/createEntete',
  async (data: CreateEntetePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/prospections/entetes', data);
      return response.data.data as ProspectionEntete; // on attend que le serveur renvoie l'entête créé
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Erreur lors de la création de l’entête'
      );
    }
  }
);

// ────────────────────────────────────────────────
// Slice
// ────────────────────────────────────────────────
const initialState: ProspectionEntetesState = {
  items: [],
  loading: false,
  error: null,
};

const prospectionsEntetesSlice = createSlice({
  name: 'prospectionsEntetes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(fetchProspectionEntetes.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchProspectionEntetes.fulfilled, (state, action: PayloadAction<ProspectionEntete[]>) => {
            state.loading = false;
            state.items = action.payload;
        })
        .addCase(fetchProspectionEntetes.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(updateProspectionEntete.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateProspectionEntete.fulfilled, (state, action: PayloadAction<ProspectionEntete>) => {
            state.loading = false;
            // Mise à jour optimiste : on remplace l'élément dans la liste
            const index = state.items.findIndex((item) => item.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = action.payload;
            }
        })
        .addCase(updateProspectionEntete.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(createProspectionEntete.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createProspectionEntete.fulfilled, (state, action: PayloadAction<ProspectionEntete>) => {
            state.loading = false;
            state.items.push(action.payload); // ajout optimiste
        })
        .addCase(createProspectionEntete.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
  },
});

export default prospectionsEntetesSlice.reducer;