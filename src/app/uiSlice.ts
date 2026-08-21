// app/uiSlice.ts
import { createSlice } from '@reduxjs/toolkit';

type UIState = {
  showPreferences: boolean;
  sidebarCollapsed: boolean;
  // true tant qu'aucune coupure n'a été détectée — évite un flash "hors ligne" au tout
  // premier rendu, avant que le socket ait eu le temps de se connecter ou d'échouer.
  socketConnected: boolean;
};

const initialState: UIState = {
  showPreferences: false,
  sidebarCollapsed: false,
  socketConnected: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePreferences: (state) => {
      state.showPreferences = !state.showPreferences;
    },
    setShowPreferences: (state, action) => {
      state.showPreferences = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
  },
});

export const { togglePreferences, setShowPreferences, toggleSidebar, setSidebarCollapsed, setSocketConnected } = uiSlice.actions;
export default uiSlice.reducer;