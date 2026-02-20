import { Outlet } from 'react-router-dom';
import Sidebar from '../../../../layouts/Sidebar';

const Attestation = () => {
  const contextValue = {
    prestationId: '',
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* La Sidebar prendra automatiquement 100% de la hauteur grâce à h-screen */}
      <Sidebar module="attestation"/>
      {/* Le contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Zone de contenu scrollable indépendamment de la sidebar */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="">
            <Outlet context={contextValue} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attestation;
