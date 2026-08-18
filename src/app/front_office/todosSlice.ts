import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

export interface Todo {
  id: string;
  prestationId: string;
  rappel: {
    id: string;
    objet: string;
    moment: string;
    status: 'FAIT' | 'INACTIF' | 'SUPPRIMER';
    type: 'NORMAL' | 'URGENT' | 'FAIBLE';
  };
  prestation: {
    id: string;
    numeroDos: string;
    statut: string;
    dossierCommunColab:{
      id: string;
      userId: string;
      module: {
        code: string;
        nom: string;
      }
    }
  };
  status: 'ACTIF' | 'INACTIF';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchTodosPaginatedParams {
  page: number;
  limit: number;
  search?: string;
  statut?: string;
  type?: 'URGENT' | 'NORMAL' | 'FAIBLE';
  periode?: 'passe' | 'avenir';
}

interface TodosState {
  items: Todo[];
  loading: boolean;
  error: string | null;
  // Liste paginée (ToDoList.tsx uniquement) — distincte de `items` ci-dessus, qui reste
  // alimentée par `fetchTodos`/`fetchTodosByPrestation` et utilisée ailleurs dans l'app
  // (RappelsTable.tsx, SuiviTabContent.tsx du module ticketing).
  listData: Todo[];
  listMeta: PaginationMeta;
  listLoading: boolean;
  listError: string | null;
}

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
  listData: [],
  listMeta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  listLoading: false,
  listError: null,
};

export const fetchTodos = createAsyncThunk(
  'todos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/todolists');
      if (!res.data.success) throw new Error('Erreur');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement todos');
    }
  }
);

// Fetch paginé + recherche/filtres côté serveur (écran ToDoList.tsx uniquement)
export const fetchTodosPaginated = createAsyncThunk(
  'todos/fetchAllPaginated',
  async (params: FetchTodosPaginatedParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/todolists', { params });
      if (!res.data.success) throw new Error('Erreur');
      // res.data.data = { data: Todo[], meta: PaginationMeta }
      const payload = res.data.data;
      return { data: payload.data as Todo[], meta: payload.meta as PaginationMeta };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur chargement todos');
    }
  }
);

export const createTodo = createAsyncThunk(
  'todos/create',
  async (
    payload: {
      prestationId: string;
      objet: string;
      moment: string;
      type?: 'NORMAL' | 'URGENT';
      googleAccountId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const body: Record<string, string> = {
        prestationId: payload.prestationId,
        objet: payload.objet,
        moment: payload.moment,
      };

      if (payload.type === 'URGENT') {
        body.type = 'URGENT';
        if (payload.googleAccountId) body.googleAccountId = payload.googleAccountId;
      }

      const res = await axiosInstance.post('/todolists', body);
      if (!res.data.success) throw new Error();
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue('Erreur création');
    }
  }
);

export const updateTodo = createAsyncThunk(
  'todos/update',
  async (
    { rappelId, objet, moment }: { rappelId: string; objet: string; moment: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(`/rappels/${rappelId}`, { objet, moment });
      if (!res.data.success) throw new Error('Échec mise à jour');
      return res.data.data; // on attend l'objet rappel mis à jour
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const markAsDone = createAsyncThunk(
  'todos/markDone',
  async (rappelId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(`/rappels/${rappelId}/fait`);
      if (!res.data.success) throw new Error('Échec');
      return res.data.data; // rappel mis à jour (status ACHEVE)
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur marquage fait');
    }
  }
);

export const deactivateTodo = createAsyncThunk(
  'todos/deactivate',
  async (rappelId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(`/rappels/${rappelId}/deactivate`);
      if (!res.data.success) throw new Error('Échec');
      return res.data.data; // rappel mis à jour (status INACTIF sur todo ?)
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur désactivation');
    }
  }
);

export const deleteTodo = createAsyncThunk(
  'todos/delete',
  async (rappelId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/rappels/${rappelId}`);
      if (!res.data.success) throw new Error('Échec suppression');
      return rappelId; // on renvoie juste l'id pour le retirer du state
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Erreur suppression');
    }
  }
);

// Ajouter ce thunk dans le même fichier
export const fetchTodosByPrestation = createAsyncThunk(
  'todos/fetchByPrestation',
  async (prestationId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/todolists/prestation/${prestationId}`);
      if (!res.data.success) {
        throw new Error('Erreur chargement rappels');
      }
      return res.data.data; // tableau de Todo[]
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || 'Erreur lors du chargement des rappels'
      );
    }
  }
);

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => { state.loading = true; })
      .addCase(fetchTodos.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // ── PAGINATION (ToDoList.tsx) ─────────────────────
      .addCase(fetchTodosPaginated.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchTodosPaginated.fulfilled, (state, action) => {
        state.listLoading = false;
        state.listData = action.payload.data;
        state.listMeta = action.payload.meta;
      })
      .addCase(fetchTodosPaginated.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      // ── UPDATE ───────────────────────────────────────
    .addCase(updateTodo.pending, (state) => {
      state.loading = true;
    })
    .addCase(updateTodo.fulfilled, (state, action) => {
      state.loading = false;
      const updatedRappel = action.payload;
      const index = state.items.findIndex((t) => t.rappel.id === updatedRappel.id);
      if (index !== -1) {
        state.items[index].rappel = updatedRappel;
      }
    })
    .addCase(updateTodo.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })

    // ── MARK DONE ────────────────────────────────────
    .addCase(markAsDone.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.items.findIndex((t) => t.rappel.id === updated.id);
      if (index !== -1) {
        state.items[index].rappel = updated;
      }
    })

    // ── DEACTIVATE ───────────────────────────────────
    .addCase(deactivateTodo.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.items.findIndex((t) => t.rappel.id === updated.id);
      if (index !== -1) {
        state.items[index].rappel = updated;     // si l'API renvoie le rappel
        // OU si elle ne renvoie rien d'utile :
        // state.items[index].status = 'INACTIF';
      }
    })

    // ── DELETE ───────────────────────────────────────
    .addCase(deleteTodo.fulfilled, (state, action) => {
      const deletedId = action.payload;
      state.items = state.items.filter((t) => t.rappel.id !== deletedId);
    })
    .addCase(fetchTodosByPrestation.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchTodosByPrestation.fulfilled, (state, action: PayloadAction<Todo[]>) => {
      state.loading = false;
      state.items = action.payload;
    })
    .addCase(fetchTodosByPrestation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default todosSlice.reducer;