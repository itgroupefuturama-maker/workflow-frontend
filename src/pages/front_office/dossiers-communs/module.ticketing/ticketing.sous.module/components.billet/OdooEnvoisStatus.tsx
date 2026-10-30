import { FiAlertTriangle, FiCheckCircle, FiClock, FiRefreshCw, FiSend } from 'react-icons/fi';
import type { OdooEnvoi, OdooEventType } from '../../../../../../app/front_office/billetSlice';

interface OdooEnvoisStatusProps {
  envois?: OdooEnvoi[];
  // Envoi en cours depuis cette page (bouton désactivé + spinner)
  envoiEnCours: 'VENTE' | 'ACHAT' | null;
  onRenvoyerVente: () => void;
  onRenvoyerAchat: () => void;
  onActualiser: () => void;
}

const LIBELLES: Record<OdooEventType, string> = {
  TICKET_SALE_ORDER_SUBMITTED: 'Vente',
  TICKET_PURCHASE_ORDER_SUBMITTED: 'Achat',
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '';

// Une ligne par type d'envoi (vente / achat) : le dernier envoi seulement, odooEnvois étant trié du plus récent au plus ancien
function EnvoiLigne({
  envoi,
  enCours,
  onRenvoyer,
}: {
  envoi: OdooEnvoi;
  enCours: boolean;
  onRenvoyer: () => void;
}) {
  const libelle = LIBELLES[envoi.eventType] ?? envoi.eventType;

  if (envoi.statut === 'ECHEC') {
    return (
      <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
        <FiAlertTriangle className="shrink-0" size={14} />
        <span>
          <strong>{libelle}</strong> non reçue par Odoo le {fmtDate(envoi.updatedAt)}
          {envoi.erreur && <span className="text-red-500"> — {envoi.erreur}</span>}
        </span>
        <button
          onClick={onRenvoyer}
          disabled={enCours}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend size={12} />
          {enCours ? 'Envoi…' : 'Renvoyer'}
        </button>
      </div>
    );
  }

  if (envoi.statut === 'RECU' && envoi.valideAt) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
        <FiCheckCircle className="shrink-0" size={14} />
        <span>
          <strong>{libelle}</strong> validée par Odoo
          {envoi.odooReference && <> ({envoi.odooReference})</>} le {fmtDate(envoi.valideAt)}
          {envoi.commentaireOdoo && <span className="text-emerald-600"> — {envoi.commentaireOdoo}</span>}
        </span>
      </div>
    );
  }

  // EN_COURS, ou RECU pas encore validé
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
      <FiClock className="shrink-0" size={14} />
      <span>
        <strong>{libelle}</strong>{' '}
        {envoi.statut === 'EN_COURS'
          ? `en cours d'envoi à Odoo (${fmtDate(envoi.createdAt)})`
          : `envoyée à Odoo le ${fmtDate(envoi.updatedAt)} — en attente de validation`}
      </span>
    </div>
  );
}

export default function OdooEnvoisStatus({
  envois,
  envoiEnCours,
  onRenvoyerVente,
  onRenvoyerAchat,
  onActualiser,
}: OdooEnvoisStatusProps) {
  const derniereVente = envois?.find((e) => e.eventType === 'TICKET_SALE_ORDER_SUBMITTED');
  const dernierAchat = envois?.find((e) => e.eventType === 'TICKET_PURCHASE_ORDER_SUBMITTED');

  if (!derniereVente && !dernierAchat) return null;

  return (
    <div className="px-3 py-2 border-b border-slate-300 bg-white flex items-start gap-2">
      <div className="flex-1 flex flex-col gap-1.5">
        {derniereVente && (
          <EnvoiLigne envoi={derniereVente} enCours={envoiEnCours === 'VENTE'} onRenvoyer={onRenvoyerVente} />
        )}
        {dernierAchat && (
          <EnvoiLigne envoi={dernierAchat} enCours={envoiEnCours === 'ACHAT'} onRenvoyer={onRenvoyerAchat} />
        )}
      </div>
      {/* Le statut avance côté Odoo, plus tard : on laisse l'utilisateur recharger */}
      <button
        onClick={onActualiser}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        title="Recharger le billet pour voir la réponse d'Odoo"
      >
        <FiRefreshCw size={12} />
        Actualiser
      </button>
    </div>
  );
}
