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
import { PARAMETRES_CATEGORIES } from '../constants/parametres';
import type { RootState, AppDispatch } from '../app/store';
import { FiRefreshCw, FiChevronRight, FiActivity } from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

function ListeParametre() {
  const dispatch = useAppDispatch();

  const { loading: privilegesLoading } = useSelector((s: RootState) => s.privileges);
  const { loading: profilesLoading } = useSelector((s: RootState) => s.profiles);
  const { loading: autorisationsLoading } = useSelector((s: RootState) => s.autorisations);
  const { loading: usersLoading } = useSelector((s: RootState) => s.users);
  const { loading: transactionTypesLoading } = useSelector((s: RootState) => s.transactionTypes);
  const { loading: transactionsLoading } = useSelector((s: RootState) => s.transactions);
  const { loading: modulesLoading } = useSelector((s: RootState) => s.modules);
  const { loading: modelesLoading } = useSelector((s: RootState) => s.modeles);
  const { loading: commissionLoading } = useSelector((s: RootState) => s.commissions);
  const { loading: numerotationLoading } = useSelector((s: RootState) => s.numerotation);
  const { loading: milesLoading } = useSelector((s: RootState) => s.miles);
  const { loading: piecesLoading } = useSelector((s: RootState) => s.pieces);
  const { loading: clientBeneficiairesLoading } = useSelector((s: RootState) => s.clientBeneficiaires);
  const { loading: devisTransactionsLoading } = useSelector((s: RootState) => s.devisTransactions);
  const { loading: clientFacturesLoading } = useSelector((s: RootState) => s.clientFactures);
  const { loading: articlesLoading } = useSelector((s: RootState) => s.articles);
  const { loading: fournisseursLoading } = useSelector((s: RootState) => s.fournisseurs);

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

  const totalItems = PARAMETRES_CATEGORIES.reduce(
    (total, category) => total + category.items.length,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

        {/* En-tête compact */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <FiActivity size={19} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Console d'administration
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Gérez les accès, les transactions et les configurations.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 sm:inline-flex">
              {totalItems} configurations
            </span>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={Boolean(anyLoading)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <FiRefreshCw
                size={15}
                className={anyLoading ? 'animate-spin' : ''}
              />
              <span>{anyLoading ? 'Actualisation...' : 'Actualiser'}</span>
            </button>
          </div>
        </header>

        {/* Catégories de paramètres */}
        <div className="space-y-6">
          {PARAMETRES_CATEGORIES.map((category) => (
            <section key={category.key}>
              {/* Titre de catégorie */}
              <div className="mb-3 flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${category.iconBg}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${category.iconColor.replace(
                      'text-',
                      'bg-'
                    )}`}
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800">
                    {category.label}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {category.desc}
                  </p>
                </div>

                <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                  {category.items.length}
                </span>
              </div>

              {/* Grille compacte */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {category.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={`/parametre/${item.path}`}
                      className="group flex min-h-[68px] min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 transition-colors hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:gap-3 sm:px-3.5"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${category.iconBg} ${category.iconColor} transition-colors group-hover:bg-indigo-600 group-hover:text-white`}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-slate-800 group-hover:text-indigo-700 sm:text-sm">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Configurer
                        </p>
                      </div>

                      <FiChevronRight
                        size={15}
                        className="shrink-0 text-slate-100 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Pied de page */}
        <footer className="mt-7 border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Copyright © {new Date().getFullYear()} ABT IT Développement
          </p>
        </footer>
      </div>
    </main>
  );
}

export default ListeParametre;