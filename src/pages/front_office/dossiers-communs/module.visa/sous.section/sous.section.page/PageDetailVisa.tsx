import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { FiArrowRight, FiCheck, FiCheckCircle, FiChevronDown, FiFile } from 'react-icons/fi';
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

// Palette couleur par module (même logique que DossierActifCard)
const colorMap: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  amber:  { bg: '#f59e0b', bgLight: '#fef3c7', text: '#d97706', border: '#fde68a' },
  blue:   { bg: '#3b82f6', bgLight: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  rose:   { bg: '#f43f5e', bgLight: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
  orange: { bg: '#f97316', bgLight: '#ffedd5', text: '#ea580c', border: '#fed7aa' },
  green:  { bg: '#22c55e', bgLight: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  indigo: { bg: '#6366f1', bgLight: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  violet: { bg: '#8b5cf6', bgLight: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
};

const extractColorFromGradient = (gradient: string): string => {
  const match = gradient.match(/from-(\w+)-/);
  return match?.[1] ?? 'blue';
};

// ── Card collapsible avec accent couleur ───────────────────────────────────

interface CardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  gradient?: string;
}

const Card = ({ title, children, action, gradient = 'from-blue-400 to-indigo-500' }: CardProps) => {
  const colorKey = extractColorFromGradient(gradient);
  const color    = colorMap[colorKey] ?? colorMap['blue'];

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('dossierActifCard_isOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggle = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem('dossierActifCard_isOpen', String(next));
      return next;
    });
  };

  return (
    <div
      className="bg-white rounded-xl border overflow-hidden mb-1"
      style={{ borderColor: color.border }}
    >
      {/* Header */}
      <div
        className="relative flex items-center justify-between px-4 py-2.5 cursor-pointer overflow-hidden transition-colors"
        style={{ background: color.bgLight, borderBottom: isOpen ? `0.5px solid ${color.border}` : 'none' }}
        onClick={() => setIsOpen(p => !p)}
      >
        {/* Cercles décoratifs */}
        <div
          className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 bg-linear-to-r ${gradient}`}
        />
        <div
          className={`absolute -bottom-5 -right-10 w-28 h-28 rounded-full opacity-10 bg-linear-to-r ${gradient}`}
        />

        {/* Titre */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: color.bg }}
          >
            <FiFile size={11} color="#fff" />
          </div>
          <p className="text-sm font-semibold" style={{ color: color.text }}>
            {title}
          </p>
        </div>

        {/* Droite : action slot + chevron */}
        <div className="relative flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {action}
          <button
            onClick={e => { e.stopPropagation(); handleToggle(); }}
            className="w-6 h-6 rounded-md border flex items-center justify-center transition-colors"
            style={{ borderColor: color.border, color: color.text }}
            title={isOpen ? 'Réduire' : 'Agrandir'}
          >
            <FiChevronDown
              size={12}
              style={{
                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>
      </div>

      {/* Body collapsible */}
      <div
        style={{
          maxHeight: isOpen ? '600px' : '0',
          opacity:   isOpen ? 1 : 0,
          overflow:  'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
};

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
  const totalPersonnes = detail?.visaLigne.reduce((s, l) => s + l.visaProspectionLigne.nombre, 0);
  const totalAriary    = detail?.visaLigne.reduce(
    (s, l) => s + l.visaProspectionLigne.puClientAriary * l.visaProspectionLigne.nombre, 0
  );

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
                <div>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-white">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-5 w-8" />
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <Skeleton className="h-5 w-24" />
                            </div>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-7 w-28" />
                              <Skeleton className="h-7 w-24" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : detail?.visaLigne?.length === 0 ? (
                    <EmptyMsg msg="Aucune ligne visa" />
                  ) : (
                    <div className="space-y-3">
                      {detail?.visaLigne.map((ligne, idx) => {
                        const vp       = ligne.visaProspectionLigne;
                        const vParams  = vp.visaParams;
                        const expanded = expandedLignes.has(ligne.id);
                        // const accesPortailListe = ligne.accesPortail ?? [];
                        const sousTotal = vp.puClientAriary * vp.nombre;
                        const passagers = ligne.passagers ?? [];
                        const visa = ligne.visa ?? [];

                        // Tous les passagers ont un visa associé ?
                        const tousPassagersOntVisa =
                          passagers.length > 0 &&
                          passagers.every(p =>
                            visa.some((v: Visa) => v.passagerAbstractId === p.id)
                          );

                        return (
                          <div key={ligne.id} className="bg-slate-700 rounded-xl border border-slate-400 overflow-hidden">

                            {/* ── Header accordéon ── */}
                            <div
                              onClick={() => toggleLigne(ligne.id)}
                              className="w-full flex items-center justify-between px-4 py-3  hover:bg-slate-600 transition cursor-pointer"
                            >
                              {/* Infos ligne */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                  #{idx + 1}
                                </span>

                                <div className="flex flex-col">
                                  <span className="font-semibold text-white text-sm">
                                    {vParams.pays.pays}
                                  </span>
                                  <span className="text-[10px] text-gray-100 font-medium">
                                    {vParams.code} — {vParams.visaType.nom}
                                  </span>
                                </div>

                                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  {ligne.referenceLine}
                                </span>

                                {/* <StatusBadge status={ligne.statusLigne} />
                                <StatusBadge status={ligne.statusVisa} /> */}
                              </div>

                              {/* Actions & résumé */}
                              <div className="flex items-center gap-3 shrink-0">

                                {/* Sous-total */}
                                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                  {sousTotal.toLocaleString('fr-FR')} Ar
                                </span>

                                <div className="w-px h-6 bg-gray-200 shrink-0" />

                                {/* Bouton soumettre */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSubmitModal({
                                      ligneId:          ligne.id,
                                      puConsulatDevise: vp.puConsulatDevise,
                                      puClientAriary:   vp.puClientAriary,
                                      tauxEchange:      vp.tauxEchange,
                                      devise:           vp.devise,
                                    });
                                  }}
                                  disabled={!tousPassagersOntVisa || ligne.soummissionPuConsilatAriary !== null}
                                  title={
                                    !tousPassagersOntVisa
                                      ? passagers.length === 0
                                        ? 'Aucun passager assigné'
                                        : `${passagers.filter(p => !visa.some((v: Visa) => v.passagerAbstractId === p.id)).length} passager(s) sans visa`
                                      : 'Soumettre la ligne'
                                  }
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                                    tousPassagersOntVisa && ligne.soummissionPuConsilatAriary == null
                                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                  }`}
                                >
                                  <span className={!tousPassagersOntVisa || ligne.soummissionPuConsilatAriary !== null ? 'grayscale opacity-50' : ''}>
                                    📤
                                  </span>
                                  Soumettre
                                </button>

                                {/* Chevron */}
                                <svg
                                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* ── Corps accordéon ── */}
                            {expanded && (
                              <div className="px-4 py-4 space-y-5 bg-white">
                                {/* ── Grille infos séjour / consulat / tarifs / soumission ── */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {/* Séjour */}
                                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Séjour</p>
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold text-gray-800">
                                        {fmtDate(vp.dateDepart)} → {fmtDate(vp.dateRetour)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {vParams.visaDuree.duree} j · {vParams.visaEntree.entree} · {vp.nombre} pers.
                                      </p>
                                      <p className="text-xs text-gray-500">Traitement : {vParams.dureeTraitement} j</p>
                                    </div>
                                  </div>

                                  {/* Consulat */}
                                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Consulat</p>
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold text-gray-800 capitalize">{consulat?.nom ?? '—'}</p>
                                      <p className="text-xs text-gray-500">PU : {fmtNum(vp.puConsulatDevise)} {vp.devise}</p>
                                      <p className="text-xs text-gray-500">PU Ar : {fmtNum(vp.puConsulatAriary)} Ar</p>
                                    </div>
                                  </div>

                                  {/* Tarif client */}
                                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Tarif client</p>
                                    <div className="space-y-1">
                                      <p className="text-sm font-bold text-indigo-700">{fmtNum(sousTotal)} Ar</p>
                                      <p className="text-xs text-indigo-500">
                                        {fmtNum(vp.puClientDevise)} {vp.devise} × {vp.nombre} pers.
                                      </p>
                                      <p className="text-xs text-indigo-400">Taux : 1 {vp.devise} = {fmtNum(vp.tauxEchange)} Ar</p>
                                    </div>
                                  </div>

                                  {/* Soumission */}
                                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Soumission</p>
                                    <div className="space-y-1">
                                      <p className="text-xs text-gray-600">Taux : {fmtNum(ligne.soummissionTauxChange)}</p>
                                      <p className="text-xs text-gray-600">PU consulat : {fmtNum(ligne.soummissionPuConsilatAriary)} Ar</p>
                                      <p className="text-xs text-gray-600">PU client : {fmtNum(ligne.soummissionPuClientAriary)} Ar</p>
                                      <p className="text-xs text-gray-600">Commission : {fmtNum(ligne.soummissionCommissionAriary)} Ar</p>
                                      <div className="pt-1 mt-1 border-t border-amber-100 space-y-1">
                                        <p className="text-xs text-gray-500">Réf. : {ligne.referenceSoummision ?? '—'}</p>
                                        <p className="text-xs text-gray-500">Limite : {fmtDate(ligne.limiteSoummision)}</p>
                                      </div>
                                    </div>
                                  </div>

                                </div>

                                {/* ── Infos complémentaires ── */}
                                {(ligne.numeroDossier || ligne.resultatVisa || ligne.variante || ligne.limitePaiement) && (
                                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                      Informations complémentaires
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      {ligne.numeroDossier  && <Row label="N° dossier"      value={ligne.numeroDossier} />}
                                      {ligne.variante       && <Row label="Variante"         value={ligne.variante} />}
                                      {ligne.resultatVisa   && <Row label="Résultat visa"    value={ligne.resultatVisa} />}
                                      {ligne.limitePaiement && <Row label="Limite paiement" value={fmtDate(ligne.limitePaiement)} />}
                                    </div>
                                  </div>
                                )}

                                {/* ── Passagers + Visa ── */}
                                <div>
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                                    Passagers ({passagers.length} / {vp.nombre})
                                  </p>

                                  {passagers.length === 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                      ⚠ Aucun passager assigné — utilisez le bouton "Accès portail"
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {passagers.map((passager) => {
                                        const visaPassager = visa.find((v: Visa) => v.passagerAbstractId === passager.id);
                                        const isActif    = passager.clientbeneficiaire.statut === 'ACTIF';

                                        return (
                                          <div
                                            key={passager.id}
                                            className="rounded-2xl border border-slate-300 overflow-hidden shadow-sm"
                                          >
                                            {/* ── Header passager ── */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                  {passager.clientbeneficiaire.libelle
                                                    ?.split(' ').slice(0, 2)
                                                    .map((n: string) => n[0]).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                    {passager.clientbeneficiaire.libelle} 
                                                  </p>
                                                  <p className="text-xs text-gray-400 font-mono">{passager.clientbeneficiaire.code}</p>
                                                </div>

                                                
                                              
                                              </div>

                                              <div className="flex items-center gap-2">
                                                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                                  isActif ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'
                                                }`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                  {isActif ? 'Actif' : 'Inactif'}
                                                </span>
                                                <button
                                                  onClick={() => navigate(`/dossiers-communs/visa/passager/${passager.id}`, {
                                                    state: { 
                                                      nomPassager: passager.clientbeneficiaire.libelle,
                                                      numeroDos: prestation?.numeroDos,
                                                    }
                                                  })}
                                                  className="flex items-center bg-blue-500 gap-1 text-xs font-medium text-blue-100 hover:text-gray-900 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition"
                                                >
                                                  Valider Les Infos <FiArrowRight size={11} /> 
                                                </button>

                                                <div>
                                                  {visaPassager?.statusVisa == 'ACCEPTER' ? <FiCheck size={30} color='green' />  : ''}
                                                </div>
                                              </div>
                                            </div>

                                            {/* ── Corps : accès portail + visa côte à côte ── */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                                              {/* Accès portail */}
                                              <div className="px-4 py-3 space-y-6">
                                                <div className="flex items-center justify-between">
                                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Accès portail</p> 
                                                  {/* Bouton ouvrir en plein */}
                                                  <a
                                                    href={`${API_URL}/${detail.pdfLogin}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 transition-all"
                                                  >
                                                    Ouvrir le pdf
                                                  </a>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <p className="text-xs text-gray-500">Completer manuellement les infos du client</p>
                                                  <button
                                                    onClick={() => navigate(`/dossiers-communs/visa/client-info/${passager.id}`)}
                                                    className="bg-indigo-500 text-xs text-white px-2 py-1 rounded-lg font-semibold hover:bg-indigo-600 transition-all"
                                                  >
                                                    Acceder au formulaire
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Visa du passager */}
                                              <div className="px-4 py-3 space-y-2">
                                                <p className={`text-xs font-semibold ${visaPassager?.statusVisa == 'ACCEPTER' ? 'text-green-500' : 'text-gray-400'} uppercase tracking-wide`}>Visa {visaPassager?.statusVisa == 'ACCEPTER' ? 'Valider' : ''} </p>
                                                {visaPassager ? (
                                                  <>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <StatusBadge status={visaPassager.statusVisa} />
                                                      <span className="text-xs text-gray-500">Résultat : {visaPassager.resultat ?? '—'}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                      Réf. dossier : <span className="font-medium text-gray-700">{visaPassager.referenceDossier ?? '—'}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                      Soumission : {fmtDate(visaPassager.dateSoummission)}
                                                    </p>
                                                    {/* Actions visa */}
                                                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                      <button
                                                        disabled= {visaPassager.statusVisa !== 'A_ENREGISTRER'}  
                                                        onClick={() => setSendModal({ visaId: visaPassager.id, visaEnteteId: detail.id })}
                                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                      >
                                                        Envoyer 
                                                      </button>
                                                      <button
                                                        onClick={() => handlePay(visaPassager.id)}
                                                        disabled={payLoading || visaPassager.statusVisa !== 'ENREGISTRE'}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                      >
                                                        💳 Payer
                                                      </button>
                                                      <button
                                                        onClick={() => setDecisionModal({ visaId: visaPassager.id, visaEnteteId: detail.id })}
                                                        disabled={visaPassager.statusVisa !== 'EN_COURS'}
                                                        className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 flex items-center gap-1 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                      >
                                                        ⚖️ Décision
                                                      </button>
                                                    </div>
                                                  </>
                                                ) : (
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <p className="text-xs text-gray-400">Aucun visa associé</p>
                                                  </div>
                                                )}
                                              </div>

                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                                              <p className="text-[10px] text-gray-300">Assigné le {fmtDate(passager.createdAt)}</p>
                                            </div>

                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {/* ── Onglet Suivi ── */}
              {activeTabSousSection === 'suivi' && (
                <SuiviTabSection
                  prestationId={prestationId}
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
            {showAccesPortail && (
              <CreateAccesPortailModal
                visaEnteteId={detail.id}
                lignes={detail.visaLigne}
                onClose={() => setShowAccesPortail(false)}
              />
            )}

            {/* ── Modal soumission ligne ── */}
            {submitModal && (
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