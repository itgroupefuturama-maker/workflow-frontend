export default function TabContainer({ tabs, activeTab, setActiveTab, children, color }: any) {
  const activeColor = color ?? "bg-yellow-500";
  return (
    <div className="w-full">
      {/* Container des onglets */}
      <div className="flex items-end -space-x-1">
        {tabs.map((tab: any) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-10 py-2 text-xs font-bold uppercase transition-all duration-300
                rounded-tl-xl rounded-tr-xl
                
                ${isActive 
                  ? `${activeColor} text-white z-20 scale-y-105 origin-bottom` 
                  : 'text-gray-500 hover:from-[#ffffff] hover:to-[#eeeeee] z-10'
                }
                
                border border-slate-200 border-b-0
              `}
            >
              {/* Petit effet de reflet blanc sur le dessus pour le look "glossy" */}
              {/* <div className="absolute inset-0 bg-linear-to-b from-white/30 to-transparent rounded-tl-xl rounded-tr-xl pointer-events-none"></div> */}
              
              <span className={isActive ? 'drop-shadow-sm' : ''}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Le corps du menu (la grande zone blanche) */}
      <div className="relative z-30  border-t border-slate-200 rounded-b-lg ">
        {/* Contenu interne */}
        <div className="animate-fadeIn">
          {children}
        </div>
      </div>
    </div>
  );
}