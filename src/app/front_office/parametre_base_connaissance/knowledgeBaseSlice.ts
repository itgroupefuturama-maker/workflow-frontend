import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

export interface SubTheme {
  id: string;
  nom: string;
  themeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
  subThemes: SubTheme[];
}

export interface KnowledgeItem {
  id: string;
  titre: string;
  contenu: string;
  subThemeId: string;
  createdAt: string;
  updatedAt: string;
  subTheme: SubTheme & {
    theme: Omit<Theme, 'subThemes'>;
  };
}


interface KnowledgeBaseState {
  themes:          Theme[];
  items:           KnowledgeItem[];
  selectedTheme:   string | null;
  selectedSubTheme: string | null;
  loadingThemes:   boolean;
  loadingItems:    boolean;
  error:           string | null;
}

const initialState: KnowledgeBaseState = {
  themes:           [],
  items:            [],
  selectedTheme:    null,
  selectedSubTheme: null,
  loadingThemes:    false,
  loadingItems:     false,
  error:            null,
};

export const fetchThemes = createAsyncThunk(
  'knowledgeBase/fetchThemes',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/knowledge-base/themes');
      if (!res.data.success) throw new Error();
      return res.data.data as Theme[];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur chargement des thèmes'
      );
    }
  }
);

export const fetchKnowledgeItems = createAsyncThunk(
  'knowledgeBase/fetchItems',
  async (
    { theme, sousTheme }: { theme: string; sousTheme: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get('/knowledge-base', {
        params: { theme, sousTheme },
      });
      if (!res.data.success) throw new Error();
      return res.data.data as KnowledgeItem[];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur chargement des articles'
      );
    }
  }
);

// Ajouter ce thunk dans le slice existant
export const createKnowledgeItem = createAsyncThunk(
  'knowledgeBase/createItem',
  async (
    payload: { theme: string; sousTheme: string; titre: string; contenu: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post('/knowledge-base', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as KnowledgeItem;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur lors de la création'
      );
    }
  }
);

export const updateKnowledgeItem = createAsyncThunk(
  'knowledgeBase/updateItem',
  async (
    payload: { id: string; theme: string; sousTheme: string; titre: string; contenu: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = payload;
      const res = await axiosInstance.put(`/knowledge-base/${id}`, body);
      if (!res.data.success) throw new Error();
      return res.data.data as KnowledgeItem;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur lors de la modification'
      );
    }
  }
);

const knowledgeBaseSlice = createSlice({
  name: 'knowledgeBase',
  initialState,
  reducers: {
    setSelectedTheme(state, action: PayloadAction<string>) {
      state.selectedTheme    = action.payload;
      state.selectedSubTheme = null;
      state.items            = [];
    },
    setSelectedSubTheme(state, action: PayloadAction<string>) {
      state.selectedSubTheme = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThemes.pending, (state) => {
        state.loadingThemes = true;
        state.error         = null;
      })
      .addCase(fetchThemes.fulfilled, (state, action: PayloadAction<Theme[]>) => {
        state.loadingThemes = false;
        state.themes        = action.payload;
      })
      .addCase(fetchThemes.rejected, (state, action) => {
        state.loadingThemes = false;
        state.error         = action.payload as string;
      })
      .addCase(fetchKnowledgeItems.pending, (state) => {
        state.loadingItems = true;
        state.error        = null;
      })
      .addCase(fetchKnowledgeItems.fulfilled, (state, action: PayloadAction<KnowledgeItem[]>) => {
        state.loadingItems = false;
        state.items        = action.payload;
      })
      .addCase(fetchKnowledgeItems.rejected, (state, action) => {
        state.loadingItems = false;
        state.error        = action.payload as string;
      })
      .addCase(createKnowledgeItem.pending, (state) => {
        state.loadingItems = true;
        state.error        = null;
        })
        .addCase(createKnowledgeItem.fulfilled, (state, action: PayloadAction<KnowledgeItem>) => {
        state.loadingItems = false;
        state.items.unshift(action.payload); // ajoute en tête de liste
        })
        .addCase(createKnowledgeItem.rejected, (state, action) => {
        state.loadingItems = false;
        state.error        = action.payload as string;
        })
        .addCase(updateKnowledgeItem.pending, (state) => {
          state.loadingItems = true;
          state.error        = null;
        })
        .addCase(updateKnowledgeItem.fulfilled, (state, action: PayloadAction<KnowledgeItem>) => {
          state.loadingItems = false;
          // Remplace l'item modifié dans la liste sans refetch
          const idx = state.items.findIndex((i) => i.id === action.payload.id);
          if (idx !== -1) state.items[idx] = action.payload;
        })
        .addCase(updateKnowledgeItem.rejected, (state, action) => {
          state.loadingItems = false;
          state.error        = action.payload as string;
        });
  },
});

export const { setSelectedTheme, setSelectedSubTheme } = knowledgeBaseSlice.actions;
export default knowledgeBaseSlice.reducer;