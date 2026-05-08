import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientBeneficiaires } from '../../../../app/back_office/clientBeneficiairesSlice';
import type { RootState, AppDispatch } from '../../../../app/store';
import { FiAlertCircle, FiArrowLeft, FiAward, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import TabListeBeneficiaires from './section/TabListeBeneficiaires';
import TabMilesClient from './section/TabMilesClient';

type Tab = 'liste' | 'miles';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'liste', label: 'Liste des bénéficiaires', icon: <FiUserCheck size={15} /> },
  { id: 'miles', label: 'Miles clients',           icon: <FiAward size={15} /> },
];

const AllClientBeneficiairePage = () => {
  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('liste');

  const { error: globalError } = useSelector((state: RootState) => state.clientBeneficiaires);

  useEffect(() => {
    dispatch(fetchClientBeneficiaires());
  }, [dispatch]);

  return (
    <div className="animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="pl-5 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-200 shadow-md rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiUserCheck className="text-indigo-600" /> Clients Bénéficiaires
            </h2>
            <p className="text-gray-500 font-medium italic">
              Gérez les bénéficiaires et leurs clients facturés.
            </p>
          </div>
        </div>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      <div className="px-5 pb-5">
        {/* ONGLETS */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {/* CONTENU */}
        {activeTab === 'liste' && <TabListeBeneficiaires />}
        {activeTab === 'miles' && <TabMilesClient />}
      </div>
    </div>
  );
};

export default AllClientBeneficiairePage;