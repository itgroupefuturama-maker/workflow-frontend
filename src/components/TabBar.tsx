import { ArrowLeftIcon } from 'lucide-react';

export interface Tab<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  title: string;
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
  onBack?: () => void;
}

const TabBar = <T extends string>({
  title,
  tabs,
  activeTab,
  onTabChange,
  onBack = () => window.history.back(),
}: Props<T>) => (
  <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 flex items-center gap-1">
    <div className="text-sm font-medium px-4 py-3 mr-2 border-r border-gray-100 flex items-center gap-2">
      <button className="hover:bg-gray-100 rounded-lg p-2" onClick={onBack}>
        <ArrowLeftIcon strokeWidth={1.5} size={20} />
      </button>
      <span className="border border-gray-200 rounded-lg px-3 py-1">{title}</span>
    </div>
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onTabChange(t.id)}
        className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
          activeTab === t.id
            ? 'border-yellow-400 text-gray-900'
            : 'border-transparent text-gray-500 hover:text-gray-800'
        }`}
      >
        {t.label}
      </button>
    ))}
  </nav>
);

export default TabBar;