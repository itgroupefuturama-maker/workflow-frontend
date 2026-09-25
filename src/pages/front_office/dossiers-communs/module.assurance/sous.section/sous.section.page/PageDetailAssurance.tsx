import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceEnteteDetail,
  clearAssuranceEnteteDetail
} from '../../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { AssuranceHeader } from '../../components/AssuranceHeader';
import DossierActifCard from '../../../../../../components/CarteDossierActif/DossierActifCard';
import { API_URL } from '../../../../../../service/env';
import { FiArrowRight, FiFile } from 'react-icons/fi';
import PageSkeleton from '../../../../../../components/ui/PageSkeleton';
import { fmtDate, fmtNum } from '../../utils/formatters';
import StatusBadge from '../../../module.visa/components/StatusBadge';
import { FactureModal } from '../../components/ModalsFacturation';
import { FileText, Info, CreditCard, MapPin } from 'lucide-react';
import { useAuthorization } from '../../../../../../hooks/useAuthorization';

const MODULE = 'assurance';

const PageDetailAssurance = () => {
  const { ligneId } = useParams<{ ligneId: string }>();
  const dispatch    = useDispatch<AppDispatch>();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { canManage } = useAuthorization();
  const canManageAssurance = canManage(MODULE);

  const numeroDos = location.state?.numeroDos ?? '—';

  const tabs = [
    // { id: 'prospection', label: 'Listes des prospections' },
    // { id: 'assurance',   label: 'Listes des assurance' },
  ];

  const [activeTab, setActiveTab]       = useState(location.state?.targetTab || 'assurance');
  const [showFactModal, setShowFactModal] = useState(false);

  const { detail, loading } = useSelector((s: RootState) => s.assuranceEnteteDetail);
  const clientFactureId = useSelector(
    (s: RootState) => s.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  useEffect(() => {
    if (ligneId) dispatch(fetchAssuranceEnteteDetail(ligneId));
    return () => { dispatch(clearAssuranceEnteteDetail()); };
  }, [ligneId, dispatch]);

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [dispatch, clientFactureId]);

  const handleTabChange = (id: string) => {
    if (id === 'prospection') {
      navigate(`/dossiers-communs/assurance/pages`, { state: { targetTab: 'prospection' } });
    } else {
      setActiveTab(id);
    }
  };

  const handleFactureSaved = () => {
    setShowFactModal(false);
    if (ligneId) dispatch(fetchAssuranceEnteteDetail(ligneId));
  };

  if (loading) return <PageSkeleton />;

  if (!detail) return null;

  const prospection = detail.assuranceProspectionLigne;
  const ap          = prospection?.assuranceParams;
  const isConforme  = detail.statut === 'CONFORME';
  const tarifRef    = prospection?.assuranceTarifPlein ?? undefined;
  const tarif       = prospection?.assuranceTarifPlein;
  const devise      = tarif?.devise ?? '—';

  const factureInitial = {
    tauxChangeFacture:       String(detail?.tauxChangeFacture       ?? prospection?.tauxChange      ?? ''),
    puFactureAssureurDevise: String(detail?.puFactureAssureurDevise ?? tarif?.prixAssureurDevise    ?? ''),
    puFactureAssureurAriary: String(detail?.puFactureAssureurAriary ?? tarif?.prixAssureurAriary    ?? ''),
    puFactureClientAriary:   String(detail?.puFactureClientAriary   ?? tarif?.prixClientAriary      ?? ''),
    commissionFactureAriary: String(detail?.commissionFactureAriary ?? tarif?.commissionAriary      ?? ''),
    numeroPolice:            detail?.numeroPolice    ?? '',
    numeroQuittance:         detail?.numeroQuittance ?? '',
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex flex-col h-full min-h-0">

          {/* ── Header fixe ── */}
          <div className="shrink-0 px-4 bg-slate-200 rounded-t-xl">
            <div className="flex items-center justify-between">
              <AssuranceHeader
                numeroassurance={numeroDos}
                nomPassager=""
                navigate={navigate}
                isDetail={true}
                isProspection={false}
                isDevis={false}
              />
              <div className="flex items-center gap-2 py-2">
                <a
                  href={`${API_URL}/${detail.assuranceEntete?.pdfLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-orange-600 hover:border-orange-200 transition shadow-sm"
                >
                  <FiFile className="text-orange-500" />
                  PDF Accès Portail
                </a>
                <button
                  onClick={() => navigate(`/dossiers-communs/assurance/client-info/${detail.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
                >
                  Accéder au formulaire
                </button>
                <button
                  onClick={() => navigate(`/dossiers-communs/assurance/passager/${detail.id}`, {
                    state: {
                      nomPassager: detail.clientBeneficiaire?.libelle,
                      numeroDos: detail.numeroDossier,
                    }
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                >
                  Valider : <span className="font-normal opacity-90">{detail.clientBeneficiaire?.libelle}</span>
                  <FiArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Sous-header ── */}
          <div className="shrink-0 px-4 bg-slate-200 rounded-b-xl pb-2">
            <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />
            <div className="py-1 flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/dossiers-communs/assurance/pages', { state: { targetTab: 'assurance' } })}
            >
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-white text-sm transition">
                ←
              </button>
              <span className="text-sm font-bold text-gray-900">Retour</span>
            </div>
          </div>

          {/* ── Contenu scrollable ── */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4">

            {/* ══════════════════════════════════
                TABLEAU — Résumé du dossier
            ══════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th colSpan={4} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Info size={12} /> Résumé du dossier
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Statut ligne</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Créé le</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">N° ligne</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Bénéficiaire</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={detail.statusLigne} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                      {fmtDate(detail.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {detail.referenceLine ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {detail.clientBeneficiaire?.libelle ?? '—'}
                    </td>
                  </tr>

                  {/* ─── Sous-section : Paramètres ─── */}
                  {ap && (
                    <>
                      <tr className="bg-slate-100 border-t border-slate-200">
                        <td colSpan={4} className="px-4 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-slate-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Paramètres assurance</span>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-slate-50/60 border-b border-slate-100">
                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Zone destination</th>
                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Fournisseur</th>
                      </tr>
                      <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                        <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{ap.zoneDestination ?? '—'}</td>
                        <td className="px-4 py-2.5" colSpan={2}>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {ap.fournisseur?.libelle ?? '—'}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* ══════════════════════════════════
                TABLEAU — Séjour & Tarif
            ══════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th colSpan={4} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FileText size={12} /> Séjour &amp; Tarif de référence
                        {devise !== '—' && (
                          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {devise}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>

                  {/* ─── Séjour ─── */}
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Séjour</span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Date départ</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Date retour</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Durée</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Taux change prospection</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{fmtDate(prospection?.dateDepart)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{fmtDate(prospection?.dateRetour)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {prospection?.duree ? `${prospection.duree} jours` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap font-mono">
                      {prospection?.tauxChange ? `1 ${devise} = ${fmtNum(prospection.tauxChange)} Ar` : '—'}
                    </td>
                  </tr>

                  {/* ─── Tarif de référence ─── */}
                  {tarif && (
                    <>
                      <tr className="bg-slate-100 border-t border-slate-200">
                        <td colSpan={4} className="px-4 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tarif de référence</span>
                            <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded font-mono">
                              Durée couverte : {tarif.borneInf} → {tarif.borneSup} jours
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-slate-50/60 border-b border-slate-100">
                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Poste</th>
                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">En {devise}</th>
                        <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right" colSpan={2}>En Ariary</th>
                      </tr>
                      <tr className="hover:bg-gray-50 transition border-b border-gray-50">
                        <td className="px-4 py-2.5 text-xs text-gray-500">Prix assureur</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 text-right font-mono whitespace-nowrap">
                          {fmtNum(tarif.prixAssureurDevise)} {devise}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 text-right font-mono whitespace-nowrap" colSpan={2}>
                          {fmtNum(tarif.prixAssureurAriary)} Ar
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition border-b border-gray-50">
                        <td className="px-4 py-2.5 text-xs text-amber-600">Commission</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-amber-600 text-right font-mono whitespace-nowrap">
                          {fmtNum(tarif.commissionDevise)} {devise}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-amber-600 text-right font-mono whitespace-nowrap" colSpan={2}>
                          {fmtNum(tarif.commissionAriary)} Ar
                        </td>
                      </tr>
                      <tr className="bg-indigo-50/40 hover:bg-indigo-50/60 transition border-b border-indigo-100">
                        <td className="px-4 py-2.5 text-xs font-bold text-indigo-700">Prix client</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-indigo-700 text-right font-mono whitespace-nowrap">
                          {fmtNum(tarif.prixClientDevise)} {devise}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-bold text-indigo-700 text-right font-mono whitespace-nowrap" colSpan={2}>
                          {fmtNum(tarif.prixClientAriary)} Ar
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* ══════════════════════════════════
                TABLEAU — Informations client (formulaire)
            ══════════════════════════════════ */}
            {detail.clientAssuranceForm && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th colSpan={4} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Info size={12} /> Informations du bénéficiaire
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Nom</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Prénom</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Date naissance</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">N° passport</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {detail.clientAssuranceForm.nom ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                        {detail.clientAssuranceForm.prenom ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                        {fmtDate(detail.clientAssuranceForm.dateNaissance)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {detail.clientAssuranceForm.numeroPassport ?? '—'}
                        </span>
                      </td>
                    </tr>

                    {/* ─── Sous-section contact ─── */}
                    <tr className="bg-slate-100 border-t border-slate-200">
                      <td colSpan={4} className="px-4 py-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact & Identité</span>
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">N° CIN / Réf</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Email</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Adresse</th>
                    </tr>
                    <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {detail.clientAssuranceForm.numero ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-blue-600 whitespace-nowrap">
                        {detail.clientAssuranceForm.email ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>
                        {detail.clientAssuranceForm.adresse ?? '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ══════════════════════════════════
                TABLEAU — Documents soumis
            ══════════════════════════════════ */}
            {detail.assuranceDocClient && detail.assuranceDocClient.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th colSpan={3} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FileText size={12} /> Documents soumis
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Document</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Statut</th>
                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Fichier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.assuranceDocClient.map((doc) => {
                      // Retrouve le libellé du doc depuis assuranceDocParams
                      const docLabel = prospection?.assuranceParams?.assuranceDocParams
                        ?.find(p => p.assuranceDocId === doc.assuranceDocId)
                        ?.assuranceDoc?.document ?? doc.assuranceDocId;

                      return (
                        <tr key={doc.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                          <td className="px-4 py-2.5 text-xs font-semibold text-gray-800 whitespace-nowrap">
                            {docLabel}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              doc.status === 'CONFORME'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <a
                              href={`${API_URL}/${doc.pj}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
                            >
                              <FiFile size={12} /> Voir le fichier
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══════════════════════════════════
                TABLEAU — Facturation
            ══════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th colSpan={4} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard size={12} /> Facturation
                        </div>
                        {isConforme && canManageAssurance && (
                          <button
                            onClick={() => setShowFactModal(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-white/20 hover:bg-white/30 rounded-lg transition"
                          >
                            ✏️ Saisir facture
                          </button>
                        )}
                      </div>
                    </th>
                  </tr>

                  {/* ─── Prix ─── */}
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prix facturés</span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">PU assureur (devise)</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">PU assureur (Ar)</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Commission (Ar)</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">PU client (Ar)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-700 whitespace-nowrap">
                      {fmtNum(detail.puFactureAssureurDevise) ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-700 whitespace-nowrap">
                      {detail.puFactureAssureurAriary ? `${fmtNum(detail.puFactureAssureurAriary)} Ar` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-amber-600 whitespace-nowrap">
                      {detail.commissionFactureAriary ? `${fmtNum(detail.commissionFactureAriary)} Ar` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold font-mono text-indigo-700 whitespace-nowrap">
                      {detail.puFactureClientAriary ? `${fmtNum(detail.puFactureClientAriary)} Ar` : '—'}
                    </td>
                  </tr>

                  {/* ─── Références ─── */}
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Références &amp; Taux</span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Taux change facture</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">N° police</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">N° quittance</th>
                    <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">N° ligne</th>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-700 whitespace-nowrap">
                      {fmtNum(detail.tauxChangeFacture) ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {detail.numeroPolice ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {detail.numeroQuittance ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {detail.referenceLine ?? '—'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Modal facturation */}
        {showFactModal && detail?.id && (
          <FactureModal
            assuranceId={detail.id}
            initial={factureInitial}
            tarifRef={tarifRef}
            onClose={() => setShowFactModal(false)}
            onSaved={handleFactureSaved}
          />
        )}
      </TabContainer>
    </div>
  );
};

export default PageDetailAssurance;