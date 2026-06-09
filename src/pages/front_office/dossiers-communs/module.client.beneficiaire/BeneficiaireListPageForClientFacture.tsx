import { useEffect, useState } from 'react';
import { FiUsers, FiLoader, FiSearch, FiX, FiChevronDown, FiList, FiGrid} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchClientFactureById, fetchPreferencesBeneficiaire } from '../../../../app/back_office/clientFacturesSlice';
import PreferencesModal from './PreferencesModal';

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

  const [clientOpen, setClientOpen] = useState(true);

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

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [clientFactureId, dispatch]);

  if (loadingDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
        <FiLoader className="animate-spin text-indigo-400 mb-3" size={24} />
        <p className="text-sm text-slate-400">Chargement...</p>
      </div>
    );
  }

  if (errorDetail) {
    return (
      <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm">
        {errorDetail}
      </div>
    );
  }

  if (!currentDetail) return null;

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
    <div className="py-2 px-4">
      {/* ── Carte client facturé (Version Minimaliste) ── */}
      <div className="group bg-white border border-slate-300 rounded-lg overflow-hidden transition-all hover:shadow-md">
        
        {/* Header ultra-compact */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50/50"
          onClick={() => setClientOpen(p => !p)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar minimaliste */}
            <div className="w-7 h-7 rounded bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300 text-[10px] font-bold text-slate-500 group-hover:bg-white transition-colors">
              {libelle.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex items-center gap-3 overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-800 truncate">{libelle}</h3>
              
              {/* Badges version simplifiée */}
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-tighter ${statutBadge(statut)}`}>
                  {statut}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-tighter ${profilBadge(profilRisque)}`}>
                  {profilRisque}
                </span>
              </div>

              {/* Code client discret */}
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 rounded border border-slate-300">
                {code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Responsable discret */}
            <span className="hidden lg:block text-[11px] text-slate-400 italic">
              {user ? `${user.prenom} ${user.nom}` : 'N/A'}
            </span>
            
            {/* Chevron plus petit */}
            <FiChevronDown 
              size={14} 
              className={`text-slate-400 transition-transform duration-200 ${clientOpen ? 'rotate-180' : '-rotate-90'}`} 
            />
          </div>
        </div>

        {/* Contenu compact en grille serrée */}
        <div className={`grid transition-all duration-200 ${clientOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden bg-slate-50/30 border-t border-slate-100">
            <div className="p-2 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1">
              {[
                { label: 'Taux base',  val: tauxBase },
                { label: 'Vol dom.',   val: volDomestique },
                { label: 'Vol rég.',   val: volRegional },
                { label: 'Long courrier',   val: longCourrier },
                { label: 'Comptant',    val: auComptant },
                { label: 'Crédit 15j',    val: credit15jrs },
                { label: 'Crédit 30j',    val: credit30jrs },
                { label: 'Crédit 60j',    val: credit60jrs },
                { label: 'Crédit 90j',    val: credit90jrs },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center justify-center py-1 border border-transparent hover:border-slate-200 hover:bg-white rounded transition-all">
                  <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">{item.label}</span>
                  <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{item.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Liste bénéficiaires en grille ── */}
      <div className="">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <FiUsers size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Bénéficiaires liés</span>
            </div>
            {/* ── Barre de recherche ── */}
            {beneficiaires.length > 0 && (
              <div className="px-4 py-2.5">
                <div className="relative">
                  <FiSearch
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un bénéficiaire..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <FiX size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
            {(['table', 'cards'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all
                  ${viewMode === mode
                    ? 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {mode === 'table' ? <FiList size={12} /> : <FiGrid size={12} />}
                {mode === 'table' ? 'Tableau' : 'Cartes'}
              </button>
            ))}
          </div>
        </div>

        

        {beneficiaires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <FiUsers className="text-slate-300" size={22} />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucun bénéficiaire lié</p>
            <p className="text-xs text-slate-400">Ce client facturé n'a pas encore de bénéficiaires.</p>
          </div>

        ) : beneficiairesFiltres.length === 0 ? (
          /* ── Aucun résultat de recherche ── */
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <FiSearch className="text-slate-300" size={18} />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucun résultat</p>
            <p className="text-xs text-slate-400">
              Aucun bénéficiaire ne correspond à &laquo;&nbsp;{search}&nbsp;&raquo;
            </p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              Effacer la recherche
            </button>
          </div>
        ) : viewMode === 'table' ? (

          /* ── Vue Tableau ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                    Bénéficiaire
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                    Code
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                    Type
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                    Statut
                  </th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beneficiairesFiltres.map(({ clientBeneficiaireId, clientBeneficiaire }) => (
                  <tr
                    key={clientBeneficiaireId}
                    onClick={() => dispatch(fetchPreferencesBeneficiaire(clientBeneficiaireId))}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${typeBadgeAvatar(clientBeneficiaire.typeClient)}`}>
                          {clientBeneficiaire.libelle.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800 text-[13px] truncate max-w-[200px]">
                          {clientBeneficiaire.libelle}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {clientBeneficiaire.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeBadgeClass(clientBeneficiaire.typeClient)}`}>
                        {clientBeneficiaire.typeClient === 'SIMPLE' ? 'Ponctuel' : clientBeneficiaire.typeClient}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statutBadge(clientBeneficiaire.statut)}`}>
                        {clientBeneficiaire.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50">
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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