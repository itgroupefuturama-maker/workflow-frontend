import { FiCheck } from "react-icons/fi";

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
      label: `Detail : ${nomPassager}`,
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
    <header>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isLast    = index === steps.length - 1;
          const isActive  = isLast && !step.done;
          const isClickable = !!step.onClick;

          return (
            <div key={index} className="flex items-center">

              {/* Étape */}
              <div
                onClick={isClickable ? step.onClick : undefined}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                  transition-all select-none
                  ${index === 0 ? 'rounded-l-lg' : ''}
                  ${isLast ? 'rounded-r-lg' : ''}
                  ${isActive
                    ? 'bg-amber-400 text-white shadow-md'
                    : step.done
                      ? 'bg-stone-200 text-stone-500 hover:bg-stone-300 cursor-pointer'
                      : 'bg-stone-100 text-stone-400'
                  }
                `}
                style={{
                  // clip-path flèche
                  clipPath: isLast
                    ? index === 0
                      ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
                      : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)'
                    : index === 0
                      ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
                      : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                }}
              >
                {/* Icône ou numéro */}
                {step.done ? (
                  <span className="h-5 w-5 rounded-full bg-stone-300 text-stone-500 flex items-center justify-center shrink-0">
                    <FiCheck size={11} strokeWidth={3} />
                  </span>
                ) : (
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isActive ? 'bg-white/30 text-white' : 'bg-stone-200 text-stone-400'
                  }`}>
                    {index + 1}
                  </span>
                )}

                <span className="whitespace-nowrap">{step.label}</span>
              </div>

              {/* Espacement négatif pour que les flèches se chevauchent */}
              {!isLast && <div className="-mx-px" />}

            </div>
          );
        })}
      </div>
    </header>
  );
};