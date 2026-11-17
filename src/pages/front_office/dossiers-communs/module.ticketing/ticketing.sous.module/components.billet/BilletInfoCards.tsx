import React, { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Percent, Plane, XCircle } from 'lucide-react';
import { fmtAriary, fmtNombre } from '../../../../../../utils/format';

const TYPE_VOL: Record<string, string> = {
  LONG_COURRIER: 'Long courrier',
  NATIONAL: 'Vol national',
  REGIONAL: 'Vol régional',
};

interface BilletInfoCardsProps {
  billet: any;
  clientFacture: any;
  dossier: any;
}

/**
 * Carte compacte du billet, placée à droite du fil d'Ariane.
 * Met en avant la compagnie, le client facturé et la commission appliquée ;
 * le reste (entête, date, contact, totaux…) est dans le panneau « Plus d'infos ».
 */
const BilletInfoCards: React.FC<BilletInfoCardsProps> = ({ billet, clientFacture, dossier }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAnnule = !!billet?.raisonAnnul;

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

  if (!billet) return null;

  const compagnie = billet?.prospectionEntete?.fournisseur?.libelle;
  const ecart = Number(billet?.commissionAppliquer ?? 0) - Number(billet?.commissionPropose ?? 0);

  // Les valeurs vides ou nulles sont masquées plutôt qu'affichées « — », « 0 » ou « undefined ».
  const hasNumber = (v: unknown) => v !== null && v !== undefined && v !== '' && Number(v) !== 0;
  const details = [
    { label: 'N° billet',           value: billet?.numeroBillet },
    { label: 'En-tête',             value: billet?.prospectionEntete?.numeroEntete },
    { label: 'Créé le',             value: billet?.createdAt ? new Date(billet.createdAt).toLocaleDateString('fr-FR') : null },
    { label: 'Type de vol',         value: billet?.typeVol ? (TYPE_VOL[billet.typeVol] ?? billet.typeVol) : null },
    { label: 'Type de passager',    value: billet?.typePassager },
    { label: 'Contact principal',   value: dossier?.contactPrincipal },
    { label: 'WhatsApp',            value: dossier?.whatsapp },
    { label: 'Commission proposée', value: billet?.commissionPropose != null ? `${fmtNombre(billet.commissionPropose)} %` : null },
    { label: 'Total compagnie',     value: hasNumber(billet?.totalCompagnie) ? `${fmtAriary(billet.totalCompagnie)} Ar` : null },
    { label: 'Taux de change',      value: hasNumber(billet?.tauxEchange) ? `${fmtNombre(billet.tauxEchange)} Ar` : null },
  ].filter((d) => d.value);

  return (
    <div ref={ref} className="relative inline-flex">
      <div className={`flex items-stretch rounded-xl bg-white shadow-sm ring-1 ${isAnnule ? 'ring-red-200' : 'ring-slate-200/70'}`}>
        {/* Compagnie + n° billet */}
        <div className="flex min-w-0 items-center gap-2.5 py-1.5 pl-3 pr-4">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isAnnule ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-600'}`}>
            <Plane size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Compagnie</p>
            <div className="flex items-center gap-1.5">
              <span className="max-w-[220px] truncate text-sm font-bold text-slate-900" title={compagnie}>
                {compagnie ?? '—'}
              </span>
              {billet?.prospectionEntete?.numeroEntete && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                  {billet.prospectionEntete.numeroEntete}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Facturé à */}
        <div className="flex min-w-0 flex-col justify-center border-l border-slate-100 px-4 py-1.5 leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Facturé à</p>
          <span className="inline-flex max-w-[180px] items-center gap-1 truncate text-sm font-bold text-slate-800" title={clientFacture?.libelle}>
            <Building2 size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            {clientFacture?.libelle ?? '—'}
          </span>
        </div>

        {/* Commission appliquée */}
        <div
          className="flex flex-col justify-center border-l border-slate-100 px-4 py-1.5 leading-tight"
          title={`Commission proposée : ${fmtNombre(billet?.commissionPropose)} %`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Comm. appliquée</p>
          <div className="flex items-baseline gap-1.5">
            <span className="inline-flex items-center gap-0.5 text-sm font-bold text-emerald-700">
              {fmtNombre(billet?.commissionAppliquer)}
              <Percent size={12} aria-hidden="true" />
            </span>
            {ecart !== 0 && !Number.isNaN(ecart) && (
              <span className={`text-[11px] font-medium ${ecart > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {ecart > 0 ? '+' : ''}{fmtNombre(ecart)} pt
              </span>
            )}
          </div>
        </div>

        {isAnnule && (
          <div className="flex items-center border-l border-red-100 bg-red-50 px-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
              <XCircle size={13} aria-hidden="true" /> Annulé
            </span>
          </div>
        )}

        {/* Plus d'infos */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Afficher plus d'informations sur le billet"
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
          aria-label="Détails du billet"
          className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10"
        >
          <div className="border-b border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Détails du billet
          </div>
          {isAnnule && (
            <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span><strong>Motif d'annulation :</strong> {billet.raisonAnnul}</span>
            </div>
          )}
          <dl className="divide-y divide-slate-100">
            {details.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-2">
                <dt className="w-36 shrink-0 text-xs text-slate-500">{label}</dt>
                <dd className="min-w-0 flex-1 break-words text-xs font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
};

export default BilletInfoCards;
