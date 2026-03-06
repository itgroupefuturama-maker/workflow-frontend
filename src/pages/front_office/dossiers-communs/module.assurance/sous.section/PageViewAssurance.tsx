import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import TabContainer from '../../../../../layouts/TabContainer';

const PageViewAssurance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'assurance',        label: 'Listes des assurance' },
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  // ── Sélecteurs ─────────────────────────────────────────────────────────────
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (prestationId) {
      console.log('fetch');
      
    }
  }, [prestationId, dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'prospection' && <div>Page prospection</div>}
      {activeTab === 'assurance'   && <div>Page assurance</div>}
    </TabContainer>
  );
};

export default PageViewAssurance;