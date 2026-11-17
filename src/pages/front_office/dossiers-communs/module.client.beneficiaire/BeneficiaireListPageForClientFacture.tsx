import { useEffect, useState } from 'react';
import { FiUsers, FiLoader, FiSearch, FiX, FiChevronDown, FiList, FiGrid, FiHash, FiArrowRight } from 'react-icons/fi';
import DossierActifCard from '../../../../components/CarteDossierActif/DossierActifCard';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchClientFactureById, fetchPreferencesBeneficiaire } from '../../../../app/back_office/clientFacturesSlice';
import PreferencesModal from './PreferencesModal';
import { formatStatut } from '../../../../utils/statut';

interface Props {
  clientFactureId: string;
}

const profilBadge = (profil: string) => ({
  FAIBLE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  MOYEN:  'bg-amber-50  text-amber-700  border border-amber-200',
  ELEVE:  'bg-red-50    text-red-700    border border-red-200',
}[profil] ?? 'bg-slate-100 text-slate-600');

const statutBadge = (statut: string) => ({
  ACTIF:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  INACTIF: 'bg-red-100    text-red-600    border border-red-200',
  CREER:   'bg-blue-50    text-blue-700   border border-blue-200',
}[statut] ?? 'bg-slate-100 text-slate-600');

const typeBadgeClass = (type: string) => ({
  SIMPLE:    'bg-blue-50   text-blue-700   border-blue-200',
  BRONZE:    'bg-orange-50 text-orange-700 border-orange-200',
  SILVER:    'bg-slate-100 text-slate-600  border-slate-300',
  GOLD:      'bg-amber-50  text-amber-700  border-amber-200',
  VIP:       'bg-purple-50 text-purple-700 border-purple-200',
  PLATINIUM: 'bg-slate-700 text-slate-100  border-slate-600',
}[type] ?? 'bg-slate-100 text-slate-600 border-slate-200');

const typeBadgeAvatar = (type: string) => ({
  SIMPLE:    'bg-blue-100   text-blue-700',
  BRONZE:    'bg-orange-100 text-orange-700',
  SILVER:    'bg-slate-200  text-slate-600',
  GOLD:      'bg-amber-100  text-amber-700',
  VIP:       'bg-purple-100 text-purple-700',
  PLATINIUM: 'bg-slate-700  text-slate-100',
}[type] ?? 'bg-slate-100 text-slate-500');

