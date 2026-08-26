import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import type { RootState } from '../../../../../app/store';
import axiosInstance from '../../../../../service/Axios';
import { toast } from '../../../../../components/Toast/toast';

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

export default function Notifications() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/notifications/user/${user.id}`);
      if (res.data.success) setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
      toast.error('Impossible de marquer la notification comme lue');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
      toast.error('Impossible de supprimer la notification');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await axiosInstance.patch(`/notifications/user/${user.id}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
      toast.error('Impossible de marquer toutes les notifications comme lues');
    }
  };

  const activeNotifications = notifications.filter((n) => n.status === 'ACTIF');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-800">Notifications</h1>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <FiCheck size={13} />
              Tout marquer lu
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Chargement...</span>
            </div>
          ) : activeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FiBell size={32} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-5 py-4 group hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="shrink-0 mt-1.5">
                    <span className={`block w-2 h-2 rounded-full ${!notif.isRead ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                  >
                    <p className={`text-sm leading-snug ${!notif.isRead ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {notif.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
