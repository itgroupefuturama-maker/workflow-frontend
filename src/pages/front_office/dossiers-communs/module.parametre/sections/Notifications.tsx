// sections/Notifications.tsx
import React from 'react';
import { FiBell } from 'react-icons/fi';

const Notifications: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paramètres</p>
    <h2 className="text-base font-semibold text-gray-800 mt-0.5 mb-6">Notifications</h2>
    {/* TODO: contenu */}
    <div className="text-center py-14">
      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
        <FiBell size={28} />
      </div>
      <p className="text-xs text-gray-400">Cette section sera disponible prochainement</p>
    </div>
  </div>
);

export default Notifications;