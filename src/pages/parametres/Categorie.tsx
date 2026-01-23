import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  createCategorie,
  updateCategorie,
  deleteCategorie,
} from '../../app/back_office/categoriesSlice';
import {
  fetchSousCategories,
  createSousCategorie,
  updateSousCategorie,
  activateSousCategorie,
  deactivateSousCategorie,
  deleteSousCategorie,
} from '../../app/back_office/sousCategoriesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Categorie } from '../../app/back_office/categoriesSlice';
import type { SousCategorie } from '../../app/back_office/sousCategoriesSlice';
import { FiPlus, FiX, FiLoader, FiTag, FiPackage, FiArrowLeft, FiCheck } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

// --- Composant Oui/Non Amélioré ---
type OuiNonButtonProps = {
  value: 'OUI' | 'NON';
  setValue: (v: 'OUI' | 'NON') => void;
  label: string;
};

const OuiNonButton: React.FC<OuiNonButtonProps> = ({ value, setValue, label }) => (
  <div className="flex flex-col gap-3">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</span>
    <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
      <button 
        type="button" 
        onClick={() => setValue('OUI')} 
        className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center gap-2 ${value === 'OUI' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {value === 'OUI' && <FiCheck />} OUI
      </button>
      <button 
        type="button" 
        onClick={() => setValue('NON')} 
        className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center gap-2 ${value === 'NON' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {value === 'NON' && <FiCheck />} NON
      </button>
    </div>
  </div>
);

const useAppDispatch = () => useDispatch<AppDispatch>();

const CategoriePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: categories, loading: catLoading } = useSelector((state: RootState) => state.categories);
  const { data: sousCategories } = useSelector((state: RootState) => state.sousCategories);
  const { data: modules } = useSelector((state: RootState) => state.modules);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSousCategories());
  }, [dispatch]);

  const [catModal, setCatModal] = useState<'none' | 'form'>('none');
  const [editingCat, setEditingCat] = useState<Categorie | null>(null);
  const [catModuleId, setCatModuleId] = useState('');
  const [catAchat, setCatAchat] = useState<'OUI' | 'NON'>('OUI');
  const [catVente, setCatVente] = useState<'OUI' | 'NON'>('NON');

  const [sousModal, setSousModal] = useState<'none' | 'form'>('none');
  const [editingSous, setEditingSous] = useState<SousCategorie | null>(null);
  const [sousLibelle, setSousLibelle] = useState('');
  const [sousCategorieId, setSousCategorieId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  // --- Gestion des Actions de ligne (Loading inclus) ---
  const handleAsyncAction = async (actionFn: any, id: string) => {
    setIsSubmitting(true);
    await dispatch(actionFn(id));
    setIsSubmitting(false);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { moduleId: catModuleId, achat: catAchat, vente: catVente };
    if (editingCat) {
      await dispatch(updateCategorie({ id: editingCat.id, ...payload }));
    } else {
      await dispatch(createCategorie(payload));
    }
    setIsSubmitting(false);
    closeCatModal();
  };

  const handleSousSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { libelleSousCategorie: sousLibelle, categorieId: sousCategorieId };
    if (editingSous) {
      await dispatch(updateSousCategorie({ id: editingSous.id, ...payload }));
    } else {
      await dispatch(createSousCategorie(payload));
    }
    setIsSubmitting(false);
    closeSousModal();
  };

  const openCatEdit = (cat: Categorie) => {
    setEditingCat(cat);
    setCatModuleId(cat.moduleId);
    setCatAchat(cat.achat);
    setCatVente(cat.vente);
    setCatModal('form');
  };

  const closeCatModal = () => {
    setCatModal('none');
    setEditingCat(null);
    setCatModuleId('');
    setCatAchat('OUI');
    setCatVente('NON');
  };

  const openSousEdit = (sous: SousCategorie) => {
    setEditingSous(sous);
    setSousLibelle(sous.libelleSousCategorie);
    setSousCategorieId(sous.categorieId);
    setSousModal('form');
  };

  const closeSousModal = () => {
    setSousModal('none');
    setEditingSous(null);
    setSousLibelle('');
    setSousCategorieId('');
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Overlay global de traitement */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
            <FiLoader className="text-indigo-600 animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mise à jour...</p>
          </div>
        </div>
      )}

      {/* SECTION CATÉGORIES */}
      <div className="mb-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
              <FiArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Catégorie
            </h2>
          </div>
          <button onClick={() => setCatModal('form')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 text-sm">
            <FiPlus size={20} /> Nouvelle Catégorie
          </button>
        </div>

        <div className="bg-white border border-gray-100  overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                <tr>
                  <th className="px-6 py-6 text-left">Catégorie</th>
                  <th className="px-6 py-6 text-center">Achat</th>
                  <th className="px-6 py-6 text-center">Vente</th>
                  <th className="px-6 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                          <FiPackage size={18} />
                        </div>
                        <div>
                          <span className="text-gray-900 font-black text-sm uppercase">{cat.module.nom}</span>
                          <p className="text-[10px] font-mono font-bold text-gray-400">{cat.module.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border ${cat.achat === 'OUI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {cat.achat }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border ${cat.vente === 'OUI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {cat.vente}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                        <button onClick={() => openCatEdit(cat)} className="text-blue-600 hover:underline">Modifier</button>
                        <button onClick={() => { setAuditEntityId(cat.id); setAuditEntityName(cat.module.nom); }} className="text-purple-600 hover:underline">Tracer</button>
                        <button onClick={() => window.confirm('Supprimer ?') && dispatch(deleteCategorie(cat.id))} className="text-red-500 hover:underline">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {catLoading && categories.length === 0 && (
            <div className="p-20 flex flex-col items-center gap-3 text-gray-400">
              <FiLoader className="animate-spin text-indigo-600" size={30} />
              <p className="text-[10px] font-black uppercase tracking-widest">Récupération des catégories...</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION SOUS-CATÉGORIES */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            Famille Article
          </h2>
          <button onClick={() => setSousModal('form')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 text-sm">
            <FiPlus size={20} /> Nouvelle Sous-Catégorie
          </button>
        </div>

        <div className="bg-white border border-gray-100 shadow-gray-100/40 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                <tr>
                  <th className="px-6 py-6 text-left">Code famille article</th>
                  <th className="px-6 py-6 text-left">Libellé famille article</th>
                  <th className="px-6 py-6 text-left">Catégorie</th>
                  <th className="px-6 py-6 text-center">Statut</th>
                  <th className="px-6 py-6 text-center">Date d'Application</th>
                  <th className="px-6 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {sousCategories.map((sous) => (
                  <tr key={sous.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 text-[10px] font-mono font-black bg-gray-50 text-indigo-500 px-3 py-1.5 rounded-lg border border-gray-100">
                        <FiTag size={12} /> {sous.codeSousCategorie}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-sm text-gray-800 uppercase tracking-tight">
                      {sous.libelleSousCategorie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-500">
                        {sous.categorie.module.nom}
                        {/* <span className="ml-2 text-[9px] bg-gray-100 px-2 py-0.5 rounded uppercase font-black">
                          {sous.categorie.achat}/{sous.categorie.vente}
                        </span> */}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        sous.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                        sous.status === 'CREER' ? 'bg-blue-100 text-blue-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          sous.status === 'ACTIF' ? 'bg-green-500' : 
                          sous.status === 'CREER' ? 'bg-blue-500' : 
                          'bg-red-500'
                        }`} />
                        {/* Affichage du texte : 'Créé' si le statut est 'CREER' */}
                        {sous.status === 'CREER' ? 'Créé' : sous.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-[10px] font-mono text-gray-500">
                      {sous.createdAt ? new Date(sous.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                        <button onClick={() => openSousEdit(sous)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Modifier">
                          Modifier
                        </button>
                        <button
                          onClick={() => handleAsyncAction(sous.status === 'ACTIF' ? deactivateSousCategorie : activateSousCategorie, sous.id)}
                          className={`p-2.5 rounded-xl transition-all ${sous.status === 'ACTIF' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={sous.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                        >
                          {sous.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => window.confirm('Supprimer ?') && handleAsyncAction(deleteSousCategorie, sous.id)} className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all" title="Supprimer">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODALES --- */}

      {catModal === 'form' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800">Paramétrage Catégorie</h3>
              <button onClick={closeCatModal} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-gray-400 transition-all">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-8 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Module Associé</label>
                <select value={catModuleId} onChange={(e) => setCatModuleId(e.target.value)} required className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all">
                  <option value="">Sélectionner un module</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <OuiNonButton value={catAchat} setValue={setCatAchat} label="Autoriser les flux d'Achat" />
                <OuiNonButton value={catVente} setValue={setCatVente} label="Autoriser les flux de Vente" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeCatModal} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sousModal === 'form' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800">Sous-Catégorie</h3>
              <button onClick={closeSousModal} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-gray-400 transition-all">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSousSubmit} className="p-8 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Libellé</label>
                <input
                  type="text"
                  placeholder="NOM DE LA SOUS-CATÉGORIE"
                  value={sousLibelle}
                  onChange={(e) => setSousLibelle(e.target.value.toUpperCase())}
                  required
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Catégorie Parente</label>
                <select value={sousCategorieId} onChange={(e) => setSousCategorieId(e.target.value)} required className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-gray-700 outline-none transition-all">
                  <option value="">Lier à une catégorie</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.module.nom} (Flux: {c.achat}/{c.vente})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeSousModal} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal entity="CATEGORIE" entityId={auditEntityId} entityName={auditEntityName} isOpen={!!auditEntityId} onClose={() => setAuditEntityId(null)} />
    </div>
  );
};

export default CategoriePage;