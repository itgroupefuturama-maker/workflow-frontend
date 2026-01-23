import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createModele,
  updateModele,
  deleteModele,
  activateModele,
  deactivateModele
} from '../../app/back_office/modelesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Modele, ModuleRef } from '../../app/back_office/modelesSlice';
import { API_URL } from '../../service/env';
import { FiPlus, FiX, FiLoader, FiFileText, FiCalendar, FiExternalLink, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ModelesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: modeles, loading: modelesLoading } = useSelector((state: RootState) => state.modeles);
  const { data: modules } = useSelector((state: RootState) => state.modules);

  // States UI
  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingModele, setEditingModele] = useState<Modele | null>(null);

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    moduleId: '',
    fonctionnalite: '',
    modeleIntroduction: '',
    dateApplication: '',
    pdf: null as File | null
  });

  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({ moduleId: '', fonctionnalite: '', dateApplication: '', modeleIntroduction:'',pdf: null });
    setEditingModele(null);
    setError('');
    setActiveModal('none');
  };

  const openEditModal = (mod: Modele) => {
    setEditingModele(mod);
    setFormData({
      moduleId: mod.moduleId,
      fonctionnalite: mod.fonctionnalite,
      modeleIntroduction: mod.modeleIntroduction || '',
      dateApplication: mod.dateApplication.slice(0, 10),
      pdf: null
    });
    setActiveModal('form');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, pdf: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const action = editingModele
      ? updateModele({
          id: editingModele.id,
          moduleId: formData.moduleId,
          fonctionnalite: formData.fonctionnalite,
          dateApplication: new Date(formData.dateApplication).toISOString(),
          modeleIntroduction: formData.modeleIntroduction,
          status: editingModele.status,
          pdf: formData.pdf || undefined
        })
      : createModele({
          moduleId: formData.moduleId,
          fonctionnalite: formData.fonctionnalite,
          modeleIntroduction: formData.modeleIntroduction,
          dateApplication: new Date().toISOString(),
          status: 'CREER',
          pdf: formData.pdf as File
        });

    const result = await dispatch(action);
    if (createModele.fulfilled.match(result) || updateModele.fulfilled.match(result)) {
      resetForm();
    } else {
      setError('Une erreur est survenue lors de l\'enregistrement.');
    }
    setIsSubmitting(false);
  };

  const handleAction = async (actionFn: any, id: string) => {
    setIsSubmitting(true);
    await dispatch(actionFn({ id }));
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay de chargement global */}
      {isSubmitting && activeModal === 'none' && (
        <div className="fixed inset-0 z-60 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Traitement en cours...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">

        <div className='flex items-center gap-4'>
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiFileText className="text-indigo-600" /> Gestion des Modèles
            </h2>
            <p className="text-gray-500 font-medium italic">Gestion des documents PDF et conformité par module.</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setActiveModal('form'); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouveau Modèle
        </button>
      </div>

      {/* Tableau Modernisé */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Module</th>
              <th className="px-6 py-5 text-left">Fonctionnalité</th>
              <th className="px-6 py-5 text-left">Modèle Document</th>
              <th className="px-6 py-5 text-left">Modèle Introduction</th>
              <th className="px-6 py-5 text-left">Date Application</th>
              <th className="px-6 py-5 text-right">Statut</th>
              <th className="px-6 py-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {modeles.map((modele) => (
              <tr key={modele.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{modele.module.nom}</div>
                  <div className="text-[10px] font-mono text-indigo-500 font-black uppercase tracking-tighter">{modele.module.code}</div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-600">
                  {modele.fonctionnalite}
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={`${API_URL}/${modele.modeleDocument}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-black text-[11px] uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all"
                  >
                    <FiExternalLink /> Consulter PDF
                  </a>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-600">
                  {modele.modeleIntroduction || 'N/A'}
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500 uppercase">
                    <FiCalendar className="text-gray-300" /> {new Date(modele.dateApplication).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    modele.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${modele.status === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {modele.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button onClick={() => openEditModal(modele)} className="text-blue-600 hover:underline">Modifier</button>
                    {modele.status === 'ACTIF' ? (
                      <button onClick={() => handleAction(deactivateModele, modele.id)} className="text-amber-600 hover:underline">Désactiver</button>
                    ) : (
                      <button onClick={() => handleAction(activateModele, modele.id)} className="text-emerald-600 hover:underline">Activer</button>
                    )}
                    <button onClick={() => { setAuditEntityId(modele.id); setAuditEntityName(modele.module.nom); }} className="text-purple-600 hover:underline">Tracer</button>
                    <button onClick={() => window.confirm('Supprimer ?') && handleAction(deleteModele, modele.id)} className="text-red-500 hover:underline border-l border-gray-100 pl-4">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {modelesLoading && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Récupération des documents...</p>
          </div>
        )}
      </div>

      {/* Modale de Formulaire Premium */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {editingModele ? 'Édition du Modèle' : 'Nouveau Modèle PDF'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"><FiX size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Module de référence</label>
                  <select 
                    value={formData.moduleId}
                    onChange={(e) => setFormData({...formData, moduleId: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    required
                  >
                    <option value="">Choisir un module...</option>
                    {modules.map((m: ModuleRef) => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nom Fonctionnalité</label>
                  <input 
                    value={formData.fonctionnalite} 
                    onChange={(e) => setFormData({...formData, fonctionnalite: e.target.value})} 
                    placeholder="Ex: CREATION_FACTURE_CLIENT" 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all  placeholder:text-gray-300" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Model D'introduction</label>
                  <input 
                    value={formData.modeleIntroduction} 
                    onChange={(e) => setFormData({...formData, modeleIntroduction: e.target.value})} 
                    placeholder="Ex: Bonjour, voici le document..." 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all  placeholder:text-gray-300" 
                    required 
                  />
                </div>

                {/* <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date d'application</label>
                  <input 
                    type="date"
                    value={formData.dateApplication} 
                    onChange={(e) => setFormData({...formData, dateApplication: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-gray-700" 
                    required 
                  />
                </div> */}

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Fichier PDF {editingModele && <span className="text-indigo-400 font-medium tracking-normal text-[9px]">(Laissez vide pour conserver l'original)</span>}
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={handleFileChange} 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" 
                      required={!editingModele}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase flex items-center gap-2 border border-red-100">
                  <FiAlertCircle /> {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">Annuler</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : editingModele ? 'Mettre à jour' : 'Confirmer la création'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="MODELE"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default ModelesPage;