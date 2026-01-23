import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCommission,
  updateCommission,
  deleteCommission,
  activateCommission,
  deactivateCommission,
} from '../../app/back_office/commissionsSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Commission, ModuleRef } from '../../app/back_office/commissionsSlice';
import { FiPlus, FiX, FiLoader, FiPercent, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const CommissionPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: commissions, loading: commissionsLoading } = useSelector((state: RootState) => state.commissions);
  const { data: modules } = useSelector((state: RootState) => state.modules);

  // States UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  // Form State initial
  const initialState = {
    moduleId: '',
    provenantOdoo: 'OUI',
    librePrixModule: 'NON',
    forfaitUnite: 'OUI',
    difPrixClientPrixModule: 'NON',
    libre: 'NON',
    dateApplication: new Date().toISOString().slice(0, 10)
  };

  const [formData, setFormData] = useState(initialState);

  const resetForm = () => {
    setFormData(initialState);
    setEditingCommission(null);
    setMessage(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (comm: Commission) => {
    setEditingCommission(comm);
    setFormData({
      moduleId: comm.moduleId,
      provenantOdoo: comm.provenantOdoo,
      librePrixModule: comm.librePrixModule,
      forfaitUnite: comm.forfaitUnite,
      difPrixClientPrixModule: comm.DifPrixClientPrixModule,
      libre: comm.libre,
      dateApplication: comm.dateApplication.slice(0, 10)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      ...formData,
      DifPrixClientPrixModule: formData.difPrixClientPrixModule, // Mapping pour l'API
      dateApplication: new Date(formData.dateApplication).toISOString(),
    };

    const action = editingCommission 
      ? updateCommission({ id: editingCommission.id, ...payload }) 
      : createCommission(payload);

    const result = await dispatch(action);

    if (createCommission.fulfilled.match(result) || updateCommission.fulfilled.match(result)) {
      setMessage({ text: editingCommission ? 'Modifié avec succès !' : 'Commission créée !', isError: false });
      setTimeout(resetForm, 1500);
    } else {
      setMessage({ text: 'Erreur lors de l\'enregistrement.', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleAction = async (actionFn: any, id: string) => {
    setIsSubmitting(true);
    await dispatch(actionFn({ id }));
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette configuration de commission ?')) return;
    setIsSubmitting(true);
    await dispatch(deleteCommission({ id }));
    setIsSubmitting(false);
  };

  const openAudit = (commission: Commission) => {
      setAuditEntityId(commission.id);
      setAuditEntityName(commission.module.nom);
    };

  const closeAudit = () => {
    setAuditEntityId(null);
    setAuditEntityName('');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay global pour actions rapides */}
      {isSubmitting && !isModalOpen && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <FiLoader className="text-indigo-600 animate-spin" size={40} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        

        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiPercent className="text-indigo-600" /> Gestion des Commissions
            </h2>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouvelle Commission
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-left">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5">Code Catégorie</th>
              <th className="px-6 py-5">Catégorie Prestation</th>
              <th className="px-6 py-5 text-center">Statut</th>
              <th className="px-6 py-5">Date d'application</th>
              <th className="px-6 py-5 text-center">Provenant Odoo</th>
              <th className="px-6 py-5 text-center">Libre sur prix Prestataire</th>
              <th className="px-6 py-5 text-center">Forfaitaire Par Unité</th>
              <th className="px-6 py-5 text-center">Diff Prix Client/Préstataire</th>
              <th className="px-6 py-5 text-center">Libre</th>
              <th className="px-6 py-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {commissions.map((comm) => (
              <tr key={comm.id} className="hover:bg-indigo-50/30 transition-colors text-sm text-gray-700">
                <td className="px-6 py-4 text-center">
                  <div className="text-[10px] font-mono text-indigo-500 uppercase">{comm.module?.code}</div></td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{comm.module?.nom || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black ${comm.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {comm.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-[10px] font-mono text-indigo-500 uppercase">{new Date(comm.createdAt).toLocaleDateString('fr-FR')}</div></td>
                <td className="px-6 py-4 text-center"><BooleanBadge value={comm.provenantOdoo} /></td>
                <td className="px-6 py-4 text-center"><BooleanBadge value={comm.librePrixModule} /></td>
                <td className="px-6 py-4 text-center"><BooleanBadge value={comm.forfaitUnite} /></td>
                <td className="px-6 py-4 text-center"><BooleanBadge value={comm.DifPrixClientPrixModule} /></td>
                <td className="px-6 py-4 text-center"><BooleanBadge value={comm.libre} /></td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3 text-[10px] font-black uppercase">
                    <button onClick={() => handleOpenEdit(comm)} className="text-blue-600 hover:underline">Modifier</button>
                    {comm.status === 'ACTIF' ? (
                      <button onClick={() => handleAction(deactivateCommission, comm.id)} className="text-amber-600 hover:underline">Désactiver</button>
                    ) : (
                      <button onClick={() => handleAction(activateCommission, comm.id)} className="text-emerald-600 hover:underline">Activer</button>
                    )}
                    <button
                      onClick={() => openAudit(comm)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      Tracer
                    </button>
                    <button onClick={() => handleDelete(comm.id)} className="text-red-600 hover:underline">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {commissionsLoading && <div className="p-10 text-center"><FiLoader className="animate-spin mx-auto text-indigo-600" /></div>}
      </div>

      {/* Modale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">{editingCommission ? 'Modifier Commission' : 'Nouvelle Commission'}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Module</label>
                  <select 
                    value={formData.moduleId} 
                    onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Sélectionner un module</option>
                    {modules.map((m: ModuleRef) => <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>)}
                  </select>
                </div>

                <SelectField label="Provenant Odoo" value={formData.provenantOdoo} onChange={(v) => setFormData({...formData, provenantOdoo: v})} />
                <SelectField label="Libre Prix Module" value={formData.librePrixModule} onChange={(v) => setFormData({...formData, librePrixModule: v})} />
                <SelectField label="Forfait Unité" value={formData.forfaitUnite} onChange={(v) => setFormData({...formData, forfaitUnite: v})} />
                <SelectField label="Diff. Prix Client/Module" value={formData.difPrixClientPrixModule} onChange={(v) => setFormData({...formData, difPrixClientPrixModule: v})} />
                <SelectField label="Libre" value={formData.libre} onChange={(v) => setFormData({...formData, libre: v})} />
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date d'application</label>
                  <input 
                    type="date" 
                    value={formData.dateApplication} 
                    onChange={(e) => setFormData({...formData, dateApplication: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>
              </div>

              {message && (
                <div className={`mt-6 p-4 rounded-2xl flex items-center gap-2 font-bold text-sm ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />} {message.text}
                </div>
              )}

              <div className="flex gap-4 mt-10">
                <button type="button" onClick={resetForm} className="flex-1 py-4 border border-gray-100 rounded-2xl font-bold text-gray-500">Annuler</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : editingCommission ? 'Mettre à jour' : 'Confirmer la création'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="COMMISSIONS"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={closeAudit}
      />
    </div>
  );
};

// Composants internes pour le style
const BooleanBadge = ({ value }: { value: string }) => (
  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${value === 'OUI' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-300'}`}>
    {value}
  </span>
);

const SelectField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
      {['OUI', 'NON'].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${value === opt ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default CommissionPage;