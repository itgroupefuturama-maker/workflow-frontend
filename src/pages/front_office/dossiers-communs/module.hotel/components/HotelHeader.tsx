import { FiArrowRight } from "react-icons/fi";

export const HotelHeader = ({ numerohotel, navigate,  isDetail = false , isBenchmarking = false, isDevis = false}) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      {isDetail ? (
        <>
          {/* Bouton Retour (visible uniquement en mode détail) */}
         <header className="flex items-center justify-between">
             <div className="flex items-center text-sm">
               <button
                 onClick={() => navigate(`/dossiers-communs/hotel/pages`, { state: isBenchmarking ? { targetTab: 'benchmarking' } : { targetTab: 'hotel' } })}
                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
               >
                 <span className="font-semibold tracking-wide">{isBenchmarking ? 'Liste des Benchmarking' : 'Liste des hotels'}</span>
               </button>
               <FiArrowRight className="text-slate-400 ml-2 mr-2" size={16} />
               <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-white font-semibold shadow-sm">
                 {isBenchmarking && isDevis== false  ? 'Bench' : isDevis ? 'Devis' : 'hotel'} n° {numerohotel}
               </div>
             </div>
           </header>
        </>
      ) : (
        /* Titre pour la page Liste */
        <div className="text-sm flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-white font-semibold shadow-sm">
          <span className="font-semibold tracking-wide">{isBenchmarking ? 'Liste des Benchmarking' : 'Liste des hotels'}</span>
        </div>
      )}
    </div>
  </header>
);