import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../app/store';
import { activateRaisonAnnulation, deactivateRaisonAnnulation } from '../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import { useState } from 'react';
import RaisonAnnulationModal from '../../../../../components/modals/RaisonAnnulationModal';

export default function RaisonAnnulationListe() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.raisonAnnulation);

  // Tracker quel item est en cours de traitement
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [modalRaisonOpen, setModalRaisonOpen] = useState(false);

  const handleActivate = async (id: string) => {
    setLoadingId(id);
    await dispatch(activateRaisonAnnulation(id));
    setLoadingId(null);
  };

  const handleDeactivate = async (id: string) => {
    setLoadingId(id);
    await dispatch(deactivateRaisonAnnulation(id));
    setLoadingId(null);
  };

  if (loading) {
    return (
      <div className="p-10 text-center animate-pulse text-slate-500">
        Chargement des raisons d'annulation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 italic">
        Aucune raison d'annulation trouvée
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ══ HEADER ══ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Raisons d'annulation</h2>
          <p className="text-xs text-slate-400 mt-0.5">{items.length} raison{items.length > 1 ? 's' : ''} enregistrée{items.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModalRaisonOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle raison
        </button>
      </div>

      {/* ══ TABLE ══ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <p className="text-sm font-semibold text-slate-500">Aucune raison d'annulation</p>
            <p className="text-xs text-slate-400">Commencez par en créer une</p>
          </div>
        ) : (
          <table className="min-w-full">

            {/* Head */}
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Libellé</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Créé le</th>
                <th className="px-6 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const isProcessing = loadingId === item.id;
                const isActif = item.statut === 'ACTIF';
                const isCreer = item.statut === 'CREER';

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    {/* Libellé */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200/0 group-hover:border-slate-200 flex items-center justify-center transition-all shrink-0">
                          <span className="text-[11px] font-bold text-slate-400">{index + 1}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{item.libelle}</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 uppercase rounded-lg text-xs font-semibold ${
                        isActif
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : isCreer
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full  ${
                          isActif ? 'bg-emerald-500' : isCreer ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        {item.statut == 'CREER' ? 'Crée' : item.statut}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {isProcessing ? (
                        <div className="inline-flex items-center justify-end">
                          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                        </div>
                      ) : isActif ? (
                        <button
                          onClick={() => handleDeactivate(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 border border-red-100 hover:border-red-500 hover:shadow-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 group-hover:bg-white" />
                          Désactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-500 hover:text-white transition-all duration-200 border border-emerald-100 hover:border-emerald-500 hover:shadow-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Activer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {items.filter(i => i.statut === 'ACTIF').length} active{items.filter(i => i.statut === 'ACTIF').length > 1 ? 's' : ''} sur {items.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Actif
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Créer
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Inactif
              </span>
            </div>
          </div>
        )}
      </div>

      <RaisonAnnulationModal isOpen={modalRaisonOpen} onClose={() => setModalRaisonOpen(false)} />
    </div>
  );
}