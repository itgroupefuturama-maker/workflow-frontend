// components/PreferencesModal.tsx
import { FiX, FiLoader, FiUsers } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { clearPreferences } from '../../../../app/back_office/clientFacturesSlice';

const typeServiceBadge = (type: string) => ({
  TICKET:  'bg-blue-50 text-blue-700 border border-blue-200',
  SERVICE: 'bg-violet-50 text-violet-700 border border-violet-200',
}[type] ?? 'bg-slate-100 text-slate-500');

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

interface Props {
  clientName: string;
  clientRef?: string;
  clientType?: string;
  clientStatus?: string;
}

export default function PreferencesModal({
  clientName,
  clientRef,
  clientType,
  clientStatus,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { preferences, loadingPreferences, errorPreferences } = useSelector(
    (state: RootState) => state.clientFactures
  );

  const grouped = (preferences ?? []).reduce<Record<string, typeof preferences>>(
    (acc, pref) => {
      const key = pref.service.libelle;
      if (!acc[key]) acc[key] = [];
      acc[key].push(pref);
      return acc;
    },
    {}
  );

  // Configuration des thèmes basée sur tes types de cartes
  const clientThemes: Record<string, { bg: string, text: string, icon: string, sub: string }> = {
    SIMPLE: { bg: 'bg-slate-800', text: 'text-white', icon: 'bg-white/20', sub: 'text-slate-300' },
    BRONZE: { bg: 'bg-orange-700', text: 'text-white', icon: 'bg-white/20', sub: 'text-orange-200' },
    SILVER: { bg: 'bg-slate-400', text: 'text-slate-800', icon: 'bg-white/20', sub: 'text-slate-700' },
    GOLD:   { bg: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-600', text: 'text-yellow-900', icon: 'bg-white/20', sub: 'text-amber-900/80' },
    VIP:    { bg: 'bg-purple-700', text: 'text-white', icon: 'bg-white/20', sub: 'text-purple-200' },
  };

  const t = clientThemes[clientType || 'SIMPLE'] || clientThemes.SIMPLE;

  return (
    <div
      className="fixed inset-0 z-60 flex justify-end bg-black/10 transition-opacity"
      onClick={() => dispatch(clearPreferences())}
    >
      <div
        className="relative flex flex-col top-20 h-[calc(100vh-8rem)] bg-white w-[370px] border-l border-slate-200 mr-4 shadow-2xl overflow-hidden rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- NOUVEAU HEADER DYNAMIQUE --- */}
        <div className={`relative ${t.bg} transition-colors duration-500`}>
          {/* Icône de fond décorative */}
          <div className={`absolute -right-4 -top-4 opacity-10 pointer-events-none ${t.text}`}>
            <FiUsers size={100} />
          </div>

          <div className="relative z-10 px-5 pt-6 pb-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${t.icon} backdrop-blur-md flex items-center justify-center text-lg font-bold ${t.text}`}>
                  {getInitials(clientName)}
                </div>
                <div>
                  <h2 className={`text-base font-bold ${t.text} leading-tight truncate max-w-[180px]`}>
                    {clientName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${t.icon} ${t.text}`}>
                      {clientType || 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch(clearPreferences())}
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${t.icon} ${t.text} hover:bg-white/30 transition-colors`}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Grille d'infos rapide intégrée au header */}
            <div className="grid grid-cols-2 gap-2 mt-5">
               <div className={`${t.icon} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                  <p className={`text-[9px] font-bold uppercase ${t.sub} opacity-80`}>Statut</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${clientStatus === 'ACTIF' ? 'bg-green-400' : 'bg-slate-400'}`} />
                    <span className={`text-xs font-bold ${t.text}`}>{clientStatus}</span>
                  </div>
               </div>
               <div className={`${t.icon} rounded-lg px-3 py-2 backdrop-blur-sm`}>
                  <p className={`text-[9px] font-bold uppercase ${t.sub} opacity-80`}>Référence</p>
                  <p className={`text-xs font-bold ${t.text}`}>{clientRef || '—'}</p>
               </div>
            </div>
          </div>
        </div>

        {!loadingPreferences && preferences.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <FiUsers className="text-slate-300" size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Aucune préférence</p>
            <p className="text-[11px] text-slate-400 mt-1">Ce client n'a pas encore de préférences enregistrées.</p>
          </div>
        )}

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/30">
          {loadingPreferences && (
            <div className="flex flex-col items-center justify-center py-16">
              <FiLoader className="animate-spin text-slate-300 mb-3" size={20} />
              <p className="text-sm text-slate-400">Chargement des préférences...</p>
            </div>
          )}

          {!loadingPreferences && !errorPreferences && preferences.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Préférences de service
              </p>

              {Object.entries(grouped).map(([serviceName, items]) => (
                <div key={serviceName} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{serviceName}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeServiceBadge(items[0].service.typeService)}`}>
                      {items[0].service.typeService}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50/30 transition-colors">
                        <span className="text-xs text-slate-600">{item.preference}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-white">
          <button
            onClick={() => dispatch(clearPreferences())}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}