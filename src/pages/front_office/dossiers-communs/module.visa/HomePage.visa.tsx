import Sidebar from '../../../../layouts/Sidebar';
import { Outlet } from 'react-router-dom';

const HomePageVisa = () => {

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="visa"/>
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

export default HomePageVisa;
