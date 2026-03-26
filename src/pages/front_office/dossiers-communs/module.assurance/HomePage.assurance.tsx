import Sidebar from '../../../../layouts/Sidebar';
import { Outlet } from 'react-router-dom';

const HomePageAssurance = () => {

  return (
    <div className="flex flex-1 h-full min-h-0  overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="assurance"/>
      {/* Le contenu principal */}
        {/* Zone de contenu scrollable indépendamment de la sidebar */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden py-2 px-2">
          <Outlet />
        </div>
    </div>
  );
};

export default HomePageAssurance;
