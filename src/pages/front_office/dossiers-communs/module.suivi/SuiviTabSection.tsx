import React from 'react';
import CommentairesTable from './CommentairesTable';
import RappelsTable from './RappelsTable';
import EvolutionClientTable from './EvolutionClientTable';

interface SuiviTabSectionProps {
  prestationId: string;
}

const SuiviTabSection: React.FC<SuiviTabSectionProps> = ({ prestationId }) => {
  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <CommentairesTable prestationId={prestationId} />
        <RappelsTable prestationId={prestationId} />
      </div>
      <EvolutionClientTable prestationId={prestationId} />
    </div>
  );
};

export default SuiviTabSection;