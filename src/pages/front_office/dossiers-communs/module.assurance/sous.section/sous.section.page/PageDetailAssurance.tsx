import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceEnteteDetail,
  clearAssuranceEnteteDetail,
  updateAssuranceFacture,
  type UpdateFacturePayload,
} from '../../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import TabContainer from '../../../../../../layouts/TabContainer';
import { AssuranceHeader } from '../../components/AssuranceHeader';
import DossierActifCard from '../../../../../../components/CarteDossierActif/DossierActifCard';
import { API_URL } from '../../../../../../service/env';
import { FiArrowRight, FiChevronDown, FiFile, FiX } from 'react-icons/fi';
import Spinner from '../../../../../../layouts/Spinner';

/* ─────────────────────── helpers ─────────────────────── */

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtNum = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('fr-FR') : '—';

/* ─────────────────────── atoms ───────────────────────── */

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    CREER:    'bg-gray-100 text-gray-600 border-gray-200',
    ACTIF:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    INITIALE: 'bg-blue-50 text-blue-600 border-blue-200',
    VALIDE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    ANNULE:   'bg-red-50 text-red-600 border-red-200',
  };
  const cls = colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

const Card = ({ title, children, action, defaultCollapsed = false }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultCollapsed?: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="flex items-center gap-2 group flex-1 min-w-0"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-700 transition-colors">
            {title}
          </p>
          <div className={`shrink-0 w-4 h-4 rounded-md bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-all ${collapsed ? '' : 'rotate-180'}`}>
            <FiChevronDown size={11} className="text-gray-500" />
          </div>
        </button>
        {action && <div className="shrink-0 ml-3">{action}</div>}
      </div>

      {!collapsed && (
        <div className="px-5 py-4">{children}</div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
  </div>
);

/* ─────────────────────── modal facturation ──────────────── */

const EMPTY_FORM = {
  tauxChangeFacture:       '',
  puFactureAssureurDevise: '',
  puFactureAssureurAriary: '',
  puFactureClientAriary:   '',
  commissionFactureAriary: '',
  numeroPolice:            '',
  numeroQuittance:         '',
};

const FactureModal = ({
  assuranceId,
  initial,
  onClose,
  onSaved,
}: {
  assuranceId: string;
  initial: typeof EMPTY_FORM;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [form,    setForm]    = useState(initial);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const payload: UpdateFacturePayload = {
        assuranceId,
        tauxChangeFacture:       Number(form.tauxChangeFacture),
        puFactureAssureurDevise: Number(form.puFactureAssureurDevise),
        puFactureAssureurAriary: Number(form.puFactureAssureurAriary),
        puFactureClientAriary:   Number(form.puFactureClientAriary),
        commissionFactureAriary: Number(form.commissionFactureAriary),
        numeroPolice:            form.numeroPolice,
        numeroQuittance:         form.numeroQuittance,
      };
      await dispatch(updateAssuranceFacture(payload)).unwrap();
      onSaved();
    } catch (e: any) {
      setErr(e ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Champs du formulaire déclarés pour éviter la répétition
  const numericFields: { name: keyof typeof EMPTY_FORM; label: string }[] = [
    { name: 'tauxChangeFacture',       label: 'Taux de change' },
    { name: 'puFactureAssureurDevise', label: 'PU assureur (devise)' },
    { name: 'puFactureAssureurAriary', label: 'PU assureur (Ar)' },
    { name: 'puFactureClientAriary',   label: 'PU client (Ar)' },
    { name: 'commissionFactureAriary', label: 'Commission (Ar)' },
  ];

  return (
    /* overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm font-bold text-gray-900">Saisir les données de facturation</p>
            <p className="text-xs text-gray-400 mt-0.5">ID assurance : {assuranceId}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* champs numériques */}
          <div className="grid grid-cols-2 gap-3">
            {numericFields.map(({ name, label }) => (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {label}
                </label>
                <input
                  type="number"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            ))}
          </div>

          {/* champs texte */}
          <div className="grid grid-cols-2 gap-3">
            {(['numeroPolice', 'numeroQuittance'] as const).map((name) => (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {name === 'numeroPolice' ? 'N° police' : 'N° quittance'}
                </label>
                <input
                  type="text"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            ))}
          </div>

          {/* erreur */}
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-4 py-2">
              ⚠️ {err}
            </div>
          )}

          {/* actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition inline-flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────── page ─────────────────────────── */

const PageDetailAssurance = () => {
  const { ligneId } = useParams<{ ligneId: string }>();
  const dispatch    = useDispatch<AppDispatch>();
  const navigate    = useNavigate();
  const location    = useLocation();

  const numeroDos  = location.state?.numeroDos  ?? '—';
  const fournisseur = location.state?.fournisseur ?? '—';

  const tabs = [
      { id: 'prospection', label: 'Listes des prospections' },
      { id: 'assurance',        label: 'Listes des assurance' },
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'assurance');
  const [showFactModal,  setShowFactModal]  = useState(false);

  const { detail, loading, error } = useSelector((s: RootState) => s.assuranceEnteteDetail);
  const clientFactureId = useSelector(
    (s: RootState) => s.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  const dossierActif = useSelector((s: RootState) => s.dossierCommun.currentClientFactureId);

  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

  useEffect(() => {
    if (ligneId) dispatch(fetchAssuranceEnteteDetail(ligneId));
    return () => { dispatch(clearAssuranceEnteteDetail()); };
  }, [ligneId, dispatch]);

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [dispatch, clientFactureId]);

  const handleTabChange = (id: string) => {
      if (id === 'prospection') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/assurance/pages`, { 
          state: { targetTab: 'prospection' }
      });
      } else {
      setActiveTab(id);
      }
  };

  // Préremplir le modal avec les valeurs déjà existantes
  const factureInitial = {
    tauxChangeFacture:       String(detail?.tauxChangeFacture       ?? ''),
    puFactureAssureurDevise: String(detail?.puFactureAssureurDevise ?? ''),
    puFactureAssureurAriary: String(detail?.puFactureAssureurAriary ?? ''),
    puFactureClientAriary:   String(detail?.puFactureClientAriary   ?? ''),
    commissionFactureAriary: String(detail?.commissionFactureAriary ?? ''),
    numeroPolice:            detail?.numeroPolice    ?? '',
    numeroQuittance:         detail?.numeroQuittance ?? '',
  };

  const handleFactureSaved = () => {
    setShowFactModal(false);
    if (ligneId) dispatch(fetchAssuranceEnteteDetail(ligneId));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Spinner /> <span className="text-sm">Chargement…</span>
    </div>
  );

  if (!detail) return null;

  const prospection = detail.assuranceProspectionLigne;
  const ap          = prospection?.assuranceParams;
  const isConforme  = detail.statut === 'CONFORME';

  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} color="bg-blue-400" >
      <div className="min-h-screen bg-neutral-50 space-y-4">

        <AssuranceHeader
          numeroassurance={numeroDos}
          nomPassager={''}
          navigate={navigate}
          isDetail={true}
          isProspection={false}
          isDevis={false}
        />

        <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />

        {/* ══ Topbar ══ */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dossiers-communs/assurance/pages', { state: { targetTab: 'assurance' } })}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm transition"
              >←</button>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Détail assurance</h1>
                <p className="text-xs text-gray-400">{numeroDos} · {fournisseur}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Content ══ */}
        <div className="">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

            {/* ── Colonne gauche (2/3) ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Séjour */}
              <Card title="Séjour">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                  <Field label="Date départ"   value={fmtDate(prospection?.dateDepart)} />
                  <Field label="Date retour"   value={fmtDate(prospection?.dateRetour)} />
                  <Field label="Durée"         value={prospection?.duree ? `${prospection.duree} jours` : '—'} />
                  <Field label="Taux change"   value={prospection?.tauxChange ? `${fmtNum(prospection.tauxChange)} Ar` : '—'} />
                  <Field label="Réf. devis"    value={prospection?.referenceDevis} />
                  <Field label="Date devis"    value={fmtDate(prospection?.dateDevis)} />
                </div>
              </Card>

               {/* Facturation — bouton visible uniquement si CONFORME */}
              <Card
                title="Facturation"
                action={
                  isConforme ? (
                    <button
                      onClick={() => setShowFactModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                    >
                      ✏️ Saisir facture
                    </button>
                  ) : undefined
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="PU assureur (devise)" value={fmtNum(detail.puFactureAssureurDevise)} />
                  <Field label="PU assureur (Ar)"     value={detail.puFactureAssureurAriary ? `${fmtNum(detail.puFactureAssureurAriary)} Ar` : '—'} />
                  <Field label="Commission (Ar)"      value={detail.commissionFactureAriary ? `${fmtNum(detail.commissionFactureAriary)} Ar` : '—'} />
                  <Field label="PU client (Ar)"       value={detail.puFactureClientAriary ? `${fmtNum(detail.puFactureClientAriary)} Ar` : '—'} />
                  <Field label="Taux change facture"  value={fmtNum(detail.tauxChangeFacture)} />
                  <Field label="N° ligne"           value={detail.referenceLine} />
                  <Field label="N° police"            value={detail.numeroPolice} />
                  <Field label="N° quittance"         value={detail.numeroQuittance} />
                </div>
              </Card>

              {/* Paramètres assurance */}
              {ap && (
                <Card title="Paramètres assurance" defaultCollapsed={true}>
                  <div className="space-y-4">

                    {/* Info zone */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ap.zoneDestination}</p>
                        <p className="text-xs text-gray-400">
                          {ap.fournisseur?.libelle} · {ap.fournisseur?.code}
                        </p>
                      </div>
                      <StatusBadge status={ap.status} />
                    </div>

                    {/* Tarifs plein */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Tarifs plein</p>
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                          {ap.assuranceTarifPlein?.length ?? 0}
                        </span>
                      </div>
                      {!ap.assuranceTarifPlein || ap.assuranceTarifPlein.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucun tarif plein</p>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-amber-50">
                                <th className="px-3 py-2 text-left font-semibold text-amber-600">Borne (j)</th>
                                <th className="px-3 py-2 text-left font-semibold text-amber-600">Devise</th>
                                <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix assureur</th>
                                <th className="px-3 py-2 text-right font-semibold text-amber-600">Commission</th>
                                <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix client</th>
                                <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix client (Ar)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ap.assuranceTarifPlein.map((t) => (
                                <tr key={t.id} className="bg-white border-t border-gray-100">
                                  <td className="px-3 py-2">
                                    <span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">
                                      {t.borneInf} – {t.borneSup}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-mono font-semibold text-gray-700">{t.devise}</td>
                                  <td className="px-3 py-2 text-right text-gray-700">{fmtNum(t.prixAssureurDevise)}</td>
                                  <td className="px-3 py-2 text-right text-amber-600 font-semibold">{fmtNum(t.commissionDevise)}</td>
                                  <td className="px-3 py-2 text-right text-indigo-700 font-bold">{fmtNum(t.prixClientDevise)}</td>
                                  <td className="px-3 py-2 text-right text-indigo-700 font-bold">{fmtNum(t.prixClientAriary)} Ar</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Tarifs réduit */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Tarifs réduits</p>
                        <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                          {ap.assuranceTarifReduit?.length ?? 0}
                        </span>
                      </div>
                      {!ap.assuranceTarifReduit || ap.assuranceTarifReduit.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucun tarif réduit</p>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-violet-50">
                                <th className="px-3 py-2 text-left font-semibold text-violet-600">Borne (j)</th>
                                <th className="px-3 py-2 text-left font-semibold text-violet-600">Taux appliqué</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ap.assuranceTarifReduit.map((t) => (
                                <tr key={t.id} className="bg-white border-t border-gray-100">
                                  <td className="px-3 py-2">
                                    <span className="font-mono bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-semibold">
                                      {t.borneInf} – {t.borneSup}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="text-lg font-bold text-violet-600">
                                      {t.tauxApplique}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Documents requis */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Documents requis</p>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                          {ap.assuranceDocParams?.length ?? 0}
                        </span>
                      </div>
                      {!ap.assuranceDocParams || ap.assuranceDocParams.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucun document requis</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {ap.assuranceDocParams.map((doc) => (
                            <div key={doc.id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                              <span className="text-sm">📄</span>
                              <div>
                                <p className="text-xs font-semibold text-gray-800">
                                  {doc.assuranceDoc?.document ?? '—'}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {doc.assuranceDoc?.codeDoc ?? doc.assuranceDocId}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* ── Colonne droite (1/3) ── */}
            <div className="space-y-4">

              <Card title="Résumé">
                {[
                  // { label: 'Statut',        value: <StatusBadge status={detail.statut} /> },
                  { label: 'Statut ligne',  value: <StatusBadge status={detail.statusLigne == 'CREER' ? 'créé' : detail.statusLigne == 'ASSIGNER' ? 'assigné' : detail.statusLigne == 'ENVOYE' ? 'envoyé' : detail.statusLigne == 'APPROUVE' ? 'approuvé' : detail.statusLigne == 'INACTIF' ? 'inactif' : detail.statusLigne} /> },
                  { label: 'Référence',     value: detail.referenceLine ?? '—' },
                  { label: 'N° dossier',    value: detail.numeroDossier ?? '—' },
                  { label: 'Créé le',       value: fmtDate(detail.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </Card>

              {detail?.assuranceEntete?.pdfLogin != null && (
                <div className="flex items-center gap-2 justify-between bg-white border border-gray-100 rounded-lg px-4 py-3">
                  <div className="text-sm font-medium text-gray-500">Voir les liste des accèes</div>
                  <a 
                    href={`${API_URL}/${detail.assuranceEntete?.pdfLogin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="
                      flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700
                      bg-linear-to-b from-white to-[#f0f0f0]
                      border border-gray-300 rounded-md
                      hover:text-orange-600 transition-all duration-200
                      active:translate-y-1px active:shadow-inner
                    "
                  >
                    <FiFile className="text-lg text-orange-500" />
                    <span>Voir le PDF</span>
                  </a>
                </div>
              )}


              <div className="bg-linear-to-b from-white to-[#f9fafb] border border-gray-200 rounded-xl p-5">
                <div className="flex flex-col gap-4">
                  {/* En-tête : Icône et Titre */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                      Client Bénéficiaire
                    </span>
                    <h3 className="text-lg font-bold text-gray-800">
                      {detail.clientBeneficiaire?.libelle || "Nom non spécifié"}
                    </h3>
                    <div className="flex justify-between items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <div>
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-600 mr-2">ID</span>
                        {detail.clientBeneficiaire?.code}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigate(`/dossiers-communs/assurance/passager/${detail.id}`, {
                            state: { 
                              nomPassager: detail.clientBeneficiaire?.libelle,
                              numeroDos: detail.numeroDossier,
                            }
                          })}
                          className="
                            flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-tight
                            text-white bg-green-500
                            rounded-lg shadow-md hover:shadow-lg hover:brightness-105
                            active:scale-95 transition-all duration-200
                          "
                        >
                          Voir les Détails 
                          <FiArrowRight className="text-sm" /> 
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {ap && (
                <Card title="Zone & Fournisseur">
                  {[
                    { label: 'Zone',             value: ap.zoneDestination },
                    { label: 'Fournisseur',      value: ap.fournisseur?.libelle },
                    { label: 'Code',             value: ap.fournisseur?.code },
                    { label: 'Date application', value: fmtDate(ap.dateApplication) },
                    { label: 'Statut params',    value: <StatusBadge status={ap.status} /> },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </Card>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal facturation */}
      {showFactModal && detail?.id && (
        <FactureModal
          assuranceId={detail.id}
          initial={factureInitial}
          onClose={() => setShowFactModal(false)}
          onSaved={handleFactureSaved}
        />
      )}
    </TabContainer>
  );
};

export default PageDetailAssurance;