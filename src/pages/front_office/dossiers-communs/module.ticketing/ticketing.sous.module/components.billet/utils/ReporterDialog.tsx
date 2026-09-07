// ReporterDialog.tsx
import { useState } from 'react';
import type { BilletLigne } from '../../../../../../../app/front_office/billetSlice';
import Button from '../../../../../../../components/ui/Button';

interface ReporterDialogProps {
  billet: BilletLigne['billet'][0] | null;
  onConfirm: (billet: BilletLigne['billet'][0], date: string) => void;
  onClose: () => void;
}

export const ReporterDialog: React.FC<ReporterDialogProps> = ({ billet, onConfirm, onClose }) => {
  const [date, setDate] = useState('');

  if (!billet) return null;

  const info      = billet.clientbeneficiaireInfo;
  const nomComplet = `${info?.prenom ?? ''} ${info?.nom ?? ''}`.trim() || 'Passager inconnu';

  const handleConfirm = () => {
    if (!date) return;
    onConfirm(billet, date);
    onClose();
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Boîte */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-slate-800">Reporter le billet</h3>
            <p className="text-[12px] text-slate-500 mt-0.5 truncate">
              {nomComplet}
              {billet.numeroBillet && (
                <span className="ml-1.5 font-mono text-[10px] bg-slate-100
                                 text-slate-600 px-1.5 py-0.5 rounded">
                  {billet.numeroBillet}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avertissement */}
        <div className="mx-5 mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200
                        rounded-xl px-3.5 py-3">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none"
               stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94
                 a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Cette action va reporter le billet à une nouvelle date.
            Le passager devra être notifié du changement.
          </p>
        </div>

        {/* Champ date */}
        <div className="px-5 mb-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider
                            text-slate-400 mb-1.5">
            Nouvelle date de départ
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5
                       text-[13px] text-slate-700 bg-slate-50
                       focus:outline-none focus:ring-2 focus:ring-amber-400/40
                       focus:border-amber-400 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-5 pb-5">
          <Button variant="secondary" onClick={onClose} className="flex-1 justify-center">
            Annuler
          </Button>
          <Button variant="warning" onClick={handleConfirm} disabled={!date} className="flex-1 justify-center">
            Confirmer le report
          </Button>
        </div>
      </div>
    </div>
  );
};