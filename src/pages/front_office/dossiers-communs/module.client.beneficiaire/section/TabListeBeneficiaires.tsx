import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  activateClientBeneficiaire,
  deactivateClientBeneficiaire,
  deleteClientBeneficiaire,
} from '../../../../../app/back_office/clientBeneficiairesSlice';
import type { ClientBeneficiaire } from '../../../../../app/back_office/clientBeneficiairesSlice';
import type { RootState, AppDispatch } from '../../../../../app/store';
import { FiAlertTriangle, FiLoader, FiSearch, FiTag, FiTrash2, FiUserCheck } from 'react-icons/fi';
import AuditModal from '../../../../../components/AuditModal';
import { useNavigate } from 'react-router-dom';
import ModalFormBeneficiaire from '../modals/ModalFormBeneficiaire';

// ─── Modale de confirmation suppression ──────────────────────────────────────

function ModalConfirmDelete({
  client,
  onClose,
  onConfirm,
  loading,
}: {
  client: ClientBeneficiaire;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="px-6 py-5 flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-100 shrink-0">
            <FiAlertTriangle size={22} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base">Supprimer ce bénéficiaire ?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Cette action est <span className="font-bold text-red-500">irréversible</span>. Le bénéficiaire suivant sera définitivement supprimé :
            </p>
          </div>
        </div>

        {/* Carte client */}
        <div className="mx-6 mb-5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <FiUserCheck size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900">{client.libelle}</p>
            <p className="text-[11px] text-gray-400 font-mono uppercase">{client.code}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="text-sm px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <FiTrash2 size={14} />
            }
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────────────────────

const TabListeBeneficiaires = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { data: beneficiaires, loading } = useSelector(
    (state: RootState) => state.clientBeneficiaires
  );

  const [showModal, setShowModal]             = useState(false);
  const [editingClient, setEditingClient]     = useState<ClientBeneficiaire | null>(null);
  const [auditEntityId, setAuditEntityId]     = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');
  const [globalSearch, setGlobalSearch]       = useState('');
  const [deletingClient, setDeletingClient]   = useState<ClientBeneficiaire | null>(null); // ← nouveau
  const [deleteLoading, setDeleteLoading]     = useState(false);                           // ← nouveau
  const [searchFilters, setSearchFilters]     = useState({
    codeBen: true, libelleBen: true, codeFact: false, libelleFact: false,
  });

  const toggleFilter = (f: keyof typeof searchFilters) =>
    setSearchFilters(prev => ({ ...prev, [f]: !prev[f] }));

  const handleAction = async (actionFn: any, payload: any) => {
    await dispatch(actionFn(payload));
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    setDeleteLoading(true);
    await dispatch(deleteClientBeneficiaire({ id: deletingClient.id }));
    setDeleteLoading(false);
    setDeletingClient(null);
  };

  const filteredBeneficiaires = useMemo(() => {
    if (!globalSearch) return beneficiaires;
    const s = globalSearch.toLowerCase();
    return beneficiaires.filter((ben) => {
      const matchCodeBen     = searchFilters.codeBen     && ben.code.toLowerCase().includes(s);
      const matchLibelleBen  = searchFilters.libelleBen  && ben.libelle.toLowerCase().includes(s);
      const matchCodeFact    = searchFilters.codeFact    && ben.factures.some(f => f.clientFacture.code.toLowerCase().includes(s));
      const matchLibelleFact = searchFilters.libelleFact && ben.factures.some(f => f.clientFacture.libelle.toLowerCase().includes(s));
      return matchCodeBen || matchLibelleBen || matchCodeFact || matchLibelleFact;
    });
  }, [beneficiaires, globalSearch, searchFilters]);

  return (
    <>
      {/* Barre recherche + bouton nouveau */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex flex-1 flex-col lg:flex-row items-stretch lg:items-center gap-2">
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
          <div className="flex flex-wrap gap-2 p-2 lg:p-0">
            {[
              { id: 'codeBen',     label: 'Code Ben.',  color: 'indigo' },
              { id: 'libelleBen',  label: 'Nom Ben.',   color: 'indigo' },
              { id: 'codeFact',    label: 'Code Fact.', color: 'emerald' },
              { id: 'libelleFact', label: 'Nom Fact.',  color: 'emerald' },
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
        {/* <button
          onClick={() => { setEditingClient(null); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 whitespace-nowrap"
        >
          + Nouveau bénéficiaire
        </button> */}
      </div>

      {/* Tableau */}
      <div className="bg-white  rounded-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-blue-800 uppercase text-[10px] font-black text-white tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Code Bénéficiaire</th>
              <th className="px-6 py-5 text-left">Libellé Bénéficiaire</th>
              <th className="px-6 py-5 text-left">Code Client Facturé</th>
              <th className="px-6 py-5 text-left">Libellé Client Facturé</th>
              <th className="px-6 py-5 text-left">Type Client</th>
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    client.typeClient === 'SIMPLE' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {client.typeClient ?? '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    client.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                    client.statut === 'CREER' ? 'bg-blue-100 text-blue-700'  :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      client.statut === 'ACTIF' ? 'bg-green-500' :
                      client.statut === 'CREER' ? 'bg-blue-500'  :
                      'bg-red-500'
                    }`} />
                    {client.statut === 'CREER' ? 'Créé' : client.statut}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  {new Date(client.dateApplication).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button
                      onClick={() => navigate(`/dossiers-communs/base-donnee/details/${client.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition cursor-pointer"
                    >
                      Profilage
                    </button>
                    <button
                      onClick={() => navigate(`/parametre/client-beneficiaire/${client.id}`)}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleAction(
                        client.statut === 'ACTIF' ? deactivateClientBeneficiaire : activateClientBeneficiaire,
                        { id: client.id }
                      )}
                      className={client.statut === 'ACTIF' ? 'text-amber-600 hover:underline cursor-pointer' : 'text-emerald-600 hover:underline cursor-pointer'}
                    >
                      {client.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => { setAuditEntityId(client.id); setAuditEntityName(client.libelle); }}
                      className="text-purple-600 hover:underline cursor-pointer"
                    >
                      Tracer
                    </button>
                    {/* ← Bouton Supprimer : ouvre la modale au lieu de window.confirm */}
                    {/* <button
                      onClick={() => setDeletingClient(client)}
                      className="text-red-500 hover:underline border-l border-gray-100 pl-4 cursor-pointer"
                    >
                      <FiTrash2 size={15} />
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && beneficiaires.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
          </div>
        )}

        {!loading && filteredBeneficiaires.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-gray-400 font-medium italic">Aucun résultat.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <ModalFormBeneficiaire
          editingClient={editingClient}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
        />
      )}

      {/* ← Modale confirmation suppression */}
      {deletingClient && (
        <ModalConfirmDelete
          client={deletingClient}
          onClose={() => setDeletingClient(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      )}

      <AuditModal
        entity="CLIENT_BENEFICIAIRE"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </>
  );
};

export default TabListeBeneficiaires;