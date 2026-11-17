import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import {
  Building2, Calendar, ChevronDown, CreditCard, FileText, Hash, Phone, Tag, User, XCircle,
} from 'lucide-react';
import { fmtCredit } from '../../utils/format';

interface DossierActifCardProps {
  /** Conservé pour compatibilité avec les appels existants (couleur du module). */
  gradient?: string;
  className?: string;
}

/**
 * Carte compacte du dossier actif, prévue pour être placée à droite de l'en-tête.
 * Met en avant le client facturé, son code et son crédit ; le reste (contact, WhatsApp,
 * réf. Travel Planner, description…) s'affiche dans un panneau « Plus d'infos ».
 */
export default function DossierActifCard({ className = '' }: DossierActifCardProps) {
  const dossierActif = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermeture du panneau : clic extérieur ou touche Échap
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

  if (!dossierActif) return null;

  const client = dossierActif.clientfacture;
  const isAnnule = !!dossierActif.raisonAnnulation;

  const details = [
    { label: 'N° dossier',          value: dossierActif.numero?.toString(),      icon: FileText },
    { label: 'Contact principal',   value: dossierActif.contactPrincipal,        icon: User     },
    { label: 'WhatsApp',            value: dossierActif.whatsapp,                icon: Phone    },
    { label: 'Réf. Travel Planner', value: dossierActif.referenceTravelPlaner,   icon: Tag      },
    { label: 'Description',         value: dossierActif.description?.toString(), icon: FileText },
  ].filter((d) => d.value);

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <div
        className={`flex items-stretch rounded-xl bg-white shadow-sm ring-1 ${
          isAnnule ? 'ring-red-200' : 'ring-slate-200/70'
        }`}
      >
        {/* Client facturé + code */}
        <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client facturé</p>
            <div className="flex items-center gap-1.5">
              <span className="max-w-[220px] truncate text-sm font-bold text-slate-900" title={client?.libelle}>
                {client?.libelle ?? '—'}
              </span>
              {client?.code && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                  <Hash size={10} aria-hidden="true" />
                  {client.code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Crédit */}
        <div className="flex flex-col justify-center border-l border-slate-100 px-4 py-1.5 leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Crédit</p>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
            <CreditCard size={13} aria-hidden="true" />
            {fmtCredit(client?.creditdefault)}
          </span>
        </div>

        {/* Statut annulé (visible directement : information critique) */}
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
          aria-label="Afficher plus d'informations sur le dossier"
          title="Plus d'infos"
          className={`flex items-center gap-1 rounded-r-xl border-l border-slate-100 px-3 text-xs font-medium transition-colors ${
            open ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          {dossierActif.numero != null && <span className="hidden xl:inline">Dossier n° {dossierActif.numero}</span>}
          <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Panneau détails */}
      {open && (
        <div
          role="dialog"
          aria-label="Détails du dossier"
          className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10"
        >
          <div className="border-b border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Détails du dossier
          </div>

          {isAnnule && (
            <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-2.5">
              <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-semibold text-red-700">Raison d'annulation</p>
                <p className="text-red-700">{dossierActif.raisonAnnulation}</p>
                {dossierActif.dateAnnulation && (
                  <p className="mt-0.5 flex items-center gap-1 text-red-500">
                    <Calendar size={10} aria-hidden="true" /> {dossierActif.dateAnnulation}
                  </p>
                )}
              </div>
            </div>
          )}

          <dl className="divide-y divide-slate-100">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-2">
                <Icon size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                <dt className="w-32 shrink-0 text-xs text-slate-500">{label}</dt>
                <dd className="min-w-0 flex-1 break-words text-xs font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
