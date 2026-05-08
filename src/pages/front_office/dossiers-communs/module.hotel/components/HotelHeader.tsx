import { FiCheck, FiChevronRight } from "react-icons/fi";

export const HotelHeader = ({ numerohotel, navigate, isDetail = false, isBenchmarking = false, isDevis = false }) => {

  const steps = isDetail ? [
    {
      label: isBenchmarking ? 'Liste des Benchmarking' : 'Liste des hôtels',
      done: true,
      onClick: () => navigate(`/dossiers-communs/hotel/pages`, {
        state: isBenchmarking ? { targetTab: 'prospection' } : { targetTab: 'hotel' }
      }),
    },
    {
      label: `${isBenchmarking && !isDevis ? 'Bench' : isDevis ? 'Devis' : 'Hôtel'} n° ${numerohotel}`,
      done: false,
      onClick: undefined,
    },
  ] : [
    {
      label: isBenchmarking ? 'Liste des Benchmarking' : 'Liste des hôtels',
      done: false,
      onClick: undefined,
    }
  ];

  return (
    <header className="my-4">
      <nav className="flex items-center ">
        {steps.map((step, index) => {
          const isLast      = index === steps.length - 1;
          
          // CORRECTION DE LA LOGIQUE isActive :
          // Si c'est le dernier élément et qu'il n'est pas marqué comme "done", il est actif.
          const isActive    = !step.done; 
          
          const isClickable = !!step.onClick;

          return (
            <div key={index} className="flex items-center">
              <button
                disabled={!isClickable}
                onClick={isClickable ? step.onClick : undefined}
                className={`
                  relative flex items-center gap-2.5 px-4 py-2 text-sm font-medium
                  rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                    : isClickable 
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-white/50 bg-slate-300' 
                      : 'text-slate-400 cursor-default bg-slate-300'
                  }
                `}
              >
                {/* Badge Numérique ou Check */}
                <div className={`
                  flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold transition-all
                  ${step.done 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : isActive 
                      ? 'bg-indigo-600 text-white shadow-indigo-200/40 shadow-lg' 
                      : 'bg-slate-300 text-slate-500'
                  }
                `}>
                  {step.done ? <FiCheck size={12} strokeWidth={4} /> : index + 1}
                </div>

                <span className={`whitespace-nowrap ${isActive ? 'font-bold text-slate-900' : ''}`}>
                  {step.label}
                </span>
              </button>

              {/* Séparateur Chevron */}
              {!isLast && (
                <div className="mx-1 text-slate-600">
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