import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  updateClientBeneficiaire,
  fetchClientBeneficiaires,
} from '../../../app/back_office/clientBeneficiairesSlice';
import {
  addBeneficiaireToClientFacture,
  removeBeneficiaireFromClientFacture,
} from '../../../app/back_office/clientFacturesSlice';
import {
  createClientBeneficiaireInfos,
  fetchClientBeneficiaireInfos,
  updateClientBeneficiaireInfo,
  type ClientBeneficiaireInfo,
} from '../../../app/portail_client/clientBeneficiaireInfosSlice';
import { fetchGoogleCalendarAuthUrl } from '../../../app/front_office/parametre_utilisateur/userSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import { API_URL } from '../../../service/env';
import { toast } from '../../../components/Toast/toast';
import {
  FiArrowLeft, FiTrash2, FiSearch, FiPlus, FiLoader, FiCheck, FiX,
  FiUser, FiFileText, FiCalendar, FiPhone, FiUpload, FiEdit2, FiClock,
} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ── Helpers ────────────────────────────────────────────────────────────────

function getMonthsUntilExpiry(dateStr: string): number {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
}

function getValidityStripe(dateValiditeDoc: string): string {
  const m = getMonthsUntilExpiry(dateValiditeDoc);
  if (m < 3) return 'bg-red-500';
  if (m < 9) return 'bg-orange-400';
  if (m < 12) return 'bg-yellow-400';
  return 'bg-emerald-500';
}

function formatDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DOC_LABEL: Record<string, string> = {
  PASSEPORT: 'Passeport',
  CIN: 'CIN',
  LAISSE_PASSER: 'Laissez-passer',
};

const toISO = (d: string) => (d ? `${d}T00:00:00.000Z` : '');

// ── Sous-composants ──────────────────────────────────────────────────────────

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
    {icon} {children}
  </p>
);

