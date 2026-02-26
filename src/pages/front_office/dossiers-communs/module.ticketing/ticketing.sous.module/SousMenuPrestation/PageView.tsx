import { useEffect, useState } from 'react';
import { FiPlus, FiClock, FiActivity, FiTag, FiFileText, FiArrowRight, FiHash } from 'react-icons/fi';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import TabContainer from '../../../../../../layouts/TabContainer';
import type { RootState } from '../../../../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBilletsByDossierCommun, type BilletEntete } from '../../../../../../app/front_office/billetSlice';
import { fetchServiceSpecifiques } from '../../../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';

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
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  );
};

export default function PageView() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const dossierId = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId?.id);
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  const { entetes, loadingEntetes, errorEntetes, openCreateModal, openEditModal } =
    useOutletContext<PrestationContext>();

  const { list: billets, loadingList: loadingBillets, errorList: errorBillets } =
    useSelector((state: RootState) => state.billet);

  const serviceState = useSelector((state: RootState) => state.serviceSpecifique);
  const services = serviceState.items;

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'defaultTab');

  useEffect(() => {
    if (services.length === 0 && !serviceState.loading) {
      dispatch(fetchServiceSpecifiques() as any);
    }
  }, [dispatch, services.length, serviceState.loading]);

  useEffect(() => {
    if (dossierId && activeTab === 'billet') {
      dispatch(fetchBilletsByDossierCommun(dossierId) as any);
    }
  }, [dossierId, activeTab, dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet',      label: 'Listes des billets'            },
  ];

  // ── Statut badge ──────────────────────────────────────────────────
  const statutBadge = (statut: string) => {
    const map: Record<string, string> = {
      CREER:                 'bg-amber-100 text-amber-700 border-amber-200',
      BC_CLIENT_A_APPROUVER: 'bg-violet-100 text-violet-700 border-violet-200',
    };
    return map[statut] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const statutLabel = (statut: string) => {
    if (statut === 'CREER') return 'Créé';
    return statut.replace(/_/g, ' ');
  };

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>

      {/* ══════════════════════════════════════════
          ONGLET PROSPECTION
      ══════════════════════════════════════════ */}
      {activeTab === 'prospection' ? (
        <div className="space-y-5">

          {/* ── Action bar ── */}
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
          </div>

          {/* ── Carte dossier actif ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Bandeau supérieur coloré */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

            <div className="p-5">
              {/* Numéro + statut annulation */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    N° Dossier Commun
                  </p>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight">
                    {dossierActif?.numero}
                  </p>
                </div>

                {dossierActif?.raisonAnnulation && (
                  <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Annulé
                  </span>
                )}
              </div>

              {/* Grille d'infos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 pt-3 border-t border-slate-100">
                {dossierActif?.raisonAnnulation && (
                  <Field label="Raison d'annulation" value={dossierActif.raisonAnnulation} />
                )}
                {dossierActif?.dateAnnulation && (
                  <Field label="Date d'annulation"   value={dossierActif.dateAnnulation} />
                )}
                <Field label="Contact principal"   value={dossierActif?.contactPrincipal} />
                <Field label="WhatsApp"            value={dossierActif?.whatsapp} />
                <Field label="Réf. Travel Planner" value={dossierActif?.referenceTravelPlaner} />
                <Field label="Client facturé"      value={dossierActif?.clientfacture?.libelle} />
                <Field label="Code client"         value={dossierActif?.clientfacture?.code} />
              </div>
            </div>
          </div>

          {/* ── États de chargement ── */}
          {loadingEntetes ? (
            <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                <FiTag className="text-white" size={18} />
              </div>
              <p className="text-sm text-slate-400 animate-pulse">Chargement des en-têtes...</p>
            </div>
          ) : errorEntetes ? (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm">
              {errorEntetes}
            </div>
          ) : entetes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <FiClock className="text-slate-300" size={28} />
              </div>
              <p className="text-base font-semibold text-slate-500 mb-1">Aucun en-tête de prospection</p>
              <p className="text-sm text-slate-400 mb-4">Cliquez sur le bouton ci-dessus pour commencer.</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
              >
                <FiPlus size={15} /> Ajouter un en-tête
              </button>
            </div>
          ) : (
            /* ── Tableau entêtes ── */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50">
                      {['N° En-tête', 'Type Vol', 'Fournisseur', 'Crédit', 'Comm. proposée', 'Comm. appliquée', 'Créé le', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {entetes.map((entete) => (
                      <tr key={entete.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                            <FiHash size={12} className="text-slate-400" />
                            {entete.numeroEntete}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            {entete.typeVol}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                          {entete.fournisseur?.libelle || entete.fournisseurId}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                          {entete.credit}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-700">{entete.commissionPropose}
                            <span className="text-xs text-slate-400 font-normal"> %</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-bold text-indigo-600">{entete.commissionAppliquer}
                            <span className="text-xs text-indigo-400 font-normal"> %</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 font-medium">
                          {new Date(entete.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(entete)}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => navigate(`/dossiers-communs/ticketing/pages/prospection/${entete.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              Détail <FiArrowRight size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      ) : (
        /* ══════════════════════════════════════════
            ONGLET BILLET
        ══════════════════════════════════════════ */
        <div className="space-y-5">

          {/* ── Action bar ── */}
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

          {/* ── États ── */}
          {loadingBillets ? (
            <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                <FiFileText className="text-white" size={18} />
              </div>
              <p className="text-sm text-slate-400 animate-pulse">Chargement des billets...</p>
            </div>
          ) : errorBillets ? (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm">
              {errorBillets}
            </div>
          ) : billets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <FiActivity className="text-slate-300" size={28} />
              </div>
              <p className="text-base font-semibold text-slate-500 mb-1">Aucun billet pour ce dossier</p>
              <p className="text-sm text-slate-400">Les billets apparaîtront ici une fois générés.</p>
            </div>
          ) : (
            /* ── Tableau billets ── */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50">
                      {['N° Billet', 'N° Devis', 'N° En-tête', 'Statut', 'Comm. appl.', 'Nb lignes', 'Créé le', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {billets.map((billet: BilletEntete) => (
                      <tr
                        key={billet.id}
                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/dossiers-communs/ticketing/pages/billet/${billet.devisId}?prospectionEnteteId=${billet.prospectionEnteteId}`)}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                            <FiHash size={12} className="text-slate-400" />
                            {billet.numeroBillet}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500">
                          {billet.devis?.reference || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500">
                          {billet.prospectionEntete?.numeroEntete || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap uppercase">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statutBadge(billet.statut)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 " />
                            {statutLabel(billet.statut)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-bold text-indigo-600">{billet.commissionAppliquer}
                            <span className="text-xs text-indigo-400 font-normal"> %</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                            {billet.billetLigne?.length || 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 font-medium">
                          {new Date(billet.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dossiers-communs/ticketing/pages/billet/${billet.devisId}?prospectionEnteteId=${billet.prospectionEnteteId}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            Voir <FiArrowRight size={11} />
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