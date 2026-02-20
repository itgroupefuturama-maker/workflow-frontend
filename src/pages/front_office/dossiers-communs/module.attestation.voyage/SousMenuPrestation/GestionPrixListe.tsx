// src/components/parametre/GestionPrixListe.tsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchAttestationParams } from '../../../../../app/front_office/parametre_attestation/attestationParamsSlice';
import AttestationParamModal from '../../../../../components/modals/Attestation/AttestationParamModal';

export default function GestionPrixListe() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector(
    (state: RootState) => state.attestationParams
  );

  const [modalOpen, setModalOpen] = useState(false); // ← AJOUT

  useEffect(() => {
    if (items.length === 0) dispatch(fetchAttestationParams());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
        Erreur : {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-gray-950 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          + Nouveau prix
        </button>
      </div>

      {/* Tableau */}
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {['Prix', 'Statut', 'Date activation', 'Date désactivation', 'Créé le'].map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                {item.prix.toLocaleString('fr-FR')} Ar
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.status === 'ACTIF'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.status === 'ACTIF' ? 'bg-green-500' : 'bg-slate-400'
                    }`}
                  />
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {new Date(item.date_activation).toLocaleString('fr-FR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {item.date_desactivation
                  ? new Date(item.date_desactivation).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : <span className="text-slate-300">—</span>
                }
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && !loading && (
        <p className="text-center text-slate-400 py-10 text-sm italic">
          Aucun paramètre de prix trouvé
        </p>
      )}

      <AttestationParamModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}