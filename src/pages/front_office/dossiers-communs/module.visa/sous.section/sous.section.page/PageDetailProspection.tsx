import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { approuverDevis, clearVisaDevis, creerVisaEntete, envoyerDevis, fetchVisaDevis, genererPdfClient, genererPdfDirection } from '../../../../../../app/front_office/parametre_visa/visaDevisSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { VisaHeader } from '../../components/VisaHeader';
import { API_URL } from '../../../../../../service/env';
import { useVisaPdf } from '../../../module.pdf/pdf.generation/hooks/usePdfGenerator';
import { Download, Eye } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt    = (n: number)  => n.toLocaleString('fr-FR');
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUT_COLORS: Record<string, string> = {
    créé: 'bg-green-100 text-green-700',
    DEVIS_APPROUVE  : 'bg-green-100 text-green-700',
    DEVIS_ENVOYE    : 'bg-blue-100  text-blue-700',
    DEVIS           : 'bg-yellow-100 text-yellow-700',
    CREER           : 'bg-gray-100  text-gray-600',
    ANNULER         : 'bg-red-100   text-red-700',
};

const Badge = ({ label }: { label: string }) => (
  <span className={`px-3 py-2 uppercase rounded-full border border-slate-200 text-xs font-semibold ${STATUT_COLORS[label] ?? 'bg-gray-100 text-gray-600'}`}>
    {label.replace('_', ' ')}
  </span>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-slate-300 bg-slate-200">
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
    </div>
    <div className="">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between py-1.5 mx-2 text-sm border-b border-gray-50 last:border-0">
    <span className="text-gray-400 shrink-0 w-44">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value ?? '—'}</span>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────

