import React from 'react';

// 1. On déclare le sous-composant ICI, à l'extérieur
const InfoItem = ({ 
  label, 
  value, 
  className = "" 
}: { 
  label: string; 
  value: string | number | React.ReactNode; 
  className?: string 
}) => (
  <div>
    <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
      {label}
    </label>
    <p className={`font-medium text-xs uppercase ${className}`}>{value || '—'}</p>
  </div>
);

interface BilletInfoCardsProps {
  billet: any;
  clientFacture: any;
  dossier: any;
}

const BilletInfoCards: React.FC<BilletInfoCardsProps> = ({ billet, clientFacture, dossier }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <InfoItem label="Num Dossier Entete" value={billet?.prospectionEntete?.numeroEntete} />
        <InfoItem label="Num Billet" value={billet?.numeroBillet} />
        <InfoItem 
          label="Date Création" 
          value={billet?.createdAt ? new Date(billet.createdAt).toLocaleString('fr-FR') : '—'} 
        />
        <InfoItem label="Statut Billet" value={billet?.statut == 'CREER' ? 'Crée' : billet?.statut} />

        <div>
          <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
            Raison Annulation
          </label>
          <p className="p-3 font-medium border border-slate-100 bg-slate-50/50 rounded min-h-3rem">
            {billet?.raisonAnnul || 'Aucune'}
          </p>
        </div>

        <InfoItem label="Client Facturé" value={clientFacture?.libelle} />
        <InfoItem label="Contact Principal" value={dossier?.contactPrincipal} />
        <InfoItem label="Whatsapp" value={dossier?.whatsapp} />

        <InfoItem label="Compagnie" value={billet?.prospectionEntete?.fournisseur?.libelle} />
        <InfoItem label="Total compagnie" value={`${billet?.totalCompagnie?.toLocaleString('fr-FR')} Ar`} />
        
        {/* J'ai gardé la correction pour Type Vol ici aussi */}
        <InfoItem label="Type Vol" value={billet?.typeVol} /> 

        <InfoItem label="Commission proposée" value={`${billet?.commissionPropose} %`} />
        <InfoItem label="Commission appliquée" value={`${billet?.commissionAppliquer} %`} />
        <InfoItem label="Total Commission" value={`${billet?.totalCommission} %`} />

      </div>
    </div>
  );
};

export default BilletInfoCards;