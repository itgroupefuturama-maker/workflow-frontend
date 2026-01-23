import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchArticles,
  createArticle,
  updateArticle,
  activateArticle,
  deactivateArticle,
  deleteArticle,
} from '../../app/back_office/articlesSlice';
import {
  fetchSousCategories, // Pour le select dans le formulaire
} from '../../app/back_office/sousCategoriesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Article } from '../../app/back_office/articlesSlice';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiTag, FiBox,FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ArticlePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: articles, loading } = useSelector((state: RootState) => state.articles);
  const { data: sousCategories } = useSelector((state: RootState) => state.sousCategories);

  useEffect(() => {
    dispatch(fetchArticles());
    dispatch(fetchSousCategories()); // Pour remplir le select
  }, [dispatch]);

  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Form states
  const [libelleArticle, setLibelleArticle] = useState('');
  const [sousCategorieId, setSousCategorieId] = useState('');

  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  const closeModal = () => {
    setActiveModal('none');
    setEditingArticle(null);
    setLibelleArticle('');
    setSousCategorieId('');
    setMessage({ text: '', isError: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { libelleArticle, sousCategorieId };

    if (editingArticle) {
      const result = await dispatch(updateArticle({ id: editingArticle.id, ...payload }));
      if (updateArticle.fulfilled.match(result)) {
        setMessage({ text: 'Article mis à jour !', isError: false });
        setTimeout(closeModal, 1500);
      } else {
        setMessage({ text: 'Erreur lors de la mise à jour.', isError: true });
      }
    } else {
      const result = await dispatch(createArticle(payload));
      if (createArticle.fulfilled.match(result)) {
        setMessage({ text: 'Article créé !', isError: false });
        setTimeout(closeModal, 1500);
      } else {
        setMessage({ text: 'Erreur lors de la création.', isError: true });
      }
    }
    setIsSubmitting(false);
  };

  const openEdit = (art: Article) => {
    setEditingArticle(art);
    setLibelleArticle(art.libelleArticle);
    setSousCategorieId(art.sousCategorieId);
    setActiveModal('form');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Overlay loading */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[60] bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Traitement...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className='flex items-center gap-4'>
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl hover:bg-gray-200 transition-all">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <FiBox className="text-indigo-600" /> Articles
            </h2>
            <p className="text-gray-500 font-medium italic">Gestion des articles par sous-catégorie.</p>
          </div>
        </div>
        
        <button
          onClick={() => setActiveModal('form')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouvel Article
        </button>
      </div>

      {/* TABLEAU */}
      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Code Famille Article</th>
              <th className="px-6 py-5 text-left">Libellé Famille Article</th>
              <th className="px-6 py-5 text-left">Catégorie</th>
              <th className="px-6 py-5 text-left">Transaction Achat</th>
              <th className="px-6 py-5 text-left">Transaction Vente</th>
              <th className="px-6 py-5 text-left">Code Sous-Catégorie</th>
              <th className="px-6 py-5 text-left">Libellé Sous-Catégorie</th>
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {articles.map((art) => (
              <tr key={art.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-mono font-black bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg border border-gray-100">
                    <FiTag size={12} /> {art.codeArticle}
                  </span>
                </td>
                <td className="px-6 py-4 font-black text-sm">{art.libelleArticle}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {art.sousCategorie.categorie.module.nom}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {art.sousCategorie.categorie.achat}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {art.sousCategorie.categorie.vente}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{art.sousCategorie.codeSousCategorie}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{art.sousCategorie.libelleSousCategorie}</td>
                {/* <td className="px-6 py-4 text-sm text-gray-600">{art.sousCategorie.categorie.moduleId}</td> */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${art.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${art.status === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {art.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button onClick={() => openEdit(art)} className="text-blue-600 hover:underline">Modifier</button>
                    <button
                      onClick={() => dispatch(art.status === 'ACTIF' ? deactivateArticle(art.id) : activateArticle(art.id))}
                      className={art.status === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                    >
                      {art.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => { setAuditEntityId(art.id); setAuditEntityName(art.libelleArticle); }}
                      className="text-purple-600 hover:underline"
                    >
                      Tracer
                    </button>
                    <button
                      onClick={() => window.confirm('Supprimer cet article ?') && dispatch(deleteArticle(art.id))}
                      className="text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && articles.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FiLoader className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement des articles...</p>
          </div>
        )}
      </div>

      {/* MODALE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {editingArticle ? 'Modifier Article' : 'Nouvel Article'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Libellé Article</label>
                <input
                  type="text"
                  placeholder="ex: Ordinateur portable"
                  value={libelleArticle}
                  onChange={(e) => setLibelleArticle(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sous-Catégorie</label>
                <select
                  value={sousCategorieId}
                  onChange={(e) => setSousCategorieId(e.target.value)}
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                >
                  <option value="">Sélectionner une sous-catégorie</option>
                  {sousCategories.map((sous) => (
                    <option key={sous.id} value={sous.id}>
                      {sous.libelleSousCategorie}
                    </option>
                  ))}
                </select>
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sousCategorieId}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="ARTICLE"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default ArticlePage;