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
} from '../../../../../../app/front_office/parametre_visa/passagerDetailSlice';
import { API_URL_PORTAIL } from '../../../../../../service/env';
import TabContainer from '../../../../../../layouts/TabContainer';
import { VisaHeader } from '../../components/VisaHeader';
import { Briefcase, FileText, Phone, User, Users } from 'lucide-react';

/* ─────────────────────── helpers ─────────────────────── */

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─────────────────────── atoms ───────────────────────── */

const Spinner = ({ size = 4 }: { size?: number }) => (
  <svg className={`animate-spin h-${size} w-${size}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const Badge = ({ status }: { status: string }) => {
  const isValid = status === 'VALIDE' || status === 'VALIDER';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
      isValid
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      {status}
    </span>
  );
};

/* Card container */
const Card = ({ title, badge, action, children }: {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {badge}
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

/* Row dans un tableau de données */
const DataRow = ({ label, value, valueClass = '' }: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium text-gray-900 text-right ${valueClass}`}>{value ?? '—'}</span>
  </div>
);

/* Grille de champs (section formulaire) */
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
  </div>
);

const SectionLabel = ({ label }: { label: string }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 pt-1 pb-2 border-b border-indigo-50 mb-3">
    {label}
  </p>
);

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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all ${
        isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : colors[color]
      }`}
    >
      {loading ? <Spinner size={3} /> : done ? '✓' : null}
      {done ? doneLabel : label}
    </button>
  );
};

/* ─────────────────────── page ────────────────────────── */

const PageDetailPassager = () => {
  const { passagerId } = useParams<{ passagerId: string }>();
  const dispatch       = useDispatch<AppDispatch>();
  const navigate       = useNavigate();
  const location       = useLocation();

  const nomPassager = location.state?.nomPassager ?? 'Passager';
  const numeroDos   = location.state?.numeroDos ?? null; 
  const { detail, loading, error } = useSelector((s: RootState) => s.passagerDetail);

  const [formLoading,   setFormLoading]   = useState<Record<string, boolean>>({});
  const [formDone,      setFormDone]      = useState<Record<string, boolean>>({});
  const [docLoading,    setDocLoading]    = useState<Record<string, boolean>>({});
  const [docDone,       setDocDone]       = useState<Record<string, boolean>>({});
  const [syncLoading,   setSyncLoading]   = useState(false);
  const [syncDone,      setSyncDone]      = useState(false);
  const [actionError,   setActionError]   = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const tabs = [
      { id: 'prospection', label: 'Listes des prospections' },
      { id: 'visa',        label: 'Listes des visa' },
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'visa');

  useEffect(() => {
    if (passagerId) dispatch(fetchPassagerDetail(passagerId));
    return () => { dispatch(clearPassagerDetail()); };
  }, [passagerId, dispatch]);

  const handleValidateForm = async (formId: string) => {
    setActionError(''); setActionSuccess('');
    setFormLoading(p => ({ ...p, [formId]: true }));
    try {
      await dispatch(validateClientForm(formId)).unwrap();
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
      await dispatch(validateDocument(docId)).unwrap();
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
    if (!passagerId) return;
    setActionError(''); setActionSuccess('');
    setSyncLoading(true);
    try {
      await dispatch(syncPassagerInfo(passagerId)).unwrap();
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
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/visa/pages`, { 
          state: { targetTab: 'prospection' }
      });
      } else {
      setActiveTab(id);
      }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Spinner /> <span className="text-sm">Chargement…</span>
    </div>
  );
  /* ── rendu ── */
  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="py-2 px-4 space-y-4">
          <div className="flex flex-row justify-between">
              <VisaHeader numerovisa={numeroDos} nomPassager={nomPassager} navigate={navigate} isDetail={true} isPassager={true}/>

              <button
                onClick={handleSync}
                disabled={syncLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold transition"
              >
                {syncLoading ? <Spinner size={3} /> : syncDone ? '✓' : '⚡'}
                {syncDone ? 'Synchronisé' : 'Synchroniser'}
              </button>
          </div>

          {/* ══ Content ══ */}
          <div className="space-y-4">

            {/* feedbacks */}
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

            {detail && (
              <>
                {/* ══ Layout 2 colonnes ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                  {/* ── Colonne gauche (2/3) ── */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* ══════════════════════════════════
                        SECTION — Documents
                    ══════════════════════════════════ */}
                    {detail.userDocument.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-gray-900">Documents</h2>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              {detail.userDocument.length}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {detail.userDocument.map((doc) => (
                            <div
                              key={doc.id}
                              className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                            >
                              {/* icône + infos */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-lg">
                                  📄
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.nomDoc}</p>
                                  <div className="flex items-center gap-2 mt-2 mb-2 flex-wrap">
                                    <span className="text-xs text-gray-400">{fmtDate(doc.createdAt)}</span>
                                  </div>
                                  <Badge status={doc.status} />
                                </div>
                              </div>
                              {/* actions */}
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <a
                                  href={`${API_URL_PORTAIL}${doc.pj}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition"
                                >
                                  Voir
                                </a>
                                <ActionButton
                                  onClick={() => handleValidateDoc(doc.id)}
                                  loading={docLoading[doc.id] ?? false}
                                  statut={doc.status}
                                  done={docDone[doc.id] ?? doc.status === 'VALIDE'}
                                  label="Valider"
                                  doneLabel="Validé"
                                  color="green"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* ══════════════════════════════════
                        SECTION — Formulaires
                    ══════════════════════════════════ */}
                    {detail.clientBeneficiaireForms.length === 0 ? (
                      <div className="bg-white border border-dashed border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400 italic">
                        Aucun formulaire rempli pour ce passager.
                      </div>
                    ) : (
                      detail.clientBeneficiaireForms.map((form, fIdx) => (
                        <section key={form.id}>

                          {/* ── Titre de section formulaire ── */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <h2 className="text-base font-bold text-gray-900">{form.prenom} {form.nom}</h2>
                              <span className="text-xs text-gray-400 font-medium">Formulaire #{fIdx + 1}</span>
                              <Badge status={form.status} />
                            </div>
                            <ActionButton
                              onClick={() => handleValidateForm(form.id)}
                              loading={formLoading[form.id] ?? false}
                              statut={form.status}
                              done={formDone[form.id] ?? form.status === 'VALIDE'}
                              label="Confirmer"
                              doneLabel="Confirmé"
                              color="green"
                            />
                          </div>

                          {/* ── Card principale ── */}
                          <div className="overflow-hidden space-y-4">

                            {/* ── Identité ── */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                  <User size={12} className="text-indigo-600" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Identité</p>
                              </div>
                              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                <Field label="Nom"            value={form.nom} />
                                <Field label="Prénom"         value={form.prenom} />
                                <Field label="Sexe"           value={form.sexe} />
                                <Field label="Date naissance" value={fmtDate(form.dateNaissance)} />
                                <Field label="Lieu naissance" value={form.lieuNaissance} />
                                <Field label="Nationalité"    value={form.nationalite} />
                                <Field label="État civil"     value={form.etatCivil} />
                                <Field label="Adresse"        value={form.adresse} />
                                <Field label="Pays résidence" value={form.paysResidence} />
                              </div>
                            </div>

                            {/* ── Contact + Contact d'urgence ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                                  <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                                    <Phone size={12} className="text-rose-500" />
                                  </div>
                                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Contact d'urgence</p>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-2">
                                  <Field label="Nom"       value={`${form.prenomContactUrgence} ${form.nomContactUrgence}`} />
                                  <Field label="Téléphone" value={form.numeroContactUrgence} />
                                  <Field label="Email"     value={form.emailContactUrgence} />
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Phone size={12} className="text-emerald-600" />
                                  </div>
                                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Contact</p>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-2">
                                  <Field label="Téléphone" value={form.numero} />
                                  <Field label="Email"     value={form.email} />
                                </div>
                              </div>

                            </div>

                            {/* ── Profession ── */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                  <Briefcase size={12} className="text-amber-600" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Profession</p>
                              </div>
                              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                <Field label="Profession"    value={form.professionActuelle} />
                                <Field label="Employeur"     value={form.nomEmployeur} />
                                <Field label="Tél. pro"      value={form.numeroTelephone} />
                                <Field label="Email pro"     value={form.emailProfessionnel} />
                                <Field label="Adresse pro"   value={form.adresseProfessionnel} />
                                <Field label="Établissement" value={form.etablissement} />
                                <Field label="Diplôme"       value={form.diplome} />
                              </div>
                            </div>

                            {/* ── Document d'identité ── */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                  <FileText size={12} className="text-blue-600" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Document d'identité</p>
                              </div>
                              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                <Field label="Type"       value={form.typeDoc} />
                                <Field label="Référence"  value={form.referenceDoc} />
                                <Field label="Délivrance" value={fmtDate(form.dateDelivranceDoc)} />
                                <Field label="Validité"   value={fmtDate(form.dateValiditeDoc)} />
                              </div>
                            </div>

                            {/* ── Personnes liées ── */}
                            {form.clientBeneficiairePerson.length > 0 && (
                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                      <Users size={12} className="text-violet-600" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-600">Personnes liées</p>
                                  </div>
                                  <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                                    {form.clientBeneficiairePerson.length}
                                  </span>
                                </div>

                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {form.clientBeneficiairePerson.map((person) => (
                                    <div
                                      key={person.id}
                                      className="rounded-xl border border-gray-100 overflow-hidden hover:border-violet-100 hover:shadow-sm transition-all"
                                    >
                                      {/* Header personne */}
                                      <div className="flex items-center justify-between px-3 py-2.5 bg-linear-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5">
                                          <div className="h-7 w-7 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 text-[11px] font-black shrink-0">
                                            {person.prenom?.[0]}{person.nom?.[0]}
                                          </div>
                                          <p className="text-sm font-bold text-gray-900">
                                            {person.prenom} {person.nom}
                                          </p>
                                        </div>
                                        <span className="text-[10px] bg-white border border-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold shadow-sm">
                                          {person.typePerson}
                                        </span>
                                      </div>

                                      {/* Body personne */}
                                      <div className="p-3 grid grid-cols-2 gap-1.5 bg-white">
                                        <Field label="Sexe"           value={person.sexe} />
                                        <Field label="Né(e) le"       value={fmtDate(person.dateNaissance)} />
                                        <Field label="Lieu"           value={person.lieuNaissance} />
                                        <Field label="Nationalité"    value={person.nationalite} />
                                        <Field label="État civil"     value={person.etatCivil} />
                                        <Field label="Pays résidence" value={person.paysResidence} />
                                        <Field label="Email"          value={person.email} />
                                        <Field label="Téléphone"      value={person.numero} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        </section>
                      ))
                    )}
                  </div>

                  {/* ── Colonne droite (1/3) ── */}
                  <div className="space-y-4">

                    {/* Statut du compte */}
                    <Card title="Résumé du compte">
                      <DataRow label="Statut"     value={<Badge status={detail.actif ? 'ACTIF' : 'INACTIF'} />} />
                      <DataRow label="Validation" value={<Badge status={detail.isValidate ? 'VALIDE' : 'EN_ATTENTE'} />} />
                      <DataRow label="Créé le"    value={fmtDate(detail.createdAt)} />
                    </Card>

                    {/* Récap documents */}
                    {detail.userDocument.length > 0 && (
                      <Card title="Récap documents">
                        {detail.userDocument.map((doc) => (
                          <DataRow
                            key={doc.id}
                            label={doc.nomDoc}
                            value={<Badge status={doc.status} />}
                          />
                        ))}
                      </Card>
                    )}

                    {/* Récap formulaires */}
                    {detail.clientBeneficiaireForms.length > 0 && (
                      <Card title="Récap formulaires">
                        {detail.clientBeneficiaireForms.map((form, i) => (
                          <DataRow
                            key={form.id}
                            label={`Formulaire #${i + 1} — ${form.prenom} ${form.nom}`}
                            value={<Badge status={form.status} />}
                          />
                        ))}
                      </Card>
                    )}

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </TabContainer>
    </div>
  );
};

export default PageDetailPassager;