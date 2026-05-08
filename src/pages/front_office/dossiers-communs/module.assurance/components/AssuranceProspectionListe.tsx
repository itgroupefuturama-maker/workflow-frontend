import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  type AssuranceProspectionEntete,
  clearCreateError,
} from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import { useNavigate } from 'react-router-dom';
import { AssuranceHeader } from './AssuranceHeader';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import InfoMessage from '../../../../../components/InfoMessage/InfoMessage';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import ModalCreationProspection from '../modals/ModalCreationProspection';
import ModalCreationDevis, { type DevisModalData } from '../modals/ModalCreationDevis';
import ModalAjoutLigne, { type LigneModalData } from '../modals/ModalAjoutLigne';
import { fmtDate } from '../utils/formatters';
import { Badge, Spinner, Td, Th } from './atoms';
import { ArrowRight, ChevronDown, ClipboardCheck, FileText, Layers, Plus } from 'lucide-react';


/* ── composant principal ── */
const AssuranceProspectionListe = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list, loading, error } = useSelector((s: RootState) => s.assuranceProspection);

  const dossierActif = useSelector((s: RootState) => s.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

  console.log(`le prestation id est :`, prestationId);

  const [expanded,             setExpanded]             = useState<Record<string, boolean>>({});
  const [openCreate,           setOpenCreate]           = useState(false);
  const [sortOrder,            setSortOrder]            = useState<'desc' | 'asc'>('desc');
  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');
  const [ligneModal,           setLigneModal]           = useState<LigneModalData | null>(null);
  const [devisModal,           setDevisModal]           = useState<DevisModalData | null>(null);

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleOpenDevis = (entete: AssuranceProspectionEntete) => {
    const lignes = entete.assuranceProspectionLigne ?? [];
    setDevisModal({ enteteId: entete.id, numeroDos: entete.prestation.numeroDos, lignes });
  };

  if (loading) return <div className="flex justify-center items-center py-16"><Spinner/></div>;
  if (error)   return <InfoMessage title={error} icon="info" />;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Colonne principale ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
          <div className="flex items-center justify-between">
            <AssuranceHeader numeroassurance={prestationId} nomPassager={''} navigate={navigate} isDetail={false} isProspection={true} isDevis={false} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={`transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
              </button>
              <button
                onClick={() => setOpenCreate(true)}
                disabled={!prestationId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition shadow-sm"
              >
                + Nouvelle prospection
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs sous-section ── */}
        <div className="px-4 border-b border-neutral-50 bg-slate-200 rounded-b-xl">
          <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />
          <nav className="flex p-1 rounded-lg mb-2">
            {[{ id: 'lignes', label: 'Prospections assurance', count: list.length }, { id: 'suivi', label: 'Suivi' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabSousSection(tab.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                  activeTabSousSection === tab.id
                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTabSousSection === tab.id ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Contenu ── */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {activeTabSousSection === 'lignes' && (
            <div className="bg-white space-y-4">
              {list.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl px-5 py-12 text-center">
                  <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3 text-slate-400">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Aucune prospection enregistrée pour le moment.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-300">
                        <Th className="w-10"></Th>
                        <Th>Dossier & Fournisseur</Th>
                        <Th>Contenu</Th>
                        <Th>Statut</Th>
                        <Th>Date</Th>
                        <Th className="text-right pr-6">Actions</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {[...list]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(entete => {
                          const isExpanded = expanded[entete.id];
                          const hasLines = entete.assuranceProspectionLigne?.length > 0;

                          return (
                            <React.Fragment key={entete.id}>
                              <tr 
                                className={`group hover:bg-slate-50/80 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50/20' : ''}`}
                                onClick={() => toggle(entete.id)}
                              >
                                <Td>
                                  <ChevronDown 
                                    size={16} 
                                    className={`text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} 
                                  />
                                </Td>
                                <Td>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 leading-tight">{entete.prestation.numeroDos}</span>
                                    <span className="text-[11px] text-slate-500 font-medium">{entete.fournisseur.libelle}</span>
                                  </div>
                                </Td>
                                <Td>
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full">
                                    <div className={`w-1 h-1 rounded-full ${hasLines ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">
                                      {entete.assuranceProspectionLigne?.length ?? 0} Ligne(s)
                                    </span>
                                  </div>
                                </Td>
                                <Td><Badge status={entete.prestation.status === 'CREER' ? 'créé' : entete.prestation.status} /></Td>
                                <Td className="text-[11px] font-medium text-slate-400 uppercase">{fmtDate(entete.createdAt)}</Td>
                                
                                {/* ACTIONS COLONNE */}
                                <Td className="pr-6">
                                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                    
                                    {/* 1. Bouton Action Métier : Devis (Plus visible car c'est l'objectif) */}
                                    <button
                                      onClick={() => { dispatch(clearCreateError()); handleOpenDevis(entete); }}
                                      disabled={!hasLines}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm shadow-amber-100"
                                    >
                                      <ClipboardCheck size={13} />
                                      Devis
                                    </button>

                                    {/* 2. Bouton Ajout Ligne (Style discret/secondaire) */}
                                    <button
                                      onClick={() => { dispatch(clearCreateError()); setLigneModal({ enteteId: entete.id, numeroDos: entete.prestation.numeroDos, fournisseurId: entete.fournisseur.id }); }}
                                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 rounded-lg transition-colors shadow-xs"
                                      title="Ajouter une ligne"
                                    >
                                      <Plus size={16} strokeWidth={3} />
                                    </button>

                                    <div className="w-px h-4 bg-slate-200 mx-1" />

                                    {/* 3. Bouton Navigation (Style Icon-only ou Ghost) */}
                                    <button
                                      onClick={() => navigate(`/dossiers-communs/assurance/detailsProspection/${entete.id}`, { state: { numeroDos: entete.prestation.numeroDos } })}
                                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                      title="Voir les détails"
                                    >
                                      <ArrowRight size={18} />
                                    </button>
                                  </div>
                                </Td>
                              </tr>

                              {/* DÉTAILS DES LIGNES (EXPANDED) */}
                              {isExpanded && (
                                <tr className="bg-slate-50/50">
                                  <td colSpan={7} className="border-b border-slate-100">

                                    {!hasLines ? (
                                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                                        <p className="text-xs text-slate-400 italic">Aucune donnée. Utilisez le bouton <span className="font-bold text-slate-600">+</span> pour ajouter une ligne de calcul.</p>
                                      </div>
                                    ) : (
                                      <div className="overflow-hidden border-t border-slate-200">
                                        <table className="w-full text-[11px] tabular-nums">
                                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                            <tr>
                                              <th className="px-3 py-2">Zone</th>
                                              <th className="px-3 py-2">Période</th>
                                              <th className="px-3 py-2 text-center">Durée</th>
                                              <th className="px-3 py-2 text-right">Taux Change</th>
                                              <th className="px-3 py-2 text-right">Borne Jours</th>
                                              <th className="px-3 py-2 text-right">Devis</th>
                                              <th className="px-3 py-2 text-right">Prix Assureur Devise</th>
                                              <th className="px-3 py-2 text-right">Prix Assureur Ariary</th>
                                              <th className="px-3 py-2 text-right">Commission Devise</th>
                                              <th className="px-3 py-2 text-right">Commission Ariary</th>
                                              <th className="px-3 py-2 text-right">Prix Client Devise</th>
                                              <th className="px-3 py-2 text-right">Prix Client Ariary</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-50">
                                            {entete.assuranceProspectionLigne.map(ligne => (
                                              <tr key={ligne.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-3 py-2 font-bold text-slate-700">
                                                  {ligne.assuranceParams?.zoneDestination ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-slate-500">
                                                  {fmtDate(ligne.dateDepart)} — {fmtDate(ligne.dateRetour)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                                                    {ligne.duree ?? '—'}jours
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium text-slate-600">
                                                  {ligne.tauxChange?.toLocaleString() ?? '—'} Ar
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-indigo-500 font-bold uppercase">
                                                  {ligne.assuranceTarifPlein?.borneInf ?? '—'} à {ligne.assuranceTarifPlein?.borneSup ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.devise ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.prixAssureurDevise?.toLocaleString() ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.prixAssureurAriary?.toLocaleString() ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.commissionDevise?.toLocaleString() ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.commissionAriary?.toLocaleString() ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.prixClientDevise?.toLocaleString() ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400">
                                                  {ligne.assuranceTarifPlein?.prixClientAriary?.toLocaleString() ?? '—'}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTabSousSection === 'suivi' && <SuiviTabSection prestationId={prestationId} />}
        </div>

        {/* ── Modals ── */}
        {openCreate  && <ModalCreationProspection prestationId={prestationId} onClose={() => setOpenCreate(false)} />}
        {devisModal  && <ModalCreationDevis data={devisModal} prestationId={prestationId} onClose={() => setDevisModal(null)} />}
        {ligneModal  && <ModalAjoutLigne    data={ligneModal} prestationId={prestationId} onClose={() => setLigneModal(null)} />}

      </div>
    </div>
  );
};

export default AssuranceProspectionListe;