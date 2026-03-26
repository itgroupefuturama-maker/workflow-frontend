import { FiCheck } from "react-icons/fi";

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
    <header className="mb-2">
      <div className="flex items-center ">
        {steps.map((step, index) => {
          const isLast      = index === steps.length - 1;
          const isActive    = isLast && !step.done;
          const isClickable = !!step.onClick;

          return (
            <div key={index} className="flex items-center">
              <div
                onClick={isClickable ? step.onClick : undefined}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                  transition-all select-none
                  ${index === 0 ? 'rounded-l-lg' : ''}
                  ${isLast ? 'rounded-r-lg' : ''}
                  ${isActive
                    ? 'bg-amber-400 text-white shadow-md cursor-default'
                    : step.done
                      ? 'bg-stone-200 text-stone-500 hover:bg-stone-300 cursor-pointer'
                      : 'bg-stone-100 text-stone-400 cursor-default'
                  }
                `}
                style={{
                  clipPath: index === 0
                    ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
                    : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                  marginLeft: index === 0 ? 0 : '-1px',
                }}
              >
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
            </div>
          );
        })}
      </div>
    </header>
  );
};