export default function TabContainer({ tabs, activeTab, setActiveTab, children, color }: any) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white border-b-2 border-gray-200 rounded-lg">
      {/* Onglets — hauteur fixe */}
      <div className="inline-flex items-center gap-0.5rounded-[10px] p-1">
        {tabs.map((tab: any) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-5 py-2 text-[11px] font-medium uppercase tracking-widest mx-1
                transition-all duration-200 whitespace-nowrap
                border-b-3
                ${isActive
                  ? 'border-blue-400 text-blue-400 bg-white'
                  : 'border-gray-200 text-gray-400 hover:text-blue-400 hover:border-blue-200'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Corps — ✅ flex-1 + overflow-auto : prend l'espace restant et scroll si besoin */}
      <div className="relative z-30 flex-1 min-h-0 rounded-b-lg overflow-auto">
        <div className="animate-fadeIn h-full">
          {children}
        </div>
      </div>

    </div>
  );
}