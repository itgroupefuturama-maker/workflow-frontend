import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';           // ← AJOUT
import type { AppDispatch, RootState } from '../../../../../app/store';
import { createAttestationEntete, fetchAttestationEntetes, setSelectedEntete } from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';
import { AttestationHeader } from './components.attestation/AttestationHeader';
import axios from '../../../../../service/Axios';

const PageViewAttestation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

   const { data: fournisseurs } = useSelector((state: RootState) => state.fournisseurs);

  const { items, loading, error } = useSelector(
    (state: RootState) => state.attestationEntete
  );

  // On récupère le dossier actif de Redux au lieu de l'URL
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  console.log("dossierActif", dossierActif);

  // On extrait l'id de la prestation attestation
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "attestation")
    ?.prestation?.[0]?.id || '';

  // ─── États pour le commentaire fournisseur ────────────────────────────────
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>('');
  const [lastComment, setLastComment] = useState<{
    commentaire: string;
    alerte: string;
    dateEnregistrement: string;
  } | null>(null);

  const [, setCommentLoading] = useState(false);
  const [, setCommentError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = !!prestationId && fournisseurs.length > 0;

  useEffect(() => {
    console.log(`prestationId et entete : ${prestationId}`);
    if (items.length === 0) {
      dispatch(fetchAttestationEntetes());
    }
  }, [dispatch, items.length]);

  useEffect(() => {
    if (!selectedFournisseurId) {
      setLastComment(null);
      setCommentError(null);
      return;
    }

    const fetchLastComment = async () => {
      setCommentLoading(true);
      setCommentError(null);
      setLastComment(null);

      try {
        const response = await axios.get(
          `/commentaires-fournisseur/fournisseur/${selectedFournisseurId}/last`
        );

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Réponse invalide');
        }

        const data = response.data.data;

        if (data) {
          setLastComment({
            commentaire: data.commentaire || '—',
            alerte: data.alerte || 'INCONNU',
            dateEnregistrement: data.dateEnregistrement
              ? new Date(data.dateEnregistrement).toLocaleString('fr-FR')
              : '—',
          });
        } else {
          setLastComment(null);
        }
      } catch (err: any) {
        // console.error('Erreur chargement commentaire fournisseur:', err);
        setCommentError(
          err.response?.data?.message ||
          err.message ||
          'Impossible de charger le dernier commentaire'
        );
        setLastComment(null);
      } finally {
        setCommentLoading(false);
      }
    };
    fetchLastComment();
  }, [selectedFournisseurId]); // ← Déclenche à chaque changement de fournisseur

  // ─── Style selon alerte ───────────────────────────────────────────────
  const getAlertStyle = (alerte: string) => {
    const upper = alerte.toUpperCase();
    if (upper === 'ELEVE' || upper === 'TRES_ELEVE') {
      return 'bg-red-50 border-red-400 text-red-900';
    }
    if (upper === 'NORMAL') {
      return 'bg-orange-50 border-orange-400 text-orange-900';
    }
    return 'bg-green-50 border-green-400 text-green-900'; // FAIBLE ou autre
  };

  const getIcon = (alerte: string) => {
    const upper = alerte.toUpperCase();
    if (upper === 'ELEVE' || upper === 'TRES_ELEVE') return '🔴';
    if (upper === 'NORMAL') return '🟠';
    return '🟢';
  };

  const handleCreate = async () => {
    if (!prestationId) {
      setFormError("Aucune prestation 'attestation' trouvée pour ce dossier");
      return;
    }
    if (!selectedFournisseurId) {
      setFormError("Veuillez sélectionner un fournisseur");
      return;
    }

    setFormError(null);

    try {
      await dispatch(
        createAttestationEntete({
          prestationId,
          fournisseurId: selectedFournisseurId,
        })
      ).unwrap();  // unwrap pour catcher l'erreur redux

      setSelectedFournisseurId(''); // reset
    } catch (err: any) {
      setFormError(err.message || "Échec de la création");
    }
  };

  const handleRowClick = (id: string) => {
    // 1. Marquer comme sélectionné dans Redux
    dispatch(setSelectedEntete(id));
    
    // 2. Naviguer vers le détail
    navigate(`/dossiers-communs/attestation/details`);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">

        <AttestationHeader
          numeroAttestation={dossierActif?.numero}
          navigate={navigate} 
        />
        {/* Bouton + formulaire création */}
        {canCreate && (
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fournisseur
              </label>
              <select
                value={selectedFournisseurId}
                onChange={(e) => setSelectedFournisseurId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Choisir —</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} - {f.libelle}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !selectedFournisseurId}
              className={`
                px-5 py-2 rounded-lg font-medium text-white
                ${loading || !selectedFournisseurId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                }
              `}
            >
              {loading ? 'Création...' : 'Créer entête'}
            </button>
            {/* Notification alerte commentaire (fixe en haut à droite) */}
            {selectedFournisseurId && lastComment && lastComment.alerte && (
              <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in pointer-events-none">
                <div
                  className={`
                    flex items-start gap-3 p-4 rounded-xl shadow-lg border
                    ${getAlertStyle(lastComment.alerte)}
                  `}
                >
                  <div className="shrink-0 mt-0.5 text-xl">
                    {getIcon(lastComment.alerte)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-1">
                      Alerte fournisseur : {lastComment.alerte}
                    </div>
                    <p className="text-sm leading-tight">
                      {lastComment.commentaire}
                    </p>
                    <p className="text-xs mt-2 opacity-80">
                      {lastComment.dateEnregistrement}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {formError}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg p-10 text-center shadow">
          <div className="animate-pulse text-gray-500">Chargement des entêtes...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          Erreur : {error}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center shadow text-gray-500 italic">
          Aucune entête d'attestation trouvée
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Entête
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Dossier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Commission
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item.id)}           // ← AJOUT PRINCIPAL
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {item.numeroEntete} 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {item.prestation?.numeroDos || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {item.fournisseur?.libelle || '—'} ({item.fournisseur?.code})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {item.totalCommission.toLocaleString('fr-FR')} Ar
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageViewAttestation;