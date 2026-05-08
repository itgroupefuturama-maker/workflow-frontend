import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TabContainer from '../../../../../layouts/TabContainer';
import ParamsListe       from './sous.section.parametre/ParamsListe';
import DocsListe         from './sous.section.parametre/DocsListe';
import TarifsPleinListe  from './sous.section.parametre/TarifsPleinListe';
import TarifsReduitListe from './sous.section.parametre/TarifsReduitListe';
import RaisonAnnulationListe from '../../module.parametre/RaisonAnnulation/RaisonAnnulationListe';

const tabs = [
  { id: 'params',                label: 'Paramètre' },
  { id: 'docs',                  label: 'Document' },
  { id: 'tarifPlein',            label: 'Tarif Plein' },
  { id: 'tarifReduit',           label: 'Tarif Réduit' },
  { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
];

const ParametreViewVisa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'params');

  useEffect(() => {
    if (location.state?.targetTab) {
      const t = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(t);
    }
  }, [location.state?.targetTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(location.pathname, { replace: true, state: { ...location.state, targetTab: tab } });
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="space-y-8 py-2 px-4">
          {activeTab === 'params'                && <ParamsListe />}
          {activeTab === 'docs'                  && <DocsListe />}
          {activeTab === 'tarifPlein'            && <TarifsPleinListe />}
          {activeTab === 'tarifReduit'           && <TarifsReduitListe />}
          {activeTab === 'listeRaisonAnnulation' && <RaisonAnnulationListe />}
        </div>
      </TabContainer>
    </div>
  );
};

export default ParametreViewVisa;