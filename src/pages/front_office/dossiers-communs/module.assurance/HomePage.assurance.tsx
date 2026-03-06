import Sidebar from '../../../../layouts/Sidebar';
import { Outlet } from 'react-router-dom';

const HomePageAssurance = () => {

  return (
    <div className="flex flex-1 h-full min-h-0 bg-[#F8FAFC] overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="assurance"/>
      {/* Le contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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

export default HomePageAssurance;
