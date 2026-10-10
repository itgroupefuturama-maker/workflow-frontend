import type { ItineraireCascade } from '../hooks/useItineraireCascade';

interface ItineraireCascadeFieldsProps {
  cascade: ItineraireCascade;
  selectClassName: string;
  readonlyClassName: string;
  itineraireWrapperClassName?: string;
}

// Rendu partagé des 4 selects en cascade + champ "Itinéraire" en lecture seule, utilisé par
// AddProspectionLigneModal (ticketing) et AddLigneModal (attestation). NewLineRow (ligne inline
// en table) a sa propre cellule par étape, trop différente structurellement pour être partagée ici.
export default function ItineraireCascadeFields({
  cascade,
  selectClassName,
  readonlyClassName,
  itineraireWrapperClassName,
}: ItineraireCascadeFieldsProps) {
  const {
    paysDepartOptions, villeDepartOptions, paysArriveeOptions, villeArriveeOptions,
    paysDepartId, villeDepartId, paysArriveeId, itineraireId, selectedItineraire, loading,
    selectPaysDepart, selectVilleDepart, selectPaysArrivee, selectItineraire,
  } = cascade;

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Pays de départ <span className="text-red-500">*</span>
        </label>
        <select value={paysDepartId} onChange={(e) => selectPaysDepart(e.target.value)} className={selectClassName}>
          <option value="">— Sélectionner —</option>
          {paysDepartOptions.map((p) => <option key={p.id} value={p.id}>{p.pays}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Ville de départ <span className="text-red-500">*</span>
        </label>
        <select
          value={villeDepartId}
          onChange={(e) => selectVilleDepart(e.target.value)}
          className={selectClassName}
          disabled={!paysDepartId}
        >
          <option value="">
            {!paysDepartId ? 'Choisir un pays d\'abord' : loading.villeDepart ? 'Chargement...' : '— Sélectionner —'}
          </option>
          {villeDepartOptions.map((v) => <option key={v.id} value={v.id}>{v.ville}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Pays d'arrivée <span className="text-red-500">*</span>
        </label>
        <select
          value={paysArriveeId}
          onChange={(e) => selectPaysArrivee(e.target.value)}
          className={selectClassName}
          disabled={!villeDepartId}
        >
          <option value="">
            {!villeDepartId ? 'Choisir une ville de départ d\'abord' : loading.paysArrivee ? 'Chargement...' : '— Sélectionner —'}
          </option>
          {paysArriveeOptions.map((p) => <option key={p.id} value={p.id}>{p.pays}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Ville d'arrivée <span className="text-red-500">*</span>
        </label>
        <select
          value={itineraireId}
          onChange={(e) => selectItineraire(e.target.value)}
          className={selectClassName}
          disabled={!paysArriveeId}
        >
          <option value="">
            {!paysArriveeId ? 'Choisir un pays d\'arrivée d\'abord' : loading.villeArrivee ? 'Chargement...' : '— Sélectionner —'}
          </option>
          {villeArriveeOptions.map((it) => <option key={it.id} value={it.id}>{it.villeArrivee.ville}</option>)}
        </select>
        {paysArriveeId && !loading.villeArrivee && villeArriveeOptions.length === 0 && (
          <p className="mt-1 text-[11px] text-amber-600">
            Aucun itinéraire disponible, il doit être créé dans le référentiel (Odoo / paramétrage Itinéraires).
          </p>
        )}
      </div>

      <div className={itineraireWrapperClassName}>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Itinéraire <span className="ml-1 text-gray-400 normal-case font-normal">(calculé auto)</span>
        </label>
        <input
          type="text"
          value={selectedItineraire?.libelle ?? ''}
          readOnly
          placeholder="Sélectionnez un trajet complet"
          className={readonlyClassName}
        />
      </div>
    </>
  );
}
