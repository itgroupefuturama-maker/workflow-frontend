// src/pages/parametres/Miles.tsx
import { useEffect, useState } from 'react';
import {
  fetchMiles,
  createMiles,
  updateMiles,
  // activateMiles,
  // deactivateMiles,
} from '../../app/back_office/milesSlice';
import type { Miles } from '../../app/back_office/milesSlice';
import {
  FiArrowLeft, FiXCircle, FiPlus, FiClock,
  FiCheckCircle, FiTag, FiCalendar,
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { useNavigate } from 'react-router-dom';
import AuditModal from '../../components/AuditModal';

const useAppDispatch = () => useDispatch<AppDispatch>();

const MilesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: milesList, loading } = useSelector((state: RootState) => state.miles);
  const { data: allModules } = useSelector((state: RootState) => state.modules);

  // --- FORMULAIRE CRÉATION ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newModuleId, setNewModuleId] = useState('');
  const [newTaux, setNewTaux] = useState<number>(0);

  // --- ÉDITION TAUX ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTaux, setEditedTaux] = useState<number>(0);

  // --- AUDIT ---
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');

  useEffect(() => {
    dispatch(fetchMiles());
  }, [dispatch]);

  // TRI par date décroissante
  const sortedMilesList = [...milesList].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleCreate = () => {
    if (!newModuleId || newTaux <= 0) {
      alert('Veuillez sélectionner un module et saisir un taux valide');
      return;
    }
    console.log(`Le donnée envoyer ${JSON.stringify({ moduleId: newModuleId, taux: newTaux })}`);
    
    dispatch(createMiles({ moduleId: newModuleId, taux: newTaux }));
    setNewModuleId('');
    setNewTaux(0);
    setShowCreateForm(false);
  };

  const handleSaveTaux = (miles: Miles) => {
    dispatch(updateMiles({ id: miles.id, taux: editedTaux }));
    setEditingId(null);
  };

  const openAudit = (miles: Miles) => {
    setAuditEntityId(miles.id);
    setAuditEntityName(miles.numMiles);
  };

  const closeAudit = () => {
    setAuditEntityId(null);
    setAuditEntityName('');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(-1)}
            className="group p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestion des Miles</h1>
            <p className="text-sm text-gray-500 font-medium">Configurez vos barèmes de points par module</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
            showCreateForm
              ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
          }`}
        >
          {showCreateForm ? <><FiXCircle size={18} /> Annuler</> : <><FiPlus size={18} /> Nouveau barème</>}
        </button>
      </div>

      {/* ── FORMULAIRE CRÉATION ── */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-gray-800">Nouveau Barème Miles</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Associez un module à un taux de conversion
              </p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Module <span className="text-red-500">*</span>
              </label>
              <select
                value={newModuleId}
                onChange={(e) => setNewModuleId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">— Sélectionner un module —</option>
                {allModules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.code} – {mod.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Taux (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={newTaux}
                onChange={(e) => setNewTaux(Number(e.target.value))}
                placeholder="ex: 2.5"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="px-8 pb-8 flex justify-end gap-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-2.5 text-gray-400 font-bold text-sm hover:text-gray-600"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <FiCheckCircle size={16} /> Créer le barème
            </button>
          </div>
        </div>
      )}

      {/* ── LISTE DES MILES ── */}
      {loading && (
        <div className="text-center py-12 text-gray-400 font-semibold">Chargement...</div>
      )}

      {!loading && sortedMilesList.length === 0 && (
        <div className="text-center py-12 text-gray-400 font-semibold">
          Aucun barème Miles pour le moment.
        </div>
      )}

      <div className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
        {sortedMilesList.length > 0 && (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  N° Barème
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Module
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Taux (%)
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Date application
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Désactivation
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {sortedMilesList.map((miles) => {
                const isEditing = editingId === miles.id;
                return (
                  <tr
                    key={miles.id}
                    className={`transition-colors ${isEditing ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
                  >
                    {/* N° Barème */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <FiTag size={14} className="text-indigo-600" />
                        </div>
                        <span className="text-sm font-black text-indigo-600">{miles.numMiles}</span>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {miles.module.code}
                        </span>
                        <p className="text-sm font-semibold text-gray-700 mt-1">{miles.module.nom}</p>
                      </div>
                    </td>

                    {/* Taux */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editedTaux}
                          onChange={(e) => setEditedTaux(Number(e.target.value))}
                          className="w-24 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-black text-indigo-600">
                          {miles.taux}
                          <span className="text-xs font-bold text-gray-400 ml-1">%</span>
                        </span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        miles.status === 'ACTIF'
                          ? 'bg-green-100 text-green-700'
                          : miles.status === 'INACTIF'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          miles.status === 'ACTIF' ? 'bg-green-500'
                          : miles.status === 'INACTIF' ? 'bg-red-500'
                          : 'bg-amber-500'
                        }`} />
                        {miles.status}
                      </span>
                    </td>

                    {/* Date application */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                        <FiCalendar size={12} className="text-indigo-400" />
                        {new Date(miles.dateApplication).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Date désactivation */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-400 font-medium">
                        {miles.dateDesactivation
                          ? new Date(miles.dateDesactivation).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveTaux(miles)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 transition-colors"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Modifier taux */}
                            <button
                              onClick={() => {
                                setEditingId(miles.id);
                                setEditedTaux(miles.taux);
                              }}
                              className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                            >
                              Modifier
                            </button>

                            {/* Activer / Désactiver */}
                            {/* {miles.status !== 'ACTIF' ? (
                              <button
                                onClick={() => dispatch(activateMiles(miles.id))}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black hover:bg-emerald-600 hover:text-white transition-colors"
                                title="Activer"
                              >
                                <FiCheckCircle size={13} /> Activer
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (confirm('Désactiver ce barème ?')) {
                                    dispatch(deactivateMiles(miles.id));
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-black hover:bg-red-600 hover:text-white transition-colors"
                                title="Désactiver"
                              >
                                <FiPower size={13} /> Désactiver
                              </button>
                            )} */}

                            {/* Historique */}
                            <button
                              onClick={() => openAudit(miles)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-black hover:bg-purple-600 hover:text-white transition-colors"
                              title="Historique"
                            >
                              <FiClock size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AuditModal
        entity="MILES"
        entityId={auditEntityId}
        entityName={auditEntityName}
        isOpen={!!auditEntityId}
        onClose={closeAudit}
      />
    </div>
  );
};

export default MilesPage;