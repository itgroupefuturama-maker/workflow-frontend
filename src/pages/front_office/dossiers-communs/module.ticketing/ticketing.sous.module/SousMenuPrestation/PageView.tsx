import { useEffect, useState } from 'react';
import { FiPlus, FiClock, FiActivity } from 'react-icons/fi';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import TabContainer from '../../../../../../layouts/TabContainer';
import type { RootState } from '../../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBilletsByDossierCommun, type BilletEntete } from '../../../../../../app/front_office/billetSlice';
import { fetchServiceSpecifiques } from '../../../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';

// On définit le type du contexte pour Typescript
interface PrestationContext {
  prestationId: string;
  entetes: any[];
  loadingEntetes: boolean;
  errorEntetes: string | null;
  openCreateModal: () => void;
  openEditModal: (entete: any) => void;
}

const Field = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5 font-medium">{value}</p>
    </div>
  );
};

export default function PageView() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  // On récupère tout depuis l'OutletContext
  const dossierId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.id
  );

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  const { 
    prestationId,
    entetes, 
    loadingEntetes, 
    errorEntetes, 
    openCreateModal, 
    openEditModal 
  } = useOutletContext<PrestationContext>();

  // console.log(prestationId);

  const {
    list: billets,
    loadingList: loadingBillets,
    errorList: errorBillets
  } = useSelector((state: RootState) => state.billet);

  // Dans le composant Billet
  const serviceState = useSelector((state: RootState) => state.serviceSpecifique);
  const services = serviceState.items;   // ← tableau des services { id, code, libelle, type, ... }

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'defaultTab');

  useEffect(() => {
    if (services.length === 0 && !serviceState.loading) {
      dispatch(fetchServiceSpecifiques() as any);
    }
  }, [dispatch, services.length, serviceState.loading]);

  // Fetch billets quand on a le dossierId
  useEffect(() => {
    if (dossierId && activeTab === 'billet') {
      dispatch(fetchBilletsByDossierCommun(dossierId) as any);
    }
  }, [dossierId, activeTab, dispatch]);
    
  useEffect(() => {
    if (location.state?.targetTab) {
      // Use requestAnimationFrame to defer the state update
      const timer = setTimeout(() => {
        setActiveTab(location.state.targetTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet', label: 'Listes des billets' }
  ];

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'prospection' ? (
        <div className="space-y-6">
          {/* Section Header de la liste */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 text-sm">
            {/* Bouton retour */}
              <button
                // onClick={() => navigate(-1)}
                className="
                  flex items-center gap-2
                  px-4 py-2
                  rounded-lg
                bg-amber-400/90
                  border
                border-amber-400/90
                text-white
                hover:bg-amber-400
                  transition-all
                  font-bold
                "
              >
                <span className="font-semibold tracking-wide">
                  Liste Entete Prospection
                </span>
              </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              <FiPlus size={18} />
              Ajouter un en-tête
            </button>
          </div>

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

          {/* États de chargement et erreurs */}
          {loadingEntetes ? (
            <div className="text-center py-12 text-slate-400 animate-pulse bg-white rounded-2xl border border-slate-100">
              Chargement des en-têtes...
            </div>
          ) : errorEntetes ? (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100">
              {errorEntetes}
            </div>
          ) : entetes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <FiClock size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun en-tête de prospection</p>
              <p className="text-sm mt-2">Cliquez sur le bouton ci-dessus pour commencer.</p>
            </div>
          ) : (
            /* Le Tableau */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            N° En-tête
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Type Vol
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Fournisseur
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Crédit
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Comm. Proposée
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Comm. Appliquée
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Créé le
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {entetes.map((entete) => {
                          // const isEditing = editingEnteteId === entete.id;

                          return (
                            <tr
                              key={entete.id}
                              className="hover:bg-indigo-50/30 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {entete.numeroEntete}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {entete.typeVol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {entete.fournisseur?.libelle || entete.fournisseurId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {entete.credit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {entete.commissionPropose} %
                              </td>

                              {/* Colonne éditable */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span>{entete.commissionAppliquer} %</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {new Date(entete.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <button
                                  onClick={() => openEditModal(entete)}
                                  className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                                  title="Modifier cet en-tête"
                                >
                                  Modifier
                                </button>

                                <button
                                  onClick={() => navigate(`/dossiers-communs/ticketing/pages/prospection/${entete.id}`)}
                                  className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                                  title="Voir les lignes de prospection"
                                >
                                  Naviguer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Onglet Billet */
        <div className="space-y-6">
          {/* Header de la section billets */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 text-sm">

              {/* Bouton retour */}
              <button
                // onClick={() => navigate(-1)}
                className="
                  flex items-center gap-2
                  px-4 py-2
                  rounded-lg
                bg-amber-400/90
                  border
                border-amber-400/90
                text-white
                hover:bg-amber-400
                  transition-all
                  font-bold
                "
              >
                <span className="font-semibold tracking-wide">
                  Liste des billets
                </span>
              </button>
            </div>
          </header>

          {/* États */}
          {loadingBillets ? (
            <div className="text-center py-12 text-slate-400 animate-pulse bg-white rounded-2xl border border-slate-100">
              Chargement des billets...
            </div>
          ) : errorBillets ? (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100">
              {errorBillets}
            </div>
          ) : billets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <FiActivity size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun billet créé pour ce dossier</p>
              <p className="text-sm mt-2">Les billets apparaîtront ici une fois générés.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        N° Billet
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        N° Devis
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        N° En-tête
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Commission appl.
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Nb lignes
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {billets.map((billet: BilletEntete) => (
                      <tr
                        key={billet.id}
                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dossiers-communs/${prestationId}/pages/billet/${billet.devisId}?prospectionEnteteId=${billet.prospectionEnteteId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {billet.numeroBillet}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {billet.devis?.reference || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {billet.prospectionEntete?.numeroEntete || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full uppercase ${
                            billet.statut === 'CREER' ? 'bg-yellow-100 text-yellow-800' :
                            billet.statut === 'BC_CLIENT_A_APPROUVER' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {billet.statut == 'CREER' ? 'Crée' : billet.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {billet.commissionAppliquer} %
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600">
                          {billet.billetLigne?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(billet.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dossiers-communs/${prestationId}/pages/billet/${billet.devisId}?prospectionEnteteId=${billet.prospectionEnteteId}`)
                            }}
                            className="text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </TabContainer>
  );
}