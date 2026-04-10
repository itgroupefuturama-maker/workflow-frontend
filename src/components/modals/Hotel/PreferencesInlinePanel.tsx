import { FiX, FiLoader, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const typeServiceBadge = (type: string) => ({
  TICKET:  'bg-blue-50 text-blue-700 border border-blue-200',
  SERVICE: 'bg-violet-50 text-violet-700 border border-violet-200',
}[type] ?? 'bg-slate-100 text-slate-500');

const clientThemes: Record<string, { bg: string; text: string; icon: string; sub: string }> = {
  SIMPLE:    { bg: 'bg-slate-800',   text: 'text-white',      icon: 'bg-white/20', sub: 'text-slate-300'    },
  BRONZE:    { bg: 'bg-orange-700',  text: 'text-white',      icon: 'bg-white/20', sub: 'text-orange-200'   },
  SILVER:    { bg: 'bg-slate-400',   text: 'text-slate-800',  icon: 'bg-white/20', sub: 'text-slate-700'    },
  GOLD:      { bg: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-600', text: 'text-yellow-900', icon: 'bg-white/20', sub: 'text-amber-900/80' },
  VIP:       { bg: 'bg-purple-700',  text: 'text-white',      icon: 'bg-white/20', sub: 'text-purple-200'   },
  PLATINIUM: { bg: 'bg-slate-600',   text: 'text-white',      icon: 'bg-white/20', sub: 'text-slate-300'    },
};

interface Props {
  beneficiaire: {
    clientBeneficiaire: {
      libelle: string;
      code: string;
      typeClient: string;
      statut: string;
    };
  } | null;
  onClose: () => void;
}

export default function PreferencesInlinePanel({ beneficiaire, onClose }: Props) {
  const { preferences, loadingPreferences } = useSelector(
    (state: RootState) => state.clientFactures
  );

  if (!beneficiaire) return null;

  const { libelle, code, typeClient, statut } = beneficiaire.clientBeneficiaire;
  const t = clientThemes[typeClient] ?? clientThemes.SIMPLE;

  const grouped = (preferences ?? []).reduce<Record<string, typeof preferences>>(
    (acc, pref) => {
      const key = pref.service.libelle;
      if (!acc[key]) acc[key] = [];
      acc[key].push(pref);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col w-[300px] h-[80vh] max-h-[80vh] shrink-0 border-l border-gray-200 overflow-y-auto">
      
      {/* Header coloré */}
      <div className={`relative ${t.bg} shrink-0`}>
        <div className={`absolute -right-4 -top-4 opacity-10 pointer-events-none ${t.text}`}>
          <FiUsers size={80} />
        </div>
        <div className="relative z-10 px-4 pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${t.icon} backdrop-blur-md flex items-center justify-center text-sm font-bold ${t.text}`}>
                {getInitials(libelle)}
              </div>
              <div>
                <h3 className={`text-sm font-bold ${t.text} leading-tight truncate max-w-[150px]`}>
                  {libelle}
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${t.icon} ${t.text}`}>
                  {typeClient}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-lg ${t.icon} ${t.text} hover:bg-white/30 transition-colors shrink-0`}
            >
              <FiArrowLeft size={14} />
            </button>
          </div>

          {/* Statut + Ref */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className={`${t.icon} rounded-lg px-2.5 py-1.5 backdrop-blur-sm`}>
              <p className={`text-[9px] font-bold uppercase ${t.sub} opacity-80`}>Statut</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${statut === 'ACTIF' ? 'bg-green-400' : 'bg-slate-400'}`} />
                <span className={`text-xs font-bold ${t.text}`}>{statut}</span>
              </div>
            </div>
            <div className={`${t.icon} rounded-lg px-2.5 py-1.5 backdrop-blur-sm`}>
              <p className={`text-[9px] font-bold uppercase ${t.sub} opacity-80`}>Référence</p>
              <p className={`text-xs font-bold ${t.text} truncate`}>{code || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Corps scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/30">
        {loadingPreferences && (
          <div className="flex flex-col items-center justify-center py-10">
            <FiLoader className="animate-spin text-slate-300 mb-2" size={18} />
            <p className="text-xs text-slate-400">Chargement...</p>
          </div>
        )}

        {!loadingPreferences && preferences.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <FiUsers className="text-slate-300" size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Aucune préférence</p>
            <p className="text-[11px] text-slate-400 mt-1">Ce client n'a pas encore de préférences enregistrées.</p>
          </div>
        )}

        {!loadingPreferences && preferences.length > 0 && (
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
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/30 transition-colors">
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
    </div>
  );
}