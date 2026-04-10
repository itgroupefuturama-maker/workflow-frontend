// components/TicketingHeader.tsx
import { FiCheck } from "react-icons/fi";
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
    <header className="my-2">
      <div className="flex items-center">
        {items.map((item, index) => {
          const isLast      = index === items.length - 1;
          const isActive    = !!item.isCurrent;
          const isClickable = !!item.path && !item.isCurrent;
          const isDone      = !item.isCurrent && index < items.length - 1;

          return (
            <div key={index} className="flex items-center">
              <div
                onClick={isClickable ? () => navigate(item.path!, { state: item.state }) : undefined}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                  transition-all select-none
                  ${index === 0 ? 'rounded-l-lg' : ''}
                  ${isLast ? 'rounded-r-lg' : ''}
                  ${isActive
                    ? 'bg-blue-400 text-white shadow-md cursor-default'
                    : isClickable
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
                {isDone ? (
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
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
};