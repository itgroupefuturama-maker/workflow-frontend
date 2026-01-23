import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchClientBeneficiaires,
  createClientBeneficiaire,
  updateClientBeneficiaire,
  activateClientBeneficiaire,
  deactivateClientBeneficiaire,
  deleteClientBeneficiaire,
} from '../../app/back_office/clientBeneficiairesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { ClientBeneficiaire } from '../../app/back_office/clientBeneficiairesSlice';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiUserCheck, FiTag, FiSearch, FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ClientBeneficiairePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: beneficiaires, loading, error: globalError } = useSelector((state: RootState) => state.clientBeneficiaires);

  useEffect(() => {
    dispatch(fetchClientBeneficiaires());
  }, [dispatch]);

  // UI States
  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientBeneficiaire | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form States
  const [libelle, setLibelle] = useState('');
  const [statut, setStatut] = useState<'ACTIF' | 'INACTIF'>('ACTIF');

  // Gestion des Clients Factures liés
  // const [setSearchFacture] = useState('');

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  // États pour la recherche globale
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    codeBen: true,
    libelleBen: true,
    codeFact: false,
    libelleFact: false,
  });

  // Fonction pour basculer les filtres
  const toggleFilter = (filter: keyof typeof searchFilters) => {
    setSearchFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  const closeModals = () => {
    setActiveModal('none');
    setEditingClient(null);
    setLibelle('');
    setStatut('ACTIF');
    // setSearchFacture('');
    setMessage({ text: '', isError: false });
  };

  const handleAction = async (actionFn: any, payload: any) => {
    setIsSubmitting(true);
    await dispatch(actionFn(payload));
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dateApplication = new Date().toISOString();

    if (editingClient) {
      const result = await dispatch(updateClientBeneficiaire({ id: editingClient.id, libelle, statut }));
      if (updateClientBeneficiaire.fulfilled.match(result)) {
        setMessage({ text: 'Client bénéficiaire mis à jour !', isError: false });
        setTimeout(closeModals, 1500);
      } else {
        setMessage({ text: 'Une erreur est survenue.', isError: true });
      }
    } else {
      const result = await dispatch(createClientBeneficiaire({ libelle, statut, dateApplication }));
      if (createClientBeneficiaire.fulfilled.match(result)) {
        setMessage({ text: 'Client bénéficiaire créé !', isError: false });
        setTimeout(closeModals, 1500);
      } else {
        setMessage({ text: 'Une erreur est survenue.', isError: true });
      }
    }
    setIsSubmitting(false);
  };

  const filteredBeneficiaires = useMemo(() => {
    if (!globalSearch) return beneficiaires;

    const search = globalSearch.toLowerCase();
    
    return beneficiaires.filter((ben) => {
      // Vérification Bénéficiaire
      const matchCodeBen = searchFilters.codeBen && ben.code.toLowerCase().includes(search);
      const matchLibelleBen = searchFilters.libelleBen && ben.libelle.toLowerCase().includes(search);

      // Vérification Client Facturé (dans la liste des factures liées)
      const matchCodeFact = searchFilters.codeFact && ben.factures.some(f => 
        f.clientFacture.code.toLowerCase().includes(search)
      );
      const matchLibelleFact = searchFilters.libelleFact && ben.factures.some(f => 
        f.clientFacture.libelle.toLowerCase().includes(search)
      );

      return matchCodeBen || matchLibelleBen || matchCodeFact || matchLibelleFact;
    });
  }, [beneficiaires, globalSearch, searchFilters]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Overlay loading */}
      {isSubmitting && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Traitement...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiUserCheck className="text-indigo-600" />Clients Bénéficiaires
            </h2>
            <p className="text-gray-500 font-medium italic">Gérez les bénéficiaires et leurs clients facturés.</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingClient(null); setActiveModal('form'); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouveau Client Bénéficiaire
        </button>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold italic">
          <FiAlertCircle /> {globalError}
        </div>
      )}

      {/* BARRE DE RECHERCHE & FILTRES ÉPURÉS */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, code ou client facturé..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
          />
        </div>
        
        <div className="h-8 w-1px bg-gray-100 hidden lg:block mx-2" />

        <div className="flex flex-wrap gap-2 p-2 lg:p-0">
          {[
            { id: 'codeBen', label: 'Code Ben.', color: 'indigo' },
            { id: 'libelleBen', label: 'Nom Ben.', color: 'indigo' },
            { id: 'codeFact', label: 'Code Fact.', color: 'emerald' },
            { id: 'libelleFact', label: 'Nom Fact.', color: 'emerald' },
          ].map((filter) => (
            <button 
              key={filter.id} 
              onClick={() => toggleFilter(filter.id as keyof typeof searchFilters)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                searchFilters[filter.id as keyof typeof searchFilters] 
                ? `bg-${filter.color}-50 border-${filter.color}-200 text-${filter.color}-700` 
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white border border-gray-100 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Code client Bénéficiaire</th>
              <th className="px-6 py-5 text-left">Libellé client Bénéficiaire</th>
              <th className="px-6 py-5 text-left">Code Client Facturé</th>
              <th className="px-6 py-5 text-left">Libellé Client Facturé</th>
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-left">Date Application</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {filteredBeneficiaires.map((client) => (
              <tr key={client.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-mono font-black bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg border border-gray-100">
                    <FiTag size={12} /> {client.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <FiUserCheck size={18} />
                    </div>
                    <span className="text-gray-900 font-black text-sm">{client.libelle}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {client.factures.map((f) => (
                      <span key={f.clientFacture.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                        {f.clientFacture.code}
                      </span>
                    ))}
                    {client.factures.length === 0 && <span className="text-gray-400 italic text-xs">Aucun</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {client.factures.map((f) => (
                      <span key={f.clientFacture.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                        {f.clientFacture.libelle}
                      </span>
                    ))}
                    {client.factures.length === 0 && <span className="text-gray-400 italic text-xs">Aucun</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    client.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                    client.statut === 'CREER' ? 'bg-blue-100 text-blue-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      client.statut === 'ACTIF' ? 'bg-green-500' : 
                      client.statut === 'CREER' ? 'bg-blue-500' : 
                      'bg-red-500'
                    }`} />
                    {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                    {client.statut === 'CREER' ? 'Créé' : client.statut}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  {new Date(client.dateApplication).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button 
                      onClick={() => navigate(`/parametre/client-beneficiaire/${client.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleAction(client.statut === 'ACTIF' ? deactivateClientBeneficiaire : activateClientBeneficiaire, { id: client.id })}
                      className={client.statut === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                    >
                      {client.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => { setAuditEntityId(client.id); setAuditEntityName(client.libelle); }}
                      className="text-purple-600 hover:underline"
                    >
                      Tracer
                    </button>
                    <button onClick={() => window.confirm('Supprimer ?') && handleAction(deleteClientBeneficiaire, { id: client.id })} className="text-red-500 hover:underline border-l border-gray-100 pl-4">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && beneficiaires.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement des clients bénéficiaires...</p>
          </div>
        )}

        {filteredBeneficiaires.length === 0 && !loading && (
          <tr>
            <td colSpan={7} className="p-20 text-center">
              <p className="text-gray-400 font-medium italic">Aucun résultat ne correspond à votre recherche.</p>
            </td>
          </tr>
        )}
      </div>

      {/* MODALE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingClient ? 'Éditer le bénéficiaire' : 'Nouveau bénéficiaire'}
              </h3>
              <button onClick={closeModals} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Libellé du bénéficiaire</label>
                  <input
                    type="text"
                    placeholder="Nom complet ou raison sociale"
                    value={libelle}
                    onChange={(e) => setLibelle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Statut Initial</label>
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none"
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="INACTIF">INACTIF</option>
                  </select>
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-lg flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModals} className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-gray-500 text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="CLIENT_BENEFICIAIRE"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default ClientBeneficiairePage;