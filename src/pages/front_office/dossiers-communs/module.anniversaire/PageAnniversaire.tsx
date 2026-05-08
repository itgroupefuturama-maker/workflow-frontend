import { useState } from 'react';
import ClientsTab from './components/ClientsTab';
import ParamsTab from './components/ParamsTab';
import TabBar, { type Tab } from '../../../../components/TabBar';

type TabId = 'clients' | 'params';

const TABS: Tab<TabId>[] = [
  { id: 'clients', label: 'Liste clients' },
  { id: 'params',  label: 'Paramètres' },
];

const PageAnniversaire = () => {
  const [tab, setTab] = useState<TabId>('clients');

  return (
    <div className="p-4 bg-white">
      <TabBar title="Page Anniversaire" tabs={TABS} activeTab={tab} onTabChange={setTab} />
      {tab === 'clients' && <ClientsTab />}
      {tab === 'params'  && <ParamsTab />}
    </div>
  );
};

export default PageAnniversaire;