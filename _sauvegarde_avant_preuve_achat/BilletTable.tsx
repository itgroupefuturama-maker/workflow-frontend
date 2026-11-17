import React, { useState } from 'react';
import type { BilletLigne, ServiceProspectionLigne, ServiceSpecifique } from '../../../../../../app/front_office/billetSlice';
import { FiFilter, FiX } from 'react-icons/fi';
import { BilletActions } from './BilletActions';
import OdooEnvoisStatus from './OdooEnvoisStatus';
import { PassagersCell } from './PassagersCell';
import { MiniaturePreuve } from '../../../../../../components/ui/Preuve';
import {
  CLASSES_TON,
  estEnAttente,
  estLectureSeule,
  estLigneFrais,
  estTerminee,
  libelleLigne,
  peutAnnuler,
  peutReprogrammer,
  peutReserver,
  peutSaisirNumeros,
} from './utils/billetStatuts';

import { fmtDevise, fmtNombre } from '../../../../../../utils/format';
import { AlertTriangle, Building2, Coins, Plane, Ticket, User } from 'lucide-react';
import SelecteurVuesPrix from '../../prospection/SelecteurVuesPrix';
import BarreGroupes from '../../prospection/BarreGroupes';
import { useGroupesMasques } from '../../prospection/groupesMasques';
import { CellulesBillet, EnTeteGroupeBillet, SousEnTetesBillet } from '../../prospection/ColonnesPrixBillet';
import { aEmission, aResa, useVuesPrix } from '../../prospection/vuesPrix';

// --- Sous-composant pour les cellules de prix (évite la répétition et les erreurs de rendu) ---
const PriceCell = ({ value, isCurrency = false, className = "" }: { value: number, isCurrency?: boolean, className?: string }) => (
  <td className={`px-4 py-3 text-right ${className}`}>
    {isCurrency ? fmtDevise(value) : fmtNombre(value)}
  </td>
);

