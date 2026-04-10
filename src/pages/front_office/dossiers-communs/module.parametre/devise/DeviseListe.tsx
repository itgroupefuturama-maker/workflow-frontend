import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { createDevise, deleteDevise, fetchDevises, updateDevise, type Devise } from '../../../../../app/front_office/parametre-global/deviseSlice';
import ModalFormParametre from '../../module.hotel/components/ModalFormParametre';

const useAppDispatch = () => useDispatch<AppDispatch>();

const DeviseListe = () => {
  const dispatch = useAppDispatch();
  const { items: devises, loading } = useSelector(
    (state: RootState) => state.devise
  );

  const [showAddDevise, setShowAddDevise]     = useState(false);
  const [editingDevise, setEditingDevise]     = useState<Devise | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // État local du formulaire d'édition inline
  const [editForm, setEditForm] = useState({ devise: '', status: '' });

  // ── Création ──
  const handleCreate = (data: any) => {
    dispatch(createDevise({ devise: data.devise.toUpperCase() })).then((result) => {
      if (!result.payload?.error) {
        setShowAddDevise(false);
        dispatch(fetchDevises());
      }
    });
  };

  // ── Ouverture édition ──
  const handleOpenEdit = (devise: Devise) => {
    setEditingDevise(devise);
    setEditForm({ devise: devise.devise, status: devise.status });
  };

  // ── Sauvegarde édition ──
  const handleSaveEdit = () => {
    if (!editingDevise) return;
    dispatch(updateDevise({
      id:     editingDevise.id,
      devise: editForm.devise.toUpperCase(),
      status: editForm.status,
    })).then(() => setEditingDevise(null));
  };

  // ── Suppression ──
  const handleDelete = (id: string) => {
    dispatch(deleteDevise(id)).then(() => setConfirmDeleteId(null));
  };

  return (
    <>
      <div className="flex justify-between mb-4">
        <p className="text-xl font-bold text-gray-800">Gestion des devises</p>
        <button
          onClick={() => setShowAddDevise(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          + Ajouter une devise
        </button>
      </div>

      {/* ── Table manuelle pour gérer les actions inline ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {['Code devise', 'Statut', 'Créé le', 'Actions'].map(col => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && devises.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                  Aucune devise enregistrée.
                </td>
              </tr>
            )}
            {devises.map((devise) => {
              const isEditing   = editingDevise?.id === devise.id;
              const isDeleting  = confirmDeleteId === devise.id;

              return (
                <tr key={devise.id} className="hover:bg-slate-50 transition-colors">

                  {/* Code devise */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        value={editForm.devise}
                        onChange={e => setEditForm({ ...editForm, devise: e.target.value })}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-28 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-800 font-mono">
                        {devise.devise}
                      </span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="ACTIF">ACTIF</option>
                        <option value="INACTIF">INACTIF</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        devise.status === 'ACTIF'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {devise.status}
                      </span>
                    )}
                  </td>

                  {/* Date création */}
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(devise.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          <FiCheck size={13} /> Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingDevise(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <FiX size={13} /> Annuler
                        </button>
                      </div>
                    ) : isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 mr-1">Confirmer ?</span>
                        <button
                          onClick={() => handleDelete(devise.id)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 size={13} /> Supprimer
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <FiX size={13} /> Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(devise)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(devise.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal création */}
      <ModalFormParametre
        isOpen={showAddDevise}
        onClose={() => setShowAddDevise(false)}
        onSubmit={handleCreate}
        title="Nouvelle devise"
        fields={[
          {
            name: 'devise',
            label: 'Code devise (ex: EUR, USD)',
            type: 'text',
            required: true,
          },
        ]}
        loading={loading}
      />
    </>
  );
};

export default DeviseListe;