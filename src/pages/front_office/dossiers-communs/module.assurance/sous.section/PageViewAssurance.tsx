import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import TabContainer from '../../../../../layouts/TabContainer';
import { fetchAssuranceProspections } from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import { fetchAssuranceEntetes } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteSlice';
import AssuranceProspectionListe from '../components/AssuranceProspectionListe';
import AssuranceEnteteListe from '../components/AssuranceEnteteListe';
import BeneficiaireListPage from '../../module.client.beneficiaire/BeneficiaireListPage';

const PageViewAssurance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'assurance',   label: 'Listes des assurance' },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' }
  ];

  const [activeTab, setActiveTab] = useState('prospection');

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // ← Réécrit location.state sans changer l'URL
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, targetTab: tab },
    });
  };

  return (
    // ✅ h-full indispensable pour que TabContainer reçoive la hauteur
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        {activeTab === 'prospection' && <AssuranceProspectionListe />}
        {activeTab === 'assurance'   && <AssuranceEnteteListe />}
        {activeTab === 'beneficiaire' && clientFactureId && (
          <BeneficiaireListPage clientFactureId={clientFactureId} />
        )}
      </TabContainer>
    </div>
  );
};

export default PageViewAssurance;