import { useEffect } from 'react';
import { FiUsers, FiHash, FiCheckCircle, FiXCircle, FiLoader, FiUser, FiPlus, FiEye, FiSettings, FiClock, FiTrash2, FiAward, FiStar } from 'react-icons/fi';
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

const typeClientBanner = (type: string) => ({
  SIMPLE: 'bg-gray-200 text-gray-700',
  BRONZE: 'bg-orange-200 text-orange-900',
  SILVER: 'bg-blue-200 text-blue-900',
  GOLD:   'bg-amber-300 text-amber-900',
  VIP:    'bg-purple-200 text-purple-900',
}[type] ?? 'bg-slate-100 text-slate-600');

const typeClientIcon = (type: string) => ({
  SIMPLE: <FiUser size={13} />,
  BRONZE: <FiAward size={13} />,
  SILVER: <FiAward size={13} />,
  GOLD:   <FiAward size={13} />,
  VIP:    <FiStar size={13} />,
}[type] ?? null);

const statutIcon = (statut: string) => {
  if (statut === 'ACTIF')   return <FiCheckCircle size={11} />;
  if (statut === 'INACTIF') return <FiXCircle     size={11} />;
  return null;
};

const MetricCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-slate-50 rounded-lg px-3 py-2.5">
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-base font-semibold text-slate-800">{value}</p>
  </div>
);

export default function BeneficiaireListPage({ clientFactureId }: Props) {
  const dispatch = useDispatch<AppDispatch>();

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
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FiUsers size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Bénéficiaires liés</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              {beneficiaires.length} bénéficiaire{beneficiaires.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {/* TODO: handleAjouter */}}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title="Ajouter un bénéficiaire"
            >
              <FiPlus size={13} className="text-slate-400" />
            </button>
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
        ) : (
          <div className="p-3 grid gap-2.5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {beneficiaires.map(({ clientBeneficiaireId, clientBeneficiaire }) => (
              <div
                key={clientBeneficiaireId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
              >
                {/* Bannière typeClient ← NOUVEAU */}
                <div className={`flex items-center justify-between px-3 py-2 ${typeClientBanner(clientBeneficiaire.typeClient)}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {clientBeneficiaire.typeClient}
                  </span>
                  {typeClientIcon(clientBeneficiaire.typeClient)}
                </div>

                {/* Corps de la carte */}
                <div className="p-3.5 flex flex-col gap-2.5 flex-1">
                  {/* Identité */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-blue-600">
                        {clientBeneficiaire.libelle.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate leading-snug">
                        {clientBeneficiaire.libelle}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        {clientBeneficiaire.code}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Bas : statut + actions */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statutBadge(clientBeneficiaire.statut)}`}>
                      {statutIcon(clientBeneficiaire.statut)}
                      {clientBeneficiaire.statut}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {/* TODO */}}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        title="Voir les détails"
                      >
                        <FiEye size={12} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => {/* TODO */}}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="Préférences"
                      >
                        <FiSettings size={12} className="text-slate-400" />
                      </button>
                      {/* Bouton Préférences */}
                      <button
                        onClick={() => dispatch(fetchPreferencesBeneficiaire(clientBeneficiaireId))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="Historique"
                      >
                        <FiClock size={12} className="text-slate-400" /> 
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {preferencesClientId && (
        <PreferencesModal
          clientName={activeBeneficiaire?.clientBeneficiaire.libelle ?? ''}
        />
      )}
    </div>
  );
}