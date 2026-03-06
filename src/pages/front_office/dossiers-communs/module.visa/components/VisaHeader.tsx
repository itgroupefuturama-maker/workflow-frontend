import { FiArrowRight } from "react-icons/fi";

export const VisaHeader = ({ numerovisa, navigate,  isDetail = false , isProspection = false, isDevis = false}) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      {isDetail ? (
        <>
          {/* Bouton Retour (visible uniquement en mode détail) */}
         <header className="flex items-center justify-between">
             <div className="flex items-center text-sm">
               <button
                 onClick={() => navigate(`/dossiers-communs/visa/pages`, { state: isProspection ? { targetTab: 'prospection' } : { targetTab: 'visa' } })}
                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
               >
                 <span className="font-semibold tracking-wide">{isProspection ? 'Liste des prospection' : 'Liste des visas'}</span>
               </button>
               <FiArrowRight className="text-slate-400 ml-2 mr-2" size={16} />
               <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-white font-semibold shadow-sm">
                 {isProspection && isDevis== false  ? 'Prospection' : isDevis ? 'Devis' : 'visa'} n° {numerovisa}
               </div>
             </div>
           </header>
        </>
      ) : (
        /* Titre pour la page Liste */
        <div className="text-sm flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-white font-semibold shadow-sm">
          <span className="font-semibold tracking-wide">{isProspection ? 'Liste des Prospection' : 'Liste des visa'}</span>
        </div>
      )}
    </div>
  </header>
);