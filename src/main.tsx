import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import './index.css';  // Ou './App.css' si c'est ça
import { App } from './App.tsx';
import { store } from './app/store.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </Provider>
);