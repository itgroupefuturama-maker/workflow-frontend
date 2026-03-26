import Sidebar from '../../../../layouts/Sidebar';
import { Outlet } from 'react-router-dom';

const HomePageHotel = () => {

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="hotel"/>
      {/* Le contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden py-2 px-2">
        <Outlet />
      </div>
    </div>
  );
};

export default HomePageHotel;
