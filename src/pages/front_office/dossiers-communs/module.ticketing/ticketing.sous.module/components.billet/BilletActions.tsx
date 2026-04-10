import { FiCheck, FiCheckCircle, FiFileText, FiSend, FiArrowRight } from "react-icons/fi";

interface BilletActionsProps {
  billet: any;
  allLinesEmission: boolean;
  allLinesReservation: boolean;
  onShowFacture: () => void;
  onRegler: () => void;
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
  onShowFacture,
  onRegler,
  onApprouver,
  onShowEmission,
}: BilletActionsProps) => {
  
  return (
    <div className="flex flex-wrap gap-2 justify-end items-center">
      {/* 1. Mettre à jour la réservation */}
      <ActionButton
        label="Réserver"
        icon={FiSend}
        variant="blue"
        onClick={() => onApprouver(billet.id)}
        disabled={!(allLinesReservation && billet?.statut === 'CREER')}
      />

      {/* 2. Émettre Billet */}
      <ActionButton
        label="Émettre Billet"
        icon={FiCheck}
        variant="purple"
        onClick={onShowEmission}
        disabled={!(allLinesEmission && billet?.statut === 'BC_CLIENT_A_APPROUVER')}
      />

      {/* 3. Émettre Facture */}
      <ActionButton
        label="Facturer"
        icon={FiFileText}
        variant="amber"
        onClick={onShowFacture}
        disabled={!(billet?.statut === 'BILLET_EMIS')}
      />

      {/* 4. Régler Facture */}
      <ActionButton
        label="Régler"
        icon={FiCheckCircle}
        variant="emerald"
        onClick={onRegler}
        disabled={!(billet?.statut === 'FACTURE_EMISE')}
      />
    </div>
  );
};