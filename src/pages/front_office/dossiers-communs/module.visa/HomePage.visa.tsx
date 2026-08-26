import { Suspense } from 'react';
import Sidebar from '../../../../layouts/Sidebar';
import { Outlet } from 'react-router-dom';
import PageLoader from '../../../../components/PageLoader';

const HomePageVisa = () => {

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="visa"/>
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden py-2 px-2">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default HomePageVisa;
