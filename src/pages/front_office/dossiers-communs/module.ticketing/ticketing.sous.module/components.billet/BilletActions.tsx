import { FiCheck, FiSend, FiArrowRight } from "react-icons/fi";
import type { BilletLigne } from "../../../../../../app/front_office/billetSlice";
import {
  CLASSES_TON,
  libelleDossier,
  motifBlocageApprouver,
  motifBlocageEmettre,
  texteResumeLignes,
} from "./utils/billetStatuts";

interface BilletActionsProps {
  billet: any;
  // Toutes les lignes du dossier (y compris annulées et frais) : les règles portent sur l'ensemble
  lignes: BilletLigne[];
  // Envoi à Odoo en cours (jusqu'à ~10 s) : bouton concerné désactivé
  envoiEnCours?: 'VENTE' | 'ACHAT' | null;
  onApprouver: (billetId: string) => void;
  onShowEmission: () => void;
  onAnnulerReservation?: () => void;     // ← nouveau
  onAnnulerEmission?: () => void;        // ← nouveau
}

// Composant de bouton réutilisable pour garder le code propre
const ActionButton = ({
  onClick,
  disabled,
  icon: Icon,
  label,
  variant = "blue",
  motif,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: any;
  label: string;
  variant?: "amber" | "emerald" | "blue" | "purple";
  // Raison du blocage, en infobulle (sur le span : un bouton désactivé n'affiche pas toujours son title)
  motif?: string | null;
}) => {
  const themes = {
    amber:   "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    blue:    "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    purple:  "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
  };

  return (
    <span title={disabled && motif ? motif : undefined}>
      <button
        disabled={disabled}
        onClick={onClick}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 border shadow-sm
          active:scale-95
          ${disabled
            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none"
            : themes[variant]}
        `}
      >
        <Icon size={14} className={disabled ? "text-slate-200" : ""} />
        {label}
        {!disabled && <FiArrowRight size={12} className="ml-1 opacity-50" />}
      </button>
    </span>
  );
};

export const BilletActions = ({
  billet,
  lignes,
  envoiEnCours = null,
  onApprouver,
  onShowEmission,
}: BilletActionsProps) => {
  // Statut et etatOdoo calculés par le backend : le front ne fait qu'afficher l'état
  const etatDossier = libelleDossier(billet);
  const resume = texteResumeLignes(billet?.resumeLignes);

  const motifApprouver = motifBlocageApprouver(billet, lignes);
  const motifEmettre = motifBlocageEmettre(billet, lignes);

  return (
    <div className="flex flex-wrap gap-2 justify-end items-center">
      <div className="flex flex-col items-end gap-0.5 mr-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${CLASSES_TON[etatDossier.ton]}`}>
          {etatDossier.texte}
          {billet?.etatOdoo === 'REJETE' && <span className="font-medium">· À corriger</span>}
        </span>
        {resume && <span className="text-[11px] text-slate-500">{resume}</span>}
      </div>

      {/* Dossier annulé : aucun bouton. Facturer / Régler : déclenchés par Odoo, pas de bouton */}
      {billet?.statut !== 'ANNULER' && (
        <>
          {/* Envoie à Odoo les ventes des lignes réservées (nouvelles, modifiées ou rejetées) */}
          <ActionButton
            label={envoiEnCours === 'VENTE' ? 'Envoi à Odoo…' : 'Approuver'}
            icon={FiSend}
            variant="blue"
            onClick={() => onApprouver(billet.id)}
            disabled={envoiEnCours !== null || !!motifApprouver}
            motif={motifApprouver}
          />

          {/* Envoie à Odoo les achats : toutes les lignes actives ont leurs numéros de billet */}
          <ActionButton
            label={envoiEnCours === 'ACHAT' ? 'Envoi à Odoo…' : 'Émettre Billet'}
            icon={FiCheck}
            variant="purple"
            onClick={onShowEmission}
            disabled={envoiEnCours !== null || !!motifEmettre}
            motif={motifEmettre}
          />
        </>
      )}
    </div>
  );
};
