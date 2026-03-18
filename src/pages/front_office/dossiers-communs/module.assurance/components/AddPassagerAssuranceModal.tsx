import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { addPassagerToAssurance } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice';
import type { AssuranceLigne } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteSlice';

interface Props {
  assuranceEnteteId: string;
  lignes:            AssuranceLigne[];
  onClose:           () => void;
  onSuccess:         () => void;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AddPassagerAssuranceModal = ({ assuranceEnteteId, lignes, onClose, onSuccess }: Props) => {
  const dispatch      = useDispatch<AppDispatch>();
  const clientFacture = useSelector((s: RootState) => s.clientFactures.current);
  const beneficiaires = clientFacture?.beneficiaires ?? [];

  // une sélection par ligne : { [ligneId]: passagerId | null }
  const [selections, setSelections] = useState<Record<string, string | null>>(
    Object.fromEntries(lignes.map(l => [l.id, null]))
  );

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const setPassager = (ligneId: string, passagerId: string) =>
    setSelections(p => ({ ...p, [ligneId]: passagerId }));

  // Nombre de lignes avec un passager sélectionné
  const nbSelections = Object.values(selections).filter(Boolean).length;

  const handleSubmit = async () => {
    const payload = Object.entries(selections)
      .filter(([, passagerId]) => passagerId !== null)
      .map(([assuranceId, passagerId]) => ({ assuranceId, passagerId: passagerId! }));

    if (payload.length === 0) {
      setError('Veuillez sélectionner au moins un passager pour une ligne.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await dispatch(addPassagerToAssurance({ assuranceEnteteId, passagers: payload })).unwrap();
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e ?? 'Erreur lors de l\'ajout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Assigner des passagers</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Sélectionnez un passager par ligne · {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition text-sm"
          >✕</button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {lignes.map((ligne, idx) => {
            const ap         = ligne.assuranceProspectionLigne?.assuranceParams;
            const selected   = selections[ligne.id];

            return (
              <div key={ligne.id} className="border border-gray-200 rounded-xl overflow-hidden">

                {/* header ligne */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
                  <span className="text-[11px] font-bold text-indigo-400">Ligne #{idx + 1}</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {ap?.zoneDestination ?? '—'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fmtDate(ligne.assuranceProspectionLigne?.dateDepart)}
                    {' → '}
                    {fmtDate(ligne.assuranceProspectionLigne?.dateRetour)}
                    {' · '}
                    {ligne.assuranceProspectionLigne?.duree ?? '—'} j
                  </span>
                  {selected && (
                    <span className="ml-auto text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Passager sélectionné
                    </span>
                  )}
                </div>

                {/* liste bénéficiaires */}
                <div className="divide-y divide-gray-50">
                  {beneficiaires.length === 0 ? (
                    <p className="text-sm text-gray-400 italic px-4 py-3">Aucun bénéficiaire disponible.</p>
                  ) : (
                    beneficiaires.map(({ clientBeneficiaire }) => {
                      const isSelected = selected === clientBeneficiaire.id;
                      return (
                        <button
                          key={clientBeneficiaire.id}
                          onClick={() => setPassager(ligne.id, clientBeneficiaire.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                            isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {/* avatar */}
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {clientBeneficiaire.libelle?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                          </div>
                          {/* infos */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{clientBeneficiaire.libelle}</p>
                            <p className="text-xs text-gray-400 font-mono">{clientBeneficiaire.code}</p>
                            <p className="text-xs text-gray-400 font-mono">{clientBeneficiaire.id}</p>
                          </div>
                          {/* radio */}
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-indigo-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mx-5 mb-1 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 shrink-0">
            ⚠️ {error}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <span className="text-xs text-gray-400">
            {nbSelections} / {lignes.length} ligne{lignes.length > 1 ? 's' : ''} assignée{nbSelections > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || nbSelections === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
            >
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Envoi…' : `Confirmer (${nbSelections})`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddPassagerAssuranceModal;