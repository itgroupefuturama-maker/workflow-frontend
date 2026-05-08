// app/uiSlice.ts
import { createSlice } from '@reduxjs/toolkit';

type UIState = {
  showPreferences: boolean;
  sidebarCollapsed: boolean;
};

const initialState: UIState = {
  showPreferences: false,
  sidebarCollapsed: false,
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
  },
});

export const { togglePreferences, setShowPreferences, toggleSidebar, setSidebarCollapsed } = uiSlice.actions;
export default uiSlice.reducer;