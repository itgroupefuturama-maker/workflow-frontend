import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { createProspectionEntete, fetchProspectionEntetes, type VisaProspectionLigne } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import StatusBadge from './StatusBadge';
import CreateProspectionLigneModal from './CreateProspectionLigneModal';
import CreateDevisModal from './CreateDevisModal';

interface Props {
  prestationId: string;
}

const ProspectionTab = ({ prestationId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { data: prospections, loading, creating, error } =
    useSelector((s: RootState) => s.visaProspectionEntete);

  const [ligneModalEnteteId, setLigneModalEnteteId] = useState<string | null>(null);
  const [devisModalEntete, setDevisModalEntete] = useState<{
    id: string;
    lignes: VisaProspectionLigne[];
  } | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!prestationId) return;
    const result = await dispatch(createProspectionEntete(prestationId));
    // re-fetch après création pour avoir la liste à jour
    if (createProspectionEntete.fulfilled.match(result)) {
      dispatch(fetchProspectionEntetes(prestationId));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Prospections</h2>
        <button
          onClick={handleCreate}
          disabled={creating || !prestationId}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
        >
          {creating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Création...
            </>
          ) : '+ Nouvelle prospection'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Chargement...
        </div>
      )}

      {/* Liste vide */}
      {!loading && prospections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
          <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Aucune prospection pour ce dossier</p>
        </div>
      )}

      {/* Cards */}
      {!loading && prospections.map((entete) => {
        const dossier = entete.prestation.dossierCommunColab.dossierCommun;
        return (
          <div
            key={entete.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Header card */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {entete.prestation.numeroDos}
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    Réf. {dossier.referenceTravelPlaner}
                  </span>
                </p>
                <p className="text-sm text-gray-500">{dossier.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setLigneModalEnteteId(entete.id); }}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                >
                  + Ligne
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDevisModalEntete({ id: entete.id, lignes: entete.visaProspectionLigne }); }}
                  className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600"
                >
                  📄 Devis
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/dossiers-communs/visa/details/${entete.id}`); }}
                  className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
                >
                  Voir détail
                </button>
              </div>
            </div>

            {/* Lignes */}
            {entete.visaProspectionLigne.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400 italic">Aucune ligne de prospection</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      {['Nb', 'Départ', 'Retour', 'État visa', 'Pièce', 'PU consulat (Ar)', 'PU client (Ar)', 'Devise', 'Taux'].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entete.visaProspectionLigne.map((ligne) => (
                      <tr key={ligne.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-indigo-600">{ligne.nombre}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(ligne.dateDepart).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(ligne.dateRetour).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3"><StatusBadge status={ligne.etatVisa} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${ligne.etatPiece ? 'text-green-600' : 'text-orange-500'}`}>
                            {ligne.etatPiece ? '✓ Complet' : '✗ Incomplet'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{ligne.puConsulatAriary.toLocaleString('fr-FR')} Ar</td>
                        <td className="px-4 py-3">{ligne.puClientAriary.toLocaleString('fr-FR')} Ar</td>
                        <td className="px-4 py-3 font-mono">{ligne.devise}</td>
                        <td className="px-4 py-3">{ligne.tauxEchange.toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      {ligneModalEnteteId && (
        <CreateProspectionLigneModal
          enteteId={ligneModalEnteteId}
          prestationId={prestationId}
          onClose={() => setLigneModalEnteteId(null)}
        />
      )}
      {devisModalEntete && (
        <CreateDevisModal
          enteteId={devisModalEntete.id}
          prestationId={prestationId}
          lignes={devisModalEntete.lignes}
          onClose={() => setDevisModalEntete(null)}
        />
      )}
    </div>
  );
};

export default ProspectionTab;