import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { VisaLigne } from '../../../../../app/front_office/parametre_visa/visaEnteteSlice';
import type { AppDispatch, RootState } from '../../../../../app/store';
import axios from '../../../../../service/Axios';
import { fetchVisaEnteteDetail } from '../../../../../app/front_office/parametre_visa/visaEnteteDetailSlice';
import VisaModal from './VisaModal';


interface Props {
  visaEnteteId: string;
  lignes: VisaLigne[];
  onClose: () => void;
}

// ── Types locaux ───────────────────────────────────────────────────────────

interface LigneSelection {
  visaLigneId: string;
  passagerIds: string[];
}

const CreateAccesPortailModal = ({ visaEnteteId, lignes, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // ── Bénéficiaires depuis le store ──────────────────────────────────────────
  const beneficiaires = useSelector(
    (s: RootState) => s.clientFactures.current?.beneficiaires ?? []
  );

  // ── État : une sélection de passagers par ligne ────────────────────────────
  // Initialisé avec toutes les lignes existantes, passagerIds vides
  const [selections, setSelections] = useState<LigneSelection[]>(
    lignes.map(l => ({ visaLigneId: l.id, passagerIds: [] }))
  );

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Helpers sélection ──────────────────────────────────────────────────────

  const togglePassager = (ligneId: string, passagerId: string, maxNombre: number) => {
    setSelections(prev => prev.map(sel => {
      if (sel.visaLigneId !== ligneId) return sel;

      const already = sel.passagerIds.includes(passagerId);
      if (already) {
        return { ...sel, passagerIds: sel.passagerIds.filter(id => id !== passagerId) };
      }
      // Bloquer si quota atteint
      if (sel.passagerIds.length >= maxNombre) return sel;
      return { ...sel, passagerIds: [...sel.passagerIds, passagerId] };
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    for (const sel of selections) {
      const ligne = lignes.find(l => l.id === sel.visaLigneId);
      if (!ligne) continue;
      const requis = ligne.visaProspectionLigne.nombre;
      if (sel.passagerIds.length !== requis) {
        return `La ligne "${ligne.referenceLine}" requiert exactement ${requis} passager(s) — ${sel.passagerIds.length} sélectionné(s).`;
      }
    }
    return null;
  };

  // ── Résumé quota par ligne ─────────────────────────────────────────────────

  const quotaParLigne = useMemo(() =>
    lignes.map(l => ({
      id      : l.id,
      requis  : l.visaProspectionLigne.nombre,
      selCount: selections.find(s => s.visaLigneId === l.id)?.passagerIds.length ?? 0,
    })),
    [lignes, selections]
  );

  const allComplete = quotaParLigne.every(q => q.selCount === q.requis);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `/visa/entete/${visaEnteteId}/create-acces-portail`,
        selections
      );
      await dispatch(fetchVisaEnteteDetail(visaEnteteId));
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors de la création de l'accès portail.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <VisaModal
      title="Créer accès portail"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      {/* Résumé global */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium ${
        allComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
      }`}>
        <span>
          {allComplete ? '✓ Toutes les lignes sont complètes' : '⚠ Des lignes sont incomplètes'}
        </span>
        <span className="text-xs">
          {quotaParLigne.reduce((s, q) => s + q.selCount, 0)}
          {' / '}
          {quotaParLigne.reduce((s, q) => s + q.requis, 0)} passagers
        </span>
      </div>

      {/* Une section par ligne visa */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {lignes.map((ligne) => {
          const vp      = ligne.visaProspectionLigne;
          const sel     = selections.find(s => s.visaLigneId === ligne.id)!;
          const quota   = quotaParLigne.find(q => q.id === ligne.id)!;
          const complet = quota.selCount === quota.requis;

          return (
            <div
              key={ligne.id}
              className={`rounded-xl border overflow-hidden ${
                complet ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              {/* Header ligne */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${
                complet ? 'bg-green-50' : 'bg-indigo-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {ligne.referenceLine}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {vp.visaParams.pays.pays}
                    <span className="ml-1 text-xs text-gray-400 font-normal">
                      — {vp.visaParams.visaType.nom}
                    </span>
                  </span>
                </div>

                {/* Compteur quota */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  complet
                    ? 'bg-green-100 text-green-700'
                    : quota.selCount > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {quota.selCount} / {quota.requis} passager{quota.requis > 1 ? 's' : ''}
                </span>
              </div>

              {/* Liste des bénéficiaires */}
              <div className="p-3 space-y-2">
                {beneficiaires.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    Aucun bénéficiaire disponible
                  </p>
                ) : (
                  beneficiaires.map(({ clientBeneficiaire }) => {
                    const checked  = sel.passagerIds.includes(clientBeneficiaire.id);
                    const disabled = !checked && quota.selCount >= quota.requis;

                    return (
                      <label
                        key={clientBeneficiaire.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'border-indigo-400 bg-indigo-50'
                            : disabled
                              ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => togglePassager(ligne.id, clientBeneficiaire.id, quota.requis)}
                          className="h-4 w-4 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {clientBeneficiaire.libelle}
                          </p>
                          <p className="text-xs text-gray-400">{clientBeneficiaire.code}</p>
                        </div>
                        {checked && (
                          <span className="text-xs text-indigo-600 font-semibold shrink-0">✓</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {/* Avertissement si quota dépassable */}
              {!complet && quota.selCount > 0 && (
                <p className="px-4 pb-2.5 text-xs text-amber-600">
                  Encore {quota.requis - quota.selCount} passager(s) à sélectionner
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </VisaModal>
  );
};

export default CreateAccesPortailModal;