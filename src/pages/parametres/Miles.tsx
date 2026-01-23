// src/pages/parametres/Miles.tsx
import { useEffect, useState } from 'react';
import {
  fetchMiles,
  createMiles,
  updateModulesForMiles,
  addBorneToLatest,
  updateBorneMiles,
  deleteBorneMiles,
  activateMiles, deactivateMiles
} from '../../app/back_office/milesSlice';
// Add this import at the top with other imports
import type { BorneMiles, Miles } from '../../app/back_office/milesSlice';
import { FiArrowLeft, FiXCircle, FiPlus, FiClock, FiX, FiCheckCircle, FiTrash2, FiPower, FiTag, FiCalendar, FiCheck} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import type { RootState } from '../../app/store';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AuditModal from '../../components/AuditModal';

const useAppDispatch = () => useDispatch<AppDispatch>();

interface NewBorne {
  borneCaInf: number;
  borneCaSup: number;
  miles: number;
}

const MilesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: milesList, loading } = useSelector((state: RootState) => state.miles);
  const { data: allModules } = useSelector((state: RootState) => state.modules);

  // --- ÉTAT POUR LES ONGLETS ---
  const [activeTab, setActiveTab] = useState<'calcul' | 'perimetre'>('calcul');

  // --- ÉTATS POUR LA VISIBILITÉ ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddTrancheForm, setShowAddTrancheForm] = useState(false);

  // Formulaire création
  const [bornes, setBornes] = useState<NewBorne[]>([
    { borneCaInf: 0, borneCaSup: 1000, miles: 100 },
  ]);

  // Audit
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditEntityName, setAuditEntityName] = useState('');


  // Formulaire ajout d'une seule borne au barème actuel
  const [newBorne, setNewBorne] = useState<NewBorne>({
    borneCaInf: 0,
    borneCaSup: 0,
    miles: 0,
  });

  // État temporaire pour les modifications en cours (uniquement les changements non sauvegardés)
  const [pendingModules, setPendingModules] = useState<Record<string, Set<string>>>({});

  // Gestion de l'édition d'une borne
  const [editingBorneId, setEditingBorneId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<BorneMiles>>({});

  useEffect(() => {
    dispatch(fetchMiles());
  }, [dispatch]);

  // TRI : on trie par date de création décroissante
  const sortedMilesList = [...milesList].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Le plus récent (premier après tri)
  const latestMiles = sortedMilesList[0];

  const addBorneRow = () => {
    setBornes([...bornes, { borneCaInf: 0, borneCaSup: 0, miles: 0 }]);
  };

  const removeBorneRow = (index: number) => {
    if (bornes.length > 1) {
      setBornes(bornes.filter((_, i) => i !== index));
    }
  };

  const updateBorne = (index: number, field: keyof NewBorne, value: number) => { 
    const updated = [...bornes];
    updated[index][field] = value;
    setBornes(updated);
  };

  const handleCreate = () => {
    dispatch(createMiles(bornes));
    setBornes([{ borneCaInf: 0, borneCaSup: 1000, miles: 100 }]);
  };

  // Toggle local (sans toucher au store tout de suite)
  const togglePendingModule = (milesId: string, moduleId: string) => {
    setPendingModules((prev) => {
      const set = new Set(prev[milesId] || []);
      if (set.has(moduleId)) {
        set.delete(moduleId);
      } else {
        set.add(moduleId);
      }
      return { ...prev, [milesId]: set };
    });
  };

  // Calcul des modules actuellement sélectionnés (store + pending)
  const getCurrentModulesForMiles = (milesId: string): string[] => {
    const miles = milesList.find((m) => m.id === milesId);
    if (!miles) return [];

    const base = miles.Module.map((mod) => mod.id);
    const pending = pendingModules[milesId] || new Set<string>();

    // On applique les changements locaux
    return base
      .filter((id) => !pending.has(id)) // retire ceux décochés
      .concat(Array.from(pending).filter((id) => !base.includes(id))); // ajoute ceux cochés
  };

  const handleSaveModules = (milesId: string) => {
    const newSelectedIds = getCurrentModulesForMiles(milesId);
    dispatch(updateModulesForMiles({ milesId, newModuleIds: newSelectedIds }));

    // On vide les pending après sauvegarde
    setPendingModules((prev) => {
      const newPrev = { ...prev };
      delete newPrev[milesId];
      return newPrev;
    });
  };

  const handleDeleteBorne = (borneId: string) => {
    dispatch(deleteBorneMiles(borneId));
  };

  const hasPendingChanges = (milesId: string) => {
    return !!pendingModules[milesId] && pendingModules[milesId].size > 0;
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
      {/* TITRE PRINCIPAL AVEC BOUTON DE CRÉATION */}
      <div className="flex flex-col gap-6">
        {/* Barre d'outils supérieure */}
        <div className="flex items-center justify-between">
          
          {/* Groupe Gauche : Retour + Titre */}
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className="group p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200"
              title="Retour"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Gestion des Bornes Miles
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Configurez vos barèmes et tranches de points
              </p>
            </div>
          </div>

          {/* Groupe Droite : Action */}
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm ${
              showCreateForm 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 shadow-md active:scale-95'
            }`}
          >
            {showCreateForm ? (
              <>
                <FiXCircle size={18} />
                Annuler la création
              </>
            ) : (
              <>
                <FiPlus size={18} />
                Nouveau barème
              </>
            )}
          </button>
        </div>
        
        {/* Séparateur subtil optionnel */}
        <div className="h-px from-gray-200 via-gray-100 to-transparent w-full" />
      </div>

      {/* === frmulaire de Création === */}
      {showCreateForm && (
        <div className="bg-white mx-8 mt-8 rounded-1rem border border-gray-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
          
          {/* HEADER DU FORMULAIRE */}
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Nouveau Barème Miles</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Configuration des paliers de récompense</p>
            </div>
            <div className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black">
              {bornes.length} TRANCHE{bornes.length > 1 ? 'S' : ''}
            </div>
          </div>

          <div className="p-8">
            <div className="overflow-hidden border border-gray-100 rounded-2xl mb-8">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Borne CA Inférieure</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Borne CA Supérieure</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-indigo-600">Points Miles</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bornes.map((borne, index) => (
                    <tr key={index} className="group hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0"
                            value={borne.borneCaInf}
                            onChange={(e) => updateBorne(index, 'borneCaInf', Number(e.target.value))}
                            className="w-full bg-gray-50 border-transparent border-2 focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">€</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Max"
                            value={borne.borneCaSup}
                            onChange={(e) => updateBorne(index, 'borneCaSup', Number(e.target.value))}
                            className="w-full bg-gray-50 border-transparent border-2 focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">€</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          placeholder="Points"
                          value={borne.miles}
                          onChange={(e) => updateBorne(index, 'miles', Number(e.target.value))}
                          className="w-full bg-indigo-50/50 border-transparent border-2 focus:border-indigo-200 focus:bg-white rounded-xl px-4 py-3 text-sm font-black text-indigo-600 transition-all outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeBorneRow(index)}
                          disabled={bornes.length === 1}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-20"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ACTIONS DU FORMULAIRE */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-50 pt-8">
              <button 
                onClick={addBorneRow} 
                className="w-full sm:w-auto px-6 py-3.5 bg-white border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <FiPlus size={16} /> Ajouter une tranche
              </button>
              
              <div className="flex gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setShowCreateForm(false)} 
                  className="flex-1 sm:flex-none px-8 py-3.5 text-gray-400 font-bold text-[11px] uppercase tracking-widest hover:text-gray-600"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreate} 
                  className="flex-1 sm:flex-none px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <FiCheckCircle size={18} /> Créer le barème
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Barème actuel (le plus récent) === */}
      {latestMiles && (
        <>
          <div className="p-8 mb-12">
            <div className="mb-8 bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              {/* Décoration en arrière-plan pour le côté Premium */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 z-0" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                    <FiTag size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        Barème <span className="text-indigo-600">#{latestMiles.numMiles}</span>
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        latestMiles.status === 'ACTIF'
                          ? 'bg-green-100 text-green-700'
                          : latestMiles.status === 'INACTIF'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {latestMiles.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 font-medium flex items-center gap-2">
                      <FiCalendar className="text-indigo-400" />
                      Mise en application le {new Date(latestMiles.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 font-medium flex items-center gap-2">
                      <FiCalendar className="text-indigo-400" />
                      Désactivé le {latestMiles.dateDesactivation ? new Date(latestMiles.dateDesactivation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Non désactivé'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {latestMiles.status !== 'ACTIF' && (
                    <button
                      onClick={() => dispatch(activateMiles(latestMiles.id))}
                      className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                    >
                      <FiCheckCircle size={18} />
                      Activer le barème
                    </button>
                  )}

                  {latestMiles.status === 'ACTIF' && (
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir désactiver ce barème ?')) {
                          dispatch(deactivateMiles(latestMiles.id));
                        }
                      }}
                      className="flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                      <FiPower size={18} />
                      Désactiver
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* NAVIGATION DES ONGLETS */}
            <div className="flex gap-2 ">
              <button
                onClick={() => setActiveTab('calcul')}
                className={` pl-8 pr-8 pt-3 pb-3 bg-white text-sm font-bold transition-all rounded-tr-md border-b-2 ${
                  activeTab === 'calcul' 
                  ? 'text-indigo-600 border-b-4 border-indigo-600' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Calcul
              </button>
              <button
                onClick={() => setActiveTab('perimetre')}
                className={`pl-8 pr-8 pt-3 pb-3 bg-white text-sm font-bold transition-all rounded-tr-md border-b-2 ${
                  activeTab === 'perimetre' 
                  ? 'text-indigo-600 border-b-4 border-indigo-600' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Périmètre
              </button>
            </div>

            {/* CONTENU CALCUL */}
            {activeTab === 'calcul' && (
              <>
                {/* TITRE TABLEAU AVEC BOUTON AJOUT TRANCHE */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4">
                  <div>
                    <h4 className="font-bold text-lg text-indigo-900">Tableau de calcul actuel</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestion des tranches et barèmes miles</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* BOUTON HISTORIQUE (Style Outlined/Soft) */}
                    <button
                      onClick={() => openAudit(latestMiles)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all active:scale-95"
                    >
                      <FiClock size={16} />
                      Historiques
                    </button>

                    {/* BOUTON AJOUTER (Style Plein/Action) */}
                    <button 
                      onClick={() => setShowAddTrancheForm(!showAddTrancheForm)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                        showAddTrancheForm 
                          ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white shadow-red-100' 
                          : 'bg-indigo-600 text-white border border-transparent hover:bg-indigo-700 shadow-indigo-100'
                      }`}
                    >
                      {showAddTrancheForm ? (
                        <>
                          <FiX size={18} />
                          Fermer
                        </>
                      ) : (
                        <>
                          <FiPlus size={18} />
                          Ajouter une tranche
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {/* Formulaire ajout tranche (Conditionnel) */}
                {showAddTrancheForm && (
                  <div className="bg-white p-4 mb-8">
                    <h3 className="text-md font-bold mb-4 text-gray-800">Nouvelle tranche pour ce barème</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">CA INFÉRIEUR</label>
                        <input type="number" value={newBorne.borneCaInf} onChange={(e) => setNewBorne({ ...newBorne, borneCaInf: Number(e.target.value) })} className="w-full border border-green-300 rounded-lg px-4 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">CA SUPÉRIEUR</label>
                        <input type="number" value={newBorne.borneCaSup} onChange={(e) => setNewBorne({ ...newBorne, borneCaSup: Number(e.target.value) })} className="w-full border border-green-300 rounded-lg px-4 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">POINTS MILES</label>
                        <input type="number" value={newBorne.miles} onChange={(e) => setNewBorne({ ...newBorne, miles: Number(e.target.value) })} className="w-full border border-green-300 rounded-lg px-4 py-2" />
                      </div>
                    </div>
                    <button onClick={() => {
                      dispatch(addBorneToLatest(newBorne));
                      setNewBorne({ borneCaInf: 0, borneCaSup: 0, miles: 0 });
                      setShowAddTrancheForm(false);
                    }} className="px-6 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800">
                      Confirmer l'ajout
                    </button>
                  </div>
                )}

                <div className="overflow-hidden bg-white mb-8">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Borne CA Inférieure</th>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Borne CA Supérieur</th>
                        <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Points Miles</th>
                        <th className="px-6 py-4 text-right text-[11px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {latestMiles.bornesMiles.map((borne) => {
                        const isEditing = editingBorneId === borne.id;
                        return (
                          <tr key={borne.id} className={`transition-colors ${isEditing ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}>
                            {/* Borne Inférieure */}
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editedValues.borneCaInf ?? borne.borneCaInf}
                                  onChange={(e) => setEditedValues({ ...editedValues, borneCaInf: Number(e.target.value) })}
                                  className="w-full max-w-[120px] border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none p-2"
                                />
                              ) : (
                                <span className="text-sm font-bold text-gray-700">{borne.borneCaInf.toLocaleString()}</span>
                              )}
                            </td>

                            {/* Borne Supérieure */}
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editedValues.borneCaSup ?? borne.borneCaSup}
                                  onChange={(e) => setEditedValues({ ...editedValues, borneCaSup: Number(e.target.value) })}
                                  className="w-full max-w-[120px] border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none p-2"
                                />
                              ) : (
                                <span className="text-sm font-bold text-gray-700">{borne.borneCaSup.toLocaleString()}</span>
                              )}
                            </td>

                            {/* Points Miles */}
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editedValues.miles ?? borne.miles}
                                  onChange={(e) => setEditedValues({ ...editedValues, miles: Number(e.target.value) })}
                                  className="w-full max-w-[100px] border-gray-200 rounded-lg text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none p-2"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-indigo-600">{borne.miles}</span>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">pts</span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-3 text-[11px] font-black uppercase tracking-tighter">
                                  <button 
                                    onClick={() => {
                                      dispatch(updateBorneMiles({
                                        borneId: borne.id!,
                                        updates: {
                                          borneCaInf: editedValues.borneCaInf ?? borne.borneCaInf,
                                          borneCaSup: editedValues.borneCaSup ?? borne.borneCaSup,
                                          miles: editedValues.miles ?? borne.miles,
                                        }
                                      }));
                                      setEditingBorneId(null);
                                    }} 
                                    className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md"
                                  >
                                    Valider
                                  </button>
                                  <button onClick={() => setEditingBorneId(null)} className="text-gray-400 hover:text-gray-600 px-3 py-1.5">
                                    Annuler
                                  </button>
                                  <button onClick={() => handleDeleteBorne(borne.id!)} className="text-red-400 hover:text-red-600 px-3 py-1.5">
                                    Supprimer
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingBorneId(borne.id!);
                                    setEditedValues({ borneCaInf: borne.borneCaInf, borneCaSup: borne.borneCaSup, miles: borne.miles });
                                  }} 
                                  className="text-[11px] font-black uppercase text-indigo-600 hover:text-indigo-800 hover:underline tracking-widest"
                                >
                                  Modifier
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Formulaire ajout tranche */}
                {/* <div className="bg-white border border-gray-200 p-6 mt-12">
                  <h3 className="text-xl font-semibold mb-6 text-indigo-800">Ajouter une nouvelle tranche</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <input type="number" value={newBorne.borneCaInf} onChange={(e) => setNewBorne({ ...newBorne, borneCaInf: Number(e.target.value) })} className="border rounded-lg px-4 py-2" placeholder="CA Inf" />
                    <input type="number" value={newBorne.borneCaSup} onChange={(e) => setNewBorne({ ...newBorne, borneCaSup: Number(e.target.value) })} className="border rounded-lg px-4 py-2" placeholder="CA Sup" />
                    <input type="number" value={newBorne.miles} onChange={(e) => setNewBorne({ ...newBorne, miles: Number(e.target.value) })} className="border rounded-lg px-4 py-2" placeholder="Miles" />
                  </div>
                  <button onClick={() => {
                    dispatch(addBorneToLatest(newBorne));
                    setNewBorne({ borneCaInf: 0, borneCaSup: 0, miles: 0 });
                  }} className="px-6 py-3 bg-green-600 text-white rounded-lg">Ajouter la tranche</button>
                </div> */}
              </>
            )}

            {/* CONTENU PÉRIMÈTRE */}
            {activeTab === 'perimetre' && (
              <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4">
                  <div>
                    <h3 className="font-bold text-lg text-indigo-900">Tableau Périmètre</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestion des périmètres et barèmes miles</p>
                  </div>
              </div>
                
                <div className="overflow-hidden  bg-white mb-6">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Code Module</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom du Module</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">État</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Sélection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allModules.map((mod) => {
                        const isSelected = getCurrentModulesForMiles(latestMiles.id).includes(mod.id);
                        return (
                          <tr 
                            key={mod.id} 
                            className={`transition-all duration-200 ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-gray-50/50'}`}
                          >
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                {mod.code}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                {mod.nom}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                mod.status === 'ACTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${mod.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                {mod.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <label className="relative flex items-center cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePendingModule(latestMiles.id, mod.id)}
                                    className="peer sr-only" // On cache l'input natif
                                  />
                                  {/* Custom Checkbox Design */}
                                  <div className="w-6 h-6 bg-gray-100 border-2 border-transparent rounded-lg flex items-center justify-center transition-all peer-checked:bg-indigo-600 peer-checked:shadow-lg peer-checked:shadow-indigo-100 group-hover:border-indigo-200">
                                    <FiCheck 
                                      className={`text-white transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-0'}`} 
                                      size={14} 
                                    />
                                  </div>
                                </label>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {hasPendingChanges(latestMiles.id) && (
                  <button
                    onClick={() => handleSaveModules(latestMiles.id)}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold"
                  >
                    Sauvegarder les modifications
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {!latestMiles && !loading && milesList.length === 0 && (
        <p className="text-center py-8 text-gray-500">Aucun barème Miles pour le moment.</p>
      )}

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