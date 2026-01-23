import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import './index.css';  // Ou './App.css' si c'est ça
import { App } from './App.tsx';
import { store } from './app/store.ts';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);