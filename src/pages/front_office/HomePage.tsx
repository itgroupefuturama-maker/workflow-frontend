import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommuns} from '../../app/front_office/dossierCommunSlice';
import type { RootState, AppDispatch } from '../../app/store';
import {FiFolder, FiCheckCircle, FiTag, FiFileText} from 'react-icons/fi';
import { fetchTodos} from '../../app/front_office/todosSlice';

const useAppDispatch = () => useDispatch<AppDispatch>();

function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { token } = useSelector((state: RootState) => state.auth);

  // Option 1 : refresh uniquement des dossiers communs au montage (recommandé)
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // On recharge TOUJOURS les dossiers communs ici (c'est la page principale)
    dispatch(fetchDossiersCommuns());
    dispatch(fetchTodos());
  }, [dispatch, token, navigate]);

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-gray-50 to-gray-100/50 overflow-hidden">

      <div className="max-w-[1600px] w-full mx-auto px-6 pt-24 flex flex-col flex-1 overflow-hidden">
        {/* HEADER SECTION */}
        <div className="shrink-0 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                Listes des modules
              </h1>
              <p className="text-slate-500 text-sm">
                Gérez l'ensemble de vos dossiers ici.
              </p>
            </div>
          </div>

          {/* GRILLE DE CARTES PROFESSIONNELLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Carte Dossier Commun */}
            <div
              onClick={() => navigate('/dossiers-communs')}
              className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-blue-200 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors duration-300">
                  <FiFolder className="text-blue-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Dossier Commun</h3>
                <p className="text-sm text-slate-500">Accédez à vos fichiers partagés</p>
              </div>
            </div>

            {/* Carte To Do Liste */}
            <div
              onClick={() => navigate('/dossiers-communs/todolist')}
              className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-green-200 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors duration-300">
                  <FiCheckCircle className="text-green-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">To Do Liste</h3>
                <p className="text-sm text-slate-500">Gérez vos tâches quotidiennes</p>
              </div>
            </div>

            {/* Carte Ticketing */}
            <div
              onClick={() => navigate('/dossiers-communs/id-module')}
              className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-amber-200 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors duration-300">
                  <FiTag className="text-amber-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Ticketing</h3>
                <p className="text-sm text-slate-500">Suivez vos demandes et tickets</p>
              </div>
            </div>

            {/* Carte Attestation Voyage */}
            <div
              className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-rose-200 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-rose-500 transition-colors duration-300">
                  <FiFileText className="text-rose-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Attestation Voyage</h3>
                <p className="text-sm text-slate-500">Générez vos attestations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;