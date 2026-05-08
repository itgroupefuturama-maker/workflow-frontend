import React, { useState } from 'react';
import ParamTexteVoyage from './params/ParamTexteVoyage';
import ParamLienSondage from './params/ParamLienSondage';
import ParamTemplate    from './params/ParamTemplate';

const MENU_ITEMS = [
  { id: 'voyage',  label: 'Textes voyage',   icon: '✈️' },
  { id: 'sondage', label: 'Liens sondage',   icon: '📊' },
  { id: 'template', label: 'Templates',       icon: '📝' },
];

export default function TabParams() {
  const [activeTab, setActiveTab] = useState('voyage');

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Paramètres SAV</h1>
      
      <div className="flex gap-8 items-start">
        {/* Navigation Latérale */}
        <aside className="w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
          <nav className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Zone de contenu dynamique */}
        <main className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'voyage' && <ParamTexteVoyage />}
            {activeTab === 'sondage' && <ParamLienSondage />}
            {activeTab === 'template' && <ParamTemplate />}
          </div>
        </main>
      </div>
    </div>
  );
}