// app/uiSlice.ts
import { createSlice } from '@reduxjs/toolkit';

type UIState = {
  showPreferences: boolean;
};

const initialState: UIState = {
  showPreferences: false,
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
  },
});

export const { togglePreferences, setShowPreferences } = uiSlice.actions;
export default uiSlice.reducer;