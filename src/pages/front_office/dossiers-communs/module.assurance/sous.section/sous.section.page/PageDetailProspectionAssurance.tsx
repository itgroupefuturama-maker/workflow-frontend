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
import { Badge } from '../../components/atoms';
import PageSkeleton from '../../../../../../components/ui/PageSkeleton';
import { fmtDate, fmtNum } from '../../utils/formatters';
import { ArrowLeft, CheckCircle, Clock, Download, Eye, FileText, Info, Send, ShieldCheck } from 'lucide-react';
import { useAssurancePdf } from '../../../module.pdf/pdf.generation/hooks/usePdfGenerator';
import { useAuthorization } from '../../../../../../hooks/useAuthorization';

const MODULE = 'assurance';

const PageDetailProspectionAssurance = () => {
  const { enteteId } = useParams<{ enteteId: string }>();
  const dispatch     = useDispatch<AppDispatch>();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { canManage } = useAuthorization();
  const canManageAssurance = canManage(MODULE);

  const numeroDos = location.state?.numeroDos ?? '—';
  const { devisDetail, loadingDevis, actionError, actionSuccess, error } =
    useSelector((s: RootState) => s.assuranceProspection);

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'assurance',   label: 'Listes des assurance' },
  ];
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  const { generate: generatePdf, preview: previewPdf, loading: pdfLoading } = useAssurancePdf();

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
    if (envoyerAssuranceDevis.fulfilled.match(res) && enteteId)
      dispatch(fetchAssuranceDevisDetail(enteteId));
  };

  const handleApprouver = async () => {
    if (!devisDetail) return;
    const res = await dispatch(approuverAssuranceDevis(devisDetail.devis.id));
    if (approuverAssuranceDevis.fulfilled.match(res) && enteteId)
      dispatch(fetchAssuranceDevisDetail(enteteId));
  };

  const handleCreateEntete = async () => {
    if (!devisDetail) return;
    const res = await dispatch(createAssuranceEntete({
      assuranceProspectionEnteteId: devisDetail.prospectionAssurance.id,
      devisModuleId: devisDetail.devis.id,
    }));
    if (createAssuranceEntete.fulfilled.match(res) && enteteId)
      dispatch(fetchAssuranceDevisDetail(enteteId));
  };

  const handleTabChange = (id: string) => {
    if (id === 'assurance') {
      navigate(`/dossiers-communs/assurance/pages`, { state: { targetTab: 'assurance' } });
    } else {
      setActiveTab(id);
    }
  };

  if (loadingDevis) return <PageSkeleton />;

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
  const canEnvoyer = devis.statut === 'CREER';

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex flex-col h-full min-h-0">

          {/* ── Header fixe ── */}
          <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
            <AssuranceHeader
              numeroassurance={devis.reference}
              nomPassager=""
              navigate={navigate}
              isDetail={true}
              isProspection={true}
            />
          </div>

          {/* ── Topbar actions ── */}
          <div className="shrink-0 bg-slate-200 rounded-b-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white hover:bg-gray-100 text-slate-500 rounded-xl transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="font-black text-slate-900 text-base">Détail Prospection</h1>
                  <Badge status={devis.statut} />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Réf : <span className="text-slate-700 font-bold">{devis.reference}</span>
                  {' '}• Dossier : <span className="text-slate-700 font-bold">{numeroDos}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Exports PDF */}
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
                <button
                  onClick={() => devisDetail && previewPdf(devisDetail, 'direction')}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition"
                >
                  <Eye size={12} className="text-slate-400" /> Aperçu Direction
                </button>
                <button
                  onClick={handleDevisDirection}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition"
                  title="Télécharger direction"
                >
                  <Download size={12} className="text-slate-400" />
                </button>
                <div className="w-px bg-slate-200 mx-0.5" />
                <button
                  onClick={() => devisDetail && previewPdf(devisDetail, 'client')}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition"
                >
                  <Eye size={12} className="text-teal-500" /> Aperçu Client
                </button>
                <button
                  onClick={handleDevisClient}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition"
                  title="Télécharger client"
                >
                  <Download size={12} className="text-teal-500" />
                </button>
              </div>

              <div className="w-px h-7 bg-slate-300" />

              {/* Workflow */}
              <button
                disabled={!canEnvoyer || !canManageAssurance}
                onClick={handleEnvoyer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-40 transition"
              >
                <Send size={13} /> Envoyer
              </button>
              <button
                disabled={devis.statut !== 'DEVIS_A_APPROUVER' || !canManageAssurance}
                onClick={handleApprouver}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-40 transition"
              >
                <CheckCircle size={13} /> Approuver
              </button>
              <button
                disabled={devis.statut !== 'DEVIS_APPROUVE' || !canManageAssurance}
                onClick={handleCreateEntete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-30 transition"
              >
                <ShieldCheck size={13} /> Créer Assurance
              </button>
            </div>
          </div>

          {/* ── Contenu scrollable ── */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4">

            {/* Feedbacks */}
            {actionSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2.5">
                ✓ {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
                ⚠️ {actionError}
              </div>
            )}

            {/* ══════════════════════════════════
                TABLEAU — Résumé du devis
            ══════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th colSpan={4} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Info size={12} /> Résumé du devis
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Référence</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Client facturé</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Fournisseur</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Total général</th>
                  </tr>
                </thead>
                <thead>
                  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {devis.reference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {prospectionAssurance.clientFacture}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-800">{prospectionAssurance.fournisseur.libelle}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{prospectionAssurance.fournisseur.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg font-mono">
                        {fmtNum(devis.totalGeneral)} Ar
                      </span>
                    </td>
                  </tr>

                  {/* ─── Sous-section : Infos complémentaires ─── */}
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Info size={10} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Informations complémentaires</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Statut</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Évolution suivi</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Date création</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Dossier</th>
                  </tr>
                  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Badge status={devis.statut} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Badge status={suivi?.evolution || 'N/A'} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                      {fmtDate(prospectionAssurance.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {numeroDos}
                    </td>
                  </tr>

                  {/* ─── Sous-section : Suivi chronologique ─── */}
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Suivi chronologique</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Envoi au client</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Approbation</th>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5" colSpan={2}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          suivi?.dateEnvoieDevis ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Send size={10} />
                        </div>
                        <span className="text-xs text-gray-700">
                          {suivi?.dateEnvoieDevis ? fmtDate(suivi.dateEnvoieDevis) : 'En attente…'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5" colSpan={2}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          suivi?.dateApprobation ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <CheckCircle size={10} />
                        </div>
                        <span className="text-xs text-gray-700">
                          {suivi?.dateApprobation ? fmtDate(suivi.dateApprobation) : 'Non approuvé'}
                        </span>
                      </div>
                    </td>
                  </tr>
                </thead>
              </table>
            </div>

            {/* ══════════════════════════════════
                TABLEAU — Lignes de calcul
            ══════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th colSpan={7} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FileText size={12} />
                        Détail des lignes de calcul
                        <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {assuranceProspectionLignes.length}
                        </span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Période</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Durée</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Devise</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Prix assureur (dev.)</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Commission (dev.)</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Prix client (dev.)</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Prix client (Ar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assuranceProspectionLignes.map((ligne, idx) => (
                    <>
                      <tr key={ligne.id} className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-700">{fmtDate(ligne.dateDepart)}</p>
                          <p className="text-[10px] text-slate-400">au {fmtDate(ligne.dateRetour)}</p>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-mono font-bold text-[10px]">
                            {ligne.duree}j
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {ligne.assuranceTarifPlein.devise}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-600">
                            {ligne.assuranceTarifPlein.prixAssureurDevise.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-xs font-mono text-indigo-600 font-semibold">
                            {ligne.assuranceTarifPlein.commissionDevise.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-indigo-700">
                            {ligne.assuranceTarifPlein.prixClientDevise.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            {ligne.assuranceTarifPlein.prixClientAriary.toLocaleString()} Ar
                          </span>
                        </td>
                      </tr>

                      {/* ─── Sous-ligne : détail Ariary ─── */}
                      <tr key={`${ligne.id}-ar`} className="bg-slate-100 border-b border-slate-200">
                        <td colSpan={3} className="px-4 py-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Détail Ariary</span>
                        </td>
                        <td className="px-4 py-1.5 text-right" colSpan={2}>
                          <span className="text-[10px] text-slate-400">Net assureur : </span>
                          <span className="text-[10px] font-bold text-slate-600 font-mono">
                            {ligne.assuranceTarifPlein.prixAssureurAriary.toLocaleString()} Ar
                          </span>
                        </td>
                        <td className="px-4 py-1.5 text-right" colSpan={2}>
                          <span className="text-[10px] text-slate-400">Taux : </span>
                          <span className="text-[10px] font-bold text-slate-600 font-mono">
                            {fmtNum(ligne.tauxChange)}
                          </span>
                        </td>
                      </tr>
                    </>
                  ))}

                  {/* ─── Total général ─── */}
                  <tr className="bg-slate-700">
                    <td colSpan={6} className="px-4 py-3 text-[11px] font-black text-white uppercase tracking-wider">
                      Total Général
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-black text-emerald-300 font-mono">
                        {fmtNum(devis.totalGeneral)} Ar
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </TabContainer>
    </div>
  );
};

export default PageDetailProspectionAssurance;