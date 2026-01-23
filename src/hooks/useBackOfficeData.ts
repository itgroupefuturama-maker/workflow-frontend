// Récupération des données de la back_office

// src/hooks/useBackOfficeData.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';

// Importe tous tes thunks back-office
import { fetchPrivileges } from '../app/back_office/privilegesSlice';
import { fetchProfiles } from '../app/back_office/profilesSlice';
import { fetchAutorisations } from '../app/back_office/autorisationsSlice';
import { fetchUsers } from '../app/back_office/usersSlice';
import { fetchTransactionTypes } from '../app/back_office/transactionTypesSlice';
import { fetchTransactions } from '../app/back_office/transactionsSlice';
import { fetchModules } from '../app/back_office/modulesSlice';
import { fetchModeles } from '../app/back_office/modelesSlice';
import { fetchCommissions } from '../app/back_office/commissionsSlice';
import { fetchDossiers } from '../app/back_office/numerotationSlice';
import { fetchMiles } from '../app/back_office/milesSlice';
import { fetchPieces } from '../app/back_office/piecesSlice';
import { fetchClientBeneficiaires } from '../app/back_office/clientBeneficiairesSlice';
import { fetchDevisTransactions } from '../app/back_office/devisTransactionsSlice';
import { fetchClientFactures } from '../app/back_office/clientFacturesSlice';
import { fetchArticles } from '../app/back_office/articlesSlice';
import { fetchFournisseurs } from '../app/back_office/fournisseursSlice';

export const useBackOfficeData = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Tous les selectors en une fois
  const backOfficeData = useSelector((state: RootState) => ({
    privileges: state.privileges,
    profiles: state.profiles,
    autorisations: state.autorisations,
    users: state.users,
    transactionTypes: state.transactionTypes,
    transactions: state.transactions,
    modules: state.modules,
    modeles: state.modeles,
    commissions: state.commissions,
    numerotation: state.numerotation,
    miles: state.miles,
    pieces: state.pieces,
    clientBeneficiaires: state.clientBeneficiaires,
    devisTransactions: state.devisTransactions,
    clientFactures: state.clientFactures,
    articles: state.articles,
    fournisseurs: state.fournisseurs,
  }));

  const {
    privileges,
    profiles,
    autorisations,
    users,
    transactionTypes,
    transactions,
    modules,
    modeles,
    commissions,
    numerotation,
    miles,
    pieces,
    clientBeneficiaires,
    devisTransactions,
    clientFactures,
    articles,
    fournisseurs,
  } = backOfficeData;

  useEffect(() => {
    const loadData = () => {
      if (privileges.data.length === 0 && !privileges.loading) dispatch(fetchPrivileges());
      if (profiles.data.length === 0 && !profiles.loading) dispatch(fetchProfiles());
      if (autorisations.data.length === 0 && !autorisations.loading) dispatch(fetchAutorisations());
      if (users.data.length === 0 && !users.loading) dispatch(fetchUsers());
      if (transactionTypes.data.length === 0 && !transactionTypes.loading) dispatch(fetchTransactionTypes());
      if (transactions.data.length === 0 && !transactions.loading) dispatch(fetchTransactions());
      if (modules.data.length === 0 && !modules.loading) dispatch(fetchModules());
      if (modeles.data.length === 0 && !modeles.loading) dispatch(fetchModeles());
      if (commissions.data.length === 0 && !commissions.loading) dispatch(fetchCommissions());
      if (numerotation.data.length === 0 && !numerotation.loading) dispatch(fetchDossiers());
      if (miles.data.length === 0 && !miles.loading) dispatch(fetchMiles());
      if (pieces.data.length === 0 && !pieces.loading) dispatch(fetchPieces());
      if (clientBeneficiaires.data.length === 0 && !clientBeneficiaires.loading) dispatch(fetchClientBeneficiaires());
      if (devisTransactions.data.length === 0 && !devisTransactions.loading) dispatch(fetchDevisTransactions());
      if (clientFactures.data.length === 0 && !clientFactures.loading) dispatch(fetchClientFactures());
      if (articles.data.length === 0 && !articles.loading) dispatch(fetchArticles());
      if (fournisseurs.data.length === 0 && !fournisseurs.loading) dispatch(fetchFournisseurs());
    };

    loadData();
  }, [dispatch, privileges, profiles, autorisations, users, transactionTypes, transactions, modules, modeles, commissions, numerotation, miles, pieces, clientBeneficiaires, devisTransactions, clientFactures, articles, fournisseurs]);

  // Fonction refresh manuelle
  const refreshAll = () => {
    dispatch(fetchPrivileges());
    dispatch(fetchProfiles());
    dispatch(fetchAutorisations());
    dispatch(fetchUsers());
    dispatch(fetchTransactionTypes());
    dispatch(fetchTransactions());
    dispatch(fetchModules());
    dispatch(fetchModeles());
    dispatch(fetchCommissions());
    dispatch(fetchDossiers());
    dispatch(fetchMiles());
    dispatch(fetchPieces());
    dispatch(fetchClientBeneficiaires());
    dispatch(fetchDevisTransactions());
    dispatch(fetchClientFactures());
    dispatch(fetchArticles());
    dispatch(fetchFournisseurs());
  };

  const anyLoading = Object.values(backOfficeData).some(slice => slice.loading);

  return {
    ...backOfficeData,
    refreshAll,
    anyLoading,
  };
};