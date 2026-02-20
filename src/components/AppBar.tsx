import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHelpCircle, FiBell, FiUser, FiChevronDown, FiLogOut, FiX ,FiTrash2, FiHome } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { logout } from '../app/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import logo from '../assets/logo.jpg';
import axiosInstance from '../service/Axios';

const useAppDispatch = () => useDispatch<AppDispatch>();

// Fonction pour formater la date en "il y a X minutes/heures/jours"
const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export default function AppBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const paths = pathname.split("/").filter(Boolean);

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false); // Nouveau : menu notifs
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);

  const segmentLabels: Record<string, string> = {
    "dossiers-communs": "Dossiers",
    "dossier-detail": "Détails Dossier", // <--- Pour ta route fixe
    "prestations": "Prestations",
    "parametres": "Paramètres",
    "accueil": "Accueil",
    "pages": "Pages",
    "client-facture": "Clients Facturés",
    "client-beneficiaire": "Bénéficiaires",
    "profil": "Profils",
    "utilisateur": "Utilisateurs",
    "nouveau": "Création",
    "gerer": "Gestion",
    "prospection": "Prospection",
    "ticketing": "Billetterie",
    "devis": "Devis",
    "billet": "Billet"
  };

  // === SOCKET.IO ) ===
  useEffect(() => {
    if (openNotifications) {
      fetchNotifications();
    }
  }, [openNotifications, user?.id]);

  // Chargement des notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoadingNotifs(true);
    try {
      const response = await axiosInstance.get(`/notifications/user/${user.id}`);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Charger au montage + à chaque ouverture du menu
  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const handleOpenNotifications = () => {
    setOpenNotifications(!openNotifications);
    if (!openNotifications) {
      fetchNotifications(); // Rafraîchir à l’ouverture
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Marquer une notification comme lue
const markAsRead = async (notificationId: string) => {
  try {
    await axiosInstance.patch(`/notifications/${notificationId}/read`);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  } catch (error) {
    console.error("Erreur marquage comme lu:", error);
  }
};

// Supprimer une notification
const deleteNotification = async (notificationId: string) => {
  if (!window.confirm("Supprimer cette notification ?")) return;

  try {
    await axiosInstance.delete(`/notifications/${notificationId}`);
    // Au lieu de filtrer par id, on garde seulement les ACTIF
    // (plus sûr si le backend ne supprime pas vraiment)
    setNotifications(prev => prev.filter(n => n.status === 'ACTIF'));
  } catch (error) {
    console.error("Erreur suppression notification:", error);
  }
};

// Marquer toutes comme lues
const markAllAsRead = async () => {
  if (!user?.id) return;

  try {
    await axiosInstance.patch(`/notifications/user/${user.id}/read-all`);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  } catch (error) {
    console.error("Erreur marquage tout comme lu:", error);
  }
};

  // Calcul des profils actifs et modules accessibles
  const profilsActifs = user?.profiles
    ?.filter(p => p.status === 'ACTIF')
    ?.map(p => p.profile.profil) || [];

  const modulesAccessibles = user?.profiles
    ?.filter(p => p.status === 'ACTIF')
    ?.flatMap(p => p.profile.modules.map(m => m.module.nom)) || [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 backdrop-blur-md px-5 py-2">
      <div className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center group-hover:rotate-6 transition-transform overflow-hidden">
              <img src={logo} alt="Logo" className="h-full w-full object-cover rounded-md" />
            </div>
            <span className="font-bold text-gray-700 tracking-tight hidden sm:block">
              AL BOURAQ Travel
            </span>
          </Link>

          {/* On n'affiche le bouton que si "paths" n'est pas vide (donc pas sur "/") */}
          {paths.length > 0 && (
            <nav className="hidden md:flex items-center text-sm font-medium">
              <div className="h-4 w-px bg-gray-200 mx-2" />
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-gray-700 py-2 px-5 ml-4 rounded-2xl transition-colors cursor-pointer"
              >
                <FiHome size={20} />
                <span className="text-sm font-semibold">Accueil</span>
              </button>
            </nav>
          )}
        </div>

        {/* RIGHT : Icons & User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button className="p-2 text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-lg transition-all">
              <FiHelpCircle size={18} />
            </button>

            {/* === NOTIFICATIONS EN TEMPS RÉEL === */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleOpenNotifications}
                className="relative p-2 text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-lg transition-all"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Menu déroulant des notifications */}
              {openNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                      <span className="text-xs font-bold text-indigo-600">
                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-3 text-sm">Chargement...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-12 text-center text-gray-400">
                        <FiBell size={40} className="mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications
                        .filter(notif => notif.status === 'ACTIF') // On garde seulement les ACTIF
                        .map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 hover:bg-indigo-50 transition-all group ${
                              !notif.isRead ? 'bg-indigo-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                                !notif.isRead ? 'bg-indigo-600 animate-ping' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1">
                                <p
                                  onClick={() => markAsRead(notif.id)}
                                  className="text-sm text-gray-800 font-medium cursor-pointer hover:text-indigo-700"
                                >
                                  {notif.description}
                                  {!notif.isRead && (
                                    <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                      Nouveau
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatRelativeTime(notif.createdAt)}
                                </p>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Supprimer"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-gray-100 mx-1" />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setOpenUserMenu(!openUserMenu)}
              className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100"
            >
              <div className="h-9 w-9 bg-linear-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                {/* {user ? user.prenom[0].toUpperCase() : 'A'} */}
                A
              </div>
              <div className="hidden lg:flex flex-col items-start leading-none text-left">
                <span className="text-sm font-bold text-gray-800 italic">
                  {user ? `${user.prenom} ${user.nom}` : 'Administrateur'}
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Online</span>
              </div>
              <FiChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${openUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {openUserMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="px-5 py-3 border-b border-gray-50">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Mon Compte</p>
                </div>

                {/* Bouton Profil → ouvre le modal */}
                <button
                  onClick={() => {
                    setOpenProfileModal(true);
                    setOpenUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
                >
                  <FiUser className="text-lg" /> Mon Profil
                </button>
                <div className="h-px bg-gray-50 mx-4 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <FiLogOut className="text-lg" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === MODAL PROFIL === */}
      {openProfileModal && user && (
        <div className="fixed top-100 inset-0 z-999 flex items-center justify-center bg-black/500 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            {/* Header du modal */}
            <div className="bg-linear-to-r from-indigo-500 to-purple-600 text-white p-6 relative">
              <button
                onClick={() => setOpenProfileModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              >
                <FiX size={18} />
              </button>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-3xl font-black text-indigo-600 shadow-lg">
                  {user.prenom[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black">{user.prenom} {user.nom}</h2>
                  <p className="text-sm opacity-90">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 uppercase text-xs tracking-wider">Pseudo</p>
                  <p className="font-bold text-gray-800">{user.pseudo}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-xs tracking-wider">Département</p>
                  <p className="font-bold text-gray-800">{user.departement}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 uppercase text-xs tracking-wider">Statut du compte</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                    user.status === 'ACTIF'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>

              {profilsActifs.length > 0 && (
                <div>
                  <p className="text-gray-400 uppercase text-xs tracking-wider mb-2">Profils actifs</p>
                  <div className="flex flex-wrap gap-2">
                    {profilsActifs.map((profil, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                        {profil}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {modulesAccessibles.length > 0 && (
                <div>
                  <p className="text-gray-400 uppercase text-xs tracking-wider mb-2">Modules accessibles</p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(modulesAccessibles)].map((module, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setOpenProfileModal(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}