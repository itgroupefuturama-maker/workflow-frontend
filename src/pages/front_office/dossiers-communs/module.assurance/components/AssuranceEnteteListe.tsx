import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchAssuranceEntetes, type AssuranceLigne } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteSlice';
import { AssuranceHeader } from './AssuranceHeader';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiFile } from 'react-icons/fi';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import AddPassagerAssuranceModal from './AddPassagerAssuranceModal';
import { genererPortailAssurance } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import InfoMessage from '../../../../../components/InfoMessage/InfoMessage';
import { Spinner, Td, Th } from './atoms';
import StatusBadge from '../../module.visa/components/StatusBadge';
import { fmtDate } from '../utils/formatters';

const AssuranceEnteteListe = () => {
  const { entetes, loading, error } = useSelector((s: RootState) => s.assuranceEntete);
  const [, setExpanded] = useState<Record<string, boolean>>({});
  const [, setExpandedLignes] = useState<Record<string, boolean>>({});

  const toggleEntete = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const toggleLigne  = (id: string) => setExpandedLignes(p => ({ ...p, [id]: !p[id] }));
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [genLoading, setGenLoading] = useState<Record<string, boolean>>({});
  const [genDone,    setGenDone]    = useState<Record<string, boolean>>({});

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  const handleGenerer = async (e: React.MouseEvent, assuranceEnteteId: string) => {
    e.stopPropagation();
    setGenLoading(p => ({ ...p, [assuranceEnteteId]: true }));
    try {
      await dispatch(genererPortailAssurance(assuranceEnteteId)).unwrap();
      dispatch(fetchAssuranceEntetes(prestationId));
      setGenDone(p => ({ ...p, [assuranceEnteteId]: true }));
    } catch (err) {
      // tu peux gérer l'erreur ici si besoin
    } finally {
      setGenLoading(p => ({ ...p, [assuranceEnteteId]: false }));
    }
  };

  const [addPassagerModal, setAddPassagerModal] = useState<{
    assuranceEnteteId: string;
    lignes: AssuranceLigne[];
  } | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Spinner /> <span className="text-sm">Chargement…</span>
    </div>
  );

  if (error) return <InfoMessage title={error} icon="info" />;

  if (entetes.length === 0) return (
    <InfoMessage title="Aucune assurance trouvée." icon="empty" />
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Colonne principale ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* ── Header fixe — ne scrolle PAS ── */}
        <div className="shrink-0 px-4 py-2 bg-slate-200 rounded-t-xl">
          <AssuranceHeader
            numeroassurance={''}
            nomPassager={''}
            navigate={navigate}
            isDetail={false}
            isProspection={false}
            isDevis={false}
            />
        </div>

        <div className='px-4 bg-slate-200 rounded-b-xl'>
          <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />
          <div className="flex items-center justify-between">
            {/* Tab headers */}
            <div className="flex items-center justify-between">
              {/* Bouton + formulaire création */}
              <div className="flex items-center justify-between">
                <nav className="flex rounded-lg mb-2 gap-1" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTabSousSection('lignes')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                      activeTabSousSection === 'lignes'
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 bg-slate-300'
                    }`}
                  >
                    Liste des assurances
                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeTabSousSection === 'lignes' ? 'bg-slate-100 text-slate-600' : 'bg-slate-400 text-slate-100'
                    }`}>
                      {entetes.length}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTabSousSection('suivi')}
                    className={`px-10 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                      activeTabSousSection === 'suivi'
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 bg-slate-300'
                    }`}
                  >
                    Suivi
                  </button>
                </nav>
              </div>
            </div>

            <button
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
            >
              <svg
                width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                className={`transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          {activeTabSousSection === 'lignes' && (
            <div className="space-y-4 overflow-hidden">
              {[...entetes]
                .sort((a, b) => {
                  const dateA = new Date(a.createdAt).getTime();
                  const dateB = new Date(b.createdAt).getTime();
                  return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                })
                .map((entete) => (
                <div key={entete.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">

                  {/* ── Header entete ── */}
                  <div
                    className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => toggleEntete(entete.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                        <FiFile/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {entete.assuranceProspectionEntete.fournisseur.libelle}
                          {' · '}
                          {entete.assuranceProspectionEntete.fournisseur.code}
                        </p>
                        <p className="text-xs text-gray-400">
                          {entete.assuranceProspectionEntete.prestation.numeroDos}
                        </p>
                      </div>
                      {/* <StatusBadge status={entete.statut} /> */}
                      <StatusBadge status={entete.statutEntete == 'CREER' ? 'créé' : entete.statutEntete == 'ASSIGNER' ? 'assigné' : entete.statutEntete == 'ENVOYE' ? 'envoyé' : entete.statutEntete == 'APPROUVE' ? 'approuvé' : entete.statutEntete == 'INACTIF' ? 'inactif' : entete.statutEntete} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                        {entete.assurance.length} ligne{entete.assurance.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(entete.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                      disabled = {entete.statutEntete === 'ASSIGNER'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddPassagerModal({
                            assuranceEnteteId: entete.id,
                            lignes: entete.assurance,
                          });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Ajouter passager
                      </button>

                      <button
                        disabled = {genLoading[entete.id] || entete.statutEntete === 'ASSIGNER'}
                        onClick={(e) => handleGenerer(e, entete.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-sm"
                      >
                        {genLoading[entete.id] ? (
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : genDone[entete.id] ? '✓' : '⚡'}
                        {genLoading[entete.id] ? 'Génération…' : genDone[entete.id] ? 'Généré' : 'Générer portail'}
                      </button>
                    </div>
                  </div>

                  {/* ── Lignes assurance ── */}
                  {/* {expanded[entete.id] && ( */}
                    <div className="divide-y divide-gray-50">
                      {entete.assurance.length === 0 ? (
                        <p className="text-sm text-gray-400 italic px-5 py-4">Aucune ligne assurance.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <Th>Zone · Fournisseur</Th>
                              <Th>Période</Th>
                              <Th>Durée</Th>
                              <Th>Tarif (Devise)</Th>
                              <Th>Tarif (Ariary)</Th>
                              <Th>Taux change</Th>
                              <Th>Statut ligne</Th>
                              <Th>N° police</Th>
                              <Th></Th>
                            </tr>
                          </thead>
                          <tbody>
                            {entete.assurance.map((ligne) => {
                              const tarif = ligne.assuranceProspectionLigne?.assuranceTarifPlein;
                              const devise = tarif?.devise ?? '—';
                              const tauxChange = ligne.assuranceProspectionLigne?.tauxChange;

                              return (
                                <React.Fragment key={ligne.id}>
                                  <tr
                                    className="hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => toggleLigne(ligne.id)}
                                  >
                                    <Td>
                                      <div>
                                        <p className="font-medium text-gray-800">
                                          {ligne.assuranceProspectionLigne?.assuranceParams?.zoneDestination ?? '—'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {entete.assuranceProspectionEntete.fournisseur.libelle}
                                        </p>
                                      </div>
                                    </Td>

                                    <Td>
                                      <span className="text-xs">
                                        {fmtDate(ligne.assuranceProspectionLigne?.dateDepart)}
                                        {' → '}
                                        {fmtDate(ligne.assuranceProspectionLigne?.dateRetour)}
                                      </span>
                                    </Td>

                                    <Td>
                                      <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                                        {ligne.assuranceProspectionLigne?.duree ?? '—'} j
                                      </span>
                                    </Td>

                                    {/* ── Prix en devise ── */}
                                    <Td>
                                      {tarif ? (
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between gap-2">
                                            <span className="text-gray-400">Assureur</span>
                                            <span className="font-semibold text-gray-700">
                                              {tarif.prixAssureurDevise.toLocaleString()} {devise}
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-2">
                                            <span className="text-gray-400">Commission</span>
                                            <span className="font-semibold text-amber-600">
                                              {tarif.commissionDevise.toLocaleString()} {devise}
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-2 border-t border-gray-100 pt-0.5">
                                            <span className="text-gray-400">Client</span>
                                            <span className="font-bold text-indigo-600">
                                              {tarif.prixClientDevise.toLocaleString()} {devise}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </Td>

                                    {/* ── Prix en Ariary ── */}
                                    <Td>
                                      {tarif ? (
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between gap-2">
                                            <span className="text-gray-400">Assureur</span>
                                            <span className="font-semibold text-gray-700">
                                              {tarif.prixAssureurAriary.toLocaleString()} Ar
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-2">
                                            <span className="text-gray-400">Commission</span>
                                            <span className="font-semibold text-amber-600">
                                              {tarif.commissionAriary.toLocaleString()} Ar
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-2 border-t border-gray-100 pt-0.5">
                                            <span className="text-gray-400">Client</span>
                                            <span className="font-bold text-indigo-600">
                                              {tarif.prixClientAriary.toLocaleString()} Ar
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </Td>

                                    {/* ── Taux de change ── */}
                                    <Td>
                                      {tauxChange ? (
                                        <div className="text-center">
                                          <span className="font-mono bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">
                                            1 {devise} = {tauxChange.toLocaleString()} Ar
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </Td>

                                    <Td><StatusBadge status={ligne.statusLigne} /></Td>

                                    <Td className="text-gray-400 text-xs">{ligne.numeroPolice ?? '—'}</Td>

                                    <Td>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/dossiers-communs/assurance/detailsAssurance/${ligne.id}`, {
                                            state: {
                                              numeroDos: entete.assuranceProspectionEntete.prestation.numeroDos,
                                              fournisseur: entete.assuranceProspectionEntete.fournisseur.libelle,
                                            }
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition"
                                      >
                                        Détail <FiArrowRight />
                                      </button>
                                    </Td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  {/* )} */}
                </div>
              ))}
            </div>
          )}

          {/* ── Onglet Suivi ── */}
          {activeTabSousSection === 'suivi' && (
            <SuiviTabSection
              prestationId={prestationId}
              moduleName="assurance"
            />
          )}
        </div>
        
        {addPassagerModal && (
          <AddPassagerAssuranceModal
            assuranceEnteteId={addPassagerModal.assuranceEnteteId}
            lignes={addPassagerModal.lignes}
            onClose={() => setAddPassagerModal(null)}
            onSuccess={() => {
              // re-fetch ta liste si nécessaire
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AssuranceEnteteListe;