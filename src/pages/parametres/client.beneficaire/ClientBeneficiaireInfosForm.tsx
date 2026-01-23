import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createClientBeneficiaireInfos,
  fetchClientBeneficiaireInfos,
  updateClientBeneficiaireInfo,
  type ClientBeneficiaireInfo,
} from '../../../app/portail_client/clientBeneficiaireInfosSlice';
import type { AppDispatch, RootState } from '../../../app/store';
import { FiArrowLeft, FiUpload, FiLoader, FiFileText, FiCalendar, FiEdit2, FiX, FiUser, FiCheck } from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ClientBeneficiaireInfosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { list, loadingList, loading: isLoading } = useSelector((state: RootState) => state.clientBeneficiaireInfos);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [editingInfo, setEditingInfo] = useState<ClientBeneficiaireInfo | null>(null);

  // États du formulaire
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [nationalite, setNationalite] = useState('');
  const [clientType, setClientType] = useState<'ADULTE' | 'ENFANT' | 'BEBE' | 'JEUNE'>('ADULTE');
  const [typeDoc, setTypeDoc] = useState<'LAISSE_PASSER' | 'PASSEPORT'>('PASSEPORT');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [dateDelivranceDoc, setDateDelivranceDoc] = useState('');
  const [dateValiditeDoc, setDateValiditeDoc] = useState('');
  const [referenceCin, setReferenceCin] = useState('');
  const [dateDelivranceCin, setDateDelivranceCin] = useState('');
  const [dateValiditeCin, setDateValiditeCin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tel, setTel] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [cin, setCin] = useState<File | null>(null);

  // Chargement liste au montage
  useEffect(() => {
    if (id) dispatch(fetchClientBeneficiaireInfos(id));
  }, [id, dispatch]);

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (editingInfo) {
      setPrenom(editingInfo.prenom);
      setNom(editingInfo.nom);
      setNationalite(editingInfo.nationalite || '');
      setClientType(editingInfo.clientType);
      setTypeDoc(editingInfo.typeDoc);
      setReferenceDoc(editingInfo.referenceDoc);
      setDateDelivranceDoc(editingInfo.dateDelivranceDoc.split('T')[0]);
      setDateValiditeDoc(editingInfo.dateValiditeDoc.split('T')[0]);
      if (editingInfo.referenceCin) setReferenceCin(editingInfo.referenceCin);
      if (editingInfo.dateDelivranceCin) setDateDelivranceCin(editingInfo.dateDelivranceCin.split('T')[0]);
      if (editingInfo.dateValiditeCin) setDateValiditeCin(editingInfo.dateValiditeCin.split('T')[0]);
      if (editingInfo.whatsapp) setWhatsapp(editingInfo.whatsapp);
      if (editingInfo.tel) setTel(editingInfo.tel);
      setDocument(null);
      setCin(null);
    }
  }, [editingInfo]);

  const toISODateString = (dateStr: string): string => dateStr ? `${dateStr}T00:00:00.000Z` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      prenom,
      nom,
      nationalite: nationalite || '',
      clientType,
      typeDoc,
      referenceDoc,
      referenceCin: referenceCin || undefined,
      dateDelivranceDoc: toISODateString(dateDelivranceDoc),
      dateValiditeDoc: toISODateString(dateValiditeDoc),
      dateDelivranceCin: dateDelivranceCin ? toISODateString(dateDelivranceCin) : undefined,
      dateValiditeCin: dateValiditeCin ? toISODateString(dateValiditeCin) : undefined,
      whatsapp: whatsapp || undefined,
      tel: tel || undefined,
      document: document || undefined,
      cin: cin || undefined,
    };

    const result = editingInfo
      ? await dispatch(updateClientBeneficiaireInfo({ id: editingInfo.id, ...payload }))
      : await dispatch(createClientBeneficiaireInfos({ clientbeneficiaireId: id, ...payload }));

    if (createClientBeneficiaireInfos.fulfilled.match(result) || updateClientBeneficiaireInfo.fulfilled.match(result)) {
      setMessage({ text: `✅ ${editingInfo ? 'Modifications' : 'Nouvelles informations'} enregistrées !`, isError: false });
      setEditingInfo(null);
      setTimeout(() => setMessage(null), 3000);
    } else if (createClientBeneficiaireInfos.rejected.match(result) || updateClientBeneficiaireInfo.rejected.match(result)) {
      const errorMessage = result.error?.message || '❌ Une erreur est survenue';
      setMessage({ text: errorMessage, isError: true });
    }
    setIsSubmitting(false);
    setDocument(null);
    setCin(null);
  };

  const handleEdit = (info: ClientBeneficiaireInfo) => {
    setEditingInfo(info);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingInfo(null);
  };

  const formatDate = (isoString: string) => isoString ? new Date(isoString).toLocaleDateString('fr-FR') : '-';

  const apiUrl = import.meta.env.VITE_API_URL || '';

  return (
  <div className="min-h-screen bg-gray-50/50 pb-20 px-4">
    <div className="max-w-5xl mx-auto pt-8">
      {/* Header & Retour */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium mb-4"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
          Retour à l'édition du bénéficiaire
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Informations Complémentaires
        </h1>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          message.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {message.isError ? <FiX /> : <FiCheck />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Formulaire Principal */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-10">
        {editingInfo && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-800">
              <FiEdit2 size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Édition en cours : {editingInfo.prenom} {editingInfo.nom}</span>
            </div>
            <button type="button" onClick={handleCancelEdit} className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase underline">
              Annuler
            </button>
          </div>
        )}

        <div className="p-8 space-y-10">
          {/* Section 1: Identité */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Identité & Statut</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Prénom *</label>
                <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Nom *</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Nationalité</label>
                <input type="text" value={nationalite} onChange={(e) => setNationalite(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm" />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Type de client</label>
                <select value={clientType} onChange={(e) => setClientType(e.target.value as any)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="ADULTE">ADULTE</option>
                  <option value="ENFANT">ENFANT</option>
                  <option value="BEBE">BEBE</option>
                  <option value="JEUNE">JEUNE</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Document Principal (Passeport / Laissez-passer) */}
          <section className="pt-8 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <FiFileText /> Document Principal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Type de document</label>
                <select value={typeDoc} onChange={(e) => setTypeDoc(e.target.value as any)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <option value="PASSEPORT">PASSEPORT</option>
                  <option value="LAISSE_PASSER">LAISSE PASSER</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Référence Document</label>
                <input type="text" value={referenceDoc} onChange={(e) => setReferenceDoc(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Date délivrance Doc.</label>
                <input type="date" value={dateDelivranceDoc} onChange={(e) => setDateDelivranceDoc(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Date validité Doc.</label>
                <input type="date" value={dateValiditeDoc} onChange={(e) => setDateValiditeDoc(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </section>

          {/* Section 3: CIN Complémentaire */}
          <section className="pt-8 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <FiUser /> Informations CIN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Référence CIN</label>
                <input type="text" value={referenceCin} onChange={(e) => setReferenceCin(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Date délivrance CIN</label>
                <input type="date" value={dateDelivranceCin} onChange={(e) => setDateDelivranceCin(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Date validité CIN</label>
                <input type="date" value={dateValiditeCin} onChange={(e) => setDateValiditeCin(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </section>

          {/* Section 4: Contact & Pièces Jointes */}
          <section className="pt-8 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Colonne Contact */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contacts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">WhatsApp</label>
                    <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Téléphone</label>
                    <input type="tel" value={tel} onChange={(e) => setTel(e.target.value)}
                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Colonne Uploads */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pièces Jointes (PDF)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Document", file: document, set: setDocument, current: editingInfo?.document },
                    { label: "CIN", file: cin, set: setCin, current: editingInfo?.cin }
                  ].map((up, i) => (
                    <div key={i}>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group">
                        <FiUpload className="text-gray-300 group-hover:text-indigo-500 mb-1" />
                        <span className="text-[10px] text-center px-2 text-gray-400 group-hover:text-indigo-600 font-medium">
                          {up.file ? up.file.name : `Upload ${up.label}`}
                        </span>
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files && up.set(e.target.files[0])} />
                      </label>
                      {up.current && !up.file && (
                        <p className="mt-1 text-[10px] text-emerald-600 font-medium text-center">✓ Fichier existant</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex items-center gap-2 px-10 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            {(isSubmitting || isLoading) ? <FiLoader className="animate-spin" /> : <FiCheck />}
            {editingInfo ? 'Enregistrer les modifications' : 'Enregistrer les informations'}
          </button>
        </div>
      </form>

      {/* Liste de l'Historique */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiCalendar className="text-indigo-500" />
          Historique des saisies ({list.length})
        </h2>

        {loadingList ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-400">Chargement...</div>
        ) : list.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-400">Aucune donnée enregistrée.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {list.map((info) => (
              <div key={info.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-bold shrink-0">
                      {info.prenom[0]}{info.nom[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-none mb-1">{info.prenom} {info.nom}</h4>
                      <p className="text-[11px] text-gray-500 font-semibold uppercase">
                        {info.clientType} • {info.typeDoc} ({info.referenceDoc})
                      </p>
                      {info.referenceCin && (
                        <p className="text-[10px] text-indigo-500 mt-1">CIN: {info.referenceCin}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-xs border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-gray-400">
                      <span className="block font-medium">Validité Doc.</span>
                      {formatDate(info.dateValiditeDoc)}
                    </div>
                    {info.dateValiditeCin && (
                      <div className="text-gray-400">
                        <span className="block font-medium">Validité CIN</span>
                        {formatDate(info.dateValiditeCin)}
                      </div>
                    )}
                    <div className="flex items-center gap-2 ml-4">
                      {info.document && (
                        <a href={`${apiUrl}/${info.document}`} target="_blank" className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-md" title="Passeport">
                          <FiFileText size={16} />
                        </a>
                      )}
                      <button onClick={() => handleEdit(info)} className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-md transition-all">
                        <FiEdit2 size={12} /> Modifier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}