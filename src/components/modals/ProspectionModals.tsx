import { FiX } from 'react-icons/fi';
import type { ProspectionEntete } from '../../app/front_office/prospectionsEntetesSlice';
import { useLastComment } from '../../hooks/useLastComment'; // adapte le chemin

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

// ─── Sous-composant isolé pour l'alerte ───────────────────────────────────────
// IMPORTANT : en le séparant, ses re-renders n'affectent PAS le modal parent
function FournisseurAlert({ fournisseurId }: { fournisseurId: string }) {
  const { lastComment } = useLastComment(fournisseurId);

  if (!fournisseurId || !lastComment?.alerte) return null;

  const upper = lastComment.alerte.toUpperCase();
  const isHigh = upper === 'ELEVE' || upper === 'TRES_ELEVE';
  const isNormal = upper === 'NORMAL';

  const style = isHigh
    ? 'bg-red-50 border-red-400 text-red-900'
    : isNormal
    ? 'bg-orange-50 border-orange-400 text-orange-900'
    : 'bg-green-50 border-green-400 text-green-900';

  const icon = isHigh ? '🔴' : isNormal ? '🟠' : '🟢';

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm pointer-events-none">
      <div className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${style}`}>
        <div className="shrink-0 mt-0.5 text-xl">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold text-base mb-1">
            Alerte fournisseur : {lastComment.alerte}
          </div>
          <p className="text-sm leading-tight">{lastComment.commentaire}</p>
          <p className="text-xs mt-2 opacity-80">{lastComment.dateEnregistrement}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
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
  return (
    <>
      {/* ── MODAL ÉDITION ── */}
      {selectedEntete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                Modifier l'entête de prospection
              </h3>
              <button onClick={onCloseEdit} className="text-slate-500 hover:text-slate-800">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">N° Entête</label>
                  <p className="text-slate-900 font-medium">{selectedEntete.numeroEntete}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type de vol</label>
                  <p className="text-slate-900">{selectedEntete.typeVol}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
                  <p className="text-slate-900">{selectedEntete.fournisseur?.libelle || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crédit</label>
                  <p className="text-slate-900">{selectedEntete.credit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commission proposée</label>
                  <p className="text-slate-900">{selectedEntete.commissionPropose} %</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Commission appliquée *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modalCommission}
                    onChange={(e) => setModalCommission(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button
                  onClick={onCloseEdit}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={onSaveEdit}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Sauvegarde...
                    </>
                  ) : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CRÉATION ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Nouvel entête de prospection</h3>
              <button onClick={onCloseCreate} disabled={isCreating} className="text-slate-500 hover:text-slate-800">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ajouter une nouvelle entête pour un autre prospection
                </label>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fournisseur *
                </label>
                {fournisseursLoading ? (
                  <p className="text-slate-500">Chargement...</p>
                ) : (
                  <select
                    value={newEntete.fournisseurId}
                    onChange={(e) => setNewEntete({ ...newEntete, fournisseurId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500"
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

              {/* Alerte fournisseur — isolée dans son propre composant */}
              <FournisseurAlert fournisseurId={newEntete.fournisseurId} />

              {/* Crédit */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Crédit</label>
                <select
                  value={newEntete.credit}
                  onChange={(e) => setNewEntete({ ...newEntete, credit: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                  disabled={isCreating}
                >
                  <option value="CREDIT_0">CREDIT_0</option>
                  <option value="CREDIT_15">CREDIT_15</option>
                  <option value="CREDIT_30">CREDIT_30</option>
                  <option value="CREDIT_60">CREDIT_60</option>
                  <option value="CREDIT_90">CREDIT_90</option>
                </select>
              </div>

              {/* Type Vol */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de vol</label>
                <select
                  value={newEntete.typeVol}
                  onChange={(e) => setNewEntete({ ...newEntete, typeVol: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                  disabled={isCreating}
                >
                  <option value="NATIONAL">Nationale</option>
                  <option value="LONG_COURRIER">Long courrier</option>
                  <option value="REGIONAL">Regionale</option>
                </select>
              </div>

              {/* Pied */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={onCloseCreate}
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirmCreate}
                  disabled={isCreating || !newEntete.fournisseurId}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Création...
                    </>
                  ) : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}