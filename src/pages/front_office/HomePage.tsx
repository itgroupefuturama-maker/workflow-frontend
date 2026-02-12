import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns } from '../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../app/store';
// Ajout de FiLock pour le cadenas
import { FiFolder, FiCheckCircle, FiTag, FiFileText, FiLock, FiSettings, FiHome } from 'react-icons/fi';
import { fetchTodos } from '../../app/front_office/todosSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    dispatch(fetchDossiersCommuns());
    dispatch(fetchTodos());
  }, [dispatch, token, navigate]);

  // Liste des modules en cours de développement
  const lockedModules = [
    { name: 'Hôtel', desc: 'Gestion des réservations' },
    { name: 'Assurance', desc: 'Contrats et garanties' },
    { name: 'Visa', desc: 'Suivi des demandes' },
    { name: 'Location', desc: 'Véhicules et matériel' },
    { name: 'Activité', desc: 'Excursions et loisirs' },
    { name: 'Guidage', desc: 'Planning des guides' },
    { name: 'Résultats Stats', desc: 'Analyses de données' },
    { name: 'Tableau de bord', desc: 'Vue d\'ensemble' },
    { name: 'Miles', desc: 'Fidélité voyageurs' },
    { name: 'Contrôle', desc: 'Audit et vérification' },
    { name: 'Profil', desc: 'Paramètres utilisateur' },
    { name: 'SAV', desc: 'Service après-vente' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-50 to-gray-100/50 overflow-x-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-6 pt-24 pb-12 flex flex-col">
        
        {/* HEADER SECTION */}
        <div className="shrink-0 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Listes des modules</h1>
              <p className="text-slate-500 text-sm">Gérez l'ensemble de vos dossiers ici.</p>
            </div>
          </div>

          {/* GRILLE DE CARTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* --- MODULES ACTIFS --- */}
            
            {/* Dossier Commun */}
            <div onClick={() => navigate('/dossiers-communs')} className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-blue-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors duration-300">
                  <FiFolder className="text-blue-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Dossier</h3>
                <p className="text-sm text-slate-500">Accédez à vos fichiers partagés</p>
              </div>
            </div>

            {/* To Do Liste */}
            <div onClick={() => navigate('/dossiers-communs/todolist')} className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-green-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors duration-300">
                  <FiCheckCircle className="text-green-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">To Do List</h3>
                <p className="text-sm text-slate-500">Gérez vos tâches quotidiennes</p>
              </div>
            </div>

            {/* Ticketing */}
            <div onClick={() => navigate('/dossiers-communs/id-module')} className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-amber-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-400 transition-colors duration-300">
                  <FiTag className="text-amber-400 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Vol</h3>
                <p className="text-sm text-slate-500">Suivez vos demandes et tickets</p>
              </div>
            </div>

            {/* Attestation Voyage */}
            <div onClick={() => navigate('/dossiers-communs/attestation')} className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-rose-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-rose-500 transition-colors duration-300">
                  <FiFileText className="text-rose-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Attestation Voyage</h3>
                <p className="text-sm text-slate-500">Générez vos attestations</p>
              </div>
            </div>

            {/* Gestion Commentaire Fournisseur */}
            <div onClick={() => navigate('/dossiers-communs/parametre')} className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-violet-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-500 transition-colors duration-300">
                  <FiSettings className="text-violet-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Paramétre</h3>
                <p className="text-sm text-slate-500">Générez vos paramétre et section commentaire</p>
              </div>
            </div>

            <div onClick={() => navigate('/dossiers-communs/hotel')} className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-orange-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors duration-300">
                  <FiHome className="text-orange-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Hotel</h3>
                <p className="text-sm text-slate-500">Générez vos devis et reservation hotel</p>
              </div>
            </div>

            {/* --- NOUVEAUX MODULES (VERROUILLÉS / GRIS) --- */}
            {lockedModules.map((m, index) => (
              <div
                key={index}
                className="relative bg-white rounded-xl p-6 border border-gray-200 grayscale opacity-70 cursor-not-allowed overflow-hidden"
              >
                {/* Badge Cadenas */}
                <div className="absolute top-3 right-3 text-gray-400">
                  <FiLock size={16} />
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <FiLock className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">{m.name}</h3>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;