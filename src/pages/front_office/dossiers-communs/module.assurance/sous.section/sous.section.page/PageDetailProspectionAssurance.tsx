import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceDevisDetail,
  envoyerAssuranceDevis,
  approuverAssuranceDevis,
  createAssuranceEntete,
} from '../../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { AssuranceHeader } from '../../components/AssuranceHeader';
import { Badge, InfoCard, SectionTitle, Spinner,  } from '../../components/atoms';
import { fmtDate, fmtNum } from '../../utils/formatters';
import { ArrowLeft, CheckCircle, Clock, Download, Eye, FileText, Info, Send, ShieldCheck } from 'lucide-react';
import { useAssurancePdf } from '../../../module.pdf/pdf.generation/hooks/usePdfGenerator';

/* ── page ── */
const PageDetailProspectionAssurance = () => {
  const { enteteId } = useParams<{ enteteId: string }>();
  const dispatch     = useDispatch<AppDispatch>();
  const navigate     = useNavigate();
  const location     = useLocation();

  const numeroDos = location.state?.numeroDos ?? '—';
  const { devisDetail, loadingDevis, actioning, actionError, actionSuccess, error } =
    useSelector((s: RootState) => s.assuranceProspection);

    const tabs = [
      { id: 'prospection', label: 'Listes des prospections' },
      { id: 'assurance',        label: 'Listes des assurance' },
    ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  const { generate: generatePdf, preview: previewPdf, loading: pdfLoading } = useAssurancePdf();

  // ── Remplacer handleDevisDirection et handleDevisClient ──────────────
  const handleDevisDirection = () => {
    if (!devisDetail) return;
    generatePdf(devisDetail, 'direction', undefined, `${devis.reference}-direction.pdf`);
  };

  const handleDevisClient = () => {
    if (!devisDetail) return;
    generatePdf(devisDetail, 'client', undefined, `${devis.reference}-client.pdf`);
  };

  useEffect(() => {
    if (enteteId) dispatch(fetchAssuranceDevisDetail(enteteId));
  }, [enteteId, dispatch]);

  const handleEnvoyer = async () => {
    if (!devisDetail) return;
    const res = await dispatch(envoyerAssuranceDevis(devisDetail.devis.id));
    if (envoyerAssuranceDevis.fulfilled.match(res) && enteteId) {
      dispatch(fetchAssuranceDevisDetail(enteteId));
    }
  };

  const handleApprouver = async () => {
    if (!devisDetail) return;
    const res = await dispatch(approuverAssuranceDevis(devisDetail.devis.id));
    if (approuverAssuranceDevis.fulfilled.match(res) && enteteId) {
      dispatch(fetchAssuranceDevisDetail(enteteId));
    }
  };

  const handleCreateEntete = async () => {
    if (!devisDetail) return;
    const res = await dispatch(createAssuranceEntete({
        assuranceProspectionEnteteId: devisDetail.prospectionAssurance.id,
        devisModuleId:                devisDetail.devis.id,
    }));
    if (createAssuranceEntete.fulfilled.match(res) && enteteId) {
        dispatch(fetchAssuranceDevisDetail(enteteId));
    }
  };

  // FONCTION DE NAVIGATION INTERCEPTÉE
  const handleTabChange = (id: string) => {
      if (id === 'assurance') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/assurance/pages`, { 
          state: { targetTab: 'assurance' }
      });
      } else {
      setActiveTab(id);
    }
  };

  // const handleDevisDirection = async () => {
  //   if (!enteteId) return;
  //   const res = await dispatch(genererDevisDirection(enteteId));
  //   if (genererDevisDirection.fulfilled.match(res)) {
  //     const url = `${API_URL}/${res.payload}`;
  //     window.open(url, '_blank');
  //   }
  // };

  // const handleDevisClient = async () => {
  //   if (!enteteId) return;
  //   const res = await dispatch(genererDevisClient(enteteId));
  //   if (genererDevisClient.fulfilled.match(res)) {
  //     const url = `${API_URL}/${res.payload}`;
  //     window.open(url, '_blank');
  //   }
  // };

  /* ── états ── */
  if (loadingDevis) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Spinner/>
        <p className="text-sm">Chargement…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-sm font-medium text-red-500">⚠️ {error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">← Retour</button>
      </div>
    </div>
  );

  if (!devisDetail) return null;

  const { devis, prospectionAssurance, assuranceProspectionLignes, suivi } = devisDetail;

  /* ── logique des boutons selon le statut ── */
  const canEnvoyer  = devis.statut === 'CREER';

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex flex-col h-full bg-slate-50/50">
          {/* ── Header fixe — ne scrolle PAS ── */}
          <div className="shrink-0 px-4 pt-2 bg-slate-200 rounded-t-xl">
            <AssuranceHeader numeroassurance={devis.reference} nomPassager= {''} navigate={navigate} isDetail={true} isProspection={true}/>
          </div>
          {/* ── TOPBAR ACTIONS ── */}
          <div className="bg-slate-200 rounded-b-xl border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="bg-white p-2 hover:text-slate-600 rounded-xl transition-colors text-slate-300">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-black text-slate-900">Détail Prospection</h1>
                  <Badge status={devis.statut} />
                </div>
                <p className="text-xs text-slate-600 font-medium">Réf: <span className=" text-slate-600">{devis.reference}</span> • Dossier: {numeroDos}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Groupe Exports */}
              {/* Groupe Exports — remplace l'existant */}
              <div className="flex bg-slate-300 p-1 rounded-xl gap-1">

                {/* Direction */}
                <button
                  onClick={() => devisDetail && previewPdf(devisDetail, 'direction')}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                    text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                    hover:bg-slate-50 disabled:opacity-50 transition-all"
                  title="Aperçu direction"
                >
                  <Eye size={13} className="text-slate-400" />Direction
                </button>
                <button
                  onClick={handleDevisDirection}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                    text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                    hover:bg-slate-50 disabled:opacity-50 transition-all"
                  title="Télécharger direction"
                >
                  <Download size={14} className="text-slate-400" /> 
                </button>

                <div className="w-px bg-slate-300 mx-0.5" />

                {/* Client */}
                <button
                  onClick={() => devisDetail && previewPdf(devisDetail, 'client')}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                    text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                    hover:bg-slate-50 disabled:opacity-50 transition-all"
                  title="Aperçu client"
                >
                  <Eye size={13} className="text-teal-500" />Client
                </button>
                <button
                  onClick={handleDevisClient}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                    text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                    hover:bg-slate-50 disabled:opacity-50 transition-all"
                  title="Télécharger client"
                >
                  <Download size={14} className="text-teal-500" />
                </button>
              </div>

              <div className="w-px h-8 bg-slate-300 mx-2" />

              {/* Groupe Workflow */}
              <div className="flex items-center gap-2">
                <button 
                  disabled={!canEnvoyer} 
                  onClick={handleEnvoyer}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 disabled:opacity-40 transition-all"
                >
                  <Send size={14} /> Envoyer
                </button>
                <button 
                  disabled={devis.statut !== 'DEVIS_A_APPROUVER'}
                  onClick={handleApprouver}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-40"
                >
                  <CheckCircle size={14} /> Approuver
                </button>
                <button 
                  disabled={devis.statut !== 'DEVIS_APPROUVE'}
                  onClick={handleCreateEntete}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-30 transition-all"
                >
                  <ShieldCheck size={14} /> Créer Assurance
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-2">
              
              {/* ── HEADER KPI ── */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InfoCard>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Général</p>
                  <p className="text-xl font-black text-slate-800">{fmtNum(devis.totalGeneral)} <span className="text-sm font-medium opacity-70">Ar</span></p>
                </InfoCard>
                <InfoCard>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Client Facturé</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{prospectionAssurance.clientFacture}</p>
                </InfoCard>
                <InfoCard>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Fournisseur</p>
                  <p className="text-sm font-bold text-slate-800">{prospectionAssurance.fournisseur.libelle}</p>
                </InfoCard>
                <InfoCard>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Évolution Suivi</p>
                  <Badge status={suivi?.evolution || 'N/A'} />
                </InfoCard>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* ── COLONNE GAUCHE (Tableau) ── */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <SectionTitle icon={FileText} title="Détail des lignes de calcul" badge={assuranceProspectionLignes.length} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-tighter text-slate-400 border-b border-slate-100">
                            <th className="px-4 py-3">Période</th>
                            <th className="px-4 py-3 text-center">Durée</th>
                            <th className="px-4 py-3 bg-indigo-50/30 text-indigo-600">Devis</th>
                            <th className="px-4 py-3 bg-indigo-50/30 text-indigo-600">Prix</th>
                            <th className="px-4 py-3 bg-emerald-50/30 text-emerald-600 text-right">Montants en Ariary (Ar)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {assuranceProspectionLignes.map((ligne) => (
                            <tr key={ligne.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-700">{fmtDate(ligne.dateDepart)}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">au {fmtDate(ligne.dateRetour)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono font-bold text-[10px]">
                                  {ligne.duree}j
                                </span>
                              </td>
                              <td className="text-[9px] font-bold text-slate-400 text-center">
                                 {ligne.assuranceTarifPlein.devise}
                              </td>
                              {/* Colonne Devise */}
                              <td className="px-4 py-3 bg-indigo-50/10">
                                <div className="grid grid-cols-2 gap-x-4 text-[10px]">
                                    <span className="text-slate-400 italic font-medium">Assureur:</span>
                                    <span className="text-right font-bold">{ligne.assuranceTarifPlein.prixAssureurDevise.toLocaleString()}</span>
                                    <span className="text-slate-400 italic font-medium">Commission:</span>
                                    <span className="text-right font-bold text-indigo-600">{ligne.assuranceTarifPlein.commissionDevise.toLocaleString()}</span>
                                    <span className="border-t border-indigo-100 mt-1 pt-1 text-slate-500 font-black italic">Prix Client:</span>
                                    <span className="border-t border-indigo-100 mt-1 pt-1 text-right font-black text-indigo-700">{ligne.assuranceTarifPlein.prixClientDevise.toLocaleString()}</span>
                                </div>
                              </td>
                              {/* Colonne Ariary */}
                              <td className="px-4 py-3 bg-emerald-50/10">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Net: {ligne.assuranceTarifPlein.prixAssureurAriary.toLocaleString()}</span>
                                  <span className="text-[11px] font-black text-emerald-700">{ligne.assuranceTarifPlein.prixClientAriary.toLocaleString()} Ar</span>
                                  <span className="text-[9px] text-emerald-500 font-medium italic">Taux: {fmtNum(ligne.tauxChange)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── COLONNE DROITE (Infos & Suivi) ── */}
                <div className="space-y-6">
                  {/* Carte Suivi Workflow */}
                  <InfoCard>
                    <SectionTitle icon={Clock} title="Suivi Chronologique" />
                    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      <div className="flex items-center gap-4 relative">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${suivi.dateEnvoieDevis ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Send size={12} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 leading-none">Envoi au Client</p>
                          <p className="text-[10px] text-slate-400 mt-1">{suivi.dateEnvoieDevis ? fmtDate(suivi.dateEnvoieDevis) : 'En attente...'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 relative">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${suivi.dateApprobation ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <CheckCircle size={12} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 leading-none">Approbation</p>
                          <p className="text-[10px] text-slate-400 mt-1">{suivi.dateApprobation ? fmtDate(suivi.dateApprobation) : 'Non approuvé'}</p>
                        </div>
                      </div>
                    </div>
                  </InfoCard>

                  {/* Détails Techniques */}
                  <InfoCard>
                    <SectionTitle icon={Info} title="Informations Complémentaires" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-400 font-medium">Référence Interne</span>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{devis.reference}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-400 font-medium">Code Fournisseur</span>
                        <span className="text-xs font-bold text-slate-700 underline decoration-slate-200 underline-offset-4">{prospectionAssurance.fournisseur.code}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-slate-400 font-medium">Date Création</span>
                        <span className="text-xs font-bold text-slate-700">{fmtDate(prospectionAssurance.createdAt)}</span>
                      </div>
                    </div>
                  </InfoCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabContainer>
    </div>
  );
};

export default PageDetailProspectionAssurance;