import React from 'react';

interface Props {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const TabButton: React.FC<Props> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
      active
        ? 'border-gray-800 text-gray-800'
        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
    }`}
  >
    {icon}
    {label}
    {badge !== undefined && (
      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

export default TabButton;