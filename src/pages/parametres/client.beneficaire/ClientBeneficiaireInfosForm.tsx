import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createClientBeneficiaireInfos,
  fetchClientBeneficiaireInfos,
  updateClientBeneficiaireInfo,
  type ClientBeneficiaireInfo,
} from '../../../app/portail_client/clientBeneficiaireInfosSlice';
import type { AppDispatch, RootState } from '../../../app/store';
import { API_URL } from '../../../service/env';
import {
  FiArrowLeft, FiUpload, FiLoader, FiFileText,
  FiEdit2, FiX, FiUser, FiCheck, FiPhone, FiCalendar, FiClock,
} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

// ── Helpers ────────────────────────────────────────────────────────────────

function getMonthsUntilExpiry(dateStr: string): number {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
}

function getValidityStripe(dateValiditeDoc: string): string {
  const m = getMonthsUntilExpiry(dateValiditeDoc);
  if (m < 3)  return 'bg-red-500';
  if (m < 9)  return 'bg-orange-400';
  if (m < 12) return 'bg-yellow-400';
  return 'bg-green-500';
}

function formatDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DOC_BADGE: Record<string, string> = {
  PASSEPORT:    'bg-blue-50 text-blue-800',
  CIN:          'bg-purple-50 text-purple-800',
  LAISSE_PASSER:'bg-[#f1efe8] text-[#5f5e5a]',
};
const DOC_LABEL: Record<string, string> = {
  PASSEPORT: 'Passeport', CIN: 'CIN', LAISSE_PASSER: 'Laissez-passer',
};

