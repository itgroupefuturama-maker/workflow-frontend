import React from 'react';
import Sidebar from '../../../../layouts/SideBar';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const HomePageHotel = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="hotel"/>

      {/* Le contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Header fixe en haut du contenu */}
        <div className="p-5 border-b border-slate-100 bg-white shrink-0">
          <header className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Retour à la page d'accueil</span>
            </button>
          </header>
        </div>

        {/* Zone de contenu scrollable indépendamment de la sidebar */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageHotel;
