import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;      // Si présent, c'est un bouton cliquable
  state?: any;        // Le state pour la navigation (ex: targetTab)
  isCurrent?: boolean; // Si vrai, on affiche en jaune (étape actuelle)
}

interface TicketingHeaderProps {
  items: BreadcrumbItem[];
}

export const TicketingHeader = ({ items }: TicketingHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-10">
      <div className="flex items-center space-x-3 text-sm">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.isCurrent ? (
              // Style pour l'étape actuelle (Jaune)
              <div className="flex items-center gap-2
                  px-4 py-2
                  rounded-lg
                  bg-amber-400/90
                  border
                  border-amber-400/90
                  text-white
                  hover:bg-amber-400
                  transition-all
                  font-bold
                  ">
                {item.label}
              </div>
            ) : (
              // Style pour les étapes cliquables (Blanc)
              <button
                onClick={() => item.path && navigate(item.path, { state: item.state })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
              >
                <span className="font-semibold tracking-wide">{item.label}</span>
              </button>
            )}

            {/* Affiche la flèche sauf pour le dernier élément */}
            {index < items.length - 1 && (
              <FiArrowRight className="text-slate-400" size={16} />
            )}
          </div>
        ))}
      </div>
    </header>
  );
};