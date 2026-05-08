export default function TabContainer({ tabs, activeTab, setActiveTab, children }: any) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white rounded-xl">
      {/* Barre d'onglets avec fond gris bleuté doux */}
      <div className="flex items-end bg-slate-300">
        {tabs.map((tab: any) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-8 py-3 text-sm font-semibold
                rounded-t-[18px] 
                ${isActive
                  ? 'bg-white text-slate-800 z-10' 
                  : 'bg-slate-300 text-slate-500 border-r border-slate-300  translate-y-1'
                }
              `}
            >
              {tab.label}
              
              {/* Optionnel : L'effet d'arrondi inversé sur les coins bas (nécessite du CSS custom ou des div) */}
              {isActive && (
                <>
                  <div className="absolute bottom-0 -left-[10px] w-[10px] h-[10px] bg-white">
                    <div className="w-full h-full bg-slate-300 rounded-br-[50px]"></div>
                  </div>
                  <div className="absolute bottom-0 -right-[10px] w-[10px] h-[10px] bg-white">
                    <div className="w-full h-full bg-slate-300 rounded-bl-[10px]"></div>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenu du tableau */}
      <div className="relative z-20 flex-1 bg-white p-4 overflow-auto">
        <div className="animate-fadeIn h-full">
          {children}
        </div>
      </div>
    </div>
  );
}