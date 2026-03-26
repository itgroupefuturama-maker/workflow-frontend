import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import TabContainer from '../../../../../layouts/TabContainer';
import { fetchProspectionEntetes } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import { fetchVisaEntetes } from '../../../../../app/front_office/parametre_visa/visaEnteteSlice';
import ProspectionTab from '../components/ProspectionTab';
import VisaTab from '../components/VisaTab';
import BeneficiaireListPage from '../../module.client.beneficiaire/BeneficiaireListPage';

const PageViewVisa = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'visa',        label: 'Listes des visa' },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' }
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  // ── Sélecteurs ─────────────────────────────────────────────────────────────
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;

  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'visa')
    ?.prestation?.[0]?.id ?? '';

    console.log(prestationId);
    

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (prestationId) {
      dispatch(fetchProspectionEntetes(prestationId));
      dispatch(fetchVisaEntetes(prestationId));
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        
        {activeTab === 'prospection' && <ProspectionTab prestationId={prestationId} />}
        {activeTab === 'visa'        && <VisaTab />}
        {activeTab === 'beneficiaire' && clientFactureId && (
            <BeneficiaireListPage clientFactureId={clientFactureId} />
        )}
      </TabContainer>
    </div>
  );
};

export default PageViewVisa;