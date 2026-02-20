import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import { PARAMETRES } from '../constants/parametres';
import type { RootState, AppDispatch } from '../app/store';
import { FiRefreshCw, FiArrowRight } from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

function ListeParametre() {
  const dispatch = useAppDispatch();

  const { loading: privilegesLoading } = useSelector((state: RootState) => state.privileges);
  const { loading: profilesLoading } = useSelector((state: RootState) => state.profiles);
  const { loading: autorisationsLoading } = useSelector((state: RootState) => state.autorisations);
  const { loading: usersLoading } = useSelector((state: RootState) => state.users);
  const { loading: transactionTypesLoading } = useSelector((state: RootState) => state.transactionTypes);
  const { loading: transactionsLoading } = useSelector((state: RootState) => state.transactions);
  const { loading: modulesLoading } = useSelector((state: RootState) => state.modules);
  const { loading: modelesLoading } = useSelector((state: RootState) => state.modeles);
  const { loading: commissionLoading } = useSelector((state: RootState) => state.commissions);
  const { loading: numerotationLoading } = useSelector((state: RootState) => state.numerotation);
  const { loading: milesLoading } = useSelector((state: RootState) => state.miles);
  const { loading: piecesLoading } = useSelector((state: RootState) => state.pieces);
  const { loading: clientBeneficiairesLoading } = useSelector((state: RootState) => state.clientBeneficiaires);
  const { loading: devisTransactionsLoading } = useSelector((state: RootState) => state.devisTransactions);
  const { loading: clientFacturesLoading } = useSelector((state: RootState) => state.clientFactures);
  const { loading: articlesLoading } = useSelector((state: RootState) => state.articles);
  const { loading: fournisseursLoading } = useSelector((state: RootState) => state.fournisseurs);

  const anyLoading =
    privilegesLoading || profilesLoading || autorisationsLoading || usersLoading ||
    transactionTypesLoading || transactionsLoading || modulesLoading || modelesLoading ||
    commissionLoading || numerotationLoading || milesLoading || piecesLoading ||
    clientBeneficiairesLoading || devisTransactionsLoading || clientFacturesLoading ||
    articlesLoading || fournisseursLoading;

  const handleRefreshAll = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Back Office
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Console d'administration
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configurez et gérez les paramètres fondamentaux de la plateforme Al Bouraq.
              </p>
            </div>

            <button
              onClick={handleRefreshAll}
              disabled={anyLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <FiRefreshCw size={14} className={anyLoading ? 'animate-spin' : ''} />
              {anyLoading ? 'Actualisation...' : 'Tout actualiser'}
            </button>
          </div>

          {/* Ligne séparatrice */}
          <div className="mt-6 h-px bg-gray-200" />
        </div>

        {/* ── Compteur ── */}
        <p className="text-xs text-gray-400 font-medium mb-5 uppercase tracking-widest">
          {PARAMETRES.length} modules disponibles
        </p>

        {/* ── Grille de cartes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PARAMETRES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={`/parametre/${item.path}`}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]"
              >
                {/* Icône */}
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-gray-100 text-blue-500 group-hover:bg-gray-900 group-hover:text-white transition-all duration-200">
                    <Icon size={18} />
                  </div>
                  <FiArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 -translate-y-0.5 transition-all duration-200"
                  />
                </div>

                {/* Label */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 leading-snug">
                    {item.label}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Gérer les configurations
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ListeParametre;