interface BilletTableProps {
  loading?: boolean;
  lignes: any[];
  groups: any[];
  billet: any;
  billetLignes: any[];
  handleOpenReservation: (ligne: any) => void;
  handleOpenEmission: (ligne: any) => void;
  // « Modifier » : choix mise à jour de la réservation / reprogrammation (ou reprogrammation directe si achetée)
  handleModifier: (ligne: BilletLigne) => void;
  handleRemove: (ligne: BilletLigne) => void;
  serviceById: Map<string, ServiceSpecifique>;
  handleReporter: (ligne: BilletLigne) => void;
  envoiOdooEnCours: 'VENTE' | 'ACHAT' | null;
  onRenvoyerAchat: () => void;
  onActualiser: () => void;
  onApprouver: (billetId: string) => void;
  onShowEmission: () => void;
  onAnnulerReservation?: () => void;
  onAnnulerEmission?: () => void;
}
// ────────────────────────────────────────────────
// Sous-composant pour afficher les services spécifiques
// ────────────────────────────────────────────────
const ServicesSpecifiquesCell = ({
  services,
}: {
  services: ServiceProspectionLigne[] | undefined;
}) => {
  if (!services || services.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  return (
    <div className="flex flex-row gap-1">
      {services.map((svc) => {
        const libelle = svc.serviceSpecifique?.libelle ?? '—';
        const valeur =
          svc.valeur === 'true'  ? 'Oui' :
          svc.valeur === 'false' ? 'Non' :
          svc.valeur;

        return (
          <span
            key={svc.id}
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200"
            title={svc.serviceSpecifique?.code ?? ''}
          >
            {libelle} : {valeur}
          </span>
        );
      })}
    </div>
  );
};

const BilletTable: React.FC<BilletTableProps> = ({
  loading = false,
  lignes,
  billet,
  handleOpenReservation,
  handleOpenEmission,
  handleModifier,
  handleRemove,
  handleReporter,
  billetLignes,
  envoiOdooEnCours,
  onRenvoyerAchat,
  onActualiser,
  onApprouver,
  onShowEmission,
  onAnnulerReservation,
  onAnnulerEmission,
}) => {
  const [sortOriginAsc, setSortOriginAsc] = useState(true);

  // ── Prix affichés : Prospection / Résa / Émission (choix libre, mémorisé pour l'écran billet) ──
  const { vues, setVues, afficher } = useVuesPrix('billet.vuesPrix', ['PROSPECTION', 'RESA']);
  const compteursVues = {
    RESA: lignes.filter((l) => aResa(l)).length,
    EMISSION: lignes.filter((l) => aEmission(l)).length,
  };

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

  // Groupes de colonnes MASQUÉS (0 colonne), mémorisés — voir BarreGroupes.tsx
  const [collapsedGroups, setCollapsedGroups] = useGroupesMasques('billet.groupesMasques', {
    infosVol: false,
    puCieDevise: false,
    puCieAriary: false,
    puClientDevise: false,
    puClientAriary: false,
    mtCieDevise: false,
    mtCieAriary: false,
    mtClientDevise: false,
    mtClientAriary: false,
    mtResa: false,
    commissions: false,
    annulation: false,
    services: false,
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
    <div className="relative overflow-x-auto" aria-busy={loading}>
      {/* Voile pendant un re-fetch : le tableau reste visible mais non cliquable (évite les doubles actions) */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-start justify-center pt-16 bg-white/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow border border-slate-200">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            <span className="text-sm font-medium text-slate-600">Mise à jour…</span>
          </div>
        </div>
      )}
      <div className="bg-white overflow-hidden border border-slate-300">
        {/* Titre + icône filtre */}
        <div className="border-b p-3 border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
              Lignes du billet
            </h2>
            <button
                onClick={toggleSortOrigin}
                className="flex items-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-300 transition-all text-xs font-semibold"
                title="Trier par Origin Ligne"
              >
              <FiFilter size={14} />
              <span>Origin Ligne</span>
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                sortOriginAsc
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {sortOriginAsc ? '▲ A→Z' : '▼ Z→A'}
              </span>
            </button>
            <SelecteurVuesPrix
              value={vues}
              onChange={setVues}
              compteurs={compteursVues}
              total={lignes.length}
            />
          </div>
          <div className="flex items-center gap-3">
            <BilletActions
              billet={billet}
              lignes={billetLignes}
              envoiEnCours={envoiOdooEnCours}
              onApprouver={onApprouver}
              onShowEmission={onShowEmission}
              onAnnulerReservation={onAnnulerReservation}
              onAnnulerEmission={onAnnulerEmission}
            />
            
          </div>
        </div>

        <OdooEnvoisStatus
          envois={billet?.odooEnvois}
          envoiEnCours={envoiOdooEnCours}
          onRenvoyerVente={() => onApprouver(billet.id)}
          onRenvoyerAchat={onRenvoyerAchat}
          onActualiser={onActualiser}
        />

        {/* Groupes de colonnes : vues rapides + masquer / afficher */}
        <BarreGroupes
          groupes={[
            { key: 'infosVol', label: 'Infos Vol', icon: Plane },
            { key: 'puCieDevise', label: 'PU Cie Devise', icon: Building2 },
            { key: 'puCieAriary', label: 'PU Cie Ar', icon: Building2 },
            { key: 'puClientDevise', label: 'PU Client Devise', icon: User },
            { key: 'puClientAriary', label: 'PU Client Ar', icon: User },
            { key: 'mtCieDevise', label: 'Mt Cie Devise', icon: Building2 },
            { key: 'mtCieAriary', label: 'Mt Cie Ar', icon: Building2 },
            { key: 'mtClientDevise', label: 'Mt Client Devise', icon: User },
            { key: 'mtClientAriary', label: 'Mt Client Ar', icon: User },
            { key: 'mtResa', label: 'Mt Résa', icon: Ticket },
            { key: 'commissions', label: 'Commissions', icon: Coins },
            { key: 'annulation', label: 'Conditions', icon: AlertTriangle },
          ]}
          masques={collapsedGroups}
          onChange={(m) => setCollapsedGroups(m as typeof collapsedGroups)}
          vues={[
            { id: 'essentiel', label: 'Essentiel', title: 'Infos vol, montants client en ariary, commissions',
              masques: ['puCieDevise', 'puCieAriary', 'puClientDevise', 'puClientAriary', 'mtCieDevise', 'mtCieAriary', 'mtClientDevise', 'mtResa', 'annulation'] },
            { id: 'compagnie', label: 'Compagnie', title: 'Prix compagnie uniquement',
              masques: ['puClientDevise', 'puClientAriary', 'mtClientDevise', 'mtClientAriary'] },
            { id: 'client', label: 'Client', title: 'Prix client uniquement',
              masques: ['puCieDevise', 'puCieAriary', 'mtCieDevise', 'mtCieAriary', 'mtResa'] },
            { id: 'tout', label: 'Tout', masques: [], title: 'Tous les groupes' },
          ]}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-200 sticky top-0 z-10 text-xs">
              {/* Ligne 1 — groupes */}
              <tr className="border-b-2 border-slate-300">
                {/* Colonnes fixes (rowSpan=2) */}
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 w-12">N°</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100 min-w-[130px]">N° Dos Ref</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Origin Ligne</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Compagnie</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">N° Résa</th>
                <th rowSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700 uppercase bg-slate-100">Taux Prospection</th>
                <th rowSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700 uppercase bg-slate-100">Taux Resa</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100">Statut</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100">Nb pax</th>

                {/* Groupe Infos Vol */}
                {!collapsedGroups.infosVol && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={12}
                  onClick={() => toggleGroup('infosVol')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-slate-700 border-x border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plane size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Infos Vol
                    <span className="text-slate-300 text-xs">✕</span>
                  </div>
                </th>
                )}

                {afficher.PROSPECTION && (<>
                {/* ********************** Prix Prospection ********************** */}
                {/* Groupe PU Cie Devise */}
                {!collapsedGroups.puCieDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={6}
                  onClick={() => toggleGroup('puCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Cie Devise Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe PU Cie Ariary */}
                {!collapsedGroups.puCieAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Cie Ariary Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe PU Client Devise */}
                {!collapsedGroups.puClientDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Client Devise Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe PU Client Ariary */}
                {!collapsedGroups.puClientAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Client Ariary Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Cie Devise Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Cie Ariary Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Client Devise */}
                {!collapsedGroups.mtClientDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Client Devise Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Client Ariary Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Réservation */}
                {!collapsedGroups.mtResa && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtResa')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Ticket size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Total CIE Prospection
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                </>)}

                {afficher.RESA && (<>
                {/* ****************************** Prix Reservation ****************************** */}

                {/* Groupe PU Cie Devise */}
                {!collapsedGroups.puCieDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Cie Devise Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe PU Cie Ariary */}
                {!collapsedGroups.puCieAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Cie Ariary Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe PU Client Devise */}
                {!collapsedGroups.puClientDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Client Devise Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe PU Client Ariary */}
                {!collapsedGroups.puClientAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('puClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />PU Client Ariary Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Cie Devise Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Cie Ariary Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Client Devise */}
                {!collapsedGroups.mtClientDevise && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Client Devise Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Client Ariary Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Mt Réservation */}
                {!collapsedGroups.mtResa && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={3}
                  onClick={() => toggleGroup('mtResa')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Ticket size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Mt Réservation Réservation
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                </>)}

                {/* Prix Émission */}
                {afficher.EMISSION && (
                  <EnTeteGroupeBillet vue="EMISSION" showPenalite collapsed={false} />
                )}

                {/* Groupe Commissions */}
                {!collapsedGroups.commissions && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={2}
                  onClick={() => toggleGroup('commissions')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-green-700 border-x border-green-500 cursor-pointer hover:bg-green-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Coins size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Commissions
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Groupe Annulation */}
                {!collapsedGroups.annulation && (
                <th
                  title="Masquer ce groupe (réaffichable avec les puces « Groupes »)"
                  colSpan={2}
                  onClick={() => toggleGroup('annulation')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-orange-700 border-x border-orange-500 cursor-pointer hover:bg-orange-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 shrink-0" />Conditions
                    <span className="text-xs">✕</span>
                  </div>
                </th>
                )}

                {/* Services + Actions fixes */}
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Mode de paiement</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Services</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100 min-w-[600px]">
                  Passagers & Billets
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 min-w-[300px]">Preuves</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 min-w-[220px]">Actions</th>
              </tr>

              {/* Ligne 2 — sous-en-têtes */}
              <tr>
                {/* Infos Vol */}
                {!collapsedGroups.infosVol && (
                  <>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Avion</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">N° Vol</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Compagnie</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Itinéraire</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Classe</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Type pax</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Date départ</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Date arrivée</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Aéroport départ</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Aéroport arrivée</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Durée vol</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Durée escale</th>
                  </>
                )}

                {afficher.PROSPECTION && (<>
                {/* PU Cie Devise */}
                {!collapsedGroups.puCieDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Taux Taxe</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Taxe Devise</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Taxe Ariary</th>
                  </>
                )}

                {/* PU Cie Ariary */}
                {!collapsedGroups.puCieAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité Ar</th>
                  </>
                )}

                {/* PU Client Devise */}
                {!collapsedGroups.puClientDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité</th>
                  </>
                )}

                {/* PU Client Ariary */}
                {!collapsedGroups.puClientAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité Ar</th>
                  </>
                )}

                {/* Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité</th>
                  </>
                )}

                {/* Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité Ar</th>
                  </>
                )}

                {/* Mt Client Devise */}
                {!collapsedGroups.mtClientDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité</th>
                  </>
                )}

                {/* Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité Ar</th>
                  </>
                )}

                {/* Mt Réservation */}
                {!collapsedGroups.mtResa && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-50">Pénalité</th>
                  </>
                )}


                </>)}

                {afficher.RESA && (<>
                {/* ********************** Prix resa ******************* */}

                {/* PU Cie Devise */}
                {!collapsedGroups.puCieDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité</th>
                  </>
                )}

                {/* PU Cie Ariary */}
                {!collapsedGroups.puCieAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité Ar</th>
                  </>
                )}

                {/* PU Client Devise */}
                {!collapsedGroups.puClientDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité</th>
                  </>
                )}

                {/* PU Client Ariary */}
                {!collapsedGroups.puClientAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité Ar</th>
                  </>
                )}

                {/* Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité</th>
                  </>
                )}

                {/* Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité Ar</th>
                  </>
                )}

                {/* Mt Client Devise */}
                {!collapsedGroups.mtClientDevise && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité</th>
                  </>
                )}

                {/* Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité Ar</th>
                  </>
                )}

                {/* Mt Réservation */}
                {!collapsedGroups.mtResa && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-800 bg-violet-50">Pénalité</th>
                  </>
                )}

                </>)}

                {afficher.EMISSION && <SousEnTetesBillet vue="EMISSION" collapsed={false} showPenalite />}

                {/* Commissions */}
                {!collapsedGroups.commissions && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50">Devise</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50">Ariary</th>
                  </>
                )}

                {/* Conditions */}
                {!collapsedGroups.annulation && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-orange-700 bg-orange-50">Modif</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-orange-700 bg-orange-50">Annulation</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {sortedLignes.map((ligne, index) => {
                const p = ligne.prospectionLigne;
                const fournisseurLibelle = billet?.prospectionEntete?.fournisseur?.libelle || '—';
                const prospectionEntete = billet?.prospectionEntete;

                // Calculs simples par ligne (plus de group)
                // Règles du backend (utils/billetStatuts) : ligne annulée, remplacée ou de frais = lecture seule
                // Annulée / remplacée : grisée et barrée ; frais d'annulation : grisée ; en attente d'Odoo : verrouillée
                const lectureSeule = estLectureSeule(billet, ligne);
                const terminee     = estTerminee(ligne);
                const ligneFrais   = estLigneFrais(ligne);
                const etatLigne    = libelleLigne(ligne);

                return (
                    <tr
                      key={ligne.id}
                      className={`transition-colors text-xs ${terminee || ligneFrais ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/70'}`}
                    >
                      {/* Colonnes fixes */}
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">{index + 1}</td>
                    <td className={`px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold text-slate-800 ${terminee ? 'line-through' : ''}`}>
                      {ligne.numeroDosRef || p?.numeroDosRef || '—'}
                    </td>
                      <td className={`px-4 py-3 text-xs text-slate-600 ${terminee ? 'line-through' : ''}`}>{ligne.referenceLine}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ligne.reservation || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{ligne.prospectionLigne.tauxEchange || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{ligne.resaTauxEchange || '—'}</td>
                      <td className="px-4 py-3 text-center text-xs min-w-[160px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${CLASSES_TON[etatLigne.ton]}`}>
                          {etatLigne.texte}
                        </span>
                        {ligneFrais && <p className="mt-1 text-[10px] text-slate-500">Frais d'annulation</p>}
                        {ligne.etatOdoo === 'REJETE' && ligne.motifRejet && (
                          <p className="mt-1 text-[11px] text-red-600 text-left max-w-[220px]">
                            {ligne.motifRejet}
                            {ligne.rejeteAt && (
                              <span className="text-red-400"> — {new Date(ligne.rejeteAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            )}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{ligne.prospectionLigne.nombre || '—'}</td>

                      {/* Infos Vol */}
                      {!collapsedGroups.infosVol && (
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
                          <td className="px-4 py-3">{p?.aeroportDepart || '—'}</td>
                          <td className="px-4 py-3">{p?.aeroportArrivee || '—'}</td>
                          <td className="px-4 py-3">{p?.dureeVol || '—'}</td>
                          <td className="px-4 py-3">{p?.dureeEscale || '—'}</td>
                        </>
                      )}

                      {afficher.PROSPECTION && (<>
                      {/* **************************** Prix Prospection **************************** */}

                      {/* ===== SECTION PRIX PROSPECTION (depuis ligne.prospectionLigne) ===== */}

                      {/* PU Cie Devise - Prospection */}
                      {!collapsedGroups.puCieDevise && (
                        <>
                          <PriceCell value={p?.puBilletCompagnieDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.puServiceCompagnieDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.puPenaliteCompagnieDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.tauxTaxe} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantTaxeDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantTaxeAriary} isCurrency className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* PU Cie Ariary - Prospection */}
                      {!collapsedGroups.puCieAriary && (
                        <>
                          <PriceCell value={p?.puBilletCompagnieAriary} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.puServiceCompagnieAriary} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.puPenaliteCompagnieAriary} isCurrency className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* PU Client Devise - Prospection */}
                      {/* ⚠️ ProspectionLigne n'a PAS de puBilletClientDevise séparé,
                          il a montantBilletClientDevise — à adapter selon votre modèle */}
                      {!collapsedGroups.puClientDevise && (
                        <>
                          <PriceCell value={p?.montantBilletClientDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceClientDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteClientDevise} isCurrency className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* PU Client Ariary - Prospection */}
                      {!collapsedGroups.puClientAriary && (
                        <>
                          <PriceCell value={p?.montantBilletClientAriary} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceClientAriary} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteClientAriary} isCurrency className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* Mt Cie Devise - Prospection */}
                      {!collapsedGroups.mtCieDevise && (
                        <>
                          <PriceCell value={p?.montantBilletCompagnieDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceCompagnieDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteCompagnieDevise} isCurrency className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* Mt Cie Ariary - Prospection */}
                      {!collapsedGroups.mtCieAriary && (
                        <>
                          <PriceCell value={p?.montantBilletCompagnieAriary} className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceCompagnieAriary} className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteCompagnieAriary} className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* Mt Client Devise - Prospection */}
                      {!collapsedGroups.mtClientDevise && (
                        <>
                          <PriceCell value={p?.montantBilletClientDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceClientDevise} isCurrency className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteClientDevise} isCurrency className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* Mt Client Ariary - Prospection */}
                      {!collapsedGroups.mtClientAriary && (
                        <>
                          <PriceCell value={p?.montantBilletClientAriary} className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceClientAriary} className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteClientAriary} className="font-medium text-emerald-800" />
                        </>
                      )}

                      {/* Mt Réservation - Prospection (commission + total) */}
                      {!collapsedGroups.mtResa && (
                        <>
                          <PriceCell value={p?.montantBilletCompagnieAriary} className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantServiceCompagnieAriary} className="font-medium text-emerald-800" />
                          <PriceCell value={p?.montantPenaliteCompagnieAriary} className="font-medium text-emerald-800" />
                        </>
                      )}

                      </>)}

                      {afficher.RESA && (<>
                      {/* **************************** Prix Resa **************************** */}
                      {/* PU Cie Devise */}
                      {!collapsedGroups.puCieDevise && (
                        <>
                          <PriceCell value={ligne.puResaBilletCompagnieDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaServiceCompagnieDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaPenaliteCompagnieDevise} isCurrency className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* PU Cie Ariary */}
                      {!collapsedGroups.puCieAriary && (
                        <>
                          <PriceCell value={ligne.puResaBilletCompagnieAriary} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaServiceCompagnieAriary} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaPenaliteCompagnieAriary} isCurrency className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* PU Client Devise */}
                      {!collapsedGroups.puClientDevise && (
                        <>
                          <PriceCell value={ligne.puResaBilletClientDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaServiceClientDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaPenaliteClientDevise} isCurrency className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* PU Client Ariary */}
                      {!collapsedGroups.puClientAriary && (
                        <>
                          <PriceCell value={ligne.puResaBilletClientAriary} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaServiceClientAriary} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaPenaliteClientAriary} isCurrency className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* Mt Cie Devise */}
                      {!collapsedGroups.mtCieDevise && (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieDevise} isCurrency className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* Mt Cie Ariary */}
                      {!collapsedGroups.mtCieAriary && (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* Mt Client Devise */}
                      {!collapsedGroups.mtClientDevise && (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletClientDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantServiceClientDevise} isCurrency className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantPenaliteClientDevise} isCurrency className="font-medium text-violet-800" />
                        </>
                      )}

                      {/* Mt Client Ariary */}
                      {!collapsedGroups.mtClientAriary && (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletClientAriary} className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantServiceClientAriary} className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantPenaliteClientAriary} className="font-medium text-violet-800" />
                        </>
                      )}
                      

                      {/* Mt Réservation */}
                      {!collapsedGroups.mtResa && (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-violet-800" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-violet-800" />
                        </>
                      )}

                      </>)}

                      {/* Prix Émission */}
                      {afficher.EMISSION && (
                        <CellulesBillet vue="EMISSION" liee={{ principale: ligne, toutes: [ligne] }}
                          collapsed={false} showPenalite tauxTaxe={p?.tauxTaxe} />
                      )}

                      {/* Commissions */}
                      {!collapsedGroups.commissions && (
                        <>
                          <PriceCell value={ligne.resaCommissionEnDevise} className="font-medium text-green-700" />
                          <PriceCell value={ligne.resaCommissionEnAriary} className="font-medium text-green-700" />
                        </>
                      )}

                      {/* Conditions */}
                      {!collapsedGroups.annulation && (
                        <>
                          {/* Conditions enregistrées sur la ligne billet (repli sur la prospection pour la modif) */}
                          <td className="px-4 py-3">{ligne.conditionModif || p?.conditionModif || '—'}</td>
                          <td className="px-4 py-3">{ligne.conditionAnnul || '—'}</td>
                        </>
                      )}

                      <td className="px-4 py-3">
                        {ligne.prospectionLigne?.modePaiement}
                      </td>

                      <td className="px-4 py-3">
                        <ServicesSpecifiquesCell 
                          services={ligne.prospectionLigne?.serviceProspectionLigne} 
                        />
                      </td>

                      <td className="px-4 py-3 align-top">
                        <PassagersCell billets={ligne.billet} handleReporter={handleReporter} ligne={ligne} billetEntete={billet} />
                      </td>

                      {/* Preuves : devis (en-tête), acceptation de la résa par le client, capture du n° de résa */}
                      <td className="px-4 py-3">
                        <div className="flex flex-row gap-3">
                          <div>
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Devis client</p>
                            <MiniaturePreuve chemin={prospectionEntete?.preuveClient} libelle="Preuve d'acceptation du devis" />
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Accept. client</p>
                            <MiniaturePreuve chemin={ligne.preuveAcceptationClient} libelle="Preuve d'acceptation de la réservation" />
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">N° résa</p>
                            <MiniaturePreuve chemin={ligne.preuveResa} libelle="Capture du n° de réservation" />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center min-w-[220px]">
                        <div className="flex items-center justify-center gap-2 flex-wrap">

                          {peutReserver(billet, ligne) && ligne.statut === 'CREER' && (
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

                          {/* Saisie des numéros : seulement après validation de la vente de CETTE ligne par Odoo */}
                          {ligne.statut === 'FAIT' && !lectureSeule && !peutSaisirNumeros(billet, ligne) && (
                            <span title="La vente doit d'abord être validée par Odoo">
                              <button
                                disabled
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-300 border border-slate-100 rounded-md text-xs font-semibold cursor-not-allowed"
                              >
                                Acheter
                              </button>
                            </span>
                          )}

                          {peutSaisirNumeros(billet, ligne) && (
                            <button
                              onClick={() => handleOpenEmission(ligne)}
                              title="Saisir les numéros de billet compagnie"
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                              </svg>
                              {ligne.statut === 'CLOTURER' ? 'Corriger les numéros' : 'Acheter'}
                            </button>
                          )}

                          {/* FAIT : modal de choix (réservation / reprogrammation) ; CREER, CLOTURER : reprogrammation seule */}
                          {peutReprogrammer(billet, ligne) && (
                            <button
                              onClick={() => handleModifier(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Modifier
                            </button>
                          )}

                          {peutAnnuler(billet, ligne) && (
                            <button
                              onClick={() => handleRemove(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white active:scale-95"
                            >
                              <FiX size={14} />
                              Annuler
                            </button>
                          )}

                          {estEnAttente(ligne) && !terminee && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              En attente de la réponse d'Odoo
                            </span>
                          )}

                          {lectureSeule && !estEnAttente(ligne) && (
                            <span className="text-xs text-slate-400">—</span>
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