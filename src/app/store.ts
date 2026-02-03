import { configureStore} from '@reduxjs/toolkit'; 
import type { ThunkDispatch, Action }from '@reduxjs/toolkit'; 
import authReducer from './authSlice';
import privilegesReducer from './back_office/privilegesSlice';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import profilesReducer from './back_office/profilesSlice';
import autorisationsReducer from './back_office/autorisationsSlice';
import usersReducer from './back_office/usersSlice';
import transactionTypesReducer from './back_office/transactionTypesSlice';
import transactionsReducer from './back_office/transactionsSlice';
import modulesReducer from './back_office/modulesSlice';
import modelesReducer from './back_office/modelesSlice';
import commissionsReducer from './back_office/commissionsSlice';
import numerotationReducer from './back_office/numerotationSlice';
import milesReducer from './back_office/milesSlice';
import piecesReducer from './back_office/piecesSlice';
import clientBeneficiairesReducer from './back_office/clientBeneficiairesSlice';
import clientFacturesReducer from './back_office/clientFacturesSlice';
import devisTransactionsReducer from './back_office/devisTransactionsSlice';
import categoriesReducer from './back_office/categoriesSlice';
import sousCategoriesReducer from './back_office/sousCategoriesSlice';
import articlesReducer from './back_office/articlesSlice';
import fournisseursReducer from './back_office/fournisseursSlice';

// Portail-client
import clientBeneficiaireInfosReducer from './portail_client/clientBeneficiaireInfosSlice';

// Front-Office
import dossierCommunReducer from './front_office/dossierCommunSlice';
import devisPrestationReducer from './front_office/devisPrestationSlice';
import todosReducer from './front_office/todosSlice';
import prospectionsEntetesReducer from './front_office/prospectionsEntetesSlice';
import prospectionsLignesReducer from './front_office/prospectionsLignesSlice';
import serviceSpecifiqueReducer from './front_office/parametre_ticketing/serviceSpecifiqueSlice';
import devisReducer from './front_office/devisSlice';
import exigenceReducer from './front_office/parametre_ticketing/exigenceSlice';
import destinationReducer from './front_office/parametre_ticketing/destinationSlice';
import paysReducer from './front_office/parametre_ticketing/paysSlice';
import associationsPaysVoyageReducer from './front_office/parametre_ticketing/associationsPaysVoyageSlice';
import billetReducer from './front_office/billetSlice';
import suiviReducer from './front_office/suiviSlice';
import commentaireReducer from './front_office/commentaireSlice';
import etatVenteReducer from './front_office/etatVenteSlice';
import etatAnnulationReducer from './front_office/etatAnnulationSlice';
import etatMensuelDestinationReducer from './front_office/etatMensuelDestinationSlice';

import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

const appReducer = combineReducers({
  auth: authReducer,

  // Back-Office
  privileges: privilegesReducer,
  profiles: profilesReducer,
  autorisations: autorisationsReducer,
  users: usersReducer,
  transactionTypes: transactionTypesReducer,
  transactions: transactionsReducer,
  modules: modulesReducer,
  modeles: modelesReducer,
  commissions: commissionsReducer,
  numerotation: numerotationReducer,
  miles: milesReducer,
  pieces: piecesReducer,
  clientBeneficiaires: clientBeneficiairesReducer,
  clientFactures: clientFacturesReducer,
  devisTransactions: devisTransactionsReducer,
  categories: categoriesReducer,
  sousCategories: sousCategoriesReducer,
  articles: articlesReducer,
  fournisseurs: fournisseursReducer,

  // Front-Office
  dossierCommun: dossierCommunReducer,
  devisPrestation: devisPrestationReducer,
  todos: todosReducer,
  prospectionsEntetes: prospectionsEntetesReducer,
  prospectionsLignes: prospectionsLignesReducer,
  serviceSpecifique: serviceSpecifiqueReducer,
  devis: devisReducer,
  exigence: exigenceReducer,
  destination: destinationReducer,
  pays: paysReducer,
  associationsPaysVoyage: associationsPaysVoyageReducer,
  billet: billetReducer,
  suivi: suiviReducer,
  commentaire: commentaireReducer,
  etatVente: etatVenteReducer,
  etatAnnulation: etatAnnulationReducer,
  etatMensuelDestination: etatMensuelDestinationReducer,

  // Portail-client
  clientBeneficiaireInfos: clientBeneficiaireInfosReducer,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_APP') {
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Types pour TypeScript (infère l'état global)
export type RootState = ReturnType<typeof store.getState>;

// Étendu pour supporter les thunks (fix l'erreur dispatch)
export type AppDispatch = ThunkDispatch<RootState, unknown, Action> & typeof store.dispatch;