const PageDetailProspection = () => {
    const { enteteId } = useParams<{ enteteId: string }>();
    const dispatch     = useDispatch<AppDispatch>();
    const navigate     = useNavigate();
    const location = useLocation();

    console.log(enteteId);
    

    const { detail, loading, error } = useSelector((s: RootState) => s.visaDevis);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionError,   setActionError]   = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    const tabs = [
        { id: 'prospection', label: 'Listes des prospections' },
        { id: 'visa',        label: 'Listes des visa' },
    ];

    const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

    const { generate: generatePdf, preview: previewPdf, loading: pdfLoading } = useVisaPdf();

    useEffect(() => {
        if (enteteId) dispatch(fetchVisaDevis(enteteId));
        return () => { dispatch(clearVisaDevis()); };
    }, [enteteId, dispatch]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleEnvoyer = async () => {
        if (!detail) return;
        setActionLoading('envoyer');
        setActionError('');
        setActionSuccess('');
        try {
            await dispatch(envoyerDevis(detail.devis.id)).unwrap();
            setActionSuccess('Devis envoyé avec succès.');
        } catch (e: any) {
            setActionError(e ?? "Erreur lors de l'envoi.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprouver = async () => {
        if (!detail) return;
        setActionLoading('approuver');
        setActionError('');
        setActionSuccess('');
        try {
            await dispatch(approuverDevis(detail.devis.id)).unwrap();
            setActionSuccess('Devis approuvé avec succès.');
        } catch (e: any) {
            setActionError(e ?? "Erreur lors de l'approbation.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreerVisa = async () => {
        if (!detail) return;
        setActionLoading('visa');
        setActionError('');
        setActionSuccess('');
        try {
            await dispatch(creerVisaEntete({
            visaProspectionEnteteId : detail.prospectionVisa.id,
            devisModuleId           : detail.devis.id,
            })).unwrap();
            setActionSuccess('Visa créé avec succès.');
        } catch (e: any) {
            setActionError(e ?? 'Erreur lors de la création du visa.');
        } finally {
            setActionLoading(null);
        }
    };

    // FONCTION DE NAVIGATION INTERCEPTÉE
    const handleTabChange = (id: string) => {
        if (id === 'visa') {
        // On remonte au parent (PageView) en passant le state pour l'onglet
        navigate(`/dossiers-communs/visa/pages`, { 
            state: { targetTab: 'visa' }
        });
        } else {
        setActiveTab(id);
        }
    };

    // ── Remplacer handlePdfDirection et handlePdfClient ──────────────────
    const handlePdfDirection = () => {
        if (!detail) return;
        generatePdf(detail, 'direction', undefined, `${detail.devis.reference}-direction.pdf`);
    };

    const handlePdfClient = () => {
        if (!detail) return;
        generatePdf(detail, 'client', undefined, `${detail.devis.reference}-client.pdf`);
    };

    // const handlePdfDirection = async () => {
    //     if (!detail) return;
    //     setActionLoading('pdf-direction');
    //     setActionError('');
    //     setActionSuccess('');
    //     try {
    //         const path = await dispatch(
    //         genererPdfDirection(detail.prospectionVisa.id)
    //         ).unwrap();
    //         window.open(`${API_URL}/${path}`, '_blank');
    //         setActionSuccess('PDF direction généré avec succès.');
    //     } catch (e: any) {
    //         setActionError(e ?? 'Erreur génération PDF direction.');
    //     } finally {
    //         setActionLoading(null);
    //     }
    //     };

    //     const handlePdfClient = async () => {
    //     if (!detail) return;
    //     setActionLoading('pdf-client');
    //     setActionError('');
    //     setActionSuccess('');
    //     try {
    //         const path = await dispatch(
    //         genererPdfClient(detail.prospectionVisa.id)
    //         ).unwrap();
    //         window.open(`${API_URL}/${path}`, '_blank');
    //         setActionSuccess('PDF client généré avec succès.');
    //     } catch (e: any) {
    //         setActionError(e ?? 'Erreur génération PDF client.');
    //     } finally {
    //         setActionLoading(null);
    //     }
    //     };


    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement du devis...
        </div>
        </div>
    );

    // ── Erreur ───────────────────────────────────────────────────────────────
    if (error) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
            <p className="text-red-500 font-medium">⚠️ {error}</p>
            <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">
            ← Retour
            </button>
        </div>
        </div>
    );

    if (!detail) return null;

    const { devis, prospectionVisa, visaProspectionLignes, suivi } = detail;

    return (
        <div className="h-full flex flex-col min-h-0">
            <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
                <div className="flex h-full min-h-0 overflow-hidden">
                    {/* ── Colonne principale ── */}
                    <div className="flex-1 min-w-0 flex flex-col min-h-0">
                        {/* ── Header fixe — ne scrolle PAS ── */}
                        <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
                            <div className='flex items-center justify-between'>
                                <VisaHeader numerovisa={devis.reference} nomPassager= {''} navigate={navigate} isDetail={true} isProspection={true}/>
                            </div>
                        </div>

                        <div className=" p-2 flex items-center justify-between flex-wrap bg-slate-200 rounded-b-xl">
                            {/* Gauche : retour + titre */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                                >
                                    ←
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        Devis {devis.reference}
                                    </h1>
                                    <p className="text-sm text-gray-400">
                                        {prospectionVisa.prestation.numeroDos} — créé le {fmtDate(devis.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Droite : badge + actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge label={devis.statut} />
                                <div className="w-px h-8 bg-slate-400 shrink-0" />
                                    <div className="flex bg-slate-300 p-1 rounded-xl gap-1">
                                        {/* Direction */}
                                        <button
                                        onClick={() => detail && previewPdf(detail, 'direction')}
                                        disabled={pdfLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                                            text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                                            hover:bg-slate-50 disabled:opacity-50 transition-all"
                                        title="Aperçu direction"
                                        >
                                        <Eye size={13} className="text-slate-400" />Direction
                                        </button>
                                        <button
                                        onClick={handlePdfDirection}
                                        disabled={pdfLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                                            text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                                            hover:bg-slate-50 disabled:opacity-50 transition-all"
                                        title="Télécharger direction"
                                        >
                                        <Download size={14} className="text-slate-400" /> 
                                        </button>

                                        <div className="w-px bg-slate-200 mx-0.5" />

                                        {/* Client */}
                                        <button
                                        onClick={() => detail && previewPdf(detail, 'client')}
                                        disabled={pdfLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                                            text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                                            hover:bg-slate-50 disabled:opacity-50 transition-all"
                                        title="Aperçu client"
                                        >
                                        <Eye size={13} className="text-teal-500" />Client
                                        </button>
                                        <button
                                        onClick={handlePdfClient}
                                        disabled={pdfLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700
                                            text-xs font-bold rounded-lg border border-slate-200 shadow-sm
                                            hover:bg-slate-50 disabled:opacity-50 transition-all"
                                        title="Télécharger client"
                                        >
                                        <Download size={14} className="text-teal-500" />
                                        </button>
                                    </div>

                                    {/* Séparateur */}
                                    <div className="w-px h-8 bg-slate-400 shrink-0" />
                                        <div className="flex items-center gap-2">
                                            {/* Envoyer le devis */}
                                            <button
                                                onClick={devis.statut === 'CREER' ? handleEnvoyer : undefined}
                                                disabled={devis.statut !== 'CREER' || actionLoading === 'envoyer'}
                                                className={`px-4 py-2 text-sm rounded-lg font-semibold flex items-center gap-2 transition-all ${
                                                devis.statut === 'CREER'
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                }`}
                                            >
                                                {actionLoading === 'envoyer' ? (
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                                ) : <span className={devis.statut !== 'CREER' ? 'grayscale opacity-50' : ''}>📤</span>}
                                                Envoyer le devis
                                            </button>

                                            <span className="text-gray-300">›</span>

                                            {/* Approuver */}
                                            <button
                                                onClick={devis.statut === 'DEVIS_A_APPROUVER' ? handleApprouver : undefined}
                                                disabled={devis.statut !== 'DEVIS_A_APPROUVER' || actionLoading === 'approuver'}
                                                className={`px-4 py-2 text-sm rounded-lg font-semibold flex items-center gap-2 transition-all ${
                                                devis.statut === 'DEVIS_A_APPROUVER'
                                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                }`}
                                            >
                                                {actionLoading === 'approuver' ? (
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                                ) : <span className={devis.statut !== 'DEVIS_A_APPROUVER' ? 'grayscale opacity-50' : ''}>✅</span>}
                                                Approuver
                                            </button>

                                            <span className="text-gray-300">›</span>

                                            {/* Créer le Visa */}
                                            <button
                                                onClick={devis.statut === 'DEVIS_APPROUVE' ? handleCreerVisa : undefined}
                                                disabled={devis.statut !== 'DEVIS_APPROUVE' || actionLoading === 'visa'}
                                                className={`px-4 py-2 text-sm rounded-lg font-semibold flex items-center gap-2 transition-all ${
                                                devis.statut === 'DEVIS_APPROUVE'
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                }`}
                                            >
                                                {actionLoading === 'visa' ? (
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                                ) : <span className={devis.statut !== 'DEVIS_APPROUVE' ? 'grayscale opacity-50' : ''}>🛂</span>}
                                                Créer le Visa
                                            </button>
                                        </div>
                                    </div>
                        </div>
                        

                        {/* ── Feedback actions ── */}
                        {actionSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                            ✓ {actionSuccess}
                        </div>
                        )}
                        {actionError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                            ⚠️ {actionError}
                        </div>
                        )}
                        <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-4">

                            {/* ── Résumé devis ── */}
                            <Card title="Résumé du devis">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                <Row label="Référence"      value={devis.reference} />
                                <Row label="Statut"         value={<Badge label={devis.statut} />} />
                                <Row label="Total général"  value={<span className="text-indigo-700 font-bold text-base">{fmt(devis.totalGeneral)} Ar</span>} />
                                <Row label="Dernière MAJ"   value={fmtDate(devis.updatedAt)} />
                                </div>
                            </Card>

                            {/* ── Lignes de prospection ── */}
                            <Card title={`Lignes de prospection (${visaProspectionLignes.length})`}>
                                <div className="space-y-1">
                                {visaProspectionLignes.map((ligne, idx) => (
                                    <div key={ligne.id} className=" border border-gray-100 overflow-hidden">

                                    {/* Header ligne */}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                                            <span className="font-semibold text-gray-800 text-sm">
                                                {ligne.visaParams.pays.pays}
                                                <span className="ml-2 text-xs text-gray-400 font-normal">
                                                {ligne.visaParams.code} — {ligne.visaParams.visaType.nom}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge label={ligne.etatVisa == 'CREER' ? 'créé' : ligne.etatVisa} />
                                        </div>
                                    </div>

                                    {/* Body ligne — grille infos */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-gray-50">

                                        {/* Séjour */}
                                        <div className="px-4 py-3 space-y-0.5">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Séjour</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {fmtDate(ligne.dateDepart)} → {fmtDate(ligne.dateRetour)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {ligne.visaParams.visaDuree.duree} j · {ligne.visaParams.visaEntree.entree} · {ligne.nombre} pers.
                                        </p>
                                        </div>

                                        {/* Consulat */}
                                        <div className="px-4 py-3 space-y-0.5">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Consulat</p>
                                        <p className="text-sm font-medium text-gray-800 capitalize">
                                            {ligne.consulat?.nom ?? '—'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PU : {fmt(ligne.puConsulatDevise)} {ligne.devise} / {fmt(ligne.puConsulatAriary)} Ar
                                        </p>
                                        </div>

                                        {/* Tarif client */}
                                        <div className="px-4 py-3 space-y-0.5">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Tarif client</p>
                                        <p className="text-sm font-bold text-indigo-700">
                                            {fmt(ligne.puClientAriary * ligne.nombre)} Ar
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {fmt(ligne.puClientDevise)} {ligne.devise} × {ligne.nombre} pers.
                                        </p>
                                        </div>

                                        {/* Devise */}
                                        <div className="px-4 py-3 space-y-0.5">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Change</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            1 {ligne.devise} = {fmt(ligne.tauxEchange)} Ar
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Traitement : {ligne.visaParams.dureeTraitement} j
                                        </p>
                                        </div>

                                    </div>
                                    </div>
                                ))}
                                </div>
                            </Card>    
                        </div>
                    </div>
                </div>
            </TabContainer>
        </div>
    );
};

export default PageDetailProspection;