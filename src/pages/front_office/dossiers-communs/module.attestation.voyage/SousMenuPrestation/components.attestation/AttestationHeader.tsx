import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

export const AttestationHeader = ({ numeroAttestation, navigate,  isDetail = false }) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      {isDetail ? (
        <>
          {/* Bouton Retour (visible uniquement en mode détail) */}
         <header className="flex items-center justify-between">
             <div className="flex items-center text-sm">
               <button
                 onClick={() => navigate(`/dossiers-communs/attestation/pages`, { state: { targetTab: 'attestation' } })}
                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border text-slate-600 hover:bg-slate-100 transition-all"
               >
                 <span className="font-semibold tracking-wide">Liste des Attestations</span>
               </button>
               <FiArrowRight className="text-slate-400" size={16} />
               <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-slate-900 font-semibold shadow-sm">
                 Attestation n° {numeroAttestation}
               </div>
             </div>
           </header>
        </>
      ) : (
        /* Titre pour la page Liste */
        <div className="text-sm flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/90 text-slate-900 font-semibold shadow-sm">
          <span className="font-semibold tracking-wide">Liste des Attestations</span>
        </div>
      )}
    </div>
  </header>
);