// ── Sous-composant : champ de formulaire ───────────────────────────────────

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  span?: number;
}> = ({ label, children, span }) => (
  <div className={span ? `col-span-${span}` : ''}>
    <label className="block text-[11px] text-[#7a6e64] mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = `w-full px-3 py-2 text-[12px] bg-[#faf8f5] border border-[#e8e2db] rounded-lg
  focus:outline-none focus:border-[#c0b8b0] focus:bg-white transition-colors
  placeholder:text-[#c0b8b0] text-[#1e1a17]`;

// ── Page principale ────────────────────────────────────────────────────────

export default function ClientBeneficiaireInfosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const location  = useLocation();
  const libelle   = location.state?.libelle as string | undefined;

  const { list, loadingList, loading: isLoading } = useSelector(
    (s: RootState) => s.clientBeneficiaireInfos
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message,      setMessage]      = useState<{ text: string; isError: boolean } | null>(null);
  const [editingInfo,  setEditingInfo]  = useState<ClientBeneficiaireInfo | null>(null);

  const [prenom,            setPrenom]            = useState('');
  const [nom,               setNom]               = useState('');
  const [nationalite,       setNationalite]       = useState('');
  const [clientType,        setClientType]        = useState<'ADULTE'|'ENFANT'|'BEBE'|'JEUNE'>('ADULTE');
  const [typeDoc,           setTypeDoc]           = useState<'LAISSE_PASSER'|'PASSEPORT'|'CIN'>('PASSEPORT');
  const [referenceDoc,      setReferenceDoc]      = useState('');
  const [dateDelivranceDoc, setDateDelivranceDoc] = useState('');
  const [dateValiditeDoc,   setDateValiditeDoc]   = useState('');
  const [dateNaissance,     setDateNaissance]     = useState('');
  const [whatsapp,          setWhatsapp]          = useState('');
  const [tel,               setTel]               = useState('');
  const [document,          setDocument]          = useState<File | null>(null);

  useEffect(() => {
    if (id) dispatch(fetchClientBeneficiaireInfos(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!editingInfo) return;
    setPrenom(editingInfo.prenom);
    setNom(editingInfo.nom);
    setNationalite(editingInfo.nationalite || '');
    setClientType(editingInfo.clientType);
    setTypeDoc(editingInfo.typeDoc as any);
    setReferenceDoc(editingInfo.referenceDoc);
    setDateDelivranceDoc(editingInfo.dateDelivranceDoc.split('T')[0]);
    setDateValiditeDoc(editingInfo.dateValiditeDoc.split('T')[0]);
    setDateNaissance(editingInfo.dateNaissance?.split('T')[0] ?? '');
    setWhatsapp(editingInfo.whatsapp ?? '');
    setTel(editingInfo.tel ?? '');
    setDocument(null);
  }, [editingInfo]);

  const toISO = (d: string) => d ? `${d}T00:00:00.000Z` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      prenom, nom, nationalite: nationalite || '',
      clientType, typeDoc,
      referenceDoc,
      dateDelivranceDoc: toISO(dateDelivranceDoc),
      dateValiditeDoc:   toISO(dateValiditeDoc),
      dateNaissance:     dateNaissance ? toISO(dateNaissance) : undefined,
      whatsapp:  whatsapp || undefined,
      tel:       tel      || undefined,
      document:  document || undefined,
    };

    const result = editingInfo
      ? await dispatch(updateClientBeneficiaireInfo({ id: editingInfo.id, ...payload }))
      : await dispatch(createClientBeneficiaireInfos({ clientbeneficiaireId: id, ...payload }));

    const ok = createClientBeneficiaireInfos.fulfilled.match(result)
             || updateClientBeneficiaireInfo.fulfilled.match(result);

    if (ok) {
      setMessage({ text: editingInfo ? 'Modifications enregistrées.' : 'Informations enregistrées.', isError: false });
      setEditingInfo(null);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ text: result.error?.message || 'Une erreur est survenue.', isError: true });
    }

    setIsSubmitting(false);
    setDocument(null);
    setDateNaissance('');
  };

  const handleEdit = (info: ClientBeneficiaireInfo) => {
    setEditingInfo(info);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full bg-slate-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[#a09080] hover:text-[#6b5e52] text-[12px] mb-4 transition-colors"
        >
          <FiArrowLeft size={14} />
          Retour à l'édition du bénéficiaire
        </button>

        {/* Titre */}
        <div className="mb-6">
          {libelle && (
            <p className="text-[10px] font-medium text-[#a09080] uppercase tracking-widest mb-1">
              {libelle}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-[#1e1a17]">
            Informations complémentaires
          </h1>
        </div>

        {/* Notification */}
        {message && (
          <div className={`mb-5 px-4 py-3 rounded-xl border flex items-center gap-3 text-[13px]
            ${message.isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'}`}
          >
            {message.isError ? <FiX size={14} /> : <FiCheck size={14} />}
            {message.text}
          </div>
        )}

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e8e2db] overflow-hidden mb-8">

          {/* Bannière édition */}
          {editingInfo && (
            <div className="bg-[#f5e6c8] border-b border-[#e8d5a8] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#92611a] text-[12px] font-medium">
                <FiEdit2 size={13} />
                Édition en cours — {editingInfo.prenom} {editingInfo.nom}
              </div>
              <button
                type="button"
                onClick={() => setEditingInfo(null)}
                className="text-[#92611a] text-[11px] underline hover:no-underline"
              >
                Annuler
              </button>
            </div>
          )}

          {/* Section 1 — Identité */}
          <div className="px-6 py-5 border-b border-[#f5f0eb]">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#a09080] uppercase tracking-widest mb-4">
              <FiUser size={12} aria-hidden /> Identité et statut
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Prénom *">
                <input className={inputCls} value={prenom} onChange={e => setPrenom(e.target.value)} required />
              </Field>
              <Field label="Nom *">
                <input className={inputCls} value={nom} onChange={e => setNom(e.target.value)} required />
              </Field>
              <Field label="Nationalité">
                <input className={inputCls} value={nationalite} onChange={e => setNationalite(e.target.value)} />
              </Field>
              <Field label="Type de client">
                <select className={inputCls} value={clientType} onChange={e => setClientType(e.target.value as any)}>
                  <option value="ADULTE">Adulte</option>
                  <option value="ENFANT">Enfant</option>
                  <option value="BEBE">Bébé</option>
                  <option value="JEUNE">Jeune</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Section 2 — Document */}
          <div className="px-6 py-5 border-b border-[#f5f0eb]">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#a09080] uppercase tracking-widest mb-4">
              <FiFileText size={12} aria-hidden /> Document principal
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Type de document">
                <select className={inputCls} value={typeDoc} onChange={e => setTypeDoc(e.target.value as any)}>
                  <option value="PASSEPORT">Passeport</option>
                  <option value="CIN">CIN</option>
                  <option value="LAISSE_PASSER">Laissez-passer</option>
                </select>
              </Field>
              <Field label="Référence document">
                <input className={inputCls} value={referenceDoc} onChange={e => setReferenceDoc(e.target.value)} />
              </Field>
              <Field label="Date de délivrance">
                <input type="date" className={inputCls} value={dateDelivranceDoc} onChange={e => setDateDelivranceDoc(e.target.value)} />
              </Field>
              <Field label="Date de validité">
                <input type="date" className={inputCls} value={dateValiditeDoc} onChange={e => setDateValiditeDoc(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 3 — Naissance */}
          <div className="px-6 py-5 border-b border-[#f5f0eb]">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#a09080] uppercase tracking-widest mb-4">
              <FiCalendar size={12} aria-hidden /> Informations personnelles
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Date de naissance">
                <input type="date" className={inputCls} value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 4 — Contact + upload */}
          <div className="px-6 py-5">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#a09080] uppercase tracking-widest mb-4">
              <FiPhone size={12} aria-hidden /> Contact et pièces jointes
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="WhatsApp">
                <input type="tel" className={inputCls} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </Field>
              <Field label="Téléphone">
                <input type="tel" className={inputCls} value={tel} onChange={e => setTel(e.target.value)} />
              </Field>

              {/* Upload zone — occupe 2 colonnes */}
              <div className="col-span-2">
                <label className="block text-[11px] text-[#7a6e64] mb-1.5">Document (PDF)</label>
                <label className="flex flex-col items-center justify-center gap-1.5 w-full h-20
                  border border-dashed border-[#d4cdc6] rounded-xl cursor-pointer
                  bg-[#faf8f5] hover:bg-[#f5f0eb] hover:border-[#a09080] transition-colors"
                >
                  <FiUpload size={16} className="text-[#c0b8b0]" />
                  <span className="text-[11px] text-[#a09080]">
                    {document ? document.name : 'Glisser un PDF ou cliquer'}
                  </span>
                  {editingInfo?.document && !document && (
                    <span className="text-[10px] text-green-600">Fichier existant enregistré</span>
                  )}
                  <input
                    type="file" accept=".pdf" className="hidden"
                    onChange={e => e.target.files && setDocument(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer formulaire */}
          <div className="bg-[#f5f0eb] px-6 py-4 border-t border-[#e8e2db] flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-[#1e1a17] text-white text-[13px] font-medium
                rounded-lg hover:bg-[#2d2520] disabled:opacity-50 transition-colors"
            >
              {(isSubmitting || isLoading)
                ? <FiLoader size={14} className="animate-spin" />
                : <FiCheck size={14} />}
              {editingInfo ? 'Enregistrer les modifications' : 'Enregistrer les informations'}
            </button>
          </div>
        </form>

        {/* ── Historique ── */}
        <div className="mb-3 flex items-center gap-2">
          <FiClock size={15} className="text-[#a09080]" />
          <h2 className="text-[14px] font-semibold text-[#1e1a17]">
            Historique des saisies ({list.length})
          </h2>
        </div>

        {loadingList ? (
          <div className="bg-white rounded-xl border border-[#e8e2db] p-10 text-center text-[13px] text-[#a09080]">
            Chargement...
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e8e2db] p-10 text-center text-[13px] text-[#c0b8b0]">
            Aucune donnée enregistrée.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((info) => {
              const stripe = info.typeDoc === 'PASSEPORT'
                ? getValidityStripe(info.dateValiditeDoc)
                : 'bg-[#e8e2db]';
              const initials = `${info.prenom[0]}${info.nom[0]}`.toUpperCase();

              return (
                <div key={info.id}
                  className="bg-white rounded-xl border border-[#e8e2db] overflow-hidden hover:border-[#c0b8b0] transition-colors"
                >
                  {/* Barre validité */}
                  <div className={`h-[3px] ${stripe}`} />

                  <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">

                    {/* Identité */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#ece7e1] flex items-center justify-center
                        text-[12px] font-medium text-[#6b5e52] shrink-0"
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1e1a17]">
                          {info.prenom} {info.nom}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DOC_BADGE[info.typeDoc] ?? 'bg-gray-100 text-gray-600'}`}>
                            {DOC_LABEL[info.typeDoc] ?? info.typeDoc}
                          </span>
                          <span className="text-[11px] text-[#7a6e64]">
                            {info.referenceDoc} · {info.clientType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dates + actions */}
                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="text-right">
                        <p className="text-[10px] text-[#a09080]">Validité doc.</p>
                        <p className="text-[12px] font-medium text-[#1e1a17]">
                          {formatDate(info.dateValiditeDoc)}
                        </p>
                      </div>
                      {info.dateNaissance && (
                        <div className="text-right">
                          <p className="text-[10px] text-[#a09080]">Naissance</p>
                          <p className="text-[12px] font-medium text-[#1e1a17]">
                            {formatDate(info.dateNaissance)}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {info.document && (
                          <a
                            href={`${API_URL}/${info.document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-[#e8e2db] text-[#6b5e52]
                              hover:bg-[#f5f0eb] transition-colors"
                            title="Voir le document"
                          >
                            <FiFileText size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(info)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium
                            border border-[#e8e2db] rounded-lg text-[#1e1a17]
                            hover:bg-[#1e1a17] hover:text-white hover:border-[#1e1a17] transition-colors"
                        >
                          <FiEdit2 size={12} /> Modifier
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}