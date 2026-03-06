import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { FiUser } from 'react-icons/fi';
import {
  clearVisaEnteteDetail,
  fetchVisaEnteteDetail,
  generateAccesPortail,
} from '../../../../../../app/front_office/parametre_visa/visaEnteteDetailSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import StatusBadge from '../../components/StatusBadge';
import CreateAccesPortailModal from '../../components/CreateAccesPortailModal';
import PassagerDetailModal from '../../components/PassagerDetailModal';
import { API_URL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import { VisaHeader } from '../../components/VisaHeader';

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
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      {action}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between py-1.5 text-sm border-b border-gray-50 last:border-0">
    <span className="text-gray-400 shrink-0 w-48">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value ?? '—'}</span>
  </div>
);

const SectionTitle = ({ label }: { label: string }) => (
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-4 mb-2">{label}</p>
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

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Chargement...
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-red-500 font-medium">⚠️ {error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">← Retour</button>
      </div>
    </div>
  );

  if (!detail) return null;

  const prestation     = detail.visaProspectionEntete.prestation;
  const totalPersonnes = detail.visaLigne.reduce((s, l) => s + l.visaProspectionLigne.nombre, 0);
  const totalAriary    = detail.visaLigne.reduce(
    (s, l) => s + l.visaProspectionLigne.puClientAriary * l.visaProspectionLigne.nombre, 0
  );

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="min-h-screen bg-neutral-50 p-4 space-y-4">
          <div className="">
              <VisaHeader numerovisa={prestation.numeroDos} navigate={navigate} isDetail={true}/>
          </div>

        {/* ── Topbar ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">

            {/* Gauche */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dossiers-communs/visa/pages', { state: { targetTab: 'visa' } })}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              >←</button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Détail Visa
                </h1>
                <p className="text-sm text-gray-400">
                  {prestation.numeroDos} — créé le {fmtDate(detail.createdAt)}
                </p>
              </div>
            </div>

            {/* Droite : actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={detail.statut} />
              <StatusBadge status={detail.statutEntete} />

              <button
                onClick={() => setShowAccesPortail(true)}
                disabled={detail.visaLigne.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                🔐 Accès portail
              </button>

              <button
                onClick={handleGenerate}
                disabled={generateLoading || detail.visaLigne.length === 0}
                className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generateLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Génération...
                  </>
                ) : '⚡ Générer portail'}
              </button>
            </div>
          </div>

          {/* Feedbacks */}
          {generateSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              ✓ {generateSuccess}
            </div>
          )}
          {generateError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              ⚠️ {generateError}
            </div>
          )}
        </div>

        {/* ── Informations générales ── */}
        <Card title="Informations générales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <Row label="Dossier visa"    value={prestation.numeroDos} />
            <Row label="Statut"          value={<StatusBadge status={detail.statut} />} />
            <Row label="Statut entête"   value={<StatusBadge status={detail.statutEntete} />} />
            <Row label="PDF Login"       value={
              detail.pdfLogin
                ? <a href={`${API_URL}/${detail.pdfLogin}`} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-xs">Voir PDF</a>
                : 'Non disponible'
            } />
            <Row label="Créé le"         value={fmtDate(detail.createdAt)} />
            <Row label="Dernière MAJ"    value={fmtDate(detail.updatedAt)} />
            <Row label="Total personnes" value={`${totalPersonnes} pers.`} />
            <Row label="Total client"    value={
              <span className="text-indigo-700 font-bold text-base">
                {totalAriary.toLocaleString('fr-FR')} Ar
              </span>
            } />
          </div>
        </Card>

        {/* ── Lignes visa (accordéon) ── */}
        <Card title={`Lignes visa (${detail.visaLigne.length})`}>
          {detail.visaLigne.length === 0 ? (
            <EmptyMsg msg="Aucune ligne visa" />
          ) : (
            <div className="space-y-3">
              {detail.visaLigne.map((ligne, idx) => {
                const vp       = ligne.visaProspectionLigne;
                const vParams  = vp.visaParams;
                const expanded = expandedLignes.has(ligne.id);
                const accesPortailListe = ligne.accesPortail ?? [];
                const sousTotal = vp.puClientAriary * vp.nombre;
                const passagers = ligne.passagers ?? [];

                return (
                  <div key={ligne.id} className="rounded-xl border border-gray-100 overflow-hidden">

                    {/* ── Header accordéon ── */}
                    <button
                      onClick={() => toggleLigne(ligne.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition text-left"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                        <span className="font-semibold text-gray-800 text-sm">
                          {vParams.pays.pays}
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            {vParams.code} — {vParams.visaType.nom}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
                          {ligne.referenceLine}
                        </span>
                        <StatusBadge status={ligne.statusLigne} />
                        <StatusBadge status={ligne.statusVisa} />
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-indigo-700">
                          {sousTotal.toLocaleString('fr-FR')} Ar
                        </span>
                        <span className={`text-xs font-semibold ${vp.etatPiece ? 'text-green-600' : 'text-orange-500'}`}>
                          {vp.etatPiece ? '✓ Pièces OK' : '✗ Incomplet'}
                        </span>
                        <svg
                          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* ── Corps accordéon ── */}
                    {expanded && (
                      <div className="px-4 py-4 space-y-5 bg-white">

                        {/* Grille infos séjour / consulat / tarifs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Séjour</p>
                            <p className="text-sm font-medium text-gray-800">
                              {fmtDate(vp.dateDepart)} → {fmtDate(vp.dateRetour)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {vParams.visaDuree.duree} j · {vParams.visaEntree.entree} · {vp.nombre} pers.
                            </p>
                            <p className="text-xs text-gray-500">
                              Traitement : {vParams.dureeTraitement} j
                            </p>
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Consulat</p>
                            <p className="text-sm font-medium text-gray-800 capitalize">{vp.consulat.nom}</p>
                            <p className="text-xs text-gray-500">
                              PU : {fmtNum(vp.puConsulatDevise)} {vp.devise}
                            </p>
                            <p className="text-xs text-gray-500">
                              PU Ar : {fmtNum(vp.puConsulatAriary)} Ar
                            </p>
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Tarif client</p>
                            <p className="text-sm font-bold text-indigo-700">
                              {fmtNum(sousTotal)} Ar
                            </p>
                            <p className="text-xs text-gray-500">
                              {fmtNum(vp.puClientDevise)} {vp.devise} × {vp.nombre} pers.
                            </p>
                            <p className="text-xs text-gray-500">
                              Taux : 1 {vp.devise} = {fmtNum(vp.tauxEchange)} Ar
                            </p>
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Soumission</p>
                            <p className="text-xs text-gray-500">Taux : {fmtNum(ligne.soummissionTauxChange)}</p>
                            <p className="text-xs text-gray-500">PU consulat : {fmtNum(ligne.soummissionPuConsilatAriary)} Ar</p>
                            <p className="text-xs text-gray-500">PU client : {fmtNum(ligne.soummissionPuClientAriary)} Ar</p>
                            <p className="text-xs text-gray-500">Commission : {fmtNum(ligne.soummissionCommissionAriary)} Ar</p>
                            <p className="text-xs text-gray-500">Réf. : {ligne.referenceSoummision ?? '—'}</p>
                            <p className="text-xs text-gray-500">Limite : {fmtDate(ligne.limiteSoummision)}</p>
                          </div>
                        </div>

                        {/* Infos complémentaires */}
                        {(ligne.numeroDossier || ligne.resultatVisa || ligne.variante || ligne.limitePaiement) && (
                          <>
                            <SectionTitle label="Informations complémentaires" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {ligne.numeroDossier  && <Row label="N° dossier"      value={ligne.numeroDossier} />}
                              {ligne.variante       && <Row label="Variante"         value={ligne.variante} />}
                              {ligne.resultatVisa   && <Row label="Résultat visa"    value={ligne.resultatVisa} />}
                              {ligne.limitePaiement && <Row label="Limite paiement" value={fmtDate(ligne.limitePaiement)} />}
                            </div>
                          </>
                        )}

                        {/* ── Passagers / Accès portail ── */}
                        <span className="font-mono text-xs text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
                          {ligne.referenceLine}
                        </span>

                        <SectionTitle label={`Passagers (${passagers.length} / ${vp.nombre})`} />

                        {passagers.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            ⚠ Aucun passager assigné — utilisez le bouton "Accès portail"
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {passagers.map((passager) => {
                              const acces = ligne.accesPortail?.find(
                                a => a.passager?.id === passager.clientbeneficiaireId
                              );
                              const isActif = passager.clientbeneficiaire.statut === 'ACTIF';

                              return (
                                <div
                                  key={passager.id}
                                  className="bg-white rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                  {/* ── Header ── */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                      {/* Avatar initiales */}
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
                                        {passager.clientbeneficiaire.libelle
                                          ?.split(' ')
                                          .slice(0, 2)
                                          .map((n: string) => n[0])
                                          .join('')
                                          .toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                                          {passager.clientbeneficiaire.libelle}
                                        </p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                                          {passager.clientbeneficiaire.code}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {/* Statut dot */}
                                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                        isActif
                                          ? 'text-emerald-600 bg-emerald-50'
                                          : 'text-gray-400 bg-gray-100'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        {isActif ? 'Actif' : 'Inactif'}
                                      </span>
                                      <button
                                        onClick={() => setPassagerModal({
                                          idVisaAbstract: passager.id,
                                          nom: passager.clientbeneficiaire.libelle,
                                        })}
                                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition"
                                      >
                                        <FiUser size={11} />
                                        Détail
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── Accès portail ── */}
                                  {acces ? (
                                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                                      <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                          Login
                                        </p>
                                        {acces.login ? (
                                          <p className="text-xs font-mono bg-gray-50 rounded-lg px-2.5 py-1.5 text-gray-700 break-all">
                                            {acces.login}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-gray-300 italic">Non généré</p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                          Mot de passe
                                        </p>
                                        {acces.password ? (
                                          <p className="text-xs font-mono bg-gray-50 rounded-lg px-2.5 py-1.5 text-gray-700 break-all">
                                            {acces.password}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-gray-300 italic">Non généré</p>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                                      <p className="text-xs text-gray-400">Portail non encore généré</p>
                                    </div>
                                  )}

                                  {/* ── Footer ── */}
                                  <p className="text-[10px] text-gray-300 pt-1 border-t border-gray-50">
                                    Assigné le {fmtDate(passager.createdAt)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {passagerModal && (
          <PassagerDetailModal
            idVisaAbstract={passagerModal.idVisaAbstract}
            nomPassager={passagerModal.nom}
            onClose={() => setPassagerModal(null)}
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

      </div>
    </TabContainer>
  );
};

export default PageDetailVisa;