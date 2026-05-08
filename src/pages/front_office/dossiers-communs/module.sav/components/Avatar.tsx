import React from 'react';

const avatarColors: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-800',
  amber:  'bg-yellow-100 text-yellow-800',
  green:  'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  pink:   'bg-pink-100 text-pink-800',
};

interface AvatarProps {
  initiales: string;
  couleur: string;
}

const Avatar: React.FC<AvatarProps> = ({ initiales, couleur }) => (
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${avatarColors[couleur]}`}>
    {initiales}
  </div>
);

export default Avatar;