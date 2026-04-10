import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiSearch, FiSettings, FiUsers } from 'react-icons/fi';
import CommentairesFournisseurs from './sections/CommentairesFournisseurs';
import Notifications from './sections/Notifications';
import Utilisateurs from './sections/Utilisateurs';
import General from './sections/pdf.generation/sections/General';

type Section = 'commentaires' | 'notifications' | 'utilisateurs' | 'general';

const sidebarItems: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'commentaires',  label: 'Commentaires fournisseurs', icon: <FiBell size={15} /> },
  { key: 'notifications', label: 'Notifications',             icon: <FiBell size={15} /> },
  { key: 'utilisateurs',  label: 'Utilisateurs',              icon: <FiUsers size={15} /> },
  { key: 'general',       label: 'Général',                   icon: <FiSettings size={15} /> },
];

const sectionMap: Record<Section, React.ReactNode> = {
  commentaires:  <CommentairesFournisseurs />,
  notifications: <Notifications />,
  utilisateurs:  <Utilisateurs />,
  general:       <General />,
};

export default function ParametresPage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [activeSection, setActiveSection] = useState<Section>(
    (location.state?.key as Section) ?? 'commentaires' // ← lire le state ici
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Système</p>
              <h1 className="text-base font-semibold text-gray-800 mt-0.5">Paramètres</h1>
            </div>
          </div>
          <div className="flex-1 max-w-sm mx-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input
                type="text"
                placeholder="Rechercher un paramètre..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-3">
            <nav className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sticky top-20">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Sections</p>
              <ul className="space-y-0.5">
                {sidebarItems.map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => setActiveSection(item.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${
                        activeSection === item.key
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Contenu */}
          <main className="col-span-9">
            {sectionMap[activeSection]}
          </main>
        </div>
      </div>
    </div>
  );
}