import { FiX, FiEdit3, FiPlus, FiSave, FiPercent, FiAlertCircle } from 'react-icons/fi';
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
  clientFacture?: any;
  fournisseursLoading: boolean;
  onCloseCreate: () => void;
  onConfirmCreate: () => void;
}

// ── Petit composant label/valeur en lecture seule ─────────────────────────────
const ReadField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-base font-semibold text-gray-900">{value || '—'}</p>
  </div>
);

// ── Composant pour mettre en évidence le client et le crédit ──────────────────
const ClientHighlight = ({ clientFacture }: { clientFacture?: any }) => {
  if (!clientFacture) return null;
  
  return (
    <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Client facturé</p>
          <p className="text-lg font-bold text-blue-900">{clientFacture.libelle}</p>
          <p className="text-sm text-blue-700 mt-1">{clientFacture.code}</p>
        </div>
        <div className="pt-3 border-t border-blue-200">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Crédit par défaut</p>
          <div className="flex items-center gap-2">
            <div className="inline-block bg-white px-4 py-2 rounded-lg border border-blue-300">
              <span className="text-base font-bold text-blue-900">{clientFacture.creditdefault} Jours</span>
            </div>
            <span className="text-sm text-blue-700">Recommandé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Wrapper backdrop ──────────────────────────────────────────────────────────
const Backdrop = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    {children}
  </div>
);

// ── Header modal réutilisable ─────────────────────────────────────────────────
const ModalHeader = ({
  icon,
  title,
  subtitle,
  onClose,
  disabled,
  accentColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  disabled?: boolean;
  accentColor: 'blue' | 'amber';
}) => {
  const colorMap = {
    blue: 'bg-blue-600 text-blue-50',
    amber: 'bg-amber-600 text-amber-50',
  };

  return (
    <div>
      <div className={`${colorMap[accentColor]} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-sm opacity-90 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={disabled}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
        >
          <FiX size={20} />
        </button>
      </div>
      <div className="h-px bg-gray-200" />
    </div>
  );
};

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
  clientFacture,
  fournisseursLoading,
  onCloseCreate,
  onConfirmCreate,
}: ProspectionModalsProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { lastComment, confirmed } = useSelector(
    (state: RootState) => state.fournisseurCommentaire
  );

  const upper = lastComment?.alerte?.toUpperCase() ?? '';
  const isBlocked = upper === 'TRES_ELEVE' || (upper === 'ELEVE' && !confirmed);

  // Classes communes
  const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const labelCls = "block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-2";

  return (
    <>
      {/* ════════════════════════════════════════
          MODAL ÉDITION
      ════════════════════════════════════════ */}
      {selectedEntete && (
        <Backdrop>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ModalHeader
              icon={<FiEdit3 size={18} />}
              title="Modifier l'en-tête"
              subtitle={`N° ${selectedEntete.numeroEntete}`}
              onClose={onCloseEdit}
              disabled={isSaving}
              accentColor="blue"
            />

            <div className="p-6 space-y-6">
              {/* Section Client facturé - mise en évidence */}
              <ClientHighlight clientFacture={clientFacture} />

              {/* Informations de l'en-tête */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Détails de l'en-tête</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ReadField label="N° En-tête" value={selectedEntete.numeroEntete} />
                  <ReadField label="Type de vol" value={selectedEntete.typeVol} />
                  <ReadField label="Fournisseur" value={selectedEntete.fournisseur?.libelle} />
                  <ReadField label="Crédit" value={selectedEntete.credit} />
                </div>
              </div>

              {/* Commission */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Commission</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ReadField label="Commission proposée" value={`${selectedEntete.commissionPropose}%`} />
                  
                  <div>
                    <label className={labelCls}>
                      Commission appliquée <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={modalCommission}
                        onChange={(e) => setModalCommission(Number(e.target.value) || 0)}
                        className={`${inputCls} pr-10 font-semibold text-blue-600`}
                        disabled={isSaving}
                      />
                      <FiPercent
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={onCloseEdit}
                disabled={isSaving}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onSaveEdit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <ModalHeader
              icon={<FiPlus size={18} />}
              title="Nouvelle prospection"
              subtitle="Ajouter un nouvel en-tête"
              onClose={onCloseCreate}
              disabled={isCreating}
              accentColor="amber"
            />

            <div className="p-6 space-y-6">
              {/* Section Client facturé - mise en évidence */}
              <ClientHighlight clientFacture={clientFacture} />

              {/* Section Fournisseur */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Sélectionner un fournisseur</h4>
                <label className={labelCls}>
                  Fournisseur <span className="text-red-500">*</span>
                </label>
                {fournisseursLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-300">
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Chargement des fournisseurs...</span>
                  </div>
                ) : (
                  <select
                    value={newEntete.fournisseurId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setNewEntete({ ...newEntete, fournisseurId: id });
                      if (id) dispatch(fetchLastCommentaireFournisseur(id));
                      else dispatch(clearCommentaireFournisseur());
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

              {/* Section Crédit et Type de vol */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Crédit</label>
                  <select
                    value={newEntete.credit}
                    onChange={(e) => setNewEntete({ ...newEntete, credit: e.target.value })}
                    className={inputCls}
                    disabled={isCreating}
                  >
                    {/* Le crédit par défaut du client est la première option */}
                    {clientFacture?.creditdefault && (
                      <option value={clientFacture.creditdefault} className="font-semibold">
                        ✓ {clientFacture.creditdefault} (Recommandé)
                      </option>
                    )}
                    <option value="CREDIT_0">Crédit 0 (Au comptant)</option>
                    <option value="CREDIT_15">Crédit 15 jours</option>
                    <option value="CREDIT_30">Crédit 30 jours</option>
                    <option value="CREDIT_60">Crédit 60 jours</option>
                    <option value="CREDIT_90">Crédit 90 jours</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Type de vol</label>
                  <select
                    value={newEntete.typeVol}
                    onChange={(e) => setNewEntete({ ...newEntete, typeVol: e.target.value })}
                    className={inputCls}
                    disabled={isCreating}
                  >
                    <option value="">— Choisir un type —</option>
                    <option value="NATIONAL">Vol national</option>
                    <option value="LONG_COURRIER">Long courrier</option>
                    <option value="REGIONAL">Vol régional</option>
                  </select>
                </div>
              </div>

              {/* Message d'alerte si bloqué */}
              {isBlocked && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <FiAlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-0.5">Fournisseur bloqué</p>
                    <p className="text-xs text-red-700">
                      Ce fournisseur présente une alerte de niveau élevé. La création est désactivée pour cette prospection.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={onCloseCreate}
                disabled={isCreating}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirmCreate}
                disabled={isCreating || !newEntete.fournisseurId || isBlocked}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    Créer la prospection
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