import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import TabContainer from '../../../../../layouts/TabContainer';
import { fetchProspectionEntetes } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import { fetchVisaEntetes } from '../../../../../app/front_office/parametre_visa/visaEnteteSlice';
import ProspectionTab from '../components/ProspectionTab';
import VisaTab from '../components/VisaTab';
import BeneficiaireListPage from '../../module.client.beneficiaire/BeneficiaireListPageForClientFacture';

const PageViewVisa = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: { id: string; label: string }[] = [
    // { id: 'prospection', label: 'Listes des prospections' },
    // { id: 'visa',        label: 'Listes des visa' },
    // { id: 'beneficiaire', label: 'Listes des bénéficiaires' }
  ];

  // Onglet actif reflété dans l'URL (?onglet=...) pour survivre au rechargement et aux liens partagés
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    () => location.state?.targetTab || searchParams.get('onglet') || 'prospection'
  );

  useEffect(() => {
    if (searchParams.get('onglet') === activeTab) return;
    const next = new URLSearchParams(searchParams);
    next.set('onglet', activeTab);
    setSearchParams(next, { replace: true, state: location.state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Sélecteurs ─────────────────────────────────────────────────────────────
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const clientFactureId = dossierActif?.clientfacture?.id;

  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'visa')
    ?.prestation?.[0]?.id ?? '';

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