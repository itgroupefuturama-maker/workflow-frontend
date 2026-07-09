import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchPassagerDetail,
  clearPassagerDetail,
  validateClientForm,
  validateDocument,
  syncPassagerInfo,
  validateAssuranceForm,
  validateAssuranceDocument,
  syncAssuranceInfo,
} from '../../../../../../app/front_office/parametre_visa/passagerDetailSlice';
import { API_URL_PORTAIL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import { AssuranceHeader } from '../../components/AssuranceHeader';
import { Badge, Spinner } from '../../components/atoms';
import { fmtDate } from '../../utils/formatters';
import { FileText, User, Phone, Briefcase, Users, Info, ShieldCheck } from 'lucide-react';

/* ── ActionButton ── */
const ActionButton = ({
  onClick, loading, done, label, statut, doneLabel, color = 'green',
}: {
  onClick: () => void; loading: boolean; done: boolean;
  label: string; statut: string; doneLabel: string; color?: 'green' | 'indigo' | 'violet';
}) => {
  const isDisabled = loading || statut === 'VALIDER' || statut === 'VALIDE';
  const colors = {
    green:  'bg-emerald-600 hover:bg-emerald-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    violet: 'bg-violet-600 hover:bg-violet-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold transition-all ${
        isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : colors[color]
      }`}
    >
      {loading ? <Spinner /> : done ? '✓' : null}
      {done ? doneLabel : label}
    </button>
  );
};

/* ─────────────────────── page principale ─────────────────── */

const PageDetailPassager = () => {
  const { passagerId } = useParams<{ passagerId: string }>();
  const dispatch       = useDispatch<AppDispatch>();
  const navigate       = useNavigate();
  const location       = useLocation();

  const nomPassager = location.state?.nomPassager ?? 'Passager';

  const { detail, loading } = useSelector((s: RootState) => s.passagerDetail);

  const [formLoading,   setFormLoading]   = useState<Record<string, boolean>>({});
  const [formDone,      setFormDone]      = useState<Record<string, boolean>>({});
  const [docLoading,    setDocLoading]    = useState<Record<string, boolean>>({});
  const [docDone,       setDocDone]       = useState<Record<string, boolean>>({});
  const [syncLoading,   setSyncLoading]   = useState(false);
  const [syncDone,      setSyncDone]      = useState(false);
  const [actionError,   setActionError]   = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());

  const tabs = [
    { id: 'prospection',  label: 'Listes des prospections' },
    { id: 'assurance',    label: 'Listes des assurance' },
    { id: 'beneficiaire', label: 'Listes des bénéficiaires' },
  ];
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'assurance');

  const isAssurance = detail?.userType === 'ASSURANCE';

  const toggleForm = (id: string) =>
    setExpandedForms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    if (passagerId) dispatch(fetchPassagerDetail(passagerId));
    return () => { dispatch(clearPassagerDetail()); };
  }, [passagerId, dispatch]);

  const handleValidateForm = async (formId: string) => {
    setActionError(''); setActionSuccess('');
    setFormLoading(p => ({ ...p, [formId]: true }));
    try {
      const thunk = isAssurance ? validateAssuranceForm : validateClientForm;
      await dispatch(thunk(formId)).unwrap();
      setFormDone(p => ({ ...p, [formId]: true }));
      setActionSuccess('Formulaire validé avec succès.');
      if (passagerId) dispatch(fetchPassagerDetail(passagerId));
    } catch (e: any) {
      setActionError(e ?? 'Erreur validation formulaire.');
    } finally {
      setFormLoading(p => ({ ...p, [formId]: false }));
    }
  };

  const handleValidateDoc = async (docId: string) => {
    setActionError(''); setActionSuccess('');
    setDocLoading(p => ({ ...p, [docId]: true }));
    try {
      const thunk = isAssurance ? validateAssuranceDocument : validateDocument;
      await dispatch(thunk(docId)).unwrap();
      setDocDone(p => ({ ...p, [docId]: true }));
      setActionSuccess('Document validé avec succès.');
      if (passagerId) dispatch(fetchPassagerDetail(passagerId));
    } catch (e: any) {
      setActionError(e ?? 'Erreur validation document.');
    } finally {
      setDocLoading(p => ({ ...p, [docId]: false }));
    }
  };

  const handleSync = async () => {
    if (!passagerId || !detail) return;
    setActionError(''); setActionSuccess('');
    setSyncLoading(true);
    try {
      const thunk = isAssurance ? syncAssuranceInfo : syncPassagerInfo;
      await dispatch(thunk(passagerId)).unwrap();
      setSyncDone(true);
      setActionSuccess('Données synchronisées avec succès.');
      dispatch(fetchPassagerDetail(passagerId));
    } catch (e: any) {
      setActionError(e ?? 'Erreur synchronisation.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTabChange = (id: string) => {
    if (id === 'prospection') {
      navigate(`/dossiers-communs/assurance/pages`, { state: { targetTab: 'prospection' } });
    } else {
      setActiveTab(id);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Spinner /> <span className="text-sm">Chargement…</span>
    </div>
  );

  const forms = isAssurance
    ? (detail?.clientAssuranceForms ?? [])
    : (detail?.clientBeneficiaireForms ?? []);

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex flex-col h-full min-h-0">

          {/* ── Header fixe ── */}
          <div className="shrink-0 px-4 bg-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <AssuranceHeader
                numeroassurance={detail?.assurance?.zoneDestination}
                nomPassager={nomPassager}
                navigate={navigate}
                isDetail={true}
                isProspection={false}
                isPassager={true}
              />
              <button
                onClick={handleSync}
                disabled={syncLoading}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold transition"
              >
                {syncLoading ? <Spinner /> : syncDone ? '✓' : '⚡'}
                {syncDone ? 'Synchronisé' : 'Synchroniser'}
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

            {detail && (
              <>
                {/* ══════════════════════════════════
                    TABLEAU — Résumé du compte
                ══════════════════════════════════ */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-700 text-white">
                        <th colSpan={5} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Info size={12} /> Résumé du compte
                          </div>
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Type</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Statut</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Validation</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Créé le</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Nom passager</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {detail.userType}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge status={detail.actif ? 'ACTIF' : 'INACTIF'} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge status={detail.isValidate ? 'VALIDE' : 'EN_ATTENTE'} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {fmtDate(detail.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                          {nomPassager}
                        </td>
                      </tr>

                      {/* ─── Sous-section assurance ─── */}
                      {isAssurance && detail.assurance && (
                        <>
                          <tr className="bg-slate-100 border-t border-slate-200">
                            <td colSpan={5} className="px-4 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck size={10} className="text-slate-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Informations assurance</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="bg-slate-50/60 border-b border-slate-100">
                            <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Zone destination</th>
                            <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Assureur</th>
                          </tr>
                          <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                            <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{detail.assurance.zoneDestination ?? '—'}</td>
                            <td className="px-4 py-2.5 text-xs font-semibold text-gray-700" colSpan={3}>{detail.assurance.assureur ?? '—'}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ══════════════════════════════════
                    TABLEAU — Documents
                ══════════════════════════════════ */}
                {detail.userDocument.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-700 text-white">
                          <th colSpan={5} className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <FileText size={12} />
                              Documents
                              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {detail.userDocument.length}
                              </span>
                            </div>
                          </th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Nom du document</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Date ajout</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Statut</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Aperçu</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {detail.userDocument.map((doc, dIdx) => (
                          <tr key={doc.id} className={dIdx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-slate-50/40 hover:bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-base">📄</div>
                                <span className="text-sm font-semibold text-gray-800">{doc.nomDoc}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 text-center whitespace-nowrap">
                              {fmtDate(doc.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <Badge status={doc.status} />
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <a
                                href={`${API_URL_PORTAIL}${doc.pj}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-indigo-600 text-[11px] font-semibold rounded-lg hover:bg-indigo-50 transition"
                              >
                                Voir
                              </a>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <ActionButton
                                onClick={() => handleValidateDoc(doc.id)}
                                loading={docLoading[doc.id] ?? false}
                                statut={doc.status}
                                done={docDone[doc.id] ?? (doc.status === 'VALIDE' || doc.status === 'VALIDER')}
                                label="Valider" doneLabel="Validé" color="green"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ══════════════════════════════════
                    TABLEAU — Formulaires ASSURANCE
                ══════════════════════════════════ */}
                {isAssurance && (
                  forms.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400 italic">
                      Aucun formulaire d'assurance pour ce passager.
                    </div>
                  ) : (
                    forms.map((form: any, fIdx: number) => (
                      <div key={form.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-700 text-white">
                              <th colSpan={5} className="px-4 py-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck size={12} />
                                    <span className="text-[11px] font-black uppercase tracking-wider">
                                      Formulaire Assurance #{fIdx + 1} — {form.prenom} {form.nom}
                                    </span>
                                    <Badge status={form.status} />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ActionButton
                                      onClick={() => handleValidateForm(form.id)}
                                      loading={formLoading[form.id] ?? false}
                                      statut={form.status}
                                      done={formDone[form.id] ?? form.status === 'VALIDER'}
                                      label="Confirmer" doneLabel="Confirmé" color="green"
                                    />
                                    <button
                                      onClick={() => toggleForm(form.id)}
                                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                    >
                                      {expandedForms.has(form.id) ? '▲ Réduire' : '▼ Voir détails'}
                                    </button>
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Nom complet</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Date naissance</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Téléphone</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Email</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">N° Passport</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{form.prenom} {form.nom}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(form.dateNaissance)}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.numero ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.email ?? '—'}</td>
                              <td className="px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{form.numeroPassport ?? '—'}</td>
                            </tr>

                            {expandedForms.has(form.id) && (
                              <>
                                <tr className="bg-slate-100 border-t border-slate-200">
                                  <td colSpan={5} className="px-4 py-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Informations complémentaires</span>
                                  </td>
                                </tr>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Adresse</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>—</th>
                                </tr>
                                <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{form.adresse ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3} />
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )
                )}

                {/* ══════════════════════════════════
                    TABLEAU — Formulaires VISA
                ══════════════════════════════════ */}
                {!isAssurance && (
                  forms.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400 italic">
                      Aucun formulaire rempli pour ce passager.
                    </div>
                  ) : (
                    forms.map((form: any, fIdx: number) => (
                      <div key={form.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-700 text-white">
                              <th colSpan={9} className="px-4 py-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User size={12} />
                                    <span className="text-[11px] font-black uppercase tracking-wider">
                                      Formulaire #{fIdx + 1} — {form.prenom} {form.nom}
                                    </span>
                                    <Badge status={form.status} />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ActionButton
                                      onClick={() => handleValidateForm(form.id)}
                                      loading={formLoading[form.id] ?? false}
                                      statut={form.status}
                                      done={formDone[form.id] ?? form.status === 'VALIDE'}
                                      label="Confirmer" doneLabel="Confirmé" color="green"
                                    />
                                    <button
                                      onClick={() => toggleForm(form.id)}
                                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                    >
                                      {expandedForms.has(form.id) ? '▲ Réduire' : '▼ Voir détails'}
                                    </button>
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Nom complet</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Sexe</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Date naissance</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Nationalité</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">État civil</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Pays résidence</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Type doc</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Réf. doc</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Validité doc</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Ligne résumé */}
                            <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{form.prenom} {form.nom}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.sexe ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(form.dateNaissance)}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.nationalite ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.etatCivil ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.paysResidence ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{form.typeDoc ?? '—'}</td>
                              <td className="px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{form.referenceDoc ?? '—'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(form.dateValiditeDoc)}</td>
                            </tr>

                            {/* Détails expandés */}
                            {expandedForms.has(form.id) && (
                              <>
                                {/* ─── Contact ─── */}
                                <tr className="bg-slate-100 border-t border-slate-200">
                                  <td colSpan={9} className="px-4 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Phone size={10} className="text-slate-500" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact</span>
                                    </div>
                                  </td>
                                </tr>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Téléphone</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Email</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Adresse</th>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3}>{form.numero ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3}>{form.email ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3}>{form.adresse ?? '—'}</td>
                                </tr>

                                {/* ─── Contact urgence ─── */}
                                <tr className="bg-slate-100 border-t border-slate-200">
                                  <td colSpan={9} className="px-4 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Phone size={10} className="text-slate-500" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact d'urgence</span>
                                    </div>
                                  </td>
                                </tr>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Nom</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Téléphone</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Email</th>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3}>{form.prenomContactUrgence} {form.nomContactUrgence}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3}>{form.numeroContactUrgence ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={3}>{form.emailContactUrgence ?? '—'}</td>
                                </tr>

                                {/* ─── Profession ─── */}
                                <tr className="bg-slate-100 border-t border-slate-200">
                                  <td colSpan={9} className="px-4 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Briefcase size={10} className="text-slate-500" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Profession</span>
                                    </div>
                                  </td>
                                </tr>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Profession</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Employeur</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Tél. pro</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Email pro</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Établissement</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Diplôme</th>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{form.professionActuelle ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{form.nomEmployeur ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700">{form.numeroTelephone ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{form.emailProfessionnel ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700">{form.etablissement ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700">{form.diplome ?? '—'}</td>
                                </tr>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={9}>Adresse professionnelle</th>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={9}>{form.adresseProfessionnel ?? '—'}</td>
                                </tr>

                                {/* ─── Document d'identité ─── */}
                                <tr className="bg-slate-100 border-t border-slate-200">
                                  <td colSpan={9} className="px-4 py-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <FileText size={10} className="text-slate-500" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document d'identité</span>
                                    </div>
                                  </td>
                                </tr>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Type</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={3}>Référence</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Délivrance</th>
                                  <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Validité</th>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{form.typeDoc ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs font-mono text-gray-700" colSpan={3}>{form.referenceDoc ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{fmtDate(form.dateDelivranceDoc)}</td>
                                  <td className="px-4 py-2.5 text-xs text-gray-700" colSpan={2}>{fmtDate(form.dateValiditeDoc)}</td>
                                </tr>

                                {/* ─── Personnes liées ─── */}
                                {form.clientBeneficiairePerson?.length > 0 && (
                                  <>
                                    <tr className="bg-slate-100 border-t border-slate-200">
                                      <td colSpan={9} className="px-4 py-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <Users size={10} className="text-slate-500" />
                                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Personnes liées</span>
                                          <span className="text-[10px] bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                                            {form.clientBeneficiairePerson.length}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr className="bg-slate-50/60 border-b border-slate-100">
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left" colSpan={2}>Nom</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Type</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Sexe</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Naissance</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Nationalité</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">État civil</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Email</th>
                                      <th className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left">Téléphone</th>
                                    </tr>
                                    {form.clientBeneficiairePerson.map((person: any, pIdx: number) => (
                                      <tr key={person.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                        <td className="px-4 py-2.5 whitespace-nowrap" colSpan={2}>
                                          <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 text-[9px] font-black shrink-0">
                                              {person.prenom?.[0]}{person.nom?.[0]}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-800">{person.prenom} {person.nom}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                                            {person.typePerson}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{person.sexe ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(person.dateNaissance)}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{person.nationalite ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{person.etatCivil ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{person.email ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{person.numero ?? '—'}</td>
                                      </tr>
                                    ))}
                                  </>
                                )}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )
                )}
              </>
            )}
          </div>
        </div>
      </TabContainer>
    </div>
  );
};

export default PageDetailPassager;