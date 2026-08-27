import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { createRoot } from 'react-dom/client';
import './index.css';  // Ou './App.css' si c'est ça
import { App } from './App.tsx';
import { store, persistor } from './app/store.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import PageLoader from './components/PageLoader.tsx';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    {/* Attend la réhydratation de redux-persist (isAuthenticated/user) avant de monter l'app —
        sans ça, ProtectedRoute lirait un état "non connecté" transitoire au tout premier rendu
        après un rechargement de page (F5) et redirigerait vers /login à tort. */}
    <PersistGate loading={<PageLoader />} persistor={persistor}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </PersistGate>
  </Provider>
);