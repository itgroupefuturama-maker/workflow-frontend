
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

const Field = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  );
};

interface DossierActifCardProps {
  /** Couleur du bandeau supérieur — par défaut amber/orange (ticketing) */
  gradient?: string;
}

export default function DossierActifCard({
  gradient = 'from-amber-400 via-orange-400 to-amber-500',
}: DossierActifCardProps) {
  const dossierActif = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId
  );

  if (!dossierActif) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-5">
      {/* Bandeau couleur */}
      <div className={`h-1 bg-linear-to-r ${gradient}`} />

      <div className="p-5">
        {/* Numéro + badge annulation */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              N° Dossier Commun
            </p>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {dossierActif.numero}
            </p>
          </div>

          {dossierActif.raisonAnnulation && (
            <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Annulé
            </span>
          )}
        </div>

        {/* Grille d'infos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 pt-3 border-t border-slate-100">
          {dossierActif.raisonAnnulation && (
            <Field label="Raison d'annulation" value={dossierActif.raisonAnnulation} />
          )}
          {dossierActif.dateAnnulation && (
            <Field label="Date d'annulation" value={dossierActif.dateAnnulation} />
          )}
          <Field label="Contact principal"   value={dossierActif.contactPrincipal} />
          <Field label="WhatsApp"            value={dossierActif.whatsapp} />
          <Field label="Réf. Travel Planner" value={dossierActif.referenceTravelPlaner} />
          <Field label="Client facturé"      value={dossierActif.clientfacture?.libelle} />
          <Field label="Code client"         value={dossierActif.clientfacture?.code} />
        </div>
      </div>
    </div>
  );
}