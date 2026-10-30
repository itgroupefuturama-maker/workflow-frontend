import { FiCheck, FiSend, FiArrowRight } from "react-icons/fi";

interface BilletActionsProps {
  billet: any;
  allLinesEmission: boolean;
  allLinesReservation: boolean;
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
  variant = "blue" 
}: { 
  onClick: () => void; 
  disabled: boolean; 
  icon: any; 
  label: string; 
  variant?: "amber" | "emerald" | "blue" | "purple" 
}) => {
  const themes = {
    amber:   "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    blue:    "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    purple:  "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
  };

  return (
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
  );
};

export const BilletActions = ({
  billet,
  allLinesEmission,
  allLinesReservation,
  envoiEnCours = null,
  onApprouver,
  onShowEmission,
}: BilletActionsProps) => {
  
  return (
    <div className="flex flex-wrap gap-2 justify-end items-center">
      {/* 1. Envoie la vente à Odoo : le statut reste CREER jusqu'à la validation d'Odoo */}
      <ActionButton
        label={envoiEnCours === 'VENTE' ? 'Envoi à Odoo…' : 'Approuver'}
        icon={FiSend}
        variant="blue"
        onClick={() => onApprouver(billet.id)}
        disabled={envoiEnCours !== null || !(allLinesReservation && billet?.statut === 'CREER')}
      />

      {/* 2. Émettre Billet : affiché seulement quand toutes les lignes sont CLOTURER / MODIFIER / ANNULER */}
      {allLinesEmission && (
        <ActionButton
          label={envoiEnCours === 'ACHAT' ? 'Envoi à Odoo…' : 'Émettre Billet'}
          icon={FiCheck}
          variant="purple"
          onClick={onShowEmission}
          disabled={envoiEnCours !== null || billet?.statut !== 'BC_CLIENT_A_APPROUVER'}
        />
      )}

      {/* Facturer / Régler : réservés à Odoo (les routes renvoient 401 au front) */}
    </div>
  );
};