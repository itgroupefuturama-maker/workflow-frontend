import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../service/Axios';

interface Todo {
  id: string;
  prestationId: string;
  rappel: {
    id: string;
    objet: string;
    moment: string;
    status: 'FAIT' | 'INACTIF' | 'SUPPRIMER';
  };
  prestation: {
    id: string;
    numeroDos: string;
    statut: string;
  };
  status: 'ACTIF' | 'INACTIF';
}

interface TodosState {
  items: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
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

export const createTodo = createAsyncThunk(
  'todos/create',
  async ({ prestationId, objet, moment }: { prestationId: string; objet: string; moment: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/todolists', { prestationId, objet, moment });
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