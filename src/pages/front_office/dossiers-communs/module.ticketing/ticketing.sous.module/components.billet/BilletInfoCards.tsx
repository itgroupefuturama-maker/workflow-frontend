import React, { useState } from 'react';
import { 
  FileText, Hash, Calendar, Tag, XCircle, User, 
  Phone, Building2, Plane, DollarSign, Percent, 
  ChevronDown, ChevronUp
} from 'lucide-react';

// --- Sous-composant interne ---
const InfoItemCompact = ({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value?: string | number | React.ReactNode | null;
  icon?: React.ElementType;
  highlight?: 'red' | 'green' | 'amber';
}) => {
  const highlightColors = {
    red:   'text-red-600',
    green: 'text-emerald-600 font-black',
    amber: 'text-amber-600 font-black',
  };

  return (
    <div className="flex flex-col py-1.5 transition-colors group">
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon size={10} className="text-slate-300" />}
        <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">{label}</span>
      </div>
      <p className={`text-[11px] font-semibold truncate ${highlight ? highlightColors[highlight] : 'text-slate-700'}`}>
        {value ?? '—'}
      </p>
    </div>
  );
};

interface BilletInfoCardsProps {
  billet: any;
  clientFacture: any;
  dossier: any;
}

// --- Ton Composant Principal ---
const BilletInfoCards: React.FC<BilletInfoCardsProps> = ({ billet, clientFacture, dossier }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAnnule = !!billet?.raisonAnnul;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm transition-all duration-200 overflow-hidden">
      
      {/* Header Ultra-Compact */}
      <div 
        className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'border-b border-slate-100 bg-slate-50/30' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <Plane size={14} className={isAnnule ? 'text-red-400' : 'text-indigo-500'} />
            <span className="text-xs font-black text-slate-800 tracking-tight whitespace-nowrap">
              {billet?.numeroBillet || 'N/A'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-3 truncate text-[10px]">
            <span className="text-slate-500 font-medium truncate max-w-[150px]">
              {clientFacture?.libelle}
            </span>
            <span className="font-bold text-emerald-600">
              {billet?.totalCompagnie?.toLocaleString('fr-FR')} Ar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAnnule && (
            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">ANNULÉ</span>
          )}
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Contenu Déplié */}
      <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {isAnnule && (
          <div className="px-4 py-2 bg-red-50/50 border-b border-red-100 text-[10px] text-red-700 flex items-center gap-2">
            <XCircle size={12} />
            <strong>Motif:</strong> {billet.raisonAnnul}
          </div>
        )}

        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
            <div className="space-y-0.5">
              <InfoItemCompact label="Entête" value={billet?.prospectionEntete?.numeroEntete} icon={FileText} />
              <InfoItemCompact label="Date" value={billet?.createdAt ? new Date(billet.createdAt).toLocaleDateString() : null} icon={Calendar} />
            </div>

            <div className="space-y-0.5">
              <InfoItemCompact label="Type Vol" value={billet?.typeVol} icon={Plane} />
              <InfoItemCompact label="Compagnie" value={billet?.prospectionEntete?.fournisseur?.libelle} icon={Tag} />
            </div>

            <div className="space-y-0.5">
              <InfoItemCompact label="Facturé à" value={clientFacture?.libelle} icon={Building2} />
              <InfoItemCompact label="WhatsApp" value={dossier?.whatsapp} icon={Phone} />
            </div>

            <div className="space-y-0.5">
              <InfoItemCompact label="Contact" value={dossier?.contactPrincipal} icon={User} />
              <InfoItemCompact label="Passager" value={billet?.typePassager} icon={User} />
            </div>

            <div className="space-y-0.5">
              <InfoItemCompact label="Comm. Prop" value={`${billet?.commissionPropose}%`} icon={Percent} />
              <InfoItemCompact label="Comm. App" value={`${billet?.commissionAppliquer}%`} icon={Percent} highlight="green" />
            </div>

            <div className="space-y-0.5 border-l border-slate-100 pl-4 text-right sm:text-left">
              <InfoItemCompact label="Total Ar" value={billet?.totalCompagnie?.toLocaleString('fr-FR')} icon={DollarSign} highlight="amber" />
              <InfoItemCompact label="Taux" value={`${billet?.tauxEchange} Ar`} icon={Hash} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- LE FIX : L'EXPORTATION ---
export default BilletInfoCards;