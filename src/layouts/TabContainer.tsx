interface Tab {
  id: string;
  label: string;
}

interface TabContainerProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  children: React.ReactNode;
  /** Couleur d'accent optionnelle (ex: 'bg-green-500' pour Assurance, 'bg-orange-500' pour Hôtel).
   *  Reprend la couleur du module actif dans la barre du haut pour garder une cohérence visuelle. */
  accentClassName?: string;
}

export default function TabContainer({
  tabs,
  activeTab,
  setActiveTab,
  children,
  accentClassName = 'bg-slate-700',
}: TabContainerProps) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Barre d'onglets — style plat, cohérent avec la barre de navigation du haut */}
      <div className="flex items-center gap-1 px-2 bg-white border-b border-slate-200 shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors
                ${isActive
                  ? 'text-slate-800'
                  : 'text-slate-400 hover:text-slate-600'
                }
              `}
            >
              {tab.label}
              {isActive && (
                <span
                  className={`absolute left-2 right-2 -bottom-px h-0.5 rounded-full ${accentClassName}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <div className="relative flex-1 bg-white p-4 overflow-auto">
        <div className="animate-fadeIn h-full">
          {children}
        </div>
      </div>
    </div>
  );
}