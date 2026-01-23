import { useState, useMemo } from 'react'; // Ajout de useMemo pour la performance
import { useDispatch, useSelector } from 'react-redux';
import {
  updatePiece,
  activatePiece,
  deactivatePiece,
  deletePiece,
  // addModuleToPiece,
  // removeModuleFromPiece,
  createPiece,
} from '../../app/back_office/piecesSlice';
import type { RootState, AppDispatch } from '../../app/store';
import type { Piece } from '../../app/back_office/piecesSlice';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiTag, FiFileText, FiArrowLeft } from 'react-icons/fi';
import AuditModal from '../../components/AuditModal';
import { useNavigate } from 'react-router-dom';

const useAppDispatch = () => useDispatch<AppDispatch>();

const PiecePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: pieces } = useSelector((state: RootState) => state.pieces);
  // const { data: modules } = useSelector((state: RootState) => state.modules);

  // UI States
  const [activeModal, setActiveModal] = useState<'none' | 'form'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  
  // Remplacement de editingPiece (objet) par editingPieceId (string)
  const [editingPieceId, setEditingPieceId] = useState<string | null>(null);

  // On récupère la pièce "live" depuis le store Redux
  const currentPiece = useMemo(() => 
    pieces.find(p => p.id === editingPieceId) || null
  , [pieces, editingPieceId]);

  // Form States
  const [document, setDocument] = useState('');
  // const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  // const [newModuleIdToAdd, setNewModuleIdToAdd] = useState('');

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  const closeModals = () => {
    setActiveModal('none');
    setEditingPieceId(null);
    setDocument('');
    // setSelectedModuleIds([]);
    // setNewModuleIdToAdd('');
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

    if (currentPiece) {
      const result = await dispatch(updatePiece({ id: currentPiece.id, document }));
      if (updatePiece.fulfilled.match(result)) {
        setMessage({ text: 'Document mis à jour !', isError: false });
        setTimeout(closeModals, 1500);
      }
    } else {
      const result = await dispatch(createPiece({ document }));
      if (createPiece.fulfilled.match(result)) {
        setMessage({ text: 'Pièce créée avec succès !', isError: false });
        setTimeout(closeModals, 1500);
      }
    }
    setIsSubmitting(false);
  };

  // Les fonctions d'ajout/suppression utilisent maintenant l'ID dynamique
  // const handleAddModule = async () => {
  //   if (editingPieceId && newModuleIdToAdd) {
  //     setIsSubmitting(true);
  //     await dispatch(addModuleToPiece({ pieceId: editingPieceId, moduleId: newModuleIdToAdd }));
  //     setNewModuleIdToAdd('');
  //     setIsSubmitting(false);
  //   }
  // };

  // const handleRemoveModule = async (moduleId: string) => {
  //   if (editingPieceId) {
  //     setIsSubmitting(true);
  //     await dispatch(removeModuleFromPiece({ pieceId: editingPieceId, moduleId }));
  //     setIsSubmitting(false);
  //   }
  // };

  const openEdit = (piece: Piece) => {
    setEditingPieceId(piece.id);
    setDocument(piece.document);
    setActiveModal('form');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Overlay global (pour actions tableau) */}
      {isSubmitting && activeModal === 'none' && (
        <div className="fixed inset-0 z-[60] bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-gray-100">
            <FiLoader className="text-indigo-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mise à jour...</p>
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
              <FiFileText className="text-indigo-600" /> Gestion des Pièces
            </h2>
            <p className="text-gray-500 font-medium italic text-sm">Référentiel des documents requis par module.</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingPieceId(null); setActiveModal('form'); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus size={20} /> Nouvelle Pièce
        </button>
      </div>

      {/* TABLEAU */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-5 text-left">Code Doc</th>
              <th className="px-6 py-5 text-left">Document</th>
              {/* <th className="px-6 py-5 text-left">Modules Liés</th> */}
              <th className="px-6 py-5 text-left">Statut</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white font-medium">
            {pieces.map((piece) => (
              <tr key={piece.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-mono font-black bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg border border-gray-100 uppercase">
                    <FiTag size={12} /> {piece.codeDoc}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <FiFileText size={18} />
                    </div>
                    <span className="text-gray-900 font-black text-sm uppercase tracking-tight">{piece.document}</span>
                  </div>
                </td>
                {/* <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2 max-w-xs">
                    {piece.module.map((m) => (
                      <span key={m.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-black uppercase border border-gray-200">
                        {m.nom}
                      </span>
                    ))}
                    {piece.module.length === 0 && <span className="text-[10px] text-gray-300 italic font-bold">Aucun lien</span>}
                  </div>
                </td> */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    piece.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${piece.status === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {piece.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4 text-[11px] font-black uppercase tracking-tighter">
                    <button onClick={() => openEdit(piece)} className="text-blue-600 hover:underline">Modifier</button>
                    <button 
                      onClick={() => handleAction(piece.status === 'ACTIF' ? deactivatePiece : activatePiece, { id: piece.id })}
                      className={piece.status === 'ACTIF' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                    >
                      {piece.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => { setAuditEntityId(piece.id); setAuditEntityName(piece.document); }} className="text-purple-600 hover:underline">Tracer</button>
                    <button onClick={() => window.confirm('Supprimer ?') && handleAction(deletePiece, { id: piece.id })} className="text-red-500 hover:underline border-l border-gray-100 pl-4">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALE FORMULAIRE */}
      {activeModal === 'form' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">
                {currentPiece ? 'Édition Pièce' : 'Nouvelle Pièce'}
              </h3>
              <button onClick={closeModals} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nom du Document</label>
                  <input 
                    type="text" 
                    placeholder="ex: ATTESTATION DE RÉSIDENCE" 
                    value={document} 
                    onChange={(e) => setDocument(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase placeholder:text-gray-300" 
                    required 
                  />
                </div>

                {/* GESTION DES MODULES */}
                {/* <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Modules Associés</label>
                  
                  {currentPiece ? (
                    // MODE ÉDITION : Liste dynamique
                    <div className="space-y-3">
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {currentPiece.module.map((mod) => (
                          <div key={mod.id} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in slide-in-from-right-2">
                            <span className="text-xs font-black text-indigo-900 uppercase tracking-tighter">{mod.nom}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveModule(mod.id)} 
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Retirer ce module"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div> */}
                      
                      {/* Sélecteur d'ajout rapide */}
                      {/* <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-dashed border-gray-200">
                        <select 
                          value={newModuleIdToAdd} 
                          onChange={(e) => setNewModuleIdToAdd(e.target.value)} 
                          className="flex-1 bg-transparent text-xs font-bold outline-none pl-2"
                        >
                          <option value="">Lier un module...</option>
                          {modules
                            .filter(m => !currentPiece.module.some(pm => pm.id === m.id))
                            .map(m => <option key={m.id} value={m.id}>{m.nom}</option>)
                          }
                        </select>
                        <button 
                          type="button" 
                          onClick={handleAddModule}
                          disabled={!newModuleIdToAdd}
                          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 transition-all"
                        >
                          <FiPlusCircle size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // MODE CRÉATION : Multiselect checkboxes
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {modules.map((mod) => (
                        <label key={mod.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-100 cursor-pointer transition-colors group">
                          <input 
                            type="checkbox" 
                            checked={selectedModuleIds.includes(mod.id)} 
                            onChange={() => setSelectedModuleIds(prev => 
                              prev.includes(mod.id) ? prev.filter(id => id !== mod.id) : [...prev, mod.id]
                            )} 
                            className="hidden"
                          />
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedModuleIds.includes(mod.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                            {selectedModuleIds.includes(mod.id) && <FiCheckCircle className="text-white" size={14} />}
                          </div>
                          <span className="text-xs font-bold text-gray-600 uppercase group-hover:text-indigo-900">{mod.nom}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div> */}
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {message.isError ? <FiAlertCircle /> : <FiCheckCircle />} {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModals} className="flex-1 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Annuler</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                >
                  {isSubmitting ? <FiLoader className="animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditModal
        entity="PIECES"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={() => setAuditEntityId(null)}
      />
    </div>
  );
};

export default PiecePage;