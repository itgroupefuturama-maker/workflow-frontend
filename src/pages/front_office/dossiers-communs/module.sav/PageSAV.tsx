import React, { useState } from 'react';
import TabSondage from './section/TabSondage';
import TabRappel from './section/TabRappel';
import TabParams from './section/TabParams';
import TabBar, { type Tab } from '../../../../components/TabBar';

type TabId = 'sondage' | 'rappel' | 'params';

const TABS: Tab<TabId>[] = [
  { id: 'sondage', label: 'SAV Sondage' },
  { id: 'rappel',  label: 'SAV Rappel' },
  { id: 'params',  label: 'Paramètres SAV' },
];

const PageSAV: React.FC = () => {
  const [tab, setTab] = useState<TabId>('sondage');

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-gray-50 font-sans">
      <TabBar title="SAV" tabs={TABS} activeTab={tab} onTabChange={setTab} />
      <div className="max-w-5xl mx-auto p6">
        {tab === 'sondage' && <TabSondage />}
        {tab === 'rappel'  && <TabRappel />}
        {tab === 'params'  && <TabParams />}
      </div>
    </div>
  );
};

export default PageSAV;