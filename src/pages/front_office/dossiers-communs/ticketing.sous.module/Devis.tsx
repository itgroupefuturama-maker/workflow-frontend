import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiEye } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDevisByEntete, type Ligne } from '../../../../app/front_office/devisSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function Devis () {

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { enteteId } = useParams<{ enteteId: string }>();

    const { items: devisList, loading, error } = useSelector((state: RootState) => state.devis);
    const [openDevisId, setOpenDevisId] = useState<string | null>(null);

  useEffect(() => {
    if (enteteId) {
      dispatch(fetchDevisByEntete(enteteId));
    }
  }, [enteteId, dispatch]);

  const toggleDevis = (devisId: string) => {
    setOpenDevisId(openDevisId === devisId ? null : devisId);
  };

  if (!enteteId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-red-600">
        ID de l'entête manquant dans l'URL
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm uppercase tracking-wider">Retour</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Devis liés à l'entête
        </h1>
      </header>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
          <span className="ml-4 text-slate-600 font-medium">Chargement des devis...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {devisList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-slate-600 text-lg font-medium">
                Aucun devis généré pour cet entête.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {devisList.map((devis) => {
                const isOpen = openDevisId === devis.id;
                const entete = devis.data?.entete || {};
                const lignes = devis.data?.lignes || [];
                const lignesCount = lignes.length;

                return (
                  <div
                    key={devis.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    {/* En-tête du devis (toujours visible) */}
                    <div
                      className="p-5 flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleDevis(devis.id)}
                    >
                      <div>
                        <h3 className="text-lg font-bold text-indigo-700">
                          {devis.reference}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Créé le {new Date(devis.createdAt).toLocaleString('fr-FR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-700">
                            {devis.totalGeneral.toLocaleString('fr-FR')} Ar
                          </div>
                          <div className="text-xs text-slate-500">
                            {lignesCount} ligne{lignesCount !== 1 ? 's' : ''}
                          </div>
                        </div>

                        <div className="text-slate-400">
                          {isOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Contenu détaillé (visible quand ouvert) */}
                    {isOpen && (
                      <div className="px-5 pb-6 border-t border-slate-200">
                        {/* Infos entête */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Fournisseur
                            </label>
                            <div className="font-medium">{entete.fournisseur?.libelle || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Type de vol
                            </label>
                            <div className="font-medium">{entete.typeVol || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Crédit
                            </label>
                            <div className="font-medium">{entete.credit || '—'}</div>
                          </div>
                          <div>
                            <label className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                              Commission appliquée
                            </label>
                            <div className="font-medium">
                              {entete.commissionAppliquer != null ? `${entete.commissionAppliquer} %` : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Tableau des lignes */}
                        {lignes.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Vol</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Itinéraire</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Classe</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Passager</th>
                                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Billet Cie</th>
                                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Client</th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Services</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {lignes.map((ligne: Ligne) => (
                                  <tr key={ligne.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm">{ligne.numeroVol || '—'}</td>
                                    <td className="px-4 py-3 text-sm">{ligne.itineraire || '—'}</td>
                                    <td className="px-4 py-3 text-sm">{ligne.classe || '—'}</td>
                                    <td className="px-4 py-3 text-sm">{ligne.typePassager || '—'}</td>
                                    <td className="px-4 py-3 text-right text-sm text-emerald-700 font-medium">
                                      {ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR') || '—'} {ligne.devise}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-indigo-700 font-medium">
                                      {ligne.montantBilletClientDevise?.toLocaleString('fr-FR') || '—'} {ligne.devise}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                                        {ligne.serviceProspectionLigne?.length > 0 ? (
                                          ligne.serviceProspectionLigne.map((svc) => {
                                            const label = svc.serviceSpecifique?.libelle || svc.serviceSpecifiqueId.slice(0, 6);
                                            let displayValue = svc.valeur;
                                            if (displayValue === 'true') displayValue = 'Oui';
                                            if (displayValue === 'false') displayValue = 'Non';

                                            return (
                                              <span
                                                key={svc.id}
                                                className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full"
                                                title={`${label} = ${svc.valeur}`}
                                              >
                                                {label}: {displayValue}
                                              </span>
                                            );
                                          })
                                        ) : (
                                          <span className="text-slate-400 text-xs italic">aucun</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic mt-4">Aucune ligne dans ce devis</p>
                        )}

                        {/* Actions supplémentaires */}
                        <div className="mt-6 flex justify-end gap-4">
                          <button
                            onClick={() => alert(`Téléchargement PDF / visualisation du devis ${devis.reference} (à implémenter)`)}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <FiEye size={16} />
                            Voir / Télécharger
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
