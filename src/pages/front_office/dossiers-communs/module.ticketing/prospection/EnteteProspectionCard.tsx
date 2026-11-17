import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil, Percent, Plane } from 'lucide-react';
import type { ProspectionEntete } from '../../../../../app/front_office/prospectionsEntetesSlice';
import { fmtCredit, fmtNombre } from '../../../../../utils/format';

const TYPE_VOL: Record<string, string> = {
  LONG_COURRIER: 'Long courrier',
  NATIONAL: 'Vol national',
  REGIONAL: 'Vol régional',
};

interface Props {
  entete?: ProspectionEntete | null;
  onEdit?: () => void;
}

/**
 * Carte compacte de l'en-tête de prospection, placée à droite du fil d'Ariane.
 * Met en avant le fournisseur et la commission appliquée ; le reste est dans « Plus d'infos ».
 */
export default function EnteteProspectionCard({ entete, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!entete) return null;

  const ecart = (entete.commissionAppliquer ?? 0) - (entete.commissionPropose ?? 0);
  const majLe = entete.updatedAt
    ? new Date(entete.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  const details = [
    { label: 'N° en-tête', value: entete.numeroEntete },
    { label: 'Prospection', value: entete.prestation?.numeroDos },
    { label: 'Type de vol', value: TYPE_VOL[entete.typeVol] ?? entete.typeVol },
    { label: 'Crédit', value: fmtCredit(entete.credit) },
    { label: 'Commission proposée', value: `${fmtNombre(entete.commissionPropose)} %` },
    { label: 'Dernière mise à jour', value: majLe },
  ].filter((d) => d.value);

  return (
    <div ref={ref} className="relative inline-flex">
      <div className="flex items-stretch rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">
        {/* Compagnie */}
        <div className="flex items-center gap-2.5 py-1.5 pl-3 pr-4 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Plane size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Compagnie</p>
            <div className="flex items-center gap-1.5">
              <span
                className="max-w-[220px] truncate text-sm font-bold text-slate-900"
                title={entete.fournisseur?.libelle}
              >
                {entete.fournisseur?.libelle ?? '—'}
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                {entete.numeroEntete}
              </span>
            </div>
          </div>
        </div>

        {/* Commission appliquée */}
        <div
          className="flex flex-col justify-center border-l border-slate-100 px-4 py-1.5 leading-tight"
          title={`Commission proposée : ${fmtNombre(entete.commissionPropose)} %`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Commission appliquée</p>
          <div className="flex items-baseline gap-1.5">
            <span className="inline-flex items-center gap-0.5 text-sm font-bold text-emerald-700">
              {fmtNombre(entete.commissionAppliquer)}
              <Percent size={12} aria-hidden="true" />
            </span>
            {ecart !== 0 && (
              <span className={`text-[11px] font-medium ${ecart > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {ecart > 0 ? '+' : ''}{fmtNombre(ecart)} pt vs proposée
              </span>
            )}
          </div>
        </div>

        {/* Modifier */}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Modifier l'en-tête"
            aria-label="Modifier l'en-tête"
            className="flex items-center gap-1.5 border-l border-slate-100 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Pencil size={13} aria-hidden="true" />
            <span className="hidden lg:inline">Modifier</span>
          </button>
        )}

        {/* Plus d'infos */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Afficher plus d'informations sur l'en-tête"
          title="Plus d'infos"
          className={`flex items-center rounded-r-xl border-l border-slate-100 px-2.5 transition-colors ${
            open ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Détails de l'en-tête"
          className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10"
        >
          <div className="border-b border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Détails de l'en-tête
          </div>
          <dl className="divide-y divide-slate-100">
            {details.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-2">
                <dt className="w-40 shrink-0 text-xs text-slate-500">{label}</dt>
                <dd className="min-w-0 flex-1 break-words text-xs font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
