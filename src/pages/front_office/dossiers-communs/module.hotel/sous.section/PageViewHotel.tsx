import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { HotelHeader } from '../components/HotelHeader';
import { createBenchmarking, createHotelEnteteFromBenchmarking, createHotelProspectionEntete, fetchHotelProspectionEntetes, setSelectedEntete, type HotelProspectionEntete } from '../../../../../app/front_office/parametre_hotel/hotelProspectionEnteteSlice';
import React from 'react';
import ModalBenchmarkingForm from '../components/ModalBenchmarkingForm';
import { FiArrowRight } from 'react-icons/fi';
import TabContainer from '../../../../../layouts/TabContainer';
import { fetchHotelReservations } from '../../../../../app/front_office/parametre_hotel/hotelReservationEnteteSlice';
import HotelReservationsList from './sous.section.page/HotelReservationsList';
import ModalBenchmarkingToHotel from '../../../../../components/modals/Hotel/ModalBenchmarkingToHotel';

const PageViewHotel = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: fournisseurs, loading: fournisseursLoading } = useSelector(
    (state: RootState) => state.fournisseurs
  );

  const {
    items: entetes,
    loading: entetesLoading,
    error: entetesError,
    creating,
  } = useSelector((state: RootState) => state.hotelProspectionEntete);

  const tabs = [
    { id: 'benchmarking', label: 'Listes des entête benchmarking' },
    { id: 'hotel', label: 'Listes des reservation hotel' }
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'benchmarking');

  const {
      items: services,
    } = useSelector((state: RootState) => state.serviceHotel);

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'hotel')
    ?.prestation?.[0]?.id || '';

  console.log(`prestation = ${prestationId}`);
  

  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // État pour savoir quelle entête est ouverte (un seul à la fois ou plusieurs possibles)
  // Définir l'état de toutes les entêtes ouvertes par défaut

  const [openEnteteId, setOpenEnteteId] = useState<string | null>(null);
  // Nouvel état pour le modal benchmarking
  const [showBenchmarkingModal, setShowBenchmarkingModal] = useState(false);
  const [selectedEnteteIdForBench, setSelectedEnteteIdForBench] = useState<string | null>(null);

  // ─── États modal transformation ───────────────────────────
  const [showToHotelModal, setShowToHotelModal] = useState(false);
  const [selectedEnteteForHotel, setSelectedEnteteForHotel] = useState<HotelProspectionEntete | null>(null);
  const [toHotelLoading, setToHotelLoading] = useState(false);

  // Dans useEffect – charger les données résa quand onglet actif ou prestation change
  useEffect(() => {
    if (prestationId && activeTab === 'hotel') {
      dispatch(fetchHotelReservations(prestationId));
    }
  }, [dispatch, prestationId, activeTab]);

  useEffect(() => {
    if (entetes.length === 0 && prestationId) {
      dispatch(fetchHotelProspectionEntetes(prestationId));
    }
  }, [dispatch, prestationId, entetes.length]);

  const handleCreate = () => {
    if (!prestationId || !selectedFournisseurId) {
      setFormError("Veuillez sélectionner un fournisseur valide");
      return;
    }
    setFormError(null);
    dispatch(createHotelProspectionEntete({ prestationId, fournisseurId: selectedFournisseurId }))
      .then((result) => {
        if (createHotelProspectionEntete.fulfilled.match(result)) {
          setSelectedFournisseurId('');
        } else {
          setFormError(result.payload as string || 'Échec création');
        }
      });
  };

  // Fonction pour ouvrir le modal pour une entête précise
  const openBenchmarkingModal = (enteteId: string) => {
    setSelectedEnteteIdForBench(enteteId);
    setShowBenchmarkingModal(true);
  };

  const handleCreateBenchmarking = (data: any) => {
    dispatch(createBenchmarking(data)).then((result) => {
      if (createBenchmarking.fulfilled.match(result)) {
        setShowBenchmarkingModal(false);
        setSelectedEnteteIdForBench(null);
        // Re-fetch pour voir le nouveau benchmarking
        dispatch(fetchHotelProspectionEntetes(prestationId));
      } else {
        alert(result.payload || 'Erreur création benchmarking');
      }
    });
  };

  const toggleDetails = (id: string) => {
    setOpenEnteteId(openEnteteId === id ? null : id);
  };

  const handleRowClick = (id: string) => {
    // 1. Marquer comme sélectionné dans Redux
    dispatch(setSelectedEntete(id));
    // 2. Naviguer vers le détail
    navigate(`/dossiers-communs/hotel/details`);
  };

  const handleCreateHotelFromBenchmarking = async (payload: {
    hotelProspectionEnteteId: string;
    benchmarkingLigneIds: string[];
  }) => {
    try {
      setToHotelLoading(true);
      await dispatch(createHotelEnteteFromBenchmarking(payload)).unwrap();

      alert('Réservation hôtel créée avec succès !');
      setShowToHotelModal(false);
      setSelectedEnteteForHotel(null);

      // Rediriger vers l'onglet réservation
      setActiveTab('hotel');
      dispatch(fetchHotelReservations(prestationId));
    } catch {
      alert('Erreur lors de la création de la réservation hôtel');
    } finally {
      setToHotelLoading(false);
    }
  };
  
  useEffect(() => {
    if (location.state?.targetTab) {
      // Use requestAnimationFrame to defer the state update
      const timer = setTimeout(() => {
        setActiveTab(location.state.targetTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  const Field = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-700 mt-0.5 font-medium">{value}</p>
      </div>
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'benchmarking' ? (
        <div className="min-h-screen bg-neutral-50">
          <div className='flex justify-between mb-5'>
            <div className="">
              <HotelHeader numerohotel={dossierActif?.numero} navigate={navigate} isBenchmarking={true}/>
            </div>

            {/* Formulaire création - Design épuré */}
            {prestationId && fournisseurs.length > 0 && !fournisseursLoading && (
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  <select
                    value={selectedFournisseurId}
                    onChange={(e) => setSelectedFournisseurId(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    disabled={creating}
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.libelle}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !selectedFournisseurId}
                  className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                    creating || !selectedFournisseurId 
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                      : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95'
                  }`}
                >
                  {creating ? 'Création en cours...' : 'Créer une entête'}
                </button>
              </div>
            )}
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm">
              {formError}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
            {/* Grille d'informations */}
            <div className="grid grid-cols-4 gap-x-8 gap-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">N° dossier Commun</p>
                  <p className="text-xl font-semibold text-gray-800 ">{dossierActif?.numero}</p>
                </div>

                {dossierActif?.raisonAnnulation && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    Annulé
                  </div>
                )}
              </div>

              {dossierActif?.raisonAnnulation && (
                <Field label="Raison d'annulation" value={dossierActif.raisonAnnulation} />
              )}

              {dossierActif?.dateAnnulation && (
                <Field label="Date d'annulation" value={dossierActif.dateAnnulation} />
              )}

              <Field label="Contact principal"   value={dossierActif?.contactPrincipal} />
              <Field label="WhatsApp"            value={dossierActif?.whatsapp} />
              <Field label="Réf. Travel Planner" value={dossierActif?.referenceTravelPlaner} />
              <Field label="Client facturé"      value={dossierActif?.clientfacture?.libelle} />
              <Field label="Code client"         value={dossierActif?.clientfacture?.code} />

            </div>
          </div>

          {entetesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-neutral-500">Chargement des données...</p>
              </div>
            </div>
          ) : entetesError ? (
            <div className="p-6 bg-red-50 border-l-4 border-red-600 text-red-800">
              {entetesError}
            </div>
          ) : entetes.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-neutral-500">Aucune entête de prospection trouvée</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <table className="min-w-full ">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 ">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                      N° Entête
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                      N° Dossier
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                      Créé le
                    </th>
                    <th className="px-6 py-3.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {entetes.map((entete, index) => {
                    return (
                      <React.Fragment key={entete.id}>
                        {/* Ligne principale */}
                        <tr
                          onClick={() => toggleDetails(entete.id)}
                          className={`border-b bg-orange-200 border-neutral-100 hover:bg-orange-300 transition-colors ${
                            index === entetes.length - 1 ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-mono text-sm text-slate-700">
                            {entete.numeroEntete}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {entete.prestation?.numeroDos || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {entete.fournisseur?.libelle}
                            <span className="ml-2 text-slate-700">({entete.fournisseur?.code})</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatDate(entete.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Bouton transformer en hôtel */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEnteteForHotel(entete);
                                  setShowToHotelModal(true);
                                }}
                                className="text-xs font-medium bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer "
                              >
                                Transformer / Hôtel
                              </button>

                              {/* Bouton nouveau benchmarking existant */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBenchmarkingModal(entete.id);
                                }}
                                className="text-xs font-medium bg-white text-neutral-900 px-4 py-2 rounded-md hover:bg-orange-100 transition-colors cursor-pointer "
                              >
                                Nouveau benchmarking
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Section détails - affichée si expanded */}
                        <tr>
                          <td colSpan={6} className="bg-neutral-50 border-b border-neutral-100">
                            <div className="px-6 py-6">
                              {entete.benchmarkingEntete?.length === 0 ? (
                                <div className="text-center py-8">
                                  <svg className="w-10 h-10 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <p className="text-sm text-neutral-500">Aucun benchmarking disponible</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {entete.benchmarkingEntete.map((bench) => (
                                    <div
                                      key={bench.id}
                                      onClick={() => handleRowClick(bench.id)}
                                      className="bg-white border border-neutral-200 rounded-lg p-5 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                      {/* En-tête du benchmark */}
                                      <div className='flex justify-between items-center gap-6 mb-5'>
                                        {/* Partie Gauche : Textes (flex-1 pour prendre l'espace disponible) */}
                                        <div className="flex-1">
                                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                                N° Benchmarking
                                              </div>
                                              <div className="font-mono text-sm font-medium text-neutral-900">
                                                {bench.numero}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                                Période
                                              </div>
                                              <div className="text-sm text-neutral-900">
                                                {formatDate(bench.du)} <span className="mx-1">→</span> {formatDate(bench.au)}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                                Nuitée
                                              </div>
                                              <div className="text-sm font-medium text-neutral-900">
                                                {bench.nuite}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                                Lieu
                                              </div>
                                              <div className="text-sm text-neutral-900">
                                                {bench.ville}, {bench.pays}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Partie Droite : Icône (shrink-0 pour ne pas être écrasée) */}
                                        <div className="shrink-0">
                                          <div className="bg-orange-300 p-2.5 rounded-full text-white flex items-center justify-center cursor-pointer
                                                          hover:bg-orange-400 hover:translate-x-1 transition-all duration-300">
                                            <FiArrowRight size={18} />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Services inclus */}
                                      {bench.benchService?.length > 0 && (
                                        <div className="pt-3 border-t border-neutral-100">
                                          <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                                            Service demandé
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {bench.benchService.map((bs) => (
                                              <span
                                                key={bs.id}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                                              >
                                                {bs.serviceHotel?.service || 'Service inconnu'}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* )} */}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal création benchmarking */}
          {selectedEnteteIdForBench && (
            <ModalBenchmarkingForm
              isOpen={showBenchmarkingModal}
              onClose={() => {
                setShowBenchmarkingModal(false);
                setSelectedEnteteIdForBench(null);
              }}
              onSubmit={handleCreateBenchmarking}
              services={services}
              enteteId={selectedEnteteIdForBench}
              loading={false}
            />
          )}

          {/* Modal transformation benchmarking → hôtel */}
          {selectedEnteteForHotel && (
            <ModalBenchmarkingToHotel
              isOpen={showToHotelModal}
              onClose={() => {
                setShowToHotelModal(false);
                setSelectedEnteteForHotel(null);
              }}
              onSubmit={handleCreateHotelFromBenchmarking}
              entete={selectedEnteteForHotel}
              loading={toHotelLoading}
            />
          )}
        </div>
      ) : (
        <HotelReservationsList prestationId={prestationId} dossierNumero={dossierActif?.numero?.toString()} />
      )}
    </TabContainer>
  );
};

export default PageViewHotel;