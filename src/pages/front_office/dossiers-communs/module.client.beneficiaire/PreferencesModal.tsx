// components/PreferencesModal.tsx
import { FiX, FiLoader, FiTag, FiRepeat, FiGrid } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import { clearPreferences } from '../../../../app/back_office/clientFacturesSlice';

const typeServiceBadge = (type: string) => ({
  TICKET:   'bg-blue-50 text-blue-700 border border-blue-200',
  SERVICE:  'bg-violet-50 text-violet-700 border border-violet-200',
}[type] ?? 'bg-slate-100 text-slate-500');

interface Props {
  clientName: string;
}

export default function PreferencesModal({ clientName }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { preferences, loadingPreferences, errorPreferences } = useSelector(
    (state: RootState) => state.clientFactures
  );

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={() => dispatch(clearPreferences())}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">Préférences</p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[260px]">
              {clientName}
            </p>
          </div>
          <button
            onClick={() => dispatch(clearPreferences())}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <FiX size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-4">
          {loadingPreferences && (
            <div className="flex flex-col items-center justify-center py-10">
              <FiLoader className="animate-spin text-indigo-400 mb-3" size={22} />
              <p className="text-sm text-slate-400">Chargement...</p>
            </div>
          )}

          {errorPreferences && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {errorPreferences}
            </div>
          )}

          {!loadingPreferences && !errorPreferences && preferences.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <FiGrid className="text-slate-300" size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">Aucune préférence</p>
              <p className="text-xs text-slate-400 mt-0.5">Ce bénéficiaire n'a pas de préférences enregistrées.</p>
            </div>
          )}

          {!loadingPreferences && (preferences || []).length > 0 && (
            <div className="space-y-2">
                {Object.entries(
                (preferences || []).reduce<Record<string, typeof preferences>>((acc, pref) => {
                    const key = pref.service.libelle;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(pref);
                    return acc;
                }, {})
                ).map(([serviceName, items]) => (
                <div key={serviceName} className="border border-slate-100 rounded-xl overflow-hidden">
                  {/* En-tête service */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">{serviceName}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {items[0].service.code}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeServiceBadge(items[0].service.typeService)}`}>
                      {items[0].service.typeService}
                    </span>
                  </div>

                  {/* Lignes préférences */}
                  <div className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <FiTag size={12} className="text-slate-300" />
                          <span className="text-[13px] font-medium text-slate-700">
                            {item.preference}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <FiRepeat size={11} />
                          <span>{item.count}×</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => dispatch(clearPreferences())}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}