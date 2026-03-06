import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import TabContainer from '../../../../../layouts/TabContainer';
import type { AppDispatch, RootState } from '../../../../../app/store';

import { fetchVisaTypes } from '../../../../../app/front_office/parametre_visa/visaTypeSlice';
import { fetchVisaDurees } from '../../../../../app/front_office/parametre_visa/visaDureeSlice';
import { fetchVisaEntrees } from '../../../../../app/front_office/parametre_visa/visaEntreeSlice';
import { fetchVisaParams } from '../../../../../app/front_office/parametre_visa/visaParamSlice';
import { fetchVisaDocParams } from '../../../../../app/front_office/parametre_visa/visaDocParamsSlice';
import { fetchVisaDocs } from '../../../../../app/front_office/parametre_visa/visaDocSlice';
import { fetchVisaConsultats } from '../../../../../app/front_office/parametre_visa/visaConsultatSlice';
import RaisonAnnulationListe from '../../module.ticketing/ticketing.sous.module/SousMenuPrestation/RaisonAnnulationListe';
import { fetchRaisonsAnnulation } from '../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ParametreViewVisa = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'type');


  const tabs = [
    { id: 'type',                  label: 'Type de Visa' },
    { id: 'duree',                 label: 'Durée de Visa' },
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
  ];

  useEffect(() => {
    dispatch(fetchVisaTypes());
    dispatch(fetchVisaDurees());
    dispatch(fetchVisaEntrees());
    dispatch(fetchVisaParams());
    dispatch(fetchVisaDocParams());
    dispatch(fetchVisaDocs());
    dispatch(fetchVisaConsultats());
    dispatch(fetchRaisonsAnnulation());
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);


  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-6">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres Assurance</h1>

        <div className="space-y-8">

          {/* ── Type de Visa ── */}
          {activeTab === 'type' && (
            <>
            </>
          )}

          {/* ── Durée de Visa ── */}
          {activeTab === 'duree' && (
            <>
            </>
          )}
          
          {/* ── Raison Annulation ── */}
          {activeTab === 'listeRaisonAnnulation' && <RaisonAnnulationListe />}

        </div>
      </TabContainer>
    </div>
  );
};

export default ParametreViewVisa;