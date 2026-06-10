import React from 'react';
import CommentairesTable from './CommentairesTable';
import RappelsTable from './RappelsTable';
import EvolutionClientTable from './EvolutionClientTable';

interface SuiviTabSectionProps {
  prestationId: string;
  moduleName?: string;
}

const SuiviTabSection: React.FC<SuiviTabSectionProps> = ({ prestationId, moduleName = '' }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 mb-4">Suivi {moduleName}</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <CommentairesTable prestationId={prestationId} />
        <RappelsTable prestationId={prestationId} />
      </div>
      <EvolutionClientTable prestationId={prestationId} moduleName={moduleName} />
    </div>
  );
};

export default SuiviTabSection;