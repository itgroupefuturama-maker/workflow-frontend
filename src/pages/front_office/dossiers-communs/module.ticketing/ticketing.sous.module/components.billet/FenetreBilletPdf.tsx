// FenetreBilletPdf.tsx
//
// Fenêtre commune avant de produire le billet agence (PDF) d'un passager :
// choix des exigences de voyage à mettre en valeur + style du billet, puis action
// (aperçu, téléchargement, ou génération jointe comme e-billet dans la fenêtre d'achat).

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { BilletPassagerExigence } from '../../../module.pdf/pdf.generation/generators/billet-passager.generator';
import type { BilletStyleId } from '../../../module.pdf/pdf.generation/types/pdf-design.types';
import { BILLET_STYLES } from '../../../module.pdf/pdf.generation/config/billet-styles';
import { useEscapeKey } from '../../../../../../hooks/useEscapeKey';

export interface ChoixBilletPdf {
  styleId: BilletStyleId;
  exigencesImportantesIds: string[];
}

export interface ActionBilletPdf {
  id: string;
  label: string;
  /** Bouton principal (plein) */
  principal?: boolean;
}

interface Props {
  nomPassager: string;
  exigences: BilletPassagerExigence[];
  actions: ActionBilletPdf[];
  loading?: boolean;
  onConfirm: (actionId: string, choix: ChoixBilletPdf) => void;
  onClose: () => void;
}

export default function FenetreBilletPdf({ nomPassager, exigences, actions, loading, onConfirm, onClose }: Props) {
  useEscapeKey(true, onClose);
  const [styleId, setStyleId] = useState<BilletStyleId>('elegant');
  const [importants, setImportants] = useState<Set<string>>(new Set());

  const basculer = (id: string) =>
    setImportants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className="flex items-start gap-3 px-5 pb-4 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <AlertTriangle size={18} className="text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-slate-800">Billet agence — exigences de voyage</h3>
            <p className="mt-0.5 truncate text-[12px] text-slate-500">{nomPassager}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-slate-400 transition-colors hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Exigences */}
        <div className="mx-5 mb-4">
          {exigences.length === 0 ? (
            <p className="px-1 text-[12px] italic text-slate-400">Aucune exigence de voyage pour cette destination.</p>
          ) : (
            <>
              <p className="mb-2 px-1 text-[11px] text-slate-400">
                Cliquez sur une exigence pour la mettre en valeur (rouge) dans le PDF.
              </p>
              <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                {exigences.map((e) => {
                  const imp = importants.has(e.id);
                  return (
                    <li key={e.id} onClick={() => basculer(e.id)}
                      className={`flex cursor-pointer items-center gap-2 px-3.5 py-2.5 transition-colors ${imp ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                      <span className={`min-w-0 flex-1 text-[12px] ${imp ? 'font-semibold text-red-700' : 'text-slate-600'}`}>
                        <span className="font-medium">{e.type}</span>{e.description ? ` — ${e.description}` : ''}
                      </span>
                      {imp && (
                        <span className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Important</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Style */}
        <div className="mx-5 mb-4">
          <p className="mb-1.5 px-1 text-[11px] text-slate-400">Style du billet</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(BILLET_STYLES).map((s) => (
              <button key={s.id} type="button" onClick={() => setStyleId(s.id as BilletStyleId)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  styleId === s.id ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                }`}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.preview }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Annuler
          </button>
          {actions.map((a) => (
            <button key={a.id} type="button" disabled={loading}
              onClick={() => onConfirm(a.id, { styleId, exigencesImportantesIds: Array.from(importants) })}
              className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all disabled:opacity-40 ${
                a.principal
                  ? 'bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98]'
                  : 'border border-violet-200 text-violet-700 hover:bg-violet-50'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
