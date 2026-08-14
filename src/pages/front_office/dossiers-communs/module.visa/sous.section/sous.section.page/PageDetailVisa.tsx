import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import {
  clearVisaEnteteDetail,
  fetchVisaEnteteDetail,
  generateAccesPortail,
  payVisa,
} from '../../../../../../app/front_office/parametre_visa/visaEnteteDetailSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import StatusBadge from '../../components/StatusBadge';
import CreateAccesPortailModal from '../../components/CreateAccesPortailModal';
// import PassagerDetailModal from '../../components/PassagerDetailModal';
import { API_URL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import { VisaHeader } from '../../components/VisaHeader';
import SubmitVisaLigneModal from '../../components/SubmitVisaLigneModal';
import SendVisaModal from '../../components/SendVisaModal';
import DecisionVisaModal from '../../components/DecisionVisaModal';
import type { Visa } from '../../../../../../app/front_office/parametre_visa/visaEnteteSlice';
import SuiviTabSection from '../../../module.suivi/SuiviTabSection';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtNum = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('fr-FR') : '—';

// ── Row redesigné ──────────────────────────────────────────────────────────

const Row = ({
  label,
  value,
  accent = false,
  color,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  color?: { bg: string; bgLight: string; text: string; border: string };
}) => (
  <div className="flex items-center gap-2 justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest shrink-0">
      {label}
    </span>
    <span
      className="text-[13px] font-medium text-right"
      style={accent && color ? { color: color.text } : { color: '#1e293b' }}
    >
      {value ?? '—'}
    </span>
  </div>
);

const EmptyMsg = ({ msg }: { msg: string }) => (
  <p className="text-xs text-gray-400 italic py-2">{msg}</p>
);

// ── Page ───────────────────────────────────────────────────────────────────

const PageDetailVisa = () => {
  const { visaEnteteId } = useParams<{ visaEnteteId: string }>();
  const dispatch         = useDispatch<AppDispatch>();
  const navigate         = useNavigate();
  const location         = useLocation();

  const { detail, loading, error } = useSelector((s: RootState) => s.visaEnteteDetail);

  const clientFactureId = useSelector(
    (s: RootState) => s.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  // On extrait l'id de la prestation attestation
  const prestationId = dossierActif?.dossierCommunColab
    ?.find(colab => colab.module?.nom?.toLowerCase() === "attestation")
    ?.prestation?.[0]?.id || '';

  const [showAccesPortail, setShowAccesPortail] = useState(false);
  const [generateLoading,  setGenerateLoading]  = useState(false);
  const [generateError,    setGenerateError]    = useState('');
  const [generateSuccess,  setGenerateSuccess]  = useState('');

  const [sendModal, setSendModal] = useState<{ visaId: string; visaEnteteId: string } | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ visaId: string; visaEnteteId: string } | null>(null);
  const [payLoading,        setPayLoading]        = useState(false);
  const [payError,          setPayError]          = useState('');
  const [paySuccess,        setPaySuccess]        = useState('');

  // Change le state pour stocker aussi les données de la ligne
  const [submitModal, setSubmitModal] = useState<{
    ligneId:          string;
    puConsulatDevise: number;
    puClientAriary:   number;   // ← prix de vente fixe
    tauxEchange:      number;   // ← pré-rempli
    devise:           string;
  } | null>(null);

  const tabs = [
      { id: 'prospection', label: 'Listes des prospections' },
      { id: 'visa',        label: 'Listes des visa' },
  ];

  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'visa');

  // Lignes dépliées (accordéon)
  const [expandedLignes, setExpandedLignes] = useState<Set<string>>(new Set());
  const toggleLigne = (id: string) =>
    setExpandedLignes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [dispatch, clientFactureId]);

  useEffect(() => {
    console.log(`visa id ${visaEnteteId}`);
    if (visaEnteteId) dispatch(fetchVisaEnteteDetail(visaEnteteId));
    return () => { dispatch(clearVisaEnteteDetail()); };
  }, [visaEnteteId, dispatch]);

  const handleGenerate = async () => {
    if (!detail) return;
    setGenerateLoading(true);
    setGenerateError('');
    setGenerateSuccess('');
    try {
      await dispatch(generateAccesPortail(detail.id)).unwrap();
      setGenerateSuccess('Accès portail généré avec succès.');
      dispatch(fetchVisaEnteteDetail(detail.id)); // re-fetch pour afficher les nouveaux logins
    } catch (e: any) {
      setGenerateError(e ?? "Erreur lors de la génération.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleTabChange = (id: string) => {
      if (id === 'prospection') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/visa/pages`, { 
          state: { targetTab: 'prospection' }
      });
      } else {
      setActiveTab(id);
      }
  };

  const handlePay = async (id: string) => {
    if (!detail) return;
    setPayLoading(true);
    setPayError('');
    setPaySuccess('');
    try {
      await dispatch(payVisa(id)).unwrap();
      setPaySuccess('Paiement enregistré avec succès.');
      
      
      dispatch(fetchVisaEnteteDetail(detail.id));
    } catch (e: any) {
      setPayError(e ?? 'Erreur lors du paiement.');
    } finally {
      setPayLoading(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-red-500 font-medium">⚠️ {error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">← Retour</button>
      </div>
    </div>
  );

  // if (!detail) return null;

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  );

  const prestation     = detail?.visaProspectionEntete.prestation;
  const consulat       = detail?.visaProspectionEntete.consulat;  // ← ajouter

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* ── Header fixe — ne scrolle PAS ── */}
            <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
              <VisaHeader
                numerovisa={detail?.visaProspectionEntete?.prestation?.numeroDos ?? '...'}
                nomPassager=""
                navigate={navigate}
                isDetail={true}
              />
            </div>

            {/* ── Topbar — toujours visible ── */}
            <div className=" p-2 space-y-3 bg-slate-200 rounded-b-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">

                {/* Gauche */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/dossiers-communs/visa/pages', { state: { targetTab: 'visa' } })}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                  >←</button>
                  <div>
                    {loading ? (
                      <>
                        <Skeleton className="h-7 w-40 mb-1" />
                        <Skeleton className="h-4 w-56" />
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-gray-800">Détail Visa</h1>
                        <p className="text-sm text-gray-400">
                          {detail?.visaProspectionEntete?.prestation?.numeroDos} — créé le {fmtDate(detail?.createdAt ?? null)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Droite : actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {loading ? (
                    <>
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-36" />
                    </>
                  ) : detail ? (
                    <>
                      <button
                        onClick={() => setShowAccesPortail(true)}
                        disabled={detail.visaLigne.length === 0 || detail.statutEntete === 'ASSIGNER'}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${
                          detail.visaLigne.length === 0 || detail.statutEntete === 'ASSIGNER'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        }`}
                      >
                        <span className={detail.visaLigne.length === 0 || detail.statutEntete === 'ASSIGNER' ? 'grayscale opacity-50' : ''}>🔐</span>
                        Accès portail
                      </button>

                      <button
                        onClick={handleGenerate}
                        disabled={generateLoading || detail.visaLigne.length === 0 || detail.statutEntete === 'ASSIGNER'}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${
                          generateLoading || detail.visaLigne.length === 0 || detail.statutEntete === 'ASSIGNER'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
                        }`}
                      >
                        {generateLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Génération...
                          </>
                        ) : (
                          <>
                            <span className={detail.visaLigne.length === 0 || detail.statutEntete === 'ASSIGNER' ? 'grayscale opacity-50' : ''}>⚡</span>
                            Générer portail
                          </>
                        )}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Bouton + formulaire création */}
              <div className="flex items-center justify-between">
                <nav className="flex gap-2 ml-3" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTabSousSection('lignes')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 ${
                      activeTabSousSection === 'lignes'
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 bg-slate-300'
                    }`}
                  >
                    Liste des visa
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

              {generateSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">✓ {generateSuccess}</div>
              )}
              {generateError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">⚠️ {generateError}</div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-2">
              {activeTabSousSection === 'lignes' && (
                <div className="px-2">
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : detail?.visaLigne?.length === 0 ? (
                    <EmptyMsg msg="Aucune ligne visa" />
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-700 text-white">
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">#</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Référence</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Pays / Type</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Séjour</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Consulat</th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Prix consulat</th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Sous-total</th>
                            <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Passagers</th>
                            <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Soumission</th>
                            <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detail?.visaLigne.map((ligne, idx) => {
                            const vp      = ligne.visaProspectionLigne;
                            const vParams = vp.visaParams;
                            const sousTotal = vp.puClientAriary * vp.nombre;
                            const passagers = ligne.passagers ?? [];
                            const visa      = ligne.visa ?? [];

                            const tousPassagersOntVisa =
                              passagers.length > 0 &&
                              passagers.every(p => visa.some((v: Visa) => v.passagerAbstractId === p.id));

                            const dejaSoumis = ligne.soummissionPuConsilatAriary !== null;

                            return (
                              <>
                                {/* ── Ligne principale ── */}
                                <tr
                                  key={ligne.id}
                                  className={`transition-colors hover:bg-slate-50 cursor-pointer ${
                                    expandedLignes.has(ligne.id) ? 'bg-indigo-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                  }`}
                                  onClick={() => toggleLigne(ligne.id)}
                                >
                                  {/* # */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                      #{idx + 1}
                                    </span>
                                  </td>

                                  {/* Référence */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                      {ligne.referenceLine}
                                    </span>
                                  </td>

                                  {/* Pays / Type */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-sm font-semibold text-gray-800">{vParams.pays.pays}</p>
                                    <p className="text-[10px] text-gray-400">{vParams.code} — {vParams.visaType.nom}</p>
                                  </td>

                                  {/* Séjour */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-xs text-gray-700 font-medium">
                                      {fmtDate(vp.dateDepart)} → {fmtDate(vp.dateRetour)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {vParams.visaDuree.duree}j · {vParams.visaEntree.entree} · {vp.nombre} pers.
                                    </p>
                                  </td>

                                  {/* Consulat */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-xs font-medium text-gray-700 capitalize">{consulat?.nom ?? '—'}</p>
                                    <p className="text-[10px] text-gray-400">{fmtNum(vp.puConsulatDevise)} {vp.devise}</p>
                                  </td>

                                  {/* Prix consulat Ar */}
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <span className="text-xs font-mono text-gray-600">{fmtNum(vp.puConsulatAriary)} Ar</span>
                                  </td>

                                  {/* Sous-total */}
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg font-mono">
                                      {sousTotal.toLocaleString('fr-FR')} Ar
                                    </span>
                                  </td>

                                  {/* Passagers */}
                                  <td className="px-4 py-3 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        tousPassagersOntVisa
                                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                          : passagers.length === 0
                                            ? 'text-amber-600 bg-amber-50 border border-amber-200'
                                            : 'text-orange-600 bg-orange-50 border border-orange-200'
                                      }`}>
                                        {passagers.length} / {vp.nombre}
                                      </span>
                                      {passagers.length > 0 && (
                                        <div className="flex flex-col gap-1 mt-1 w-full">
                                          {passagers.map((passager) => {
                                            const visaPassager = visa.find((v: Visa) => v.passagerAbstractId === passager.id);
                                            return (
                                              <div key={passager.id} className="flex items-center justify-between gap-2 text-[10px] bg-white border border-gray-100 rounded-lg px-2 py-1">
                                                <span className="text-gray-600 font-medium truncate max-w-[80px]">
                                                  {passager.clientbeneficiaire.libelle}
                                                </span>
                                                {visaPassager
                                                  ? <StatusBadge status={visaPassager.statusVisa} />
                                                  : <span className="text-gray-300">—</span>
                                                }
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Soumission */}
                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    {dejaSoumis ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                          ✓ Soumis
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                          {fmtNum(ligne.soummissionPuConsilatAriary)} Ar
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          Réf : {ligne.referenceSoummision ?? '—'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 italic">Non soumis</span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">

                                      {/* Soumettre */}
                                      <button
                                        onClick={() => setSubmitModal({
                                          ligneId:          ligne.id,
                                          puConsulatDevise: vp.puConsulatDevise,
                                          puClientAriary:   vp.puClientAriary,
                                          tauxEchange:      vp.tauxEchange,
                                          devise:           vp.devise,
                                        })}
                                        disabled={!tousPassagersOntVisa || dejaSoumis}
                                        title={
                                          !tousPassagersOntVisa
                                            ? passagers.length === 0
                                              ? 'Aucun passager assigné'
                                              : 'Passager(s) sans visa'
                                            : dejaSoumis
                                              ? 'Déjà soumis'
                                              : 'Soumettre la ligne'
                                        }
                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all ${
                                          tousPassagersOntVisa && !dejaSoumis
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                        }`}
                                      >
                                        📤 Soumettre
                                      </button>

                                      {/* Détail (expand) */}
                                      <button
                                        onClick={() => toggleLigne(ligne.id)}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-1 transition"
                                      >
                                        {expandedLignes.has(ligne.id) ? '▲ Réduire' : '▼ Détails'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* ── Ligne expandée : passagers détail + actions ── */}
                                {expandedLignes.has(ligne.id) && (
                                  <tr key={`${ligne.id}-expanded`}>
                                    <td colSpan={10} className="bg-slate-50 border-t border-indigo-100 px-6 py-4">

                                      {/* Grille infos */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-1">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Séjour</p>
                                          <p className="text-xs font-semibold text-gray-800">{fmtDate(vp.dateDepart)} → {fmtDate(vp.dateRetour)}</p>
                                          <p className="text-[10px] text-gray-500">{vParams.visaDuree.duree}j · {vParams.visaEntree.entree} · {vp.nombre} pers.</p>
                                          <p className="text-[10px] text-gray-400">Traitement : {vParams.dureeTraitement}j</p>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-1">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Consulat</p>
                                          <p className="text-xs font-semibold text-gray-800 capitalize">{consulat?.nom ?? '—'}</p>
                                          <p className="text-[10px] text-gray-500">PU : {fmtNum(vp.puConsulatDevise)} {vp.devise}</p>
                                          <p className="text-[10px] text-gray-500">PU Ar : {fmtNum(vp.puConsulatAriary)} Ar</p>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Tarif client</p>
                                          <p className="text-xs font-bold text-indigo-700">{fmtNum(sousTotal)} Ar</p>
                                          <p className="text-[10px] text-indigo-500">{fmtNum(vp.puClientDevise)} {vp.devise} × {vp.nombre}</p>
                                          <p className="text-[10px] text-indigo-400">Taux : 1 {vp.devise} = {fmtNum(vp.tauxEchange)} Ar</p>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Soumission</p>
                                          <p className="text-[10px] text-gray-600">Taux : {fmtNum(ligne.soummissionTauxChange)}</p>
                                          <p className="text-[10px] text-gray-600">PU consulat : {fmtNum(ligne.soummissionPuConsilatAriary)} Ar</p>
                                          <p className="text-[10px] text-gray-600">Commission : {fmtNum(ligne.soummissionCommissionAriary)} Ar</p>
                                          <p className="text-[10px] text-gray-500">Réf. : {ligne.referenceSoummision ?? '—'}</p>
                                          <p className="text-[10px] text-gray-500">Limite : {fmtDate(ligne.limiteSoummision)}</p>
                                        </div>
                                      </div>

                                      {/* Infos complémentaires */}
                                      {(ligne.numeroDossier || ligne.resultatVisa || ligne.variante || ligne.limitePaiement) && (
                                        <div className="rounded-xl bg-white border border-gray-100 px-4 py-3 mb-4">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Informations complémentaires</p>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            {ligne.numeroDossier  && <Row label="N° dossier"      value={ligne.numeroDossier} />}
                                            {ligne.variante       && <Row label="Variante"         value={ligne.variante} />}
                                            {ligne.resultatVisa   && <Row label="Résultat visa"    value={ligne.resultatVisa} />}
                                            {ligne.limitePaiement && <Row label="Limite paiement" value={fmtDate(ligne.limitePaiement)} />}
                                          </div>
                                        </div>
                                      )}

                                      {/* Tableau passagers */}
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                        Passagers ({passagers.length} / {vp.nombre})
                                      </p>

                                      {passagers.length === 0 ? (
                                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                          ⚠ Aucun passager assigné — utilisez le bouton "Accès portail"
                                        </div>
                                      ) : (
                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                          <table className="min-w-full border-collapse">
                                            <thead>
                                              <tr className="bg-gray-100 text-gray-500">
                                                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Passager</th>
                                                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Code</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Statut</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Visa</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Résultat</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Réf. dossier</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Soumission</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Actions</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {passagers.map((passager, pIdx) => {
                                                const visaPassager = visa.find((v: Visa) => v.passagerAbstractId === passager.id);
                                                const isActif = passager.clientbeneficiaire.statut === 'ACTIF';

                                                return (
                                                  <tr key={passager.id} className={pIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>

                                                    {/* Passager */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                          {passager.clientbeneficiaire.libelle?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-800">
                                                          {passager.clientbeneficiaire.libelle}
                                                        </span>
                                                        {visaPassager?.statusVisa === 'ACCEPTER' && (
                                                          <FiCheck size={14} className="text-emerald-500 shrink-0" />
                                                        )}
                                                      </div>
                                                    </td>

                                                    {/* Code */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                                      <span className="font-mono text-[10px] text-gray-400">{passager.clientbeneficiaire.code}</span>
                                                    </td>

                                                    {/* Statut */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                        isActif ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'
                                                      }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                        {isActif ? 'Actif' : 'Inactif'}
                                                      </span>
                                                    </td>

                                                    {/* Visa status */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                      {visaPassager
                                                        ? <StatusBadge status={visaPassager.statusVisa} />
                                                        : <span className="text-[10px] text-gray-300 italic">Aucun</span>
                                                      }
                                                    </td>

                                                    {/* Résultat */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                      <span className="text-xs text-gray-500">{visaPassager?.resultat ?? '—'}</span>
                                                    </td>

                                                    {/* Réf. dossier */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                      <span className="text-xs font-mono text-gray-600">{visaPassager?.referenceDossier ?? '—'}</span>
                                                    </td>

                                                    {/* Date soumission */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                      <span className="text-xs text-gray-500">{fmtDate(visaPassager?.dateSoummission ?? null)}</span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                      <div className="flex items-center justify-center gap-1.5 flex-wrap">

                                                        {/* Valider infos */}
                                                        <button
                                                          onClick={() => navigate(`/dossiers-communs/visa/passager/${passager.id}`, {
                                                            state: {
                                                              nomPassager: passager.clientbeneficiaire.libelle,
                                                              numeroDos: prestation?.numeroDos,
                                                            }
                                                          })}
                                                          className="px-2 py-1 text-[10px] font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1"
                                                        >
                                                          Valider infos <FiArrowRight size={9} />
                                                        </button>

                                                        {/* Formulaire */}
                                                        <button
                                                          onClick={() => navigate(`/dossiers-communs/visa/client-info/${passager.id}`)}
                                                          className="px-2 py-1 text-[10px] font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                                                        >
                                                          Formulaire
                                                        </button>

                                                        {/* PDF portail */}
                                                        <a
                                                          href={`${API_URL}/${detail.pdfLogin}`}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="px-2 py-1 text-[10px] font-semibold bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                                                        >
                                                          PDF
                                                        </a>

                                                        {/* Envoyer */}
                                                        {visaPassager && (
                                                          <button
                                                            disabled={visaPassager.statusVisa !== 'A_ENREGISTRER'}
                                                            onClick={() => setSendModal({ visaId: visaPassager.id, visaEnteteId: detail.id })}
                                                            className="px-2 py-1 text-[10px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                                          >
                                                            Envoyer
                                                          </button>
                                                        )}

                                                        {/* Payer */}
                                                        {visaPassager && (
                                                          <button
                                                            onClick={() => handlePay(visaPassager.id)}
                                                            disabled={payLoading || visaPassager.statusVisa !== 'ENREGISTRE'}
                                                            className="px-2 py-1 text-[10px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center gap-1"
                                                          >
                                                            💳 Payer
                                                          </button>
                                                        )}

                                                        {/* Décision */}
                                                        {visaPassager && (
                                                          <button
                                                            onClick={() => setDecisionModal({ visaId: visaPassager.id, visaEnteteId: detail.id })}
                                                            disabled={visaPassager.statusVisa !== 'EN_COURS'}
                                                            className="px-2 py-1 text-[10px] font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center gap-1"
                                                          >
                                                            ⚖️ Décision
                                                          </button>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* ── Onglet Suivi ── */}
              {activeTabSousSection === 'suivi' && (
                <SuiviTabSection
                  prestationId={prestationId}
                  moduleName="visa"
                />
              )}

              {/* Feedbacks */}
              {paySuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                  ✓ {paySuccess}
                </div>
              )}
              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  ⚠️ {payError}
                </div>
              )}
            </div>

            {/* Modals */}
            {sendModal && (
              <SendVisaModal
                visaId={sendModal.visaId}
                visaEnteteId={sendModal.visaEnteteId}
                onClose={() => setSendModal(null)}
              />
            )}
            {decisionModal && (
              <DecisionVisaModal
                visaId={decisionModal.visaId}
                visaEnteteId={decisionModal.visaEnteteId}
                onClose={() => setDecisionModal(null)}
              />
            )}

            {/* ── Modal accès portail ── */}
            {showAccesPortail && detail && (
              <CreateAccesPortailModal
                visaEnteteId={detail.id}
                lignes={detail.visaLigne}
                onClose={() => setShowAccesPortail(false)}
              />
            )}

            {/* ── Modal soumission ligne ── */}
            {submitModal && detail && (
              <SubmitVisaLigneModal
                ligneId={submitModal.ligneId}
                visaEnteteId={detail.id}
                puConsulatDevise={submitModal.puConsulatDevise}
                puClientAriary={submitModal.puClientAriary}
                tauxEchange={submitModal.tauxEchange}
                devise={submitModal.devise}
                onClose={() => setSubmitModal(null)}
              />
            )}
          </div>
        </div>
      </TabContainer>
    </div>
  );
};

export default PageDetailVisa;