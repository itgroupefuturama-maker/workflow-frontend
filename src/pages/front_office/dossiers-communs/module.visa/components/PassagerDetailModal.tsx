import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  fetchPassagerDetail,
  clearPassagerDetail,
  validateClientForm,
  validateDocument,
  syncPassagerInfo,
} from '../../../../../app/front_office/parametre_visa/passagerDetailSlice';
import { API_URL, API_URL_PORTAIL } from '../../../../../service/env';

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value ?? '—'}</p>
  </div>
);

const SectionTitle = ({ label }: { label: string }) => (
  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest pt-2 pb-1 border-b border-indigo-100">
    {label}
  </p>
);

// ── Bouton d'action avec état loading ─────────────────────────────────────

const ActionButton = ({
  onClick,
  loading,
  done,
  label,
  statut,
  doneLabel,
  color = 'green',
}: {
  onClick: () => void;
  loading: boolean;
  done: boolean;
  label: string;
  statut: string;
  doneLabel: string;
  color?: 'green' | 'indigo' | 'violet';
}) => {
  const colors = {
    green  : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400',
    indigo : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400',
    violet : 'bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || statut === 'VALIDER'}
      className={`px-3 py-1.5 text-white text-xs rounded-lg flex items-center gap-1.5 transition shrink-0 ${statut === 'VALIDER' ? 'bg-gray-300 opacity-50' : colors[color]}`}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : done ? '✓' : null}
      {done ? doneLabel : label}
    </button>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────

interface Props {
  idVisaAbstract: string;
  nomPassager: string;
  onClose: () => void;
}

const PassagerDetailModal = ({ idVisaAbstract, nomPassager, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { detail, loading, error } = useSelector((s: RootState) => s.passagerDetail);

  // ── États locaux des actions ───────────────────────────────────────────────
  const [formLoading,   setFormLoading]   = useState<Record<string, boolean>>({});
  const [formDone,      setFormDone]      = useState<Record<string, boolean>>({});
  const [docLoading,    setDocLoading]    = useState<Record<string, boolean>>({});
  const [docDone,       setDocDone]       = useState<Record<string, boolean>>({});
  const [syncLoading,   setSyncLoading]   = useState(false);
  const [syncDone,      setSyncDone]      = useState(false);
  const [actionError,   setActionError]   = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    dispatch(fetchPassagerDetail(idVisaAbstract));
    return () => { dispatch(clearPassagerDetail()); };
  }, [idVisaAbstract, dispatch]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleValidateForm = async (formId: string) => {
    setActionError('');
    setActionSuccess('');
    setFormLoading(prev => ({ ...prev, [formId]: true }));
    try {
      await dispatch(validateClientForm(formId)).unwrap();
      setFormDone(prev => ({ ...prev, [formId]: true }));
      setActionSuccess('Formulaire validé avec succès.');
      dispatch(fetchPassagerDetail(idVisaAbstract));
    } catch (e: any) {
      setActionError(e ?? 'Erreur validation formulaire.');
    } finally {
      setFormLoading(prev => ({ ...prev, [formId]: false }));
    }
  };

  const handleValidateDoc = async (docId: string) => {
    setActionError('');
    setActionSuccess('');
    setDocLoading(prev => ({ ...prev, [docId]: true }));
    try {
      await dispatch(validateDocument(docId)).unwrap();
      setDocDone(prev => ({ ...prev, [docId]: true }));
      setActionSuccess('Document validé avec succès.');
      dispatch(fetchPassagerDetail(idVisaAbstract));
    } catch (e: any) {
      setActionError(e ?? 'Erreur validation document.');
    } finally {
      setDocLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleSync = async () => {
    setActionError('');
    setActionSuccess('');
    setSyncLoading(true);
    try {
      await dispatch(syncPassagerInfo(idVisaAbstract)).unwrap();
      setSyncDone(true);
      setActionSuccess('Données synchronisées avec succès.');
      dispatch(fetchPassagerDetail(idVisaAbstract));
    } catch (e: any) {
      setActionError(e ?? 'Erreur synchronisation.');
    } finally {
      setSyncLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Détail passager</h2>
            <p className="text-sm text-gray-400">{nomPassager}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton sync global */}
            <ActionButton
              onClick={handleSync}
              loading={syncLoading}
              done={syncDone}
              statut=''
              label="⚡ Synchroniser"
              doneLabel="Synchronisé"
              color="violet"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-xl font-bold"
            >✕</button>
          </div>
        </div>

        {/* ── Feedbacks ── */}
        {(actionSuccess || actionError) && (
          <div className={`mx-6 mt-4 shrink-0 text-sm rounded-lg px-4 py-3 border ${
            actionSuccess
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {actionSuccess ? `✓ ${actionSuccess}` : `⚠️ ${actionError}`}
          </div>
        )}

        {/* ── Body scrollable ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Chargement...
            </div>
          )}

          {/* Erreur fetch */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              ⚠️ {error}
            </div>
          )}

          {detail && (
            <>
              {/* ── Statut compte ── */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${detail.actif ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600">
                  Compte <strong>{detail.actif ? 'actif' : 'inactif'}</strong>
                  {' · '}
                  {detail.isValidate ? '✓ Validé' : '⏳ Non validé'}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  Créé le {fmtDate(detail.createdAt)}
                </span>
              </div>

              {/* ── Formulaires ── */}
              {detail.clientBeneficiaireForms.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Aucun formulaire rempli</p>
              ) : (
                detail.clientBeneficiaireForms.map((form, fIdx) => (
                  <div key={form.id} className="rounded-xl border border-gray-100 overflow-hidden">

                    {/* Header form */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-400">Formulaire #{fIdx + 1}</span>
                        <span className="font-semibold text-gray-800 text-sm">
                          {form.prenom} {form.nom}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          form.status === 'VALIDE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {form.status}
                        </span>
                      </div>

                      {/* Bouton valider formulaire */}
                      <ActionButton
                        onClick={() => handleValidateForm(form.id)}
                        loading={formLoading[form.id] ?? false}
                        statut={form.status}
                        done={formDone[form.id] ?? form.status === 'VALIDE'}
                        label="✓ Confirmer"
                        doneLabel="Confirmé"
                        color="green"
                      />
                    </div>

                    <div className="px-4 py-4 space-y-5">

                      {/* Identité */}
                      <SectionTitle label="Identité" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

                      {/* Contact */}
                      <SectionTitle label="Contact" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Téléphone" value={form.numero} />
                        <Field label="Email"     value={form.email} />
                      </div>

                      {/* Contact urgence */}
                      <SectionTitle label="Contact d'urgence" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Nom"       value={`${form.prenomContactUrgence} ${form.nomContactUrgence}`} />
                        <Field label="Téléphone" value={form.numeroContactUrgence} />
                        <Field label="Email"     value={form.emailContactUrgence} />
                      </div>

                      {/* Profession */}
                      <SectionTitle label="Profession" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Profession"    value={form.professionActuelle} />
                        <Field label="Employeur"     value={form.nomEmployeur} />
                        <Field label="Tél. pro"      value={form.numeroTelephone} />
                        <Field label="Email pro"     value={form.emailProfessionnel} />
                        <Field label="Adresse pro"   value={form.adresseProfessionnel} />
                        <Field label="Établissement" value={form.etablissement} />
                        <Field label="Diplôme"       value={form.diplome} />
                      </div>

                      {/* Document d'identité */}
                      <SectionTitle label="Document d'identité" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Type"       value={form.typeDoc} />
                        <Field label="Référence"  value={form.referenceDoc} />
                        <Field label="Délivrance" value={fmtDate(form.dateDelivranceDoc)} />
                        <Field label="Validité"   value={fmtDate(form.dateValiditeDoc)} />
                      </div>

                      {/* Personnes liées */}
                      {form.clientBeneficiairePerson.length > 0 && (
                        <>
                          <SectionTitle label={`Personnes liées (${form.clientBeneficiairePerson.length})`} />
                          <div className="space-y-3">
                            {form.clientBeneficiairePerson.map((person) => (
                              <div key={person.id} className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-gray-800">
                                    {person.prenom} {person.nom}
                                  </p>
                                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                                    {person.typePerson}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* ── Documents ── */}
              {detail.userDocument.length > 0 && (
                <div className="space-y-3">
                  <SectionTitle label={`Documents (${detail.userDocument.length})`} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detail.userDocument.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{doc.nomDoc}</p>
                            <p className="text-xs text-gray-400">
                              Ajouté le {fmtDate(doc.createdAt)}
                              {' · '}
                              <span className={`font-semibold ${
                                doc.status === 'VALIDE' ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {doc.status}
                              </span>
                            </p>
                          </div>

                          {/* Actions document */}
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={`${API_URL}${doc.pj}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs rounded-lg hover:bg-indigo-100"
                            >
                              📄 Voir
                            </a>
                            <ActionButton
                              onClick={() => handleValidateDoc(doc.id)}
                              loading={docLoading[doc.id] ?? false}
                              statut={doc.status}
                              done={docDone[doc.id] ?? doc.status === 'VALIDE'}
                              label="✓ Valider"
                              doneLabel="Validé"
                              color="green"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassagerDetailModal;