import React from 'react';
import { FileText, Hash, Calendar, Tag, XCircle, User, Phone, Building2, Plane, DollarSign, Percent } from 'lucide-react';

const color = {
  bg:      '#3b82f6',
  bgLight: '#eff6ff',
  text:    '#2563eb',
  border:  '#bfdbfe',
};

const InfoItem = ({
  label,
  value,
  icon: Icon,
  accent = false,
  highlight,
}: {
  label: string;
  value?: string | number | React.ReactNode | null;
  icon?: React.ElementType;
  accent?: boolean;
  highlight?: 'red' | 'green' | 'amber';
}) => {
  const highlightStyles = {
    red:   'bg-red-50 border border-red-100',
    green: 'bg-emerald-50 border border-emerald-100',
    amber: 'bg-amber-50 border border-amber-100',
  };

  return (
    <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors ${
      highlight ? highlightStyles[highlight] : 'bg-gray-50 hover:bg-gray-100/80'
    }`}>
      {Icon && (
        <div
          className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
            highlight === 'red'     ? 'bg-red-100 text-red-500'
            : highlight === 'green' ? 'bg-emerald-100 text-emerald-600'
            : highlight === 'amber' ? 'bg-amber-100 text-amber-600'
            : !accent               ? 'bg-white text-gray-400 shadow-sm border border-gray-100'
            : ''
          }`}
          style={accent && !highlight ? { backgroundColor: color.bgLight, color: color.text } : undefined}
        >
          <Icon size={11} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={`text-xs font-bold truncate leading-none ${
          highlight === 'red'     ? 'text-red-700'
          : highlight === 'green' ? 'text-emerald-700'
          : highlight === 'amber' ? 'text-amber-700'
          : 'text-gray-800'
        }`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
};

interface BilletInfoCardsProps {
  billet: any;
  clientFacture: any;
  dossier: any;
}

const BilletInfoCards: React.FC<BilletInfoCardsProps> = ({ billet, clientFacture, dossier }) => {
  const isAnnule = !!billet?.raisonAnnul;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative bg-white px-4 py-3 overflow-hidden border-b border-gray-100">
        <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-20 bg-gradient-to-r from-blue-400 to-blue-600" />
        <div className="absolute -bottom-4 -right-8 w-24 h-24 rounded-full opacity-10 bg-gradient-to-r from-blue-400 to-blue-600" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: color.bgLight, borderColor: color.border, color: color.text }}
            >
              <Plane size={14} />
            </div>
            <div>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5">Billet</p>
              <p className="text-gray-900 text-base font-black tracking-tight leading-none">
                {billet?.numeroBillet ?? '—'}
              </p>
            </div>
          </div>

          {isAnnule ? (
            <span className="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <XCircle size={10} /> Annulé
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: color.bgLight, borderColor: color.border, color: color.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color.bg }} />
              {billet?.statut === 'CREER' ? 'Créé' : billet?.statut}
            </span>
          )}
        </div>
      </div>

      {/* ── Bloc annulation ───────────────────────────────────────────────── */}
      {isAnnule && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5 p-2.5 bg-red-50 border border-red-100 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <XCircle size={12} className="text-red-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Raison d'annulation</p>
              <p className="text-xs font-bold text-red-700">{billet.raisonAnnul}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Grille compacte tout-en-un ───────────────────────────────────── */}
      <div className="p-3 space-y-3">

        {/* Référence */}
        <div>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 px-0.5">Référence</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            <InfoItem label="N° Dossier entête" value={billet?.prospectionEntete?.numeroEntete} icon={FileText} accent />
            <InfoItem label="N° Billet"         value={billet?.numeroBillet}                   icon={Hash}     accent />
            <InfoItem label="Date création"     value={billet?.createdAt ? new Date(billet.createdAt).toLocaleString('fr-FR') : null} icon={Calendar} />
            <InfoItem label="Type vol"          value={billet?.typeVol}                        icon={Plane} />
            <InfoItem label="Total compagnie"     value={billet?.totalCompagnie     != null ? `${billet.totalCompagnie.toLocaleString('fr-FR')} Ar` : null} icon={DollarSign} highlight="amber" />
            <InfoItem label="Commission appliquée" value={billet?.commissionAppliquer != null ? `${billet.commissionAppliquer} %`                        : null} icon={Percent} />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Client */}
        <div>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 px-0.5">Client</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            <InfoItem label="Client facturé"    value={clientFacture?.libelle}                          icon={Building2} />
            <InfoItem label="Contact principal" value={dossier?.contactPrincipal}                       icon={User}   accent />
            <InfoItem label="WhatsApp"          value={dossier?.whatsapp}                               icon={Phone}  accent />
            <InfoItem label="Compagnie"         value={billet?.prospectionEntete?.fournisseur?.libelle} icon={Tag} />
            <InfoItem label="Commission proposée" value={billet?.commissionPropose  != null ? `${billet.commissionPropose} %`                           : null} icon={Percent} />
            <InfoItem label="Total commission"    value={billet?.totalCommission    != null ? `${billet.totalCommission} %`                             : null} icon={Percent} highlight="green" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default BilletInfoCards;