import { FiArrowRight } from "react-icons/fi";

export const BilletHeader = ({ numeroBillet, prestationId, navigate }) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center text-sm">
      <button
        onClick={() => navigate(`/dossiers-communs/ticketing/pages`, { state: { targetTab: 'billet' } })}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
      >
        <span className="font-semibold tracking-wide">Liste des billets</span>
      </button>
      <FiArrowRight className="text-slate-400 ml-2 mr-2" size={16} />
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-white font-semibold shadow-sm">
        Billet n° {numeroBillet}
      </div>
    </div>
  </header>
);