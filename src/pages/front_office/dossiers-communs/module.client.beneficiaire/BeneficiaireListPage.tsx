import { useEffect, useState } from 'react';
import { FiUsers, FiLoader, FiUser, FiPlus, FiClock, FiSearch, FiX} from 'react-icons/fi';
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

export default function BeneficiaireListPage({ clientFactureId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedBenefForPrefs, setSelectedBenefForPrefs] = useState<any>(null);

  const [search, setSearch] = useState('');

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
    dateApplication, user, beneficiaires } = currentDetail;

  // ── Filtrage par libellé ──
  const beneficiairesFiltres = beneficiaires.filter(({ clientBeneficiaire }) =>
    clientBeneficiaire.libelle
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <div className="py-2 px-4 space-y-4">

      {/* ── Carte client facturé ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-indigo-600">
              {libelle.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-800 truncate">{libelle}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statutBadge(statut)}`}>
                {statut}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${profilBadge(profilRisque)}`}>
                Risque {profilRisque.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                {code}
              </span>
              <span className="text-[11px] text-slate-400">
                {user ? `${user.prenom} ${user.nom}` : 'Aucun responsable'}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">
            {new Date(dateApplication).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Taux & crédits fusionnés */}
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">
            Taux &amp; crédits
          </p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
            {[
              { label: 'Taux base',     value: tauxBase      },
              { label: 'Vol dom.',      value: volDomestique },
              { label: 'Vol rég.',      value: volRegional   },
              { label: 'Long courrier', value: longCourrier  },
              { label: 'Comptant',      value: auComptant    },
              { label: 'Crédit 15j',   value: credit15jrs   },
              { label: 'Crédit 30j',   value: credit30jrs   },
              { label: 'Crédit 60j',   value: credit60jrs   },
              { label: 'Crédit 90j',   value: credit90jrs   },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col border border-slate-100 rounded-lg px-2 py-1.5">
                <span className="text-[10px] text-slate-400 leading-none mb-1">{label}</span>
                <span className="text-[13px] font-medium text-slate-700">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Liste bénéficiaires en grille ── */}
      <div className="">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              {beneficiaires.length} bénéficiaire{beneficiaires.length > 1 ? 's' : ''}
            </span>
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
        ) : (
          <div className="p-3 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {beneficiairesFiltres.map(({ clientBeneficiaireId, clientBeneficiaire }) => {
              const type = clientBeneficiaire.typeClient;

              // ── Thèmes par type de carte ──────────────────────────────
              const theme: Record<string, {
                card: string;         // fond de la carte
                chip: string;         // couleur puce
                stripe: string;       // bande déco monde
                label: string;        // texte du type
                subtext: string;      // texte secondaire (code, libellé)
                border: string;       // bordure carte
                badgeBg: string;      // fond badge statut
                badgeText: string;    // texte badge statut
                prefBtn: string;      // bouton préférences
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
                  {/* Fond avec grain de texture léger pour le côté "premium" */}
                  <div className={`absolute inset-0 ${t.card}`} />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                  {/* Motif monde plus discret */}
                  <div className={`absolute -right-10 -bottom-10 opacity-10 pointer-events-none ${t.label}`}>
                    <FiUsers size={180} />
                  </div>

                  <div className="relative z-10 h-full flex flex-col justify-between p-5">
                    <div className="flex justify-between items-start">
                      <div className='flex flex-col'>
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
                      <p className={`text-sm font-mono ${t.label} `}>
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