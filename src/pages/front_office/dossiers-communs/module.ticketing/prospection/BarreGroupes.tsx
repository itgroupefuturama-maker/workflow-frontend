// src/pages/front_office/dossiers-communs/module.ticketing/prospection/BarreGroupes.tsx
//
// Barre de contrôle des groupes de colonnes : vues rapides (préréglages) + puces pour masquer / afficher
// chaque groupe + compteur « N groupes masqués · Tout afficher ».
// Un groupe masqué disparaît complètement du tableau (0 colonne).

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff, LayoutGrid } from 'lucide-react';

export interface GroupeColonnes {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface VueRapide {
  id: string;
  label: string;
  /** Groupes masqués dans cette vue (les autres sont affichés) */
  masques: string[];
  title?: string;
}

interface Props {
  groupes: GroupeColonnes[];
  masques: Record<string, boolean>;
  onChange: (masques: Record<string, boolean>) => void;
  vues: VueRapide[];
  disabled?: boolean;
  /** Boutons supplémentaires (ex. « Pénalités ») */
  children?: ReactNode;
}

export default function BarreGroupes({ groupes, masques, onChange, vues, disabled, children }: Props) {
  const nbMasques = groupes.filter((g) => masques[g.key]).length;

  const appliquerVue = (v: VueRapide) => {
    const next = { ...masques };
    groupes.forEach((g) => { next[g.key] = v.masques.includes(g.key); });
    onChange(next);
  };
  const vueActive = vues.find((v) => groupes.every((g) => !!masques[g.key] === v.masques.includes(g.key)));
  const basculer = (key: string) => onChange({ ...masques, [key]: !masques[key] });
  const toutAfficher = () => {
    const next = { ...masques };
    groupes.forEach((g) => { next[g.key] = false; });
    onChange(next);
  };

  const puce = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
      {/* Vues rapides */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
          <LayoutGrid size={12} aria-hidden="true" /> Vue :
        </span>
        <div className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
          {vues.map((v) => {
            const actif = vueActive?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                title={v.title}
                aria-pressed={actif}
                onClick={() => appliquerVue(v)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  actif ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {nbMasques > 0 && (
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800 ring-1 ring-amber-200">
            <EyeOff size={12} aria-hidden="true" />
            {nbMasques} groupe{nbMasques > 1 ? 's' : ''} masqué{nbMasques > 1 ? 's' : ''}
            <button
              type="button"
              disabled={disabled}
              onClick={toutAfficher}
              className="font-semibold underline underline-offset-2 hover:text-amber-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tout afficher
            </button>
          </span>
        )}
      </div>

      {/* Groupes : clic = masquer / afficher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase text-slate-500">Groupes :</span>
        {groupes.map(({ key, label, icon: Icon }) => {
          const masque = !!masques[key];
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={!masque}
              title={masque ? `Afficher « ${label} »` : `Masquer « ${label} »`}
              onClick={() => basculer(key)}
              className={`${puce} ${
                masque
                  ? 'border-dashed border-slate-300 bg-transparent text-slate-400 line-through hover:text-slate-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {masque ? <EyeOff size={12} aria-hidden="true" /> : <Icon size={12} aria-hidden="true" />}
              {label}
              {!masque && <Eye size={11} aria-hidden="true" className="text-slate-300" />}
            </button>
          );
        })}
        {children}
      </div>
    </div>
  );
}
