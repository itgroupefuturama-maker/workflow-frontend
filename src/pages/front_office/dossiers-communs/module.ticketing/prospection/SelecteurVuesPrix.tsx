// src/pages/front_office/dossiers-communs/module.ticketing/prospection/SelecteurVuesPrix.tsx
//
// Choix libre des prix affichés : Prospection, Résa, Émission (plusieurs à la fois) ou « Tout ».

import { Check, Eye } from 'lucide-react';
import { VUES_PRIX, type VuePrix } from './vuesPrix';

interface Props {
  value: VuePrix[];
  onChange: (vues: VuePrix[]) => void;
  disabled?: boolean;
  /** Nombre de lignes concernées par vue, ex. { RESA: 1, EMISSION: 0 } — affiché en petit */
  compteurs?: Partial<Record<VuePrix, number>>;
  total?: number;
  loading?: boolean;
}

const COULEURS: Record<VuePrix, string> = {
  PROSPECTION: 'bg-emerald-600 text-white border-emerald-600',
  RESA: 'bg-violet-600 text-white border-violet-600',
  EMISSION: 'bg-amber-600 text-white border-amber-600',
};

export default function SelecteurVuesPrix({ value, onChange, disabled, compteurs, total, loading }: Props) {
  const tout = VUES_PRIX.every((v) => value.includes(v.id));

  const basculer = (id: VuePrix) => {
    if (value.includes(id)) {
      if (value.length === 1) return; // au moins une vue reste affichée
      onChange(value.filter((v) => v !== id));
    } else {
      // On garde l'ordre Prospection → Résa → Émission
      onChange(VUES_PRIX.map((v) => v.id).filter((v) => v === id || value.includes(v)));
    }
  };

  return (
    <div
      role="group"
      aria-label="Prix affichés"
      title={disabled ? 'Terminez la saisie de la ligne en cours pour changer les prix affichés' : undefined}
      className={`flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200 ${disabled ? 'opacity-50' : ''}`}
    >
      <span className="flex items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Eye size={12} aria-hidden="true" /> Prix
      </span>

      {VUES_PRIX.map(({ id, label }) => {
        const actif = value.includes(id);
        const n = compteurs?.[id];
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            aria-pressed={actif}
            onClick={() => basculer(id)}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              actif ? COULEURS[id] : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {actif && <Check size={12} aria-hidden="true" />}
            {label}
            {id !== 'PROSPECTION' && total != null && (
              <span className={`text-[10px] font-medium ${actif ? 'text-white/80' : 'text-slate-400'}`}>
                {loading ? '…' : `${n ?? 0}/${total}`}
              </span>
            )}
          </button>
        );
      })}

      <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden="true" />
      <button
        type="button"
        disabled={disabled || tout}
        onClick={() => onChange(VUES_PRIX.map((v) => v.id))}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
          tout ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        Tout
      </button>
    </div>
  );
}
