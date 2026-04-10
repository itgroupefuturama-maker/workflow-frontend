import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  fetchServicesByType,
  createServicePreference,
  type TypeService,
  type ServiceSpecifique,
} from '../../../../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import ServiceSpecifiqueModal from '../../../../../components/modals/ServiceSpecifiqueModal';

interface Props {
  typeService: TypeService;
}

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ServiceSpecifiqueListe({ typeService }: Props) {
  const dispatch = useAppDispatch();
  const { itemsByType, loading } = useSelector((state: RootState) => state.serviceSpecifique);
  const filteredItems = (itemsByType ?? {})[typeService] ?? [];
  const [modalOpen, setModalOpen] = useState(false);

  // ── État modal préférence ──────────────────────────────────
  const [prefModal, setPrefModal] = useState<{
    open: boolean;
    service: ServiceSpecifique | null;
  }>({ open: false, service: null });
  const [prefInput, setPrefInput] = useState('');
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchServicesByType(typeService));
  }, [typeService, dispatch]);

  const openPrefModal = (service: ServiceSpecifique) => {
    setPrefModal({ open: true, service });
    setPrefInput('');
    setPrefError(null);
  };

  const closePrefModal = () => {
    setPrefModal({ open: false, service: null });
    setPrefInput('');
    setPrefError(null);
  };

  const handleAddPreference = async () => {
    if (!prefInput.trim()) {
      setPrefError('La préférence est requise');
      return;
    }
    if (!prefModal.service) return;

    setPrefSaving(true);
    setPrefError(null);

    const result = await dispatch(createServicePreference({
      preference: prefInput.trim(),
      serviceSpecifiqueId: prefModal.service.id,
    }));

    if (createServicePreference.fulfilled.match(result)) {
      closePrefModal();
    } else {
      setPrefError(result.payload as string);
    }

    setPrefSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Services & Spécifiques</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredItems.length} service{filteredItems.length > 1 ? 's' : ''} enregistré{filteredItems.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <span className="text-lg leading-none">+</span>
          Nouveau service
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Chargement des services...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-sm font-semibold text-slate-500">Aucun service enregistré</p>
          </div>
        ) : (
          <>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['Code', 'Libellé', 'Type', 'Préférences', 'Créé le', ''].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.libelle}</td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                          item.type === 'SPECIFIQUE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Préférences */}
                    <td className="px-6 py-4">
                      {(() => {
                        const prefs = item.servicePreference ?? [];
                        return prefs.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Aucune</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {prefs.map((pref) => (
                              <span
                                key={pref.id}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-medium"
                              >
                                {pref.preference}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openPrefModal(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <span className="text-sm leading-none">+</span>
                        Préférence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Modal création service ── */}
      <ServiceSpecifiqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        typeService={typeService}
      />

      {/* ── Modal ajout préférence ── */}
      {prefModal.open && prefModal.service && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <h3 className="text-base font-bold text-slate-800 mb-1">
              Ajouter une préférence
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Service : <span className="font-semibold text-slate-600">{prefModal.service.libelle}</span>
              <span className="ml-2 font-mono text-slate-400">({prefModal.service.code})</span>
            </p>

            {prefError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {prefError}
              </div>
            )}

            {/* Préférences existantes */}
            {(prefModal.service.servicePreference ?? []).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Déjà ajoutées</p>
                <div className="flex flex-wrap gap-1.5">
                  {(prefModal.service.servicePreference ?? []).map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs"
                    >
                      {p.preference}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nouvelle préférence <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={prefInput}
                onChange={(e) => setPrefInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPreference()}
                placeholder="Ex: Connexion WiFi Premium, Siège fenêtre..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closePrefModal}
                disabled={prefSaving}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPreference}
                disabled={prefSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {prefSaving && (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                )}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}