import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { FiArrowRight, FiFile, FiUser } from 'react-icons/fi';
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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtNum = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('fr-FR') : '—';

const Card = ({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      {action}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right">{value ?? '—'}</span>
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

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'visa');

  // Lignes dépliées (accordéon)
  const [expandedLignes, setExpandedLignes] = useState<Set<string>>(new Set());
  const toggleLigne = (id: string) =>
    setExpandedLignes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // État à ajouter dans le composant
  const [passagerModal, setPassagerModal] = useState<{
    idVisaAbstract: string;
    nom: string;
  } | null>(null);

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

  // ── States ─────────────────────────────────────────────────────────────────

  // if (loading) return (
  //   <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
  //     <div className="flex items-center gap-3 text-gray-400">
  //       <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
  //         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  //         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  //       </svg>
  //       Chargement...
  //     </div>
  //   </div>
  // );

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
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-neutral-50 pt-4 space-y-4">

        {/* ── VisaHeader — toujours visible ── */}
        <div className="">
          <VisaHeader
            numerovisa={detail?.visaProspectionEntete?.prestation?.numeroDos ?? '...'}
            nomPassager=""
            navigate={navigate}
            isDetail={true}
          />
        </div>

        {/* ── Topbar — toujours visible ── */}
        <div className="bg-white p-4 space-y-3">
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
                  {/* <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Statut</span>
                    <StatusBadge status={detail.statut} />
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400 font-medium">Entête</span>
                    <StatusBadge status={detail.statutEntete} />
                  </div>

                  <div className="w-px h-8 bg-gray-300 shrink-0" /> */}

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

          {generateSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">✓ {generateSuccess}</div>
          )}
          {generateError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">⚠️ {generateError}</div>
          )}
        </div>

        {/* ── Card infos générales — skeleton si loading ── */}
        <Card title="Informations générales">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : detail ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <Row label="Dossier visa"    value={detail.visaProspectionEntete.prestation.numeroDos} />
              {/* <Row label="Statut"          value={<StatusBadge status={detail.statut} />} />
              <Row label="Statut entête"   value={<StatusBadge status={detail.statutEntete} />} /> */}
              <Row
                label="PDF Login"
                value={
                  detail.pdfLogin ? (
                    <a
                      href={`${API_URL}/${detail.pdfLogin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 transition-all"
                    >
                      <FiFile size={12} /> Voir PDF
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                      Non disponible
                    </span>
                  )
                }
              />
              <Row label="Créé le"         value={fmtDate(detail.createdAt)} />
              <Row label="Dernière MAJ"    value={fmtDate(detail.updatedAt)} />
              <Row label="Total personnes" value={`${totalPersonnes} pers.`} />
              <Row label="Total client"    value={
                <span className="text-indigo-700 font-bold text-base">
                  {totalAriary?.toLocaleString('fr-FR')} Ar
                </span>
              } />
            </div>
          ) : null}
        </Card>

        {/* ── Lignes visa — skeleton si loading ── */}
        <div>
          <div className="px-5 py-3 border-b border-gray-300  flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-700 shrink-0">
              {loading ? 'Lignes visa' : `Listes des lignes visa (${detail?.visaLigne?.length ?? 0})`}
            </p>
          </div>

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
                  <div key={ligne.id} className="rounded-xl border border-gray-100 overflow-hidden">

                    {/* ── Header accordéon ── */}
                    <div
                      onClick={() => toggleLigne(ligne.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-indigo-50 border-b border-gray-100 transition cursor-pointer"
                    >
                      {/* Infos ligne */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>

                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">
                            {vParams.pays.pays}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
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

                        {/* État pièces */}
                        {/* <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          vp.etatPiece
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-orange-50 text-orange-500 border-orange-200'
                        }`}>
                          {vp.etatPiece ? '✓ Pièces OK' : '✗ Incomplet'}
                        </span> */}

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
                                const acces      = ligne.accesPortail?.find(a => a.passager?.id === passager.clientbeneficiaireId);
                                const visaPassager = visa.find((v: Visa) => v.passagerAbstractId === passager.id);
                                const isActif    = passager.clientbeneficiaire.statut === 'ACTIF';

                                return (
                                  <div
                                    key={passager.id}
                                    className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
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
                                          Voir les Détails <FiArrowRight size={11} /> 
                                        </button>
                                      </div>
                                    </div>

                                    {/* ── Corps : accès portail + visa côte à côte ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                                      {/* Accès portail */}
                                      <div className="px-4 py-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Accès portail</p> 
                                        {/* Bouton ouvrir en plein */}
                                            <a
                                              href={`${API_URL}/${detail.pdfLogin}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 transition-all"
                                            >
                                              <FiFile size={12} /> Ouvrir en plein écran
                                            </a>
                                        </div>
                                        {detail.pdfLogin ? (
                                          <div className="space-y-2">
                                            {/* Aperçu iframe */}
                                            <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                                              <div className="scale-[0.99] origin-top">
                                                <iframe
                                                  src={`${API_URL}/${detail.pdfLogin}#toolbar=0&navpanes=0&scrollbar=0`}
                                                  className="w-full h-40 border-0 block"
                                                  title="Aperçu PDF"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                                            Accés non disponible
                                          </span>
                                        )}
                                      </div>

                                      {/* Visa du passager */}
                                      <div className="px-4 py-3 space-y-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Visa</p>
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
    </TabContainer>
  );
};

export default PageDetailVisa;