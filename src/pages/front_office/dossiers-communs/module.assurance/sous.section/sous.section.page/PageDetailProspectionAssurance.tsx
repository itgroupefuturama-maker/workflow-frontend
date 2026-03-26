import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceDevisDetail,
  envoyerAssuranceDevis,
  approuverAssuranceDevis,
  createAssuranceEntete,
  genererDevisDirection,
  genererDevisClient,
} from '../../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { AssuranceHeader } from '../../components/AssuranceHeader';
import { API_URL } from '../../../../../../service/env';

/* ── helpers ── */
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtNum = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('fr-FR') : '—';

/* ── atoms ── */
const Spinner = ({ size = 6 }: { size?: number }) => (
  <svg className={`animate-spin h-${size} w-${size} text-gray-400`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIF:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    créé:   'bg-blue-50 text-blue-700 border-blue-200 uppercase',
    DEVIS:   'bg-amber-50 text-amber-700 border-amber-200 uppercase',
    ENVOYE:  'bg-violet-50 text-violet-700 border-violet-200 uppercase',
    APPROUVE:'bg-emerald-50 text-emerald-700 border-emerald-200 uppercase',
    INACTIF: 'bg-gray-100 text-gray-500 border-gray-200 uppercase',
  };
  const cls = colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

const Card = ({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
      {action}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right">{value ?? '—'}</span>
  </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
    {children}
  </th>
);
const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
    {children}
  </td>
);

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

  const handleDevisDirection = async () => {
    if (!enteteId) return;
    const res = await dispatch(genererDevisDirection(enteteId));
    if (genererDevisDirection.fulfilled.match(res)) {
      const url = `${API_URL}/${res.payload}`;
      window.open(url, '_blank');
    }
  };

  const handleDevisClient = async () => {
    if (!enteteId) return;
    const res = await dispatch(genererDevisClient(enteteId));
    if (genererDevisClient.fulfilled.match(res)) {
      const url = `${API_URL}/${res.payload}`;
      window.open(url, '_blank');
    }
  };

  /* ── états ── */
  if (loadingDevis) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Spinner size={8} />
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
  const canApprouver = devis.statut === 'ENVOYE';

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-neutral-50 space-y-4">

        <AssuranceHeader numeroassurance={devis.reference} nomPassager= {''} navigate={navigate} isDetail={true} isProspection={true}/>


        {/* ── Topbar ── */}
        <div className=" bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm transition"
              >←</button>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Détail prospection</h1>
                <p className="text-xs text-gray-400">{numeroDos} · <span className="font-mono">{devis.reference}</span></p>
              </div>
            </div>

            {/* ── Actions ── */}
              <div className="flex items-center gap-3">
                <Badge status={suivi.evolution} />

                {/* Séparateur */}
                <div className="h-6 w-px bg-gray-200" />

                {/* ── Groupe 1 : Génération PDF ── */}
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={handleDevisDirection}
                    disabled={actioning}
                    title="Générer le devis direction"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-xs font-semibold rounded-md transition shadow-sm border border-gray-200"
                  >
                    {actioning ? <Spinner size={3} /> : (
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PDF Direction
                  </button>

                  <button
                    onClick={handleDevisClient}
                    disabled={actioning}
                    title="Générer le devis client"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-xs font-semibold rounded-md transition shadow-sm border border-gray-200"
                  >
                    {actioning ? <Spinner size={3} /> : (
                      <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PDF Client
                  </button>
                </div>

                {/* Séparateur */}
                <div className="h-6 w-px bg-gray-200" />

                {/* ── Groupe 2 : Workflow ── */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleEnvoyer}
                    disabled={actioning || !canEnvoyer}
                    title={!canEnvoyer ? 'Devis déjà envoyé ou approuvé' : 'Envoyer le devis'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 disabled:opacity-40 disabled:cursor-not-allowed text-violet-700 text-xs font-semibold rounded-lg transition"
                  >
                    {actioning ? <Spinner size={3} /> : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    Envoyer
                  </button>

                  <button
                    onClick={handleApprouver}
                    disabled={actioning}
                    title={!canApprouver ? "Impossible d'approuver dans cet état" : 'Approuver le devis'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 text-xs font-semibold rounded-lg transition"
                  >
                    {actioning ? <Spinner size={3} /> : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Approuver
                  </button>

                  <button
                    onClick={handleCreateEntete}
                    disabled={actioning || devis.statut !== 'DEVIS_APPROUVE'}
                    title={devis.statut !== 'DEVIS_APPROUVE' ? "Le devis doit être approuvé avant de créer l'assurance" : "Créer l'assurance"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition shadow-sm"
                  >
                    {actioning ? <Spinner size={3} /> : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    Créer assurance
                  </button>
                </div>
              </div>
          </div>
        </div>

        {/* ── Feedbacks ── */}
        <div className=" px-6 pt-4 space-y-2">
          {actionSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
              ✓ {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              ⚠️ {actionError}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

            {/* ── Colonne gauche ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Lignes */}
              <Card title={`Lignes de prospection · ${assuranceProspectionLignes.length}`}>
                {assuranceProspectionLignes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune ligne.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200 -mx-1">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <Th>Départ</Th>
                          <Th>Retour</Th>
                          <Th>Durée</Th>
                          <Th>Taux change</Th>
                          <Th>Réf. devis</Th>
                          <Th>Date devis</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {assuranceProspectionLignes.map((ligne) => (
                          <tr key={ligne.id} className="hover:bg-gray-50 transition">
                            <Td>{fmtDate(ligne.dateDepart)}</Td>
                            <Td>{fmtDate(ligne.dateRetour)}</Td>
                            <Td>
                              <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                                {ligne.duree} j
                              </span>
                            </Td>
                            <Td>{fmtNum(ligne.tauxChange)} Ar</Td>
                            <Td className="text-gray-400 italic text-xs">{ligne.referenceDevis ?? '—'}</Td>
                            <Td className="text-gray-400 text-xs">{fmtDate(ligne.dateDevis)}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Suivi */}
              <Card title="Suivi">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <DataRow label="Évolution"        value={<Badge status={suivi.evolution} />} />
                  <DataRow label="Statut"           value={<Badge status={suivi.statut} />} />
                  <DataRow label="Entité"           value={suivi.entity} />
                  <DataRow label="Envoi devis"      value={fmtDate(suivi.dateEnvoieDevis)} />
                  <DataRow label="Approbation"      value={fmtDate(suivi.dateApprobation)} />
                  <DataRow label="Réf. BC client"   value={suivi.referenceBcClient} />
                  <DataRow label="Création BC"      value={fmtDate(suivi.dateCreationBc)} />
                  <DataRow label="Soumis BC"        value={fmtDate(suivi.dateSoumisBc)} />
                  <DataRow label="Approbation BC"   value={fmtDate(suivi.dateApprobationBc)} />
                  <DataRow label="Réf. facture"     value={suivi.referenceFacClient} />
                  <DataRow label="Création facture" value={fmtDate(suivi.dateCreationFac)} />
                  <DataRow label="Règlement"        value={fmtDate(suivi.dateReglement)} />
                  <DataRow label="Annulation"       value={fmtDate(suivi.dateAnnulation)} />
                </div>
              </Card>
            </div>

            {/* ── Colonne droite ── */}
            <div className="space-y-4">

              {/* Devis */}
              <Card title="Devis">
                <DataRow label="Référence" value={
                  <span className="font-mono font-bold text-indigo-700">{devis.reference}</span>
                } />
                <DataRow label="Statut"    value={<Badge status={devis.statut} />} />
                <DataRow label="Total"     value={
                  <span className="text-base font-bold text-indigo-700">{fmtNum(devis.totalGeneral)} Ar</span>
                } />
                <DataRow label="Créé le"   value={fmtDate(devis.createdAt)} />
                {/* {devis.url1 && (
                  <DataRow label="URL 1" value={
                    <a href={devis.url1} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs underline">Voir</a>
                  } />
                )}
                {devis.url2 && (
                  <DataRow label="URL 2" value={
                    <a href={devis.url2} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs underline">Voir</a>
                  } /> */}
                {/* )} */}
              </Card>

              {/* Prospection */}
              <Card title="Prospection">
                <DataRow label="N° dossier"        value={prospectionAssurance.prestation.numeroDos} />
                <DataRow label="Client"            value={prospectionAssurance.clientFacture} />
                <DataRow label="N° dossier commun" value={`#${prospectionAssurance.numeroDossierCommun}`} />
                <DataRow label="Statut"            value={<Badge status={prospectionAssurance.prestation.status == 'CREER' ? 'créé' : prospectionAssurance.prestation.status} />} />
                <DataRow label="Fournisseur"       value={
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{prospectionAssurance.fournisseur.libelle}</p>
                    <p className="text-xs text-gray-400 font-mono">{prospectionAssurance.fournisseur.code}</p>
                  </div>
                } />
                <DataRow label="Créé le" value={fmtDate(prospectionAssurance.createdAt)} />
              </Card>

            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
};

export default PageDetailProspectionAssurance;