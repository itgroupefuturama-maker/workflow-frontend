import { useAudit } from '../hooks/useAudit';
import { FiClock, FiX, FiUser, FiArrowRight, FiDatabase, FiAlertCircle } from 'react-icons/fi';

interface AuditModalProps {
  entity: string;
  entityId: string | null;
  entityName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AuditModal = ({ entity, entityId, entityName, isOpen, onClose }: AuditModalProps) => {
  const { auditData, loading, error } = useAudit(entity, entityId);

  if (!isOpen) return null;

  // Helper pour la couleur des badges d'action
  const getActionStyle = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': case 'INSERT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE': case 'MODIFY': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95">
        
        {/* Header Dynamique */}
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FiClock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 leading-tight">Journal d'Audit</h3>
              <p className="text-sm text-gray-500 font-medium">Tracer des modifications : <span className="text-indigo-600 font-bold">{entityName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <FiX size={24} />
          </button>
        </div>

        {/* Body avec Timeline */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold">Récupération des logs...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3">
              <FiAlertCircle size={20} /> <span className="font-bold">{error}</span>
            </div>
          )}

          {!loading && !error && auditData.length === 0 && (
            <div className="text-center py-20">
              <FiDatabase size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium italic">Aucune trace enregistrée pour cette entité.</p>
            </div>
          )}

          {auditData.length > 0 && (
            <div className="relative border-l-2 border-indigo-100 ml-4 space-y-10 pr-4">
              {auditData.map((entry) => (
                <div key={entry.id} className="relative pl-8">
                  {/* Point sur la timeline */}
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-sm" />
                  
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Top Row: User & Date */}
                    <div className="p-4 border-b border-gray-50 flex flex-wrap justify-between items-center gap-3 bg-gray-50/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                          <FiUser size={14} />
                        </div>
                        <div className="text-sm">
                          <span className="font-bold text-gray-800">
                            {entry.user ? `${entry.user.prenom} ${entry.user.nom}` : 'Système Automatique'}
                          </span>
                          <span className="text-gray-400 ml-2 text-xs font-medium">({entry.user?.email || 'root'})</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getActionStyle(entry.action)}`}>
                        {entry.action}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {new Date(entry.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Data Comparison Section */}
                    {(entry.oldValue || entry.newValue) && (
                      <div className="p-5 grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-center gap-4">
                        {/* Old Data */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1">État Précédent</span>
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-gray-600">
                            {entry.oldValue ? <pre>{JSON.stringify(entry.oldValue, null, 2)}</pre> : <span className="italic opacity-50 text-xs text-gray-400">Néant (Création)</span>}
                          </div>
                        </div>

                        {/* Arrow Desktop Only */}
                        <div className="hidden lg:flex text-gray-300 mt-6">
                          <FiArrowRight size={20} />
                        </div>

                        {/* New Data */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Nouvel État</span>
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-gray-600">
                            {entry.newValue ? <pre>{JSON.stringify(entry.newValue, null, 2)}</pre> : <span className="italic opacity-50 text-xs text-red-400 uppercase font-bold">Supprimé</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-lg shadow-gray-200 active:scale-95"
          >
            Fermer le journal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditModal;