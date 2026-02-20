import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHelpCircle, FiBell, FiUser, FiChevronDown, FiLogOut, FiX, FiTrash2, FiHome, FiCheck } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { logout } from '../app/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import logo from '../assets/logo.jpg';
import axiosInstance from '../service/Axios';

const useAppDispatch = () => useDispatch<AppDispatch>();

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// ── Hook : ferme un menu quand on clique en dehors ────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export default function AppBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const paths = pathname.split("/").filter(Boolean);

  const [openUserMenu, setOpenUserMenu]         = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications]       = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs]       = useState(false);

  const userMenuRef  = useRef<HTMLDivElement>(null);
  const notifRef     = useRef<HTMLDivElement>(null);
  const modalRef     = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);

  // ── Fermeture au clic extérieur ──────────────────────────────────────────────
  useClickOutside(notifRef,    () => setOpenNotifications(false));
  useClickOutside(userMenuRef, () => setOpenUserMenu(false));

  // Fermeture modal profil au clic extérieur
  useEffect(() => {
    if (!openProfileModal) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpenProfileModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openProfileModal]);

  // ── Notifications ────────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoadingNotifs(true);
    try {
      const res = await axiosInstance.get(`/notifications/user/${user.id}`);
      if (res.data.success) setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await axiosInstance.patch(`/notifications/user/${user.id}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const profilsActifs = user?.profiles?.filter((p) => p.status === 'ACTIF')?.map((p) => p.profile.profil) || [];
  const modulesAccessibles = user?.profiles?.filter((p) => p.status === 'ACTIF')?.flatMap((p) => p.profile.modules.map((m) => m.module.nom)) || [];

  return (
    <>
      <header className="stick p-1 top-0 z-50 bg-white border-b border-gray-100 px-4 sm:px-10">
        <div className="h-14 flex items-center justify-between gap-4">

          {/* ── Gauche : Logo + Accueil ── */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="h-8 w-8 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                <img src={logo} alt="Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-bold text-gray-800 text-sm tracking-tight hidden sm:block">
                AL BOURAQ
              </span>
            </Link>

            {paths.length > 0 && (
              <nav className="ml-17 hidden md:flex items-center text-sm font-medium">
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

          {/* ── Droite : Actions ── */}
          <div className="flex items-center gap-1.5">

            {/* Aide */}
            <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
              <FiHelpCircle size={17} />
            </button>

            {/* ── Notifications ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setOpenNotifications((prev) => !prev);
                  fetchNotifications();
                }}
                className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FiBell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {openNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">

                  {/* Header notifs */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <FiCheck size={12} />
                        Tout lire
                      </button>
                    )}
                  </div>

                  {/* Liste */}
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="flex items-center justify-center py-10 gap-2">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Chargement...</span>
                      </div>
                    ) : notifications.filter((n) => n.status === 'ACTIF').length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <FiBell size={28} className="text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications
                          .filter((n) => n.status === 'ACTIF')
                          .map((notif) => (
                            <div
                              key={notif.id}
                              className={`flex items-start gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors ${
                                !notif.isRead ? 'bg-blue-50/40' : ''
                              }`}
                            >
                              {/* Indicateur lu/non lu */}
                              <div className="shrink-0 mt-1.5">
                                <span className={`block w-2 h-2 rounded-full ${!notif.isRead ? 'bg-blue-500' : 'bg-gray-200'}`} />
                              </div>

                              {/* Contenu */}
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                              >
                                <p className={`text-sm leading-snug ${!notif.isRead ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                                  {notif.description}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {formatRelativeTime(notif.createdAt)}
                                </p>
                              </div>

                              {/* Supprimer */}
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                className="shrink-0 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Footer notifs */}
                  <div className="px-4 py-2.5 border-t border-gray-100">
                    <button className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors py-1">
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* ── Menu utilisateur ── */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setOpenUserMenu((prev) => !prev)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                {/* Avatar */}
                <div className="h-7 w-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.prenom?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none">
                  <span className="text-xs font-semibold text-gray-800">
                    {user ? `${user.prenom} ${user.nom}` : 'Administrateur'}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 font-medium">En ligne</span>
                </div>
                <FiChevronDown
                  size={13}
                  className={`text-gray-400 transition-transform duration-200 ${openUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {openUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {user ? `${user.prenom} ${user.nom}` : 'Administrateur'}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => { setOpenProfileModal(true); setOpenUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <FiUser size={14} />
                    Mon profil
                  </button>

                  <div className="h-px bg-gray-50 mx-3 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Modal Profil ── */}
      {openProfileModal && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header modal */}
            <div className="bg-gray-950 px-6 py-5 relative">
              <button
                onClick={() => setOpenProfileModal(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <FiX size={16} />
              </button>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center text-2xl font-black text-gray-900 shrink-0">
                  {user.prenom[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{user.prenom} {user.nom}</h2>
                  <p className="text-gray-400 text-xs mt-0.5">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Pseudo',       value: user.pseudo },
                  { label: 'Département',  value: user.departement },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
                  </div>
                ))}

                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Statut</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {user.status}
                  </span>
                </div>
              </div>

              {profilsActifs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Profils actifs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profilsActifs.map((profil, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                        {profil}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {modulesAccessibles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Modules accessibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(modulesAccessibles)].map((module, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex justify-end">
              <button
                onClick={() => setOpenProfileModal(false)}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}