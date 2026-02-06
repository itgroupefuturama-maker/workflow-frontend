import { FiCheck, FiCheckCircle, FiFileText, FiSend, FiX } from "react-icons/fi";

interface BilletActionsProps {
  billet: any;
  allLinesEmission: boolean;
  allLinesReservation: boolean;
  onShowFacture: () => void;
  onRegler: () => void;
  onApprouver: (billetId: string) => void;
  onShowEmission: () => void;
  onAnnulerReservation?: () => void;     // ← nouveau
  onAnnulerEmission?: () => void;        // ← nouveau
}

export const BilletActions = ({
  billet,
  allLinesEmission,
  allLinesReservation,
  onShowFacture,
  onRegler,
  onApprouver,
  onShowEmission,
  onAnnulerReservation,
  onAnnulerEmission,
}: BilletActionsProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8 justify-end items-center">
      {/* Bouton : Émettre facture client */}
      <button
        disabled={!(allLinesEmission && billet?.statut === 'BILLET_EMIS')}
        onClick={onShowFacture}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm
          ${allLinesEmission && billet?.statut === 'BILLET_EMIS'
            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}
        `}
      >
        <FiFileText size={18} />
        Approuver / direction
      </button>

      {/* Bouton : Marquer facture réglée */}
      <button
        disabled={!(allLinesEmission && billet?.statut === 'FACTURE_EMISE')}
        onClick={onRegler}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm
          ${allLinesEmission && billet?.statut === 'FACTURE_EMISE'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}
        `}
      >
        <FiCheckCircle size={18} />
        Direction à approuver
      </button>

      {/* Bouton : Approbation Réservation */}
      <button
        disabled={!(allLinesReservation && billet?.statut == 'CREER' )}
        onClick={() => onApprouver(billet.id)}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm
          ${allLinesReservation && billet?.statut == 'CREER'
            ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}
        `}
      >
        <FiSend size={18} />
        Mettre à jour la réservation
      </button>

      {/* Bouton : Marquer comme Émis */}
      <button
        disabled={!(allLinesEmission && billet?.statut !== 'ANNULER' && billet?.statut !== 'BILLET_EMIS' && billet?.statut !== 'FACTURE_EMISE' && billet?.statut !== 'FACTURE_REGLEE')}
        onClick={onShowEmission}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm
          ${allLinesEmission && billet?.statut !== 'ANNULER' && billet?.statut !== 'BILLET_EMIS' && billet?.statut !== 'FACTURE_EMISE' && billet?.statut !== 'FACTURE_REGLEE'
            ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}
        `}
      >
        <FiCheck size={18} />
        Billet émis
      </button>

      {/* ────────────────────────────────────────────────
          NOUVEAUX BOUTONS : ANNULATION
      ──────────────────────────────────────────────── */}

      {/* Annuler la réservation (avant émission) */}
      {/* {allLinesReservation && billet?.statut !== 'CLOTURER' && billet?.statut !== 'ANNULE' && ( */}
        <button
            disabled={!(allLinesReservation && billet?.statut !== 'CLOTURER' && billet?.statut !== 'ANNULER')}
            onClick={onAnnulerReservation}
            className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm
            ${allLinesReservation && billet?.statut !== 'CLOTURER' && billet?.statut !== 'ANNULER'
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}
            `}
        >
            <FiX size={18} />
            Modification & Annulation
        </button>
      {/* )} */}

      {/* Annuler l'émission (après émission) */}
        {/* <button
          disabled={!(allLinesEmission && billet?.statut === 'BILLET_EMIS')}
          onClick={onAnnulerEmission}
          className={
            `flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm
            ${allLinesEmission && billet?.statut === 'BILLET_EMIS'
              ? 'bg-red-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`
          }
        >
          <FiX size={18} />
          Annuler émission
        </button> */}
    </div>
  );
};