const Field: React.FC<{ label: string; children: React.ReactNode; span?: number }> = ({ label, children, span }) => (
  <div className={span ? `col-span-${span}` : ''}>
    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all ' +
  'placeholder:text-slate-300 text-slate-800';

/** Ligne de liste simple, séparée par un trait — remplace les listes en "cartes" trop spacieuses. */
const ListRow = ({
  leading,
  title,
  subtitle,
  trailing,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 py-2.5 px-1 border-b border-slate-100 last:border-b-0">
    {leading}
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-semibold text-slate-800 truncate">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitle}</p>}
    </div>
    {trailing}
  </div>
);

// ── Page principale ──────────────────────────────────────────────────────────

export default function ClientBeneficiaireFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: beneficiaires } = useSelector((s: RootState) => s.clientBeneficiaires);
  const { data: clientFactures } = useSelector((s: RootState) => s.clientFactures);
  const { list: infosList, loadingList: loadingInfosList, loading: loadingInfoSave } = useSelector(
    (s: RootState) => s.clientBeneficiaireInfos
  );

  const currentBeneficiaire = beneficiaires.find((b) => b.id === id);

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isSavingParams, setIsSavingParams] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [searchFacture, setSearchFacture] = useState('');
  const [editingInfo, setEditingInfo] = useState<ClientBeneficiaireInfo | null>(null);

  // ── Colonne droite : paramètres du bénéficiaire ──
  const [libelle, setLibelle] = useState(currentBeneficiaire?.libelle ?? '');
  const [statut, setStatut] = useState<'ACTIF' | 'INACTIF'>(
    (currentBeneficiaire?.statut as 'ACTIF' | 'INACTIF') ?? 'ACTIF'
  );
  const [typeClient, setTypeClient] = useState<'SIMPLE' | 'GOLD' | 'SILVER' | 'BRONZE' | 'VIP'>(
    (currentBeneficiaire?.typeClient as 'SIMPLE' | 'GOLD' | 'SILVER' | 'BRONZE' | 'VIP') ?? 'SIMPLE'
  );

  // ── Colonne gauche : informations complémentaires ──
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [nationalite, setNationalite] = useState('');
  const [clientType, setClientType] = useState<'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE'>('ADULTE');
  const [typeDoc, setTypeDoc] = useState<'LAISSE_PASSER' | 'PASSEPORT' | 'CIN'>('PASSEPORT');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [dateDelivranceDoc, setDateDelivranceDoc] = useState('');
  const [dateValiditeDoc, setDateValiditeDoc] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tel, setTel] = useState('');
  const [document, setDocument] = useState<File | null>(null);

  useEffect(() => {
    if (id) dispatch(fetchClientBeneficiaireInfos(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!editingInfo) return;
    setPrenom(editingInfo.prenom);
    setNom(editingInfo.nom);
    setNationalite(editingInfo.nationalite || '');
    setClientType(editingInfo.clientType ?? 'ADULTE');
    setTypeDoc(editingInfo.typeDoc as 'LAISSE_PASSER' | 'PASSEPORT' | 'CIN');
    setReferenceDoc(editingInfo.referenceDoc);
    setDateDelivranceDoc(editingInfo.dateDelivranceDoc.split('T')[0]);
    setDateValiditeDoc(editingInfo.dateValiditeDoc.split('T')[0]);
    setDateNaissance(editingInfo.dateNaissance?.split('T')[0] ?? '');
    setWhatsapp(editingInfo.whatsapp ?? '');
    setTel(editingInfo.tel ?? '');
    setDocument(null);
  }, [editingInfo]);

  const hasParamsChanges = useMemo(() => {
    if (!currentBeneficiaire) return false;
    return (
      libelle !== currentBeneficiaire.libelle ||
      statut !== currentBeneficiaire.statut ||
      typeClient !== currentBeneficiaire.typeClient
    );
  }, [libelle, statut, typeClient, currentBeneficiaire]);

  const isParamsInvalid = !libelle.trim();

  const availableClientFactures = useMemo(() => {
    const linkedIds = currentBeneficiaire?.factures.map((f) => f.clientFacture.id) || [];
    return clientFactures.filter(
      (cf) =>
        !linkedIds.includes(cf.id) &&
        (cf.libelle.toLowerCase().includes(searchFacture.toLowerCase()) ||
          cf.code.toLowerCase().includes(searchFacture.toLowerCase()))
    );
  }, [clientFactures, currentBeneficiaire, searchFacture]);

  const notify = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  // ── Actions : paramètres généraux ──
  const handleSaveParams = async () => {
    if (!currentBeneficiaire) return;
    setIsSavingParams(true);
    const result = await dispatch(
      updateClientBeneficiaire({ id: currentBeneficiaire.id, libelle, statut, typeClient })
    );
    if (updateClientBeneficiaire.fulfilled.match(result)) {
      notify('Paramètres enregistrés.');
    } else {
      notify('Erreur lors de la sauvegarde des paramètres.', true);
    }
    setIsSavingParams(false);
  };

  const handleAddClientFacture = async (clientFactureId: string) => {
    const result = await dispatch(addBeneficiaireToClientFacture({ id: clientFactureId, beneficiaireId: id! }));
    if (addBeneficiaireToClientFacture.fulfilled.match(result)) notify('Association réussie.');
    await dispatch(fetchClientBeneficiaires());
  };

  const handleRemoveClientFacture = async (clientFactureId: string) => {
    const result = await dispatch(removeBeneficiaireFromClientFacture({ id: clientFactureId, beneficiaireId: id! }));
    if (removeBeneficiaireFromClientFacture.fulfilled.match(result)) notify('Association supprimée.');
    await dispatch(fetchClientBeneficiaires());
  };

  const handleConnectGoogle = async () => {
    if (!id) return;
    setLoadingAuth(true);
    try {
      const url = await dispatch(fetchGoogleCalendarAuthUrl(id)).unwrap();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Impossible de récupérer le lien Google Calendar');
    } finally {
      setLoadingAuth(false);
    }
  };

  // ── Actions : informations complémentaires ──
  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingInfo(true);

    const payload = {
      prenom,
      nom,
      nationalite: nationalite || '',
      clientType,
      typeDoc,
      referenceDoc,
      dateDelivranceDoc: toISO(dateDelivranceDoc),
      dateValiditeDoc: toISO(dateValiditeDoc),
      dateNaissance: dateNaissance ? toISO(dateNaissance) : undefined,
      whatsapp: whatsapp || undefined,
      tel: tel || undefined,
      document: document || undefined,
    };

    if (editingInfo) {
      const result = await dispatch(updateClientBeneficiaireInfo({ id: editingInfo.id, ...payload }));
      if (updateClientBeneficiaireInfo.fulfilled.match(result)) {
        notify('Informations mises à jour.');
        setEditingInfo(null);
      } else if (updateClientBeneficiaireInfo.rejected.match(result)) {
        notify((result.payload as string) || 'Une erreur est survenue.', true);
      }
    } else {
      const result = await dispatch(createClientBeneficiaireInfos({ clientbeneficiaireId: id, ...payload }));
      if (createClientBeneficiaireInfos.fulfilled.match(result)) {
        notify('Informations enregistrées.');
        setEditingInfo(null);
      } else if (createClientBeneficiaireInfos.rejected.match(result)) {
        notify((result.payload as string) || 'Une erreur est survenue.', true);
      }
    }

    setIsSavingInfo(false);
    setDocument(null);
    setDateNaissance('');
  };

  const handleEditInfo = (info: ClientBeneficiaireInfo) => {
    setEditingInfo(info);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentBeneficiaire) {
    return <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 px-6">
      <div className="max-w-[1400px] mx-auto pt-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-500 hover:text-indigo-600"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{currentBeneficiaire.libelle}</h1>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono rounded border border-slate-200">
                {currentBeneficiaire.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Fiche complète du bénéficiaire</p>
          </div>
        </div>

        {/* Notification unique */}
        {message && (
          <div
            className={`mb-5 px-4 py-3 rounded-lg border flex items-center gap-2.5 text-[13px] font-medium ${
              message.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {message.isError ? <FiX size={15} /> : <FiCheck size={15} />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ══ Colonne GAUCHE (compacte) : paramètres + associations ══ */}
          <div className="lg:col-span-5 space-y-5">

            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <SectionLabel icon={null}>Paramètres généraux</SectionLabel>
              <div className="space-y-4">
                <Field label="Libellé">
                  <input
                    type="text"
                    value={libelle}
                    onChange={(e) => setLibelle(e.target.value.toUpperCase())}
                    className={`${inputCls} font-bold ${!libelle ? 'border-red-200' : ''}`}
                    placeholder="EX: CLIENT NOM"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Statut">
                    <select value={statut} onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')} className={`${inputCls} font-semibold`}>
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif</option>
                    </select>
                  </Field>
                  <Field label="Type client">
                    <select value={typeClient} onChange={(e) => setTypeClient(e.target.value as typeof typeClient)} className={`${inputCls} font-semibold`}>
                      <option value="SIMPLE">Simple</option>
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="BRONZE">Bronze</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={handleConnectGoogle}
                  disabled={loadingAuth}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingAuth ? <FiLoader size={13} className="animate-spin" /> : null}
                  Connecter Google Calendar
                </button>
                <button
                  onClick={handleSaveParams}
                  disabled={isSavingParams || !hasParamsChanges || isParamsInvalid}
                  className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
                    hasParamsChanges && !isParamsInvalid
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isSavingParams ? <FiLoader size={13} className="animate-spin" /> : <FiCheck size={13} />}
                  Enregistrer
                </button>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <SectionLabel icon={null}>Clients facturés associés</SectionLabel>
                <span className="text-[10px] font-semibold text-slate-400">{currentBeneficiaire.factures.length}</span>
              </div>

              {currentBeneficiaire.factures.length === 0 ? (
                <p className="text-[12px] text-slate-300 italic py-4 text-center">Aucun client facturé associé.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto -mx-1 px-1">
                  {currentBeneficiaire.factures.map((f) => (
                    <ListRow
                      key={f.clientFacture.id}
                      title={f.clientFacture.libelle}
                      subtitle={f.clientFacture.code}
                      trailing={
                        <button
                          onClick={() => handleRemoveClientFacture(f.clientFacture.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Dissocier"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      }
                    />
                  ))}
                </div>
              )}

              {/* Clients disponibles — toujours visible, filtrable par la recherche */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    À associer ({availableClientFactures.length})
                  </span>
                </div>
                <div className="relative mb-2">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input
                    type="text"
                    placeholder="Filtrer la liste..."
                    value={searchFacture}
                    onChange={(e) => setSearchFacture(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-[12px]"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto -mx-1 px-1">
                  {availableClientFactures.length === 0 ? (
                    <p className="text-[11px] text-slate-300 italic py-3 text-center">
                      {searchFacture ? 'Aucun résultat.' : 'Tous les clients facturés sont déjà associés.'}
                    </p>
                  ) : (
                    availableClientFactures.map((cf) => (
                      <ListRow
                        key={cf.id}
                        title={cf.libelle}
                        subtitle={cf.code}
                        trailing={
                          <button
                            onClick={() => handleAddClientFacture(cf.id)}
                            className="p-1.5 text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors shrink-0"
                            title="Associer"
                          >
                            <FiPlus size={14} />
                          </button>
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ══ Colonne DROITE (large) : informations complémentaires ══ */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleSubmitInfo} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">


              {editingInfo && (
                <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-amber-700 text-[12px] font-semibold">
                    <FiEdit2 size={13} /> Édition — {editingInfo.prenom} {editingInfo.nom}
                  </span>
                  <button type="button" onClick={() => setEditingInfo(null)} className="text-amber-700 text-[11px] underline hover:no-underline">
                    Annuler
                  </button>
                </div>
              )}

              <div className="px-5 py-4 border-b border-slate-100">
                <SectionLabel icon={<FiUser size={12} />}>Identité et statut</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Prénom *">
                    <input className={inputCls} value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                  </Field>
                  <Field label="Nom *">
                    <input className={inputCls} value={nom} onChange={(e) => setNom(e.target.value)} required />
                  </Field>
                  <Field label="Nationalité">
                    <input className={inputCls} value={nationalite} onChange={(e) => setNationalite(e.target.value)} />
                  </Field>
                  <Field label="Type de client">
                    <select className={inputCls} value={clientType} onChange={(e) => setClientType(e.target.value as typeof clientType)}>
                      <option value="ADULTE">Adulte</option>
                      <option value="ENFANT">Enfant</option>
                      <option value="BEBE">Bébé</option>
                      <option value="JEUNE">Jeune</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-slate-100">
                <SectionLabel icon={<FiFileText size={12} />}>Document principal</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Type de document">
                    <select className={inputCls} value={typeDoc} onChange={(e) => setTypeDoc(e.target.value as typeof typeDoc)}>
                      <option value="PASSEPORT">Passeport</option>
                      <option value="CIN">CIN</option>
                      <option value="LAISSE_PASSER">Laissez-passer</option>
                    </select>
                  </Field>
                  <Field label="Référence document">
                    <input className={inputCls} value={referenceDoc} onChange={(e) => setReferenceDoc(e.target.value)} />
                  </Field>
                  <Field label="Date de délivrance">
                    <input type="date" className={inputCls} value={dateDelivranceDoc} onChange={(e) => setDateDelivranceDoc(e.target.value)} />
                  </Field>
                  <Field label="Date de validité">
                    <input type="date" className={inputCls} value={dateValiditeDoc} onChange={(e) => setDateValiditeDoc(e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-slate-100">
                <SectionLabel icon={<FiCalendar size={12} />}>Informations personnelles</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Date de naissance">
                    <input type="date" className={inputCls} value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="px-5 py-4">
                <SectionLabel icon={<FiPhone size={12} />}>Contact et pièces jointes</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="WhatsApp">
                    <input type="tel" className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </Field>
                  <Field label="Téléphone">
                    <input type="tel" className={inputCls} value={tel} onChange={(e) => setTel(e.target.value)} />
                  </Field>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">Document (PDF)</label>
                    <label className="flex flex-col items-center justify-center gap-1 w-full h-[42px] flex-row px-3 border border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                      <FiUpload size={14} className="text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500 truncate ml-1.5">
                        {document ? document.name : editingInfo?.document ? 'Fichier existant — cliquer pour remplacer' : 'Glisser un PDF ou cliquer'}
                      </span>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files && setDocument(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingInfo || loadingInfoSave}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-[12px] font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isSavingInfo || loadingInfoSave ? <FiLoader size={14} className="animate-spin" /> : <FiCheck size={14} />}
                  {editingInfo ? 'Enregistrer les modifications' : 'Enregistrer les informations'}
                </button>
              </div>
            </form>

            {/* Historique — liste simple */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <FiClock size={14} className="text-slate-400" />
                <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                  Historique des saisies ({infosList.length})
                </h2>
              </div>

              {loadingInfosList ? (
                <p className="text-center text-[12px] text-slate-400 py-6">Chargement...</p>
              ) : infosList.length === 0 ? (
                <p className="text-center text-[12px] text-slate-300 py-6 italic">Aucune donnée enregistrée.</p>
              ) : (
                <div className="mt-2">
                  {infosList.map((info) => {
                    const stripe = info.typeDoc === 'PASSEPORT' ? getValidityStripe(info.dateValiditeDoc) : 'bg-slate-200';
                    const initials = `${info.prenom[0]}${info.nom[0]}`.toUpperCase();
                    return (
                      <ListRow
                        key={info.id}
                        leading={
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500">
                              {initials}
                            </div>
                            <span className={`absolute -left-1 top-0 bottom-0 w-1 rounded-full ${stripe}`} />
                          </div>
                        }
                        title={`${info.prenom} ${info.nom}`}
                        subtitle={
                          <>
                            {DOC_LABEL[info.typeDoc] ?? info.typeDoc} · {info.referenceDoc} · Validité {formatDate(info.dateValiditeDoc)}
                          </>
                        }
                        trailing={
                          <div className="flex items-center gap-1.5 shrink-0">
                            {info.document && (
                              <a
                                href={`${API_URL}/${info.document}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Voir le document"
                              >
                                <FiFileText size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => handleEditInfo(info)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Modifier"
                            >
                              <FiEdit2 size={14} />
                            </button>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}