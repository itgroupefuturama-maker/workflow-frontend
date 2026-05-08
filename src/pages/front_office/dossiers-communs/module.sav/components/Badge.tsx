import React from 'react';

const badgeMap: Record<string, string> = {
  'Répondu':     'bg-green-100 text-green-800',
  'En attente':  'bg-yellow-100 text-yellow-800',
  'Non envoyé':  'bg-red-100 text-red-800',
  'Planifié':    'bg-yellow-100 text-yellow-800',
  'Envoyé':      'bg-blue-100 text-blue-800',
  'Échoué':      'bg-red-100 text-red-800',
  'En cours':    'bg-blue-100 text-blue-800',
};

interface BadgeProps {
  label: string;
}

const Badge: React.FC<BadgeProps> = ({ label }) => (
  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${badgeMap[label] ?? 'bg-gray-100 text-gray-600'}`}>
    {label}
  </span>
);

export default Badge;