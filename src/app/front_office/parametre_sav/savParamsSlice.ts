import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../../service/Axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TexteVoyage {
  id: string;
  texte: string;
  destinationId: string;
  createdAt: string;
  updatedAt: string;
  destination: {
    id: string;
    code: string;
    ville: string;
    createdAt: string;
    updatedAt: string;
    paysId: string;
    pays: {
      id: string;
      pays: string;
      photo: string;
    };
  };
}

export interface LienSondage {
  id: string;
  lienSondage: string;
  texte: string;
  statut: 'ACTIF' | 'INACTIF';
  dateApplication: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRappel {
  id: string;
  texte: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRerappel {
  id: string;
  texte: string;
  createdAt: string;
  updatedAt: string;
}

interface SavParamsState {
  textesVoyage: TexteVoyage[];
  liensSondage: LienSondage[];
  templates: TemplateRappel[];
  templatesRerappel: TemplateRerappel[];
  loading: {
    textesVoyage: boolean;
    liensSondage: boolean;
    templates: boolean;
    templatesRerappel: boolean;
  };
  creating: {
    texteVoyage: boolean;
    lienSondage: boolean;
    template: boolean;
    templateRerappel: boolean;
  };
  error: string | null;
}

const initialState: SavParamsState = {
  textesVoyage: [],
  liensSondage: [],
  templates: [],
  templatesRerappel: [], // ← nouveau
  loading: { textesVoyage: false, liensSondage: false, templates: false, templatesRerappel: false },
  creating: { texteVoyage: false, lienSondage: false, template: false, templateRerappel: false },
  error: null,
};

// ─── Thunks FETCH ─────────────────────────────────────────────────────────────

export const fetchTextesVoyage = createAsyncThunk(
  'savParams/fetchTextesVoyage',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/sav-params/texte-voyage');
      if (!res.data.success) throw new Error();
      return res.data.data as TexteVoyage[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement textes voyage');
    }
  }
);

export const fetchLiensSondage = createAsyncThunk(
  'savParams/fetchLiensSondage',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/sav-params/lien-sondage');
      if (!res.data.success) throw new Error();
      return res.data.data as LienSondage[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement liens sondage');
    }
  }
);

export const fetchTemplates = createAsyncThunk(
  'savParams/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/sav-params/template-rappel');
      if (!res.data.success) throw new Error();
      return res.data.data as TemplateRappel[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement templates');
    }
  }
);

// ─── Thunks CREATE ────────────────────────────────────────────────────────────

export const createTexteVoyage = createAsyncThunk(
  'savParams/createTexteVoyage',
  async (payload: { texte: string; destinationId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/sav-params/texte-voyage', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as TexteVoyage;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création texte voyage');
    }
  }
);

export const createLienSondage = createAsyncThunk(
  'savParams/createLienSondage',
  async (
    payload: { lienSondage: string; texte: string; dateApplication: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post('/sav-params/lien-sondage', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as LienSondage;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création lien sondage');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'savParams/createTemplate',
  async (payload: { texte: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/sav-params/template-rappel', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as TemplateRappel;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création template');
    }
  }
);

export const fetchTemplatesRerappel = createAsyncThunk(
  'savParams/fetchTemplatesRerappel',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/sav-params/template-reenvoie-rappel');
      if (!res.data.success) throw new Error();
      return res.data.data as TemplateRerappel[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement templates rerappel');
    }
  }
);

export const createTemplateRerappel = createAsyncThunk(
  'savParams/createTemplateRerappel',
  async (payload: { texte: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/sav-params/template-reenvoie-rappel', payload);
      if (!res.data.success) throw new Error();
      return res.data.data as TemplateRerappel;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur création template rerappel');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const savParamsSlice = createSlice({
  name: 'savParams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // TEXTES VOYAGE
    builder
      .addCase(fetchTextesVoyage.pending, (state) => {
        state.loading.textesVoyage = true;
        state.error = null;
      })
      .addCase(fetchTextesVoyage.fulfilled, (state, action: PayloadAction<TexteVoyage[]>) => {
        state.loading.textesVoyage = false;
        state.textesVoyage = action.payload;
      })
      .addCase(fetchTextesVoyage.rejected, (state, action) => {
        state.loading.textesVoyage = false;
        state.error = action.payload as string;
      })
      .addCase(createTexteVoyage.pending, (state) => {
        state.creating.texteVoyage = true;
      })
      .addCase(createTexteVoyage.fulfilled, (state, action: PayloadAction<TexteVoyage>) => {
        state.creating.texteVoyage = false;
        state.textesVoyage.unshift(action.payload);
      })
      .addCase(createTexteVoyage.rejected, (state, action) => {
        state.creating.texteVoyage = false;
        state.error = action.payload as string;
      })

      // LIENS SONDAGE
      .addCase(fetchLiensSondage.pending, (state) => {
        state.loading.liensSondage = true;
        state.error = null;
      })
      .addCase(fetchLiensSondage.fulfilled, (state, action: PayloadAction<LienSondage[]>) => {
        state.loading.liensSondage = false;
        state.liensSondage = action.payload;
      })
      .addCase(fetchLiensSondage.rejected, (state, action) => {
        state.loading.liensSondage = false;
        state.error = action.payload as string;
      })
      .addCase(createLienSondage.pending, (state) => {
        state.creating.lienSondage = true;
      })
      .addCase(createLienSondage.fulfilled, (state, action: PayloadAction<LienSondage>) => {
        state.creating.lienSondage = false;
        state.liensSondage.unshift(action.payload);
      })
      .addCase(createLienSondage.rejected, (state, action) => {
        state.creating.lienSondage = false;
        state.error = action.payload as string;
      })

      // TEMPLATES
      .addCase(fetchTemplates.pending, (state) => {
        state.loading.templates = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action: PayloadAction<TemplateRappel[]>) => {
        state.loading.templates = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading.templates = false;
        state.error = action.payload as string;
      })
      .addCase(createTemplate.pending, (state) => {
        state.creating.template = true;
      })
      .addCase(createTemplate.fulfilled, (state, action: PayloadAction<TemplateRappel>) => {
        state.creating.template = false;
        state.templates.unshift(action.payload);
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.creating.template = false;
        state.error = action.payload as string;
      })
      // TEMPLATES RERAPPEL
      .addCase(fetchTemplatesRerappel.pending, (state) => {
        state.loading.templatesRerappel = true;
        state.error = null;
      })
      .addCase(fetchTemplatesRerappel.fulfilled, (state, action: PayloadAction<TemplateRerappel[]>) => {
        state.loading.templatesRerappel = false;
        state.templatesRerappel = action.payload;
      })
      .addCase(fetchTemplatesRerappel.rejected, (state, action) => {
        state.loading.templatesRerappel = false;
        state.error = action.payload as string;
      })
      .addCase(createTemplateRerappel.pending, (state) => {
        state.creating.templateRerappel = true;
      })
      .addCase(createTemplateRerappel.fulfilled, (state, action: PayloadAction<TemplateRerappel>) => {
        state.creating.templateRerappel = false;
        state.templatesRerappel.unshift(action.payload);
      })
      .addCase(createTemplateRerappel.rejected, (state, action) => {
        state.creating.templateRerappel = false;
        state.error = action.payload as string;
      });
  },
});

export default savParamsSlice.reducer;