export default function BeneficiaireListPage({ clientFactureId }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  // Grille de commission du client facturé : repliée par défaut pour alléger l'en-tête
  const [tauxOpen, setTauxOpen] = useState(false);

  const [search, setSearch] = useState('');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const { currentDetail, loadingDetail, errorDetail, preferencesClientId } = useSelector(
    (state: RootState) => state.clientFactures
  );

  const activeBeneficiaire = preferencesClientId
    ? currentDetail?.beneficiaires.find(
        (b) => b.clientBeneficiaire.id === preferencesClientId
      )
    : null;

  // Les données de ce client facturé sont-elles déjà en mémoire (Redux) ?
  const dejaCharge = currentDetail?.id === clientFactureId;

  // On ne recharge que si le client facturé a changé : revenir sur l'onglet ne relance plus d'appel API.
  useEffect(() => {
    if (clientFactureId && !dejaCharge) dispatch(fetchClientFactureById(clientFactureId));
  }, [clientFactureId, dejaCharge, dispatch]);

  // Le chargement plein écran ne s'affiche que s'il n'y a encore rien à montrer pour ce client.
  if (loadingDetail && !dejaCharge) {
    return (
      <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
        <FiLoader className="animate-spin text-indigo-400 mb-3" size={24} />
        <p className="text-sm text-slate-400">Chargement...</p>
      </div>
    );
  }

  if (errorDetail && !dejaCharge) {
    return (
      <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm">
        {errorDetail}
      </div>
    );
  }

  if (!currentDetail || !dejaCharge) return null;

  const { code, libelle, statut, profilRisque, tauxBase, volDomestique, volRegional,
    longCourrier, auComptant, credit15jrs, credit30jrs, credit60jrs, credit90jrs,
    user, beneficiaires } = currentDetail;

  // ── Filtrage par libellé ──
  const beneficiairesFiltres = beneficiaires.filter(({ clientBeneficiaire }) =>
    clientBeneficiaire.libelle
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <div className="flex flex-col min-h-0">
      {/* ── En-tête : même structure que les onglets Prospection / Billets ── */}
      <div className="shrink-0 px-4 bg-slate-200 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <header className="my-4">
            <div className="flex items-center gap-2.5 px-4 py-2 text-sm font-bold rounded-lg bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50">
              <span className="flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold bg-blue-600 text-white">1</span>
              Liste des bénéficiaires
            </div>
          </header>
          <DossierActifCard />
        </div>

        {/* Barre d'outils : recherche, grille de commission, mode d'affichage */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50">
              <FiUsers size={14} className="text-slate-400" aria-hidden="true" />
              Bénéficiaires liés
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600">{beneficiaires.length}</span>
            </span>

            {beneficiaires.length > 0 && (
              <div className="relative">
                <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  aria-label="Rechercher un bénéficiaire"
                  className="w-56 pl-8 pr-8 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Effacer la recherche"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTauxOpen((o) => !o)}
              aria-expanded={tauxOpen}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                tauxOpen
                  ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Grille de commission
              <FiChevronDown size={13} className={`transition-transform ${tauxOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            <div className="flex rounded-lg bg-slate-300 p-0.5 gap-0.5">
              {(['table', 'cards'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {mode === 'table' ? <FiList size={12} /> : <FiGrid size={12} />}
                  {mode === 'table' ? 'Tableau' : 'Cartes'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grille de commission du client facturé (repliée par défaut) */}
        {tauxOpen && (
          <div className="mb-2 rounded-lg bg-white ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{libelle}</span>
              <span className="font-mono">{code}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statutBadge(statut)}`}>{formatStatut(statut)}</span>
              <span>Profil de risque : <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${profilBadge(profilRisque)}`}>{formatStatut(profilRisque)}</span></span>
              {user && <span>Responsable : <span className="font-medium text-slate-700">{user.prenom} {user.nom}</span></span>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 divide-x divide-slate-100">
              {[
                { label: 'Taux de base',  val: tauxBase },
                { label: 'Vol domestique', val: volDomestique },
                { label: 'Vol régional',  val: volRegional },
                { label: 'Long courrier', val: longCourrier },
                { label: 'Comptant',      val: auComptant },
                { label: 'Crédit 15 j',   val: credit15jrs },
                { label: 'Crédit 30 j',   val: credit30jrs },
                { label: 'Crédit 60 j',   val: credit60jrs },
                { label: 'Crédit 90 j',   val: credit90jrs },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center py-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">{item.val} %</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Liste des bénéficiaires ── */}
      <div className="py-4">
        {beneficiaires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <FiUsers className="text-slate-300" size={26} />
            </div>
            <p className="text-base font-semibold text-slate-500 mb-1">Aucun bénéficiaire lié</p>
            <p className="text-sm text-slate-400">Ce client facturé n'a pas encore de bénéficiaires.</p>
          </div>

        ) : beneficiairesFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <FiSearch className="text-slate-300" size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Aucun résultat</p>
            <p className="text-sm text-slate-400">
              Aucun bénéficiaire ne correspond à &laquo;&nbsp;{search}&nbsp;&raquo;
            </p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Effacer la recherche
            </button>
          </div>
        ) : viewMode === 'table' ? (

          /* ── Vue Tableau (même style que les listes Prospection / Billets) ── */
          <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-200">
                    {['Bénéficiaire', 'Code', 'Type', 'Statut', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {beneficiairesFiltres.map(({ clientBeneficiaireId, clientBeneficiaire }) => (
                    <tr key={clientBeneficiaireId} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${typeBadgeAvatar(clientBeneficiaire.typeClient)}`}>
                            {clientBeneficiaire.libelle.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-800 truncate max-w-[260px]">
                            {clientBeneficiaire.libelle}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <FiHash size={12} className="text-slate-400" aria-hidden="true" />
                          {clientBeneficiaire.code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${typeBadgeClass(clientBeneficiaire.typeClient)}`}>
                          {clientBeneficiaire.typeClient === 'SIMPLE' ? 'Ponctuel' : formatStatut(clientBeneficiaire.typeClient)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statutBadge(clientBeneficiaire.statut)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
                          {formatStatut(clientBeneficiaire.statut)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => dispatch(fetchPreferencesBeneficiaire(clientBeneficiaireId))}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          Préférences <FiArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* ── Vue Cartes ── */
          <div
            className="p-3 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {beneficiairesFiltres.map(({ clientBeneficiaireId, clientBeneficiaire }) => {
              const type = clientBeneficiaire.typeClient;

              const theme: Record<string, {
                card: string;
                chip: string;
                stripe: string;
                label: string;
                subtext: string;
                border: string;
                badgeBg: string;
                badgeText: string;
                prefBtn: string;
              }> = {
                SIMPLE: {
                  card:      'bg-gradient-to-br from-blue-200 to-blue-300',
                  chip:      'bg-slate-300',
                  stripe:    'opacity-10',
                  label:     'text-slate-700',
                  subtext:   'text-slate-700',
                  border:    'border-slate-200',
                  badgeBg:   'bg-white/15',
                  badgeText: 'text-slate-500',
                  prefBtn:   'bg-white/10 hover:bg-white/20 text-slate-700 border-white/20',
                },
                BRONZE: {
                  card:      'bg-gradient-to-br from-orange-700 via-orange-600 to-amber-700',
                  chip:      'bg-amber-300',
                  stripe:    'opacity-15',
                  label:     'text-orange-100',
                  subtext:   'text-orange-200',
                  border:    'border-orange-500',
                  badgeBg:   'bg-white/15',
                  badgeText: 'text-white',
                  prefBtn:   'bg-white/10 hover:bg-white/20 text-white border-white/20',
                },
                SILVER: {
                  card:      'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500',
                  chip:      'bg-slate-200',
                  stripe:    'opacity-20',
                  label:     'text-slate-800',
                  subtext:   'text-slate-700',
                  border:    'border-slate-300',
                  badgeBg:   'bg-white/25',
                  badgeText: 'text-slate-800',
                  prefBtn:   'bg-white/20 hover:bg-white/35 text-slate-800 border-white/30',
                },
                GOLD: {
                  card:      'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-600',
                  chip:      'bg-yellow-200',
                  stripe:    'opacity-20',
                  label:     'text-yellow-900',
                  subtext:   'text-yellow-800',
                  border:    'border-yellow-400',
                  badgeBg:   'bg-black/15',
                  badgeText: 'text-yellow-900',
                  prefBtn:   'bg-black/10 hover:bg-black/20 text-yellow-900 border-black/15',
                },
                VIP: {
                  card:      'bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700',
                  chip:      'bg-purple-200',
                  stripe:    'opacity-15',
                  label:     'text-purple-100',
                  subtext:   'text-purple-200',
                  border:    'border-purple-500',
                  badgeBg:   'bg-white/15',
                  badgeText: 'text-white',
                  prefBtn:   'bg-white/10 hover:bg-white/20 text-white border-white/20',
                },
                PLATINIUM: {
                  card:      'bg-gradient-to-br from-slate-600 to-slate-800',
                  chip:      'bg-slate-300',
                  stripe:    'opacity-10',
                  label:     'text-slate-200',
                  subtext:   'text-slate-300',
                  border:    'border-slate-500',
                  badgeBg:   'bg-white/15',
                  badgeText: 'text-white',
                  prefBtn:   'bg-white/10 hover:bg-white/20 text-white border-white/20',
                },
              };

              const t = theme[type] ?? theme['SIMPLE'];

              return (
                <div
                  key={clientBeneficiaireId}
                  onClick={() => dispatch(fetchPreferencesBeneficiaire(clientBeneficiaireId))}
                  className={`cursor-pointer relative rounded-xl overflow-hidden border ${t.border} shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl duration-300`}
                  style={{ aspectRatio: '1.586 / 1' }}
                >
                  <div className={`absolute inset-0 ${t.card}`} />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                  <div className={`absolute -right-10 -bottom-10 opacity-10 pointer-events-none ${t.label}`}>
                    <FiUsers size={180} />
                  </div>

                  <div className="relative z-10 h-full flex flex-col justify-between p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${t.label} opacity-60`}>
                          Statut :
                        </p>
                        <p className={`text-[10px] uppercase ${t.label}`}>
                          {type === 'SIMPLE' ? 'Ponctuel' : type}
                        </p>
                      </div>
                      <button
                        className={`cursor-pointer px-3 py-1.5 text-[10px] font-bold rounded-md border backdrop-blur-md transition-all active:scale-95 ${t.prefBtn}`}
                      >
                        DÉTAILS
                      </button>
                    </div>

                    <div className="mt-2">
                      <p className={`text-sm font-mono ${t.label}`}>
                        {clientBeneficiaire.code.match(/.{1,4}/g)?.join(' ') || clientBeneficiaire.code}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="min-w-0">
                        <p className={`text-[9px] uppercase tracking-widest ${t.subtext} mb-0.5`}>
                          Nom
                        </p>
                        <p className={`text-sm font-bold truncate ${t.label} leading-none`}>
                          {clientBeneficiaire.libelle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {preferencesClientId && (
        <PreferencesModal
          clientName={activeBeneficiaire?.clientBeneficiaire.libelle ?? ''}
          clientRef={activeBeneficiaire?.clientBeneficiaire.code ?? ''}
          clientType={activeBeneficiaire?.clientBeneficiaire.typeClient}
          clientStatus={activeBeneficiaire?.clientBeneficiaire.statut}
        />
      )}
    </div>
  );
}