import { FiX, FiEdit3, FiPlus, FiSave, FiPercent } from 'react-icons/fi';
import type { ProspectionEntete } from '../../app/front_office/prospectionsEntetesSlice';
import type { AppDispatch, RootState } from '../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { clearCommentaireFournisseur, fetchLastCommentaireFournisseur } from '../../app/front_office/fournisseurCommentaire/fournisseurCommentaireSlice';
import FournisseurAlerteBadge from '../fournisseurAlerteBadget/FournisseurAlerteBadge';

interface ProspectionModalsProps {
  selectedEntete: ProspectionEntete | null;
  modalCommission: number;
  setModalCommission: (val: number) => void;
  isSaving: boolean;
  onCloseEdit: () => void;
  onSaveEdit: () => void;
  showCreateModal: boolean;
  newEntete: { fournisseurId: string; credit: string; typeVol: string };
  setNewEntete: (val: any) => void;
  isCreating: boolean;
  fournisseurs: any[];
  fournisseursLoading: boolean;
  onCloseCreate: () => void;
  onConfirmCreate: () => void;
}

// ── Petit composant label/valeur en lecture seule ─────────────────────────────
const ReadField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
  </div>
);

// ── Wrapper backdrop ──────────────────────────────────────────────────────────
const Backdrop = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    {children}
  </div>
);

// ── Header modal réutilisable ─────────────────────────────────────────────────
const ModalHeader = ({
  icon,
  gradient,
  title,
  subtitle,
  onClose,
  disabled,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  disabled?: boolean;
}) => (
  <div className="relative overflow-hidden">
    {/* Barre gradient en haut */}
    <div className={`h-1 bg-linear-to-r ${gradient}`} />

    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 bg-linear-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}>
          <span className="text-white">{icon}</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={disabled}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
      >
        <FiX size={18} />
      </button>
    </div>

    {/* Séparateur */}
    <div className="mx-6 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
  </div>
);

// ── Composant principal ───────────────────────────────────────────────────────
export default function ProspectionModals({
  selectedEntete,
  modalCommission,
  setModalCommission,
  isSaving,
  onCloseEdit,
  onSaveEdit,
  showCreateModal,
  newEntete,
  setNewEntete,
  isCreating,
  fournisseurs,
  fournisseursLoading,
  onCloseCreate,
  onConfirmCreate,
}: ProspectionModalsProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { lastComment, confirmed } = useSelector(
    (state: RootState) => state.fournisseurCommentaire
  );

  const upper = lastComment?.alerte?.toUpperCase() ?? '';
  const isBlocked =
    upper === 'TRES_ELEVE' ||
    (upper === 'ELEVE' && !confirmed);

  // Classes communes pour les selects / inputs
  const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      {/* ════════════════════════════════════════
          MODAL ÉDITION
      ════════════════════════════════════════ */}
      {selectedEntete && (
        <Backdrop>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <ModalHeader
              icon={<FiEdit3 size={16} />}
              gradient="from-indigo-500 to-violet-500"
              title="Modifier l'en-tête"
              subtitle={`N° ${selectedEntete.numeroEntete}`}
              onClose={onCloseEdit}
              disabled={isSaving}
            />

            <div className="px-6 py-5 space-y-4">
              {/* Infos en lecture seule */}
              <div className="grid grid-cols-2 gap-3">
                <ReadField label="N° En-tête"  value={selectedEntete.numeroEntete} />
                <ReadField label="Type de vol" value={selectedEntete.typeVol} />
                <ReadField label="Fournisseur" value={selectedEntete.fournisseur?.libelle} />
                <ReadField label="Crédit"      value={selectedEntete.credit} />
              </div>

              {/* Commissions */}
              <div className="grid grid-cols-2 gap-3">
                <ReadField label="Comm. proposée" value={`${selectedEntete.commissionPropose} %`} />

                {/* Seul champ éditable */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Comm. appliquée <span className="text-indigo-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={modalCommission}
                      onChange={(e) => setModalCommission(Number(e.target.value) || 0)}
                      className={`${inputCls} pr-10 font-semibold text-indigo-600`}
                      disabled={isSaving}
                    />
                    <FiPercent
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={onCloseEdit}
                disabled={isSaving}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onSaveEdit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <FiSave size={15} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* ════════════════════════════════════════
          MODAL CRÉATION
      ════════════════════════════════════════ */}
      {showCreateModal && (
        <Backdrop>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <ModalHeader
              icon={<FiPlus size={16} />}
              gradient="from-yellow-400 to-yellow-500"
              title="Nouvel en-tête"
              subtitle="Prospection supplémentaire"
              onClose={onCloseCreate}
              disabled={isCreating}
            />

            <div className="px-6 py-5 space-y-4">

              {/* Fournisseur */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Fournisseur <span className="text-red-400">*</span>
                </label>
                {fournisseursLoading ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Chargement...</span>
                  </div>
                ) : (
                  <select
                    value={newEntete.fournisseurId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setNewEntete({ ...newEntete, fournisseurId: id });
                      if (id) dispatch(fetchLastCommentaireFournisseur(id));
                      else    dispatch(clearCommentaireFournisseur());
                    }}
                    className={inputCls}
                    required
                    disabled={isCreating}
                  >
                    <option value="">— Choisir un fournisseur —</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} — {f.libelle}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Crédit + Type vol côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Crédit
                  </label>
                  <select
                    value={newEntete.credit}
                    onChange={(e) => setNewEntete({ ...newEntete, credit: e.target.value })}
                    className={inputCls}
                    disabled={isCreating}
                  >
                    <option value="CREDIT_0">Crédit 0</option>
                    <option value="CREDIT_15">Crédit 15</option>
                    <option value="CREDIT_30">Crédit 30</option>
                    <option value="CREDIT_60">Crédit 60</option>
                    <option value="CREDIT_90">Crédit 90</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Type de vol
                  </label>
                  <select
                    value={newEntete.typeVol}
                    onChange={(e) => setNewEntete({ ...newEntete, typeVol: e.target.value })}
                    className={inputCls}
                    disabled={isCreating}
                  >
                    <option value="NATIONAL">Nationale</option>
                    <option value="LONG_COURRIER">Long courrier</option>
                    <option value="REGIONAL">Régionale</option>
                  </select>
                </div>
              </div>

              {/* Message bloqué */}
              {isBlocked && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  <p className="text-xs text-red-600 font-medium leading-relaxed">
                    Ce fournisseur est bloqué en raison d'une alerte de niveau élevé.
                    La création est désactivée.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={onCloseCreate}
                disabled={isCreating}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirmCreate}
                disabled={isCreating || !newEntete.fournisseurId || isBlocked}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <FiPlus size={15} />
                    Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      <FournisseurAlerteBadge />
    </>
  );
}