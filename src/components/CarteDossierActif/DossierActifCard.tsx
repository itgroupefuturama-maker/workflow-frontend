import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { User, Phone, FileText, Tag, XCircle, Calendar, Building2, Hash } from 'lucide-react';

interface DossierActifCardProps {
  gradient?: string;
}

interface DossierActifCardProps {
  gradient?: string;
}

export default function DossierActifCard({
  gradient: _gradient = 'from-amber-400 via-orange-400 to-amber-500',
}: DossierActifCardProps) {
  const dossierActif = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId
  );

  if (!dossierActif) return null;

  const isAnnule = !!dossierActif.raisonAnnulation;

  const rows = [
    { label: 'Contact principal',   value: dossierActif.contactPrincipal,               icon: User      },
    { label: 'WhatsApp',            value: dossierActif.whatsapp,                       icon: Phone     },
    { label: 'Client facturé',      value: dossierActif.clientfacture?.libelle,         icon: Building2 },
    { label: 'Credit par défaut',   value: dossierActif.clientfacture?.creditdefault,   icon: Building2 },
    { label: 'Code client',         value: dossierActif.clientfacture?.code,            icon: Hash      },
    { label: 'Réf. Travel Planner', value: dossierActif.referenceTravelPlaner,          icon: Tag       },
    { label: 'N° dossier',          value: dossierActif.numero?.toString(),             icon: FileText  },
    { label: 'Description',         value: dossierActif.description?.toString(),        icon: FileText  },
  ].filter(r => r.value);

  // Regroupe les rows en paires pour le tableau 4 colonnes
  const rowPairs = rows.reduce<(typeof rows)[]>((acc, _, i) =>
    i % 4 === 0 ? [...acc, rows.slice(i, i + 4)] : acc, []);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-1 ">

      {/* Header */}
      {/* <div
        className="relative flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-200/80 overflow-hidden"
        onClick={handleToggle}
      >
        <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 bg-linear-to-r ${gradient}`} />
        <div className={`absolute -bottom-5 -right-10 w-28 h-28 rounded-full opacity-10 bg-linear-to-r ${gradient}`} />

        <div className="relative flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: color.bgLight, border: `1px solid ${color.border}` }}
          >
            <FileText size={13} style={{ color: color.text }} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 leading-none">{dossierActif.numero}</p>
            {dossierActif.description && (
              <p className="text-[13px] text-slate-400 font-medium">{dossierActif.description}</p>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {isAnnule ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">
              <XCircle size={10} /> Annulé
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border"
              style={{ background: color.bgLight, color: color.text, borderColor: color.border }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: color.bg }}
              />
              Actif
            </span>
          )}

          <button
            className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            title={isOpen ? 'Réduire' : 'Agrandir'}
          >
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
            />
          </button>
        </div>
      </div> */}

      {/* Body collapsible */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          'max-h-[600px] opacity-100'
        }`}
      >

        {/* Raison annulation */}
        {isAnnule && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-red-50 border-b border-red-100">
            <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-red-400 mb-0.5">Raison d'annulation</p>
              <p className="text-xs font-medium text-red-700">{dossierActif.raisonAnnulation}</p>
              {dossierActif.dateAnnulation && (
                <p className="text-[13px] text-red-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={9} /> {dossierActif.dateAnnulation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tableau 4 colonnes */}
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <tbody>
            {rowPairs.map((group, gi) => (
              <tr key={gi} className="border-b border-slate-100 last:border-0">
                {group.map(({ label, value, icon: Icon }) => (
                  <td key={label} className="px-3 py-2 border-r border-slate-100 last:border-r-0 w-[25%]">
                    <div className="flex items-center gap-1.5">
                      <Icon size={10} className="text-indigo-500 shrink-0" />
                      <span className="text-[13px] text-indigo-500 font-medium shrink-0">{label} :</span>
                      <span className="text-[13px] font-medium text-slate-700 truncate">{value}</span>
                    </div>
                  </td>
                ))}
                {/* Cellules vides si la dernière ligne a moins de 4 items */}
                {group.length < 4 &&
                  Array.from({ length: 4 - group.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="border-r border-slate-100 last:border-r-0 w-[25%]" />
                  ))
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}