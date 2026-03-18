import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import TabContainer from '../../../../../layouts/TabContainer';
import { fetchAssuranceProspections } from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import { fetchAssuranceEntetes } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteSlice';
import AssuranceProspectionListe from '../components/AssuranceProspectionListe';
import AssuranceEnteteListe from '../components/AssuranceEnteteListe';

const PageViewAssurance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'assurance',   label: 'Listes des assurance' },
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

    console.log(prestationId);
    

  useEffect(() => {
    if (prestationId) {
      dispatch(fetchAssuranceProspections(prestationId));
      dispatch(fetchAssuranceEntetes(prestationId));
    }
  }, [prestationId, dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} color="bg-blue-400" >
      {activeTab === 'prospection' && <AssuranceProspectionListe />}
      {activeTab === 'assurance'   && <AssuranceEnteteListe />}
    </TabContainer>
  );
};

export default PageViewAssurance;