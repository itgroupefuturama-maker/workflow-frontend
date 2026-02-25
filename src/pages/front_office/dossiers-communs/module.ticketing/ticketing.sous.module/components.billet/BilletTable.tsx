import React, { useState } from 'react';
import type { BilletLigne, ServiceProspectionLigne, ServiceSpecifique } from '../../../../../../app/front_office/billetSlice';
import { FiFilter, FiX } from 'react-icons/fi';

// --- Sous-composant pour les cellules de prix (évite la répétition et les erreurs de rendu) ---
const PriceCell = ({ value, isCurrency = false, className = "" }: { value: number, isCurrency?: boolean, className?: string }) => (
  <td className={`px-4 py-3 text-right ${className}`}>
    {value?.toLocaleString('fr-FR', isCurrency ? { minimumFractionDigits: 2 } : {}) || '—'}
  </td>
);

interface BilletTableProps {
  lignes: any[];
  groups: any[];
  billet: any;
  billetLignes: any[];
  handleOpenReservation: (ligne: any) => void;
  handleOpenEmission: (ligne: any) => void;
  handleReprogrammer: (ligne: BilletLigne) => void;   // ← CHANGEMENT ICI : une seule ligne
  handleRemove: (ligne: BilletLigne) => void;
  serviceById: Map<string, ServiceSpecifique>;
}

// ────────────────────────────────────────────────
// Sous-composant pour afficher les services spécifiques
// ────────────────────────────────────────────────
const ServicesSpecifiquesCell = ({
  services,
  serviceById,
}: {
  services: ServiceProspectionLigne[] | undefined;
  serviceById: Map<string, ServiceSpecifique>;
}) => {
  if (!services || services.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  return (
    <div className="flex flex-row gap-1">
      {services.map((svc) => {
      const serviceDef = serviceById.get(svc.serviceSpecifiqueId);
      // console.log(
      //   `Recherche service pour ID: ${svc.serviceSpecifiqueId} → trouvé ? `,
      //   !!serviceDef,
      //   serviceDef?.libelle || "(non trouvé)"
      // );

      const displayName = serviceDef?.libelle 
        ? serviceDef.libelle 
        : `Svc (${svc.serviceSpecifiqueId.slice(-6)})`;

        return (
          <span
            key={svc.id}
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200"
            title={`ID: ${svc.serviceSpecifiqueId}`}
          >
            {displayName}: {svc.valeur === 'true' ? 'Oui' : svc.valeur === 'false' ? 'Non' : svc.valeur}
          </span>
        );
      })}
    </div>
  );
};


const BilletTable: React.FC<BilletTableProps> = ({
  lignes,
  groups,
  billet,
  handleOpenReservation,
  handleOpenEmission,
  handleReprogrammer,
  handleRemove,
  serviceById,
}) => {
  const [sortOriginAsc, setSortOriginAsc] = useState(true);

  // On trie les lignes (copie pour ne pas muter la prop)
  const sortedLignes = [...lignes].sort((a, b) => {
    const valA = (a.referenceLine || '').toString().trim().toLowerCase();
    const valB = (b.referenceLine || '').toString().trim().toLowerCase();
    
    if (valA < valB) return sortOriginAsc ? -1 : 1;
    if (valA > valB) return sortOriginAsc ? 1 : -1;
    return 0;
  });

  const toggleSortOrigin = () => {
    setSortOriginAsc(prev => !prev);
  };

  const [collapsedGroups, setCollapsedGroups] = useState({
    infosVol:        false,
    puCieDevise:     true,   // replié par défaut
    puCieAriary:     true,
    puClientDevise:  true,
    puClientAriary:  true,
    mtCieDevise:     false,
    mtCieAriary:     true,
    mtClientDevise:  false,
    mtClientAriary:  true,
    mtResa:          true,
    commissions:     false,
    annulation:      true,
    services:        false,
  });

  const toggleGroup = (group: keyof typeof collapsedGroups) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  if (lignes.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucune ligne enregistrée pour ce billet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-white overflow-hidden border border-slate-200">
        {/* Titre + icône filtre */}
        <div className="border-b pl-5 pr-5 pb-1.5 pt-1.5 border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            Lignes du billet
          </h2>
          <button
              onClick={toggleSortOrigin}
              className="bg-slate-100 p-4 rounded-2xl text-slate-500 hover:text-slate-700 transition-colors"
              title="Trier par Origin Ligne (cliquer pour inverser)"
            >
              <FiFilter size={18} />
            </button>
        </div>

        {/* Dans le div header, après le titre */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Groupes :</span>
          {([
            { key: 'infosVol',       label: '✈️ Infos Vol',       color: 'slate'  },
            { key: 'puCieDevise',    label: '🏢 PU Cie Devise',   color: 'emerald'},
            { key: 'puCieAriary',    label: '🏢 PU Cie Ar',       color: 'emerald'},
            { key: 'puClientDevise', label: '👤 PU Client Devise', color: 'blue'   },
            { key: 'puClientAriary', label: '👤 PU Client Ar',    color: 'blue'   },
            { key: 'mtCieDevise',    label: '🏢 Mt Cie Devise',   color: 'teal'   },
            { key: 'mtCieAriary',    label: '🏢 Mt Cie Ar',       color: 'teal'   },
            { key: 'mtClientDevise', label: '👤 Mt Client Devise', color: 'indigo' },
            { key: 'mtClientAriary', label: '👤 Mt Client Ar',    color: 'indigo' },
            { key: 'mtResa',         label: '🎫 Mt Résa',         color: 'violet' },
            { key: 'commissions',    label: '💰 Commissions',     color: 'green'  },
            { key: 'annulation',     label: '⚠️ Conditions',      color: 'orange' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleGroup(key)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                collapsedGroups[key]
                  ? 'bg-white text-slate-400 border-slate-200 line-through'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setCollapsedGroups(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])) as any)}
            className="ml-auto text-xs px-3 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-medium"
          >
            Tout replier
          </button>
          <button
            onClick={() => setCollapsedGroups(prev => Object.fromEntries(Object.keys(prev).map(k => [k, false])) as any)}
            className="text-xs px-3 py-1 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium"
          >
            Tout déplier
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 text-xs">
              {/* Ligne 1 — groupes */}
              <tr className="border-b-2 border-slate-300">
                {/* Colonnes fixes (rowSpan=2) */}
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 w-12">N°</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Origin Ligne</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Fournisseur</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">N° Résa</th>
                <th rowSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700 uppercase bg-slate-100">Taux</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100">Statut</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100">Nb pax</th>

                {/* Groupe Infos Vol */}
                <th
                  colSpan={collapsedGroups.infosVol ? 1 : 10}
                  onClick={() => toggleGroup('infosVol')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-slate-700 border-x border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    ✈️ Infos Vol
                    <span className="text-slate-300 text-xs">{collapsedGroups.infosVol ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Cie Devise */}
                <th
                  colSpan={collapsedGroups.puCieDevise ? 1 : 3}
                  onClick={() => toggleGroup('puCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 PU Cie Devise
                    <span className="text-xs">{collapsedGroups.puCieDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Cie Ariary */}
                <th
                  colSpan={collapsedGroups.puCieAriary ? 1 : 3}
                  onClick={() => toggleGroup('puCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-800 border-x border-emerald-600 cursor-pointer hover:bg-emerald-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 PU Cie Ariary
                    <span className="text-xs">{collapsedGroups.puCieAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Client Devise */}
                <th
                  colSpan={collapsedGroups.puClientDevise ? 1 : 3}
                  onClick={() => toggleGroup('puClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-blue-700 border-x border-blue-500 cursor-pointer hover:bg-blue-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 PU Client Devise
                    <span className="text-xs">{collapsedGroups.puClientDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Client Ariary */}
                <th
                  colSpan={collapsedGroups.puClientAriary ? 1 : 3}
                  onClick={() => toggleGroup('puClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-blue-800 border-x border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 PU Client Ariary
                    <span className="text-xs">{collapsedGroups.puClientAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Cie Devise */}
                <th
                  colSpan={collapsedGroups.mtCieDevise ? 1 : 3}
                  onClick={() => toggleGroup('mtCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-teal-700 border-x border-teal-500 cursor-pointer hover:bg-teal-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 Mt Cie Devise
                    <span className="text-xs">{collapsedGroups.mtCieDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Cie Ariary */}
                <th
                  colSpan={collapsedGroups.mtCieAriary ? 1 : 3}
                  onClick={() => toggleGroup('mtCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-teal-800 border-x border-teal-600 cursor-pointer hover:bg-teal-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 Mt Cie Ariary
                    <span className="text-xs">{collapsedGroups.mtCieAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Client Devise */}
                <th
                  colSpan={collapsedGroups.mtClientDevise ? 1 : 3}
                  onClick={() => toggleGroup('mtClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-indigo-700 border-x border-indigo-500 cursor-pointer hover:bg-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 Mt Client Devise
                    <span className="text-xs">{collapsedGroups.mtClientDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Client Ariary */}
                <th
                  colSpan={collapsedGroups.mtClientAriary ? 1 : 3}
                  onClick={() => toggleGroup('mtClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-indigo-800 border-x border-indigo-600 cursor-pointer hover:bg-indigo-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 Mt Client Ariary
                    <span className="text-xs">{collapsedGroups.mtClientAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Réservation */}
                <th
                  colSpan={collapsedGroups.mtResa ? 1 : 3}
                  onClick={() => toggleGroup('mtResa')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🎫 Mt Réservation
                    <span className="text-xs">{collapsedGroups.mtResa ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Commissions */}
                <th
                  colSpan={collapsedGroups.commissions ? 1 : 2}
                  onClick={() => toggleGroup('commissions')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-green-700 border-x border-green-500 cursor-pointer hover:bg-green-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    💰 Commissions
                    <span className="text-xs">{collapsedGroups.commissions ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Annulation */}
                <th
                  colSpan={collapsedGroups.annulation ? 1 : 2}
                  onClick={() => toggleGroup('annulation')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-orange-700 border-x border-orange-500 cursor-pointer hover:bg-orange-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    ⚠️ Conditions
                    <span className="text-xs">{collapsedGroups.annulation ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Services + Actions fixes */}
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Services</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 min-w-[220px]">Actions</th>
              </tr>

              {/* Ligne 2 — sous-en-têtes */}
              <tr>
                {/* Infos Vol */}
                {!collapsedGroups.infosVol ? (
                  <>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Avion</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">N° Vol</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Compagnie</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Itinéraire</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Classe</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Type pax</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Date départ</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Date arrivée</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Durée vol</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Durée escale</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-slate-400 italic bg-slate-800/10">— replié —</th>
                )}

                {/* PU Cie Devise */}
                {!collapsedGroups.puCieDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-emerald-400 italic bg-emerald-50">— replié —</th>
                )}

                {/* PU Cie Ariary */}
                {!collapsedGroups.puCieAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-emerald-500 italic bg-emerald-100">— replié —</th>
                )}

                {/* PU Client Devise */}
                {!collapsedGroups.puClientDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-blue-400 italic bg-blue-50">— replié —</th>
                )}

                {/* PU Client Ariary */}
                {!collapsedGroups.puClientAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-blue-500 italic bg-blue-100">— replié —</th>
                )}

                {/* Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-teal-400 italic bg-teal-50">— replié —</th>
                )}

                {/* Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-teal-500 italic bg-teal-100">— replié —</th>
                )}

                {/* Mt Client Devise */}
                {!collapsedGroups.mtClientDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-indigo-400 italic bg-indigo-50">— replié —</th>
                )}

                {/* Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-indigo-500 italic bg-indigo-100">— replié —</th>
                )}

                {/* Mt Réservation */}
                {!collapsedGroups.mtResa ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-violet-400 italic bg-violet-50">— replié —</th>
                )}

                {/* Commissions */}
                {!collapsedGroups.commissions ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50">Devise</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50">Ariary</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-green-400 italic bg-green-50">— replié —</th>
                )}

                {/* Conditions */}
                {!collapsedGroups.annulation ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-orange-700 bg-orange-50">Modif</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-orange-700 bg-orange-50">Annulation</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-orange-400 italic bg-orange-50">— replié —</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLignes.map((ligne, index) => {
                const p = ligne.prospectionLigne;
                const fournisseurLibelle = billet?.prospectionEntete?.fournisseur?.libelle || '—';

                // Calculs simples par ligne (plus de group)
                const isReserved = !!ligne.reservation?.trim();
                const isEmitted  = ligne.statut === 'CLOTURER';
                const canReserve = !isReserved && !['MODIFIER', 'ANNULER', 'FAIT'].includes(ligne.statut || '') ;
                const canEmit    = ligne.statut === 'FAIT' && billet?.statut !== 'CREER';
                const isAnnulerDisabled =
                  ['ANNULER', 'CLOTURER', 'MODIFIER', 'CREER'].includes(ligne.statut);

                return (
                    <tr key={ligne.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                      {/* Colonnes fixes */}
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ligne.referenceLine}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ligne.reservation || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{ligne.resaTauxEchange || '—'}</td>
                      <td className="px-4 py-3 text-center text-xs">{ligne.statusLigne || '—'}</td>
                      <td className="px-4 py-3 text-center font-medium">{ligne.prospectionLigne.nombre || '—'}</td>

                      {/* Infos Vol */}
                      {!collapsedGroups.infosVol ? (
                        <>
                          <td className="px-4 py-3">{p?.avion || '—'}</td>
                          <td className="px-4 py-3 font-medium">{p?.numeroVol || '—'}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                          <td className="px-4 py-3">{p?.itineraire || '—'}</td>
                          <td className="px-4 py-3">{p?.classe || '—'}</td>
                          <td className="px-4 py-3">{p?.typePassager || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            {p?.dateHeureDepart ? new Date(p.dateHeureDepart).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p?.dateHeureArrive ? new Date(p.dateHeureArrive).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td className="px-4 py-3">{p?.dureeVol || '—'}</td>
                          <td className="px-4 py-3">{p?.dureeEscale || '—'}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-slate-400 bg-slate-50 italic">
                          {p?.numeroVol} · {p?.itineraire}
                        </td>
                      )}

                      {/* PU Cie Devise */}
                      {!collapsedGroups.puCieDevise ? (
                        <>
                          <PriceCell value={ligne.puResaBilletCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaServiceCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteCompagnieDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-emerald-600 bg-emerald-50 font-semibold">
                          {ligne.puResaBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* PU Cie Ariary */}
                      {!collapsedGroups.puCieAriary ? (
                        <>
                          <PriceCell value={ligne.puResaBilletCompagnieAriary} isCurrency />
                          <PriceCell value={ligne.puResaServiceCompagnieAriary} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteCompagnieAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-emerald-700 bg-emerald-100 font-semibold">
                          {ligne.puResaBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* PU Client Devise */}
                      {!collapsedGroups.puClientDevise ? (
                        <>
                          <PriceCell value={ligne.puResaBilletClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaServiceClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteClientDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-blue-600 bg-blue-50 font-semibold">
                          {ligne.puResaBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* PU Client Ariary */}
                      {!collapsedGroups.puClientAriary ? (
                        <>
                          <PriceCell value={ligne.puResaBilletClientAriary} isCurrency />
                          <PriceCell value={ligne.puResaServiceClientAriary} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteClientAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-blue-700 bg-blue-100 font-semibold">
                          {ligne.puResaBilletClientAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Cie Devise */}
                      {!collapsedGroups.mtCieDevise ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-teal-600 bg-teal-50 font-semibold">
                          {ligne.puResaMontantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Mt Cie Ariary */}
                      {!collapsedGroups.mtCieAriary ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-emerald-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-teal-700 bg-teal-100 font-semibold">
                          {ligne.puResaMontantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Client Devise */}
                      {!collapsedGroups.mtClientDevise ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantServiceClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantPenaliteClientDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-indigo-600 bg-indigo-50 font-semibold">
                          {ligne.puResaMontantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Mt Client Ariary */}
                      {!collapsedGroups.mtClientAriary ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletClientAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantServiceClientAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantPenaliteClientAriary} className="font-medium text-emerald-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-indigo-700 bg-indigo-100 font-semibold">
                          {ligne.puResaMontantBilletClientAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Réservation */}
                      {!collapsedGroups.mtResa ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-violet-700" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-violet-700" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-violet-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-violet-600 bg-violet-50 font-semibold">
                          {ligne.puResaMontantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Commissions */}
                      {!collapsedGroups.commissions ? (
                        <>
                          <PriceCell value={ligne.resaCommissionEnDevise} className="font-medium text-green-700" />
                          <PriceCell value={ligne.resaCommissionEnAriary} className="font-medium text-green-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-green-700 bg-green-50 font-bold">
                          {ligne.resaCommissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Conditions */}
                      {!collapsedGroups.annulation ? (
                        <>
                          <td className="px-4 py-3">{p?.conditionModif || '—'}</td>
                          <td className="px-4 py-3">{p?.conditionAnnulation || '—'}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-orange-600 bg-orange-50 italic">
                          {p?.conditionModif ? '⚠️' : '—'}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <ServicesSpecifiquesCell 
                          services={ligne.prospectionLigne?.serviceProspectionLigne} 
                          serviceById={serviceById} 
                        />
                      </td>

                      <td className="px-4 py-3 text-center min-w-[220px]">
                        <div className="flex items-center justify-center gap-2 flex-wrap">

                          {canReserve && 
                            ligne.statusLigne !== 'ANNULATION' && 
                            ligne.statusLigne !== 'ANNULER' && (
                            <button
                              onClick={() => handleOpenReservation(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Réserver
                            </button>
                          )}

                          {canEmit && 
                            ligne.statusLigne !== 'ANNULATION' && 
                            ligne.statusLigne !== 'ANNULER' && (
                            <button
                              onClick={() => handleOpenEmission(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                              </svg>
                              Émettre
                            </button>
                          )}

                          <button
                            disabled={isAnnulerDisabled}
                            onClick={() => handleReprogrammer(ligne)}
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                              ${isAnnulerDisabled
                                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white active:scale-95'}
                            `}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Modifier
                          </button>

                          <button
                            disabled={isAnnulerDisabled}
                            onClick={() => handleRemove(ligne)}
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                              ${isAnnulerDisabled
                                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white active:scale-95'}
                            `}
                          >
                            <FiX size={14} />
                            Annuler
                          </button>

                          {isEmitted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              TERMINÉ
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BilletTable;