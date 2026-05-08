import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceEnteteDetail,
  clearAssuranceEnteteDetail
} from '../../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { AssuranceHeader } from '../../components/AssuranceHeader';
import DossierActifCard from '../../../../../../components/CarteDossierActif/DossierActifCard';
import { API_URL } from '../../../../../../service/env';
import { FiArrowRight, FiFile } from 'react-icons/fi';
import Spinner from '../../../../../../layouts/Spinner';
import { fmtDate, fmtNum } from '../../utils/formatters';
import StatusBadge from '../../../module.visa/components/StatusBadge';
import { Card, Field } from '../../components/atoms';
import { FactureModal } from '../../components/ModalsFacturation';

/* ─────────────────────── page ─────────────────────────── */

const PageDetailAssurance = () => {
  const { ligneId } = useParams<{ ligneId: string }>();
  const dispatch    = useDispatch<AppDispatch>();
  const navigate    = useNavigate();
  const location    = useLocation();

  const numeroDos  = location.state?.numeroDos  ?? '—';

  const tabs = [
      { id: 'prospection', label: 'Listes des prospections' },
      { id: 'assurance',        label: 'Listes des assurance' },
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'assurance');
  const [showFactModal,  setShowFactModal]  = useState(false);

  const { detail, loading } = useSelector((s: RootState) => s.assuranceEnteteDetail);
  const clientFactureId = useSelector(
    (s: RootState) => s.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  useEffect(() => {
    if (ligneId) dispatch(fetchAssuranceEnteteDetail(ligneId));
    return () => { dispatch(clearAssuranceEnteteDetail()); };
  }, [ligneId, dispatch]);

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [dispatch, clientFactureId]);

  const handleTabChange = (id: string) => {
      if (id === 'prospection') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/assurance/pages`, { 
          state: { targetTab: 'prospection' }
      });
      } else {
      setActiveTab(id);
      }
  };

  const handleFactureSaved = () => {
    setShowFactModal(false);
    if (ligneId) dispatch(fetchAssuranceEnteteDetail(ligneId));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Spinner /> <span className="text-sm">Chargement…</span>
    </div>
  );

  if (!detail) return null;

  const prospection = detail.assuranceProspectionLigne;
  const ap          = prospection?.assuranceParams;
  const isConforme  = detail.statut === 'CONFORME';

  const tarifRef = prospection?.assuranceTarifPlein ?? undefined;

  // Préremplir depuis les valeurs facturées SI elles existent, sinon depuis le tarif
  const factureInitial = {
    tauxChangeFacture:       String(detail?.tauxChangeFacture       ?? prospection?.tauxChange          ?? ''),
    puFactureAssureurDevise: String(detail?.puFactureAssureurDevise ?? tarifRef?.prixAssureurDevise     ?? ''),
    puFactureAssureurAriary: String(detail?.puFactureAssureurAriary ?? tarifRef?.prixAssureurAriary     ?? ''),
    puFactureClientAriary:   String(detail?.puFactureClientAriary   ?? tarifRef?.prixClientAriary       ?? ''),
    commissionFactureAriary: String(detail?.commissionFactureAriary ?? tarifRef?.commissionAriary       ?? ''),
    numeroPolice:            detail?.numeroPolice    ?? '',
    numeroQuittance:         detail?.numeroQuittance ?? '',
  };


  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} >
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* ── Header fixe — ne scrolle PAS ── */}
            <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <AssuranceHeader
                  numeroassurance={numeroDos}
                  nomPassager={''}
                  navigate={navigate}
                  isDetail={true}
                  isProspection={false}
                  isDevis={false}
                />

                <div className="flex items-center gap-3">
                  {/* BOUTON SECONDAIRE : Voir le PDF */}
                  <a 
                    href={`${API_URL}/${detail.assuranceEntete?.pdfLogin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="
                      inline-flex items-center gap-2 px-4 py-1 text-sm font-medium
                      text-slate-600 bg-white border border-slate-200 rounded-lg
                      hover:bg-slate-50 hover:text-orange-600 hover:border-orange-200
                      transition-all duration-200 shadow-sm active:scale-95
                    "
                  >
                    <FiFile className="text-lg text-orange-500" />
                    <span>Pdf Accés Portail</span>
                  </a>

                  {/* BOUTON INTERMÉDIAIRE : Formulaire */}
                  <button
                    onClick={() => navigate(`/dossiers-communs/assurance/client-info/${detail.id}`)}
                    className="
                      inline-flex items-center gap-2 px-4 py-1 text-sm font-medium
                      text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg
                      hover:bg-indigo-100 transition-all duration-200 active:scale-95
                    "
                  >
                    Accéder au formulaire
                  </button>

                  {/* BOUTON PRIMAIRE : Valider (Action principale) */}
                  <button
                    onClick={() => navigate(`/dossiers-communs/assurance/passager/${detail.id}`, {
                      state: { 
                        nomPassager: detail.clientBeneficiaire?.libelle,
                        numeroDos: detail.numeroDossier,
                      }
                    })}
                    className="
                      inline-flex items-center gap-2 px-5 py-1 text-sm font-semibold
                      text-white bg-emerald-600 rounded-lg
                      hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/50
                      transition-all duration-200 active:scale-95
                    "
                  >
                    <span>Valider : <span className="font-normal opacity-90">{detail.clientBeneficiaire?.libelle}</span></span>
                    <FiArrowRight className="text-base transition-transform group-hover:translate-x-1" /> 
                  </button>
                </div>
              </div>
            </div>

            <div className='px-4 bg-slate-200 rounded-b-xl'>
              <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />
              {/* ══ Topbar ══ */}
              <div className="py-1 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate('/dossiers-communs/assurance/pages', { state: { targetTab: 'assurance' } })}>
                  <button
                    
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-white text-sm transition"
                  >←</button>
                  <div>
                    <h1 className="text-sm font-bold text-gray-900">Retour</h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* ── Colonne gauche (2/3) ── */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Séjour */}
                  <Card title="Séjour">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                      <Field label="Date départ"   value={fmtDate(prospection?.dateDepart)} />
                      <Field label="Date retour"   value={fmtDate(prospection?.dateRetour)} />
                      <Field label="Durée"         value={prospection?.duree ? `${prospection.duree} jours` : '—'} />
                      <Field label="Taux change"   value={prospection?.tauxChange ? `${fmtNum(prospection.tauxChange)} Ar` : '—'} />
                    </div>
                  </Card>

                  {/* Tarif de référence */}
                  {(() => {
                    const tarif = prospection?.assuranceTarifPlein;
                    if (!tarif) return null;
                    const devise = tarif.devise;
                    return (
                      <Card title="Tarif de référence">
                        <div className="space-y-3">
                          {/* Devise + Bornes */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                              Devise : {devise}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                              Durée couverte : {tarif.borneInf} → {tarif.borneSup} jours
                            </span>
                          </div>

                          {/* Tableau des prix */}
                          <div className="rounded-lg overflow-hidden border border-slate-300">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 text-gray-400 uppercase tracking-widest text-[10px]">
                                  <th className="px-4 py-2 text-left font-semibold">Poste</th>
                                  <th className="px-4 py-2 text-right font-semibold">En {devise}</th>
                                  <th className="px-4 py-2 text-right font-semibold">En Ariary</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                <tr className="hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-gray-500">Prix assureur</td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-gray-700">
                                    {fmtNum(tarif.prixAssureurDevise)} {devise}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-gray-700">
                                    {fmtNum(tarif.prixAssureurAriary)} Ar
                                  </td>
                                </tr>
                                <tr className="hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-amber-600">Commission</td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-amber-600">
                                    {fmtNum(tarif.commissionDevise)} {devise}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-amber-600">
                                    {fmtNum(tarif.commissionAriary)} Ar
                                  </td>
                                </tr>
                                <tr className="bg-indigo-50/60 hover:bg-indigo-50 transition">
                                  <td className="px-4 py-2.5 font-bold text-indigo-700">Prix client</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                    {fmtNum(tarif.prixClientDevise)} {devise}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                    {fmtNum(tarif.prixClientAriary)} Ar
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Taux de change de prospection */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-mono bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Taux prospection : 1 {devise} = {fmtNum(prospection?.tauxChange)} Ar
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Facturation — bouton visible uniquement si CONFORME */}
                  <Card
                    title="Facturation"
                    action={
                      isConforme ? (
                        <button
                          onClick={() => setShowFactModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                        >
                          ✏️ Saisir facture
                        </button>
                      ) : undefined
                    }
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                      <Field label="PU assureur (devise)" value={fmtNum(detail.puFactureAssureurDevise)} />
                      <Field label="PU assureur (Ar)"     value={detail.puFactureAssureurAriary ? `${fmtNum(detail.puFactureAssureurAriary)} Ar` : '—'} />
                      <Field label="Commission (Ar)"      value={detail.commissionFactureAriary ? `${fmtNum(detail.commissionFactureAriary)} Ar` : '—'} />
                      <Field label="PU client (Ar)"       value={detail.puFactureClientAriary ? `${fmtNum(detail.puFactureClientAriary)} Ar` : '—'} />
                      <Field label="Taux change facture"  value={fmtNum(detail.tauxChangeFacture)} />
                      <Field label="N° ligne"           value={detail.referenceLine} />
                      <Field label="N° police"            value={detail.numeroPolice} />
                      <Field label="N° quittance"         value={detail.numeroQuittance} />
                    </div>
                  </Card>
                </div>

                {/* ── Colonne droite (1/3) ── */}
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Card title="Résumé du Dossier">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase">Statut Ligne</span>
                          <StatusBadge status={detail.statusLigne} />
                        </div>
                        
                        <div className="px-1 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Créé le</span>
                            <span className="font-semibold text-slate-700">{fmtDate(detail.createdAt)}</span>
                          </div>
                          {ap && (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Zone</span>
                                <span className="font-semibold text-slate-700">{ap.zoneDestination}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Fournisseur</span>
                                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  {ap.fournisseur?.libelle}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal facturation */}
          {showFactModal && detail?.id && (
            <FactureModal
              assuranceId={detail.id}
              initial={factureInitial}
              tarifRef={tarifRef}          // ← ajout
              onClose={() => setShowFactModal(false)}
              onSaved={handleFactureSaved}
            />
          )}
        </div>
      </TabContainer>
    </div>
  );
};

export default PageDetailAssurance;