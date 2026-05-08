import { FiCheck, FiChevronRight } from "react-icons/fi";

export const VisaHeader = ({ numerovisa, nomPassager, navigate, isDetail = false, isProspection = false, isDevis = false, isPassager = false }) => {

  // Construction des étapes selon le contexte
  const steps = isDetail ? [
    {
      label: isProspection ? 'Liste des prospections' : 'Liste des visas',
      done: true,
      onClick: () => navigate(`/dossiers-communs/visa/pages`, {
        state: isProspection ? { targetTab: 'prospection' } : { targetTab: 'visa' }
      }),
    },
    {
      label: `${isProspection && !isDevis ? 'Prospection' : isDevis ? 'Devis' : 'Visa'} n° ${numerovisa}`,
      done: isPassager,
      onClick: isPassager ? () => navigate(-1) : undefined,
    },
    ...(isPassager ? [{
      label: `Détail : ${nomPassager}`,
      done: false,
      onClick: undefined,
    }] : []),
  ] : [
    {
      label: isProspection ? 'Liste des prospections' : 'Liste des visas',
      done: false,
      onClick: undefined,
    }
  ];

  return (
    <header className="my-2">
      <nav className="flex items-center rounded-xl w-fit ">
        {steps.map((step, index) => {
          const isLast      = index === steps.length - 1;
          
          // Correction du bug d'activation : l'étape est active si elle n'est pas terminée
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
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-300 bg-slate-300' 
                      : 'text-slate-400 cursor-default '
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
                      : 'bg-slate-200 text-slate-500'
                  }
                `}>
                  {step.done ? <FiCheck size={12} strokeWidth={4} /> : index + 1}
                </div>

                <span className={`whitespace-nowrap ${isActive ? 'font-bold text-slate-900' : ''}`}>
                  {step.label}
                </span>
              </button>

              {/* Séparateur Chevron (sauf pour le dernier) */}
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