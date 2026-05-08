// components/TicketingHeader.tsx
import { FiCheck, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
  state?: any;
  isCurrent?: boolean;
}

interface TicketingHeaderProps {
  items: BreadcrumbItem[];
}

export const TicketingHeader = ({ items }: TicketingHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="my-4">
      <nav className="flex items-center rounded-xl w-fit">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = !!item.isCurrent;
          const isClickable = !!item.path && !item.isCurrent;
          const isDone = !item.isCurrent && index < items.findIndex(i => i.isCurrent);

          return (
            <div key={index} className="flex items-center">
              <button
                disabled={!isClickable}
                onClick={isClickable ? () => navigate(item.path!, { state: item.state }) : undefined}
                className={`
                  relative flex items-center gap-2.5 px-4 py-2 text-sm font-medium
                  rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                    : isClickable 
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-300 bg-slate-300' 
                      : 'text-slate-400 cursor-default '
                  }
                `}
              >
                {/* Indicateur numérique ou Check */}
                <div className={`
                  flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold transition-colors
                  ${isDone 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                  }
                `}>
                  {isDone ? <FiCheck size={12} strokeWidth={4} /> : index + 1}
                </div>

                <span className={`${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>

              {/* Séparateur Chevron (ne pas afficher après le dernier item) */}
              {!isLast && (
                <div className="mx-1 text-slate-700">
                  <FiChevronRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
};