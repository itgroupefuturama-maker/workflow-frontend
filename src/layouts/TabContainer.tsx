// components/layout/TabContainer.tsx
export default function TabContainer({ tabs, activeTab, setActiveTab, children }: any) {
  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 gap-8">
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}