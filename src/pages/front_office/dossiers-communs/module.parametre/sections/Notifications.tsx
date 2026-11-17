import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiArrowRight, FiBell, FiCheck, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { store, type AppDispatch, type RootState } from '../../../../../app/store';
import { setCurrentClientFactureId } from '../../../../../app/front_office/dossierCommunSlice';
import {
  ICONE_NOTIFICATION, emitNotificationsChangees, lienNotification, onNotification, type AppNotification,
} from '../../../../../service/notifications';
import axiosInstance from '../../../../../service/Axios';
import { toast } from '../../../../../components/Toast/toast';

// ── Constantes ────────────────────────────────────────────────────────────────
const PAGE = 50;          // notifications chargées par palier
const LIMITE_MAX = 200;   // maximum accepté par l'API (/notifications/me?limit=…)

type Onglet = 'toutes' | 'nonLues';
type Categorie = 'toutes' | 'ventes' | 'achats' | 'factures' | 'rejets';

const CATEGORIES: { id: Categorie; label: string; types: string[] }[] = [
  { id: 'toutes',   label: 'Toutes',   types: [] },
  { id: 'ventes',   label: 'Ventes',   types: ['BILLET_VENTE_VALIDEE'] },
  { id: 'achats',   label: 'Achats',   types: ['BILLET_ACHAT_VALIDE'] },
  { id: 'factures', label: 'Factures', types: ['BILLET_FACTURE_EMISE', 'BILLET_FACTURE_REGLEE'] },
  { id: 'rejets',   label: 'Rejets',   types: ['BILLET_VENTE_REJETEE', 'BILLET_ACHAT_REJETE'] },
];

// ── Dates ─────────────────────────────────────────────────────────────────────
const debutJour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const libelleGroupe = (iso: string) => {
  const jour = debutJour(new Date(iso));
  const auj = debutJour(new Date());
  const diff = Math.round((auj - jour) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return 'Cette semaine';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const heureRelative = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (min < 24 * 60) return `Il y a ${Math.floor(min / 60)} h`;
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const dateComplete = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [limite, setLimite] = useState(PAGE);
  const [onglet, setOnglet] = useState<Onglet>('toutes');
  const [categorie, setCategorie] = useState<Categorie>('toutes');
  const [recherche, setRecherche] = useState('');

  const fetchNotifications = async (lim = limite, silencieux = false) => {
    if (!user?.id) return;
    silencieux ? setRafraichissement(true) : setLoading(true);
    try {
      const res = await axiosInstance.get('/notifications/me', { params: { limit: lim } });
      if (res.data.success) setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
      setRafraichissement(false);
    }
  };

  useEffect(() => { fetchNotifications(limite); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  // Temps réel : une nouvelle notification apparaît en tête sans recharger la page
  useEffect(() => onNotification((n) => {
    setNotifications((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
  }), []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      emitNotificationsChangees();
    } catch (e) {
      console.error(e);
      toast.error('Impossible de marquer la notification comme lue');
    }
  };

  // Marque comme lue puis ouvre la page concernée (pas de lien pour les anciennes notifications)
  const ouvrirNotification = async (n: AppNotification) => {
    if (!n.isRead) await markAsRead(n.id);
    const lien = lienNotification(n);
    if (!lien) return;
    const { data: dossiers, currentClientFactureId } = store.getState().dossierCommun;
    const dossier = dossiers.find((d) => d.id === n.data?.dossierCommunId);
    if (dossier && currentClientFactureId?.id !== dossier.id) dispatch(setCurrentClientFactureId(dossier));
    navigate(lien);
  };

  const deleteNotification = async (id: string) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      emitNotificationsChangees();
      toast.success('Notification supprimée');
    } catch (e) {
      console.error(e);
      toast.error('Impossible de supprimer la notification');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await axiosInstance.patch('/notifications/me/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      emitNotificationsChangees();
    } catch (e) {
      console.error(e);
      toast.error('Impossible de marquer toutes les notifications comme lues');
    }
  };

  const chargerPlus = () => {
    const next = Math.min(limite + PAGE, LIMITE_MAX);
    setLimite(next);
    fetchNotifications(next, true);
  };

  // ── Filtrage + regroupement par jour ───────────────────────────────────────
  const actives = useMemo(() => notifications.filter((n) => n.status === 'ACTIF'), [notifications]);
  const nbNonLues = actives.filter((n) => !n.isRead).length;

  const filtrees = useMemo(() => {
    const types = CATEGORIES.find((c) => c.id === categorie)?.types ?? [];
    const q = recherche.trim().toLowerCase();
    return actives.filter((n) =>
      (onglet === 'toutes' || !n.isRead) &&
      (types.length === 0 || (n.type && types.includes(n.type))) &&
      (!q || `${n.titre ?? ''} ${n.description}`.toLowerCase().includes(q))
    );
  }, [actives, onglet, categorie, recherche]);

  const groupes = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    filtrees.forEach((n) => {
      const g = libelleGroupe(n.createdAt);
      map.set(g, [...(map.get(g) ?? []), n]);
    });
    return [...map.entries()];
  }, [filtrees]);

  const filtreActif = onglet !== 'toutes' || categorie !== 'toutes' || recherche.trim() !== '';
  const peutChargerPlus = notifications.length >= limite && limite < LIMITE_MAX;

  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">

        {/* ── En-tête ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Notifications</h1>
              <p className="text-sm text-slate-500">
                {nbNonLues > 0 ? `${nbNonLues} non lue${nbNonLues > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(limite, true)}
              disabled={rafraichissement || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw size={12} className={rafraichissement ? 'animate-spin' : ''} aria-hidden="true" />
              {rafraichissement ? 'Actualisation…' : 'Actualiser'}
            </button>
            <button
              onClick={markAllAsRead}
              disabled={nbNonLues === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiCheck size={13} aria-hidden="true" />
              Tout marquer comme lu
            </button>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-200 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex gap-1 rounded-lg bg-slate-300 p-0.5" aria-label="Lues / non lues">
              {([
                { id: 'toutes', label: 'Toutes', n: actives.length },
                { id: 'nonLues', label: 'Non lues', n: nbNonLues },
              ] as const).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOnglet(o.id)}
                  aria-pressed={onglet === o.id}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                    onglet === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {o.label}
                  <span className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600">{o.n}</span>
                </button>
              ))}
            </nav>

            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategorie(c.id)}
                  aria-pressed={categorie === c.id}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    categorie === c.id
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <FiSearch size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="N° billet, dossier…"
              aria-label="Rechercher dans les notifications"
              className="w-56 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-8 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── Liste ── */}
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FiBell className="text-slate-300" size={26} />
            </div>
            <p className="mb-1 text-base font-semibold text-slate-500">
              {filtreActif ? 'Aucune notification pour ce filtre' : 'Aucune notification'}
            </p>
            <p className="text-sm text-slate-400">
              {filtreActif ? 'Essayez un autre filtre ou une autre recherche.' : 'Vous serez averti ici des ventes, achats et factures de vos billets.'}
            </p>
            {filtreActif && (
              <button
                onClick={() => { setOnglet('toutes'); setCategorie('toutes'); setRecherche(''); }}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {groupes.map(([groupe, items]) => (
              <section key={groupe} aria-label={groupe}>
                <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{groupe}</h2>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                  {items.map((notif) => {
                    const icone = notif.type ? ICONE_NOTIFICATION[notif.type] : undefined;
                    const Icone = icone?.icon;
                    const lien = lienNotification(notif);
                    return (
                      <li
                        key={notif.id}
                        className={`group relative flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-amber-50/30 ${
                          !notif.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        {/* Pastille non lue */}
                        {!notif.isRead && (
                          <span className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-indigo-500" aria-label="Non lue" />
                        )}

                        {/* Icône du type */}
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          {Icone ? <Icone size={16} aria-hidden="true" className={icone.className} /> : <FiBell size={15} className="text-slate-400" aria-hidden="true" />}
                        </span>

                        {/* Contenu cliquable */}
                        <button
                          type="button"
                          onClick={() => ouvrirNotification(notif)}
                          className="min-w-0 flex-1 text-left focus:outline-none"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <p className={`truncate text-sm ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {notif.titre ?? 'Notification'}
                            </p>
                            <time dateTime={notif.createdAt} title={dateComplete(notif.createdAt)} className="shrink-0 text-xs text-slate-400">
                              {heureRelative(notif.createdAt)}
                            </time>
                          </div>
                          <p className={`mt-0.5 text-sm leading-snug ${!notif.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                            {notif.description}
                          </p>
                          {lien && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                              Voir le billet{notif.data?.numeroBillet ? ` ${notif.data.numeroBillet}` : ''} <FiArrowRight size={11} />
                            </span>
                          )}
                        </button>

                        {/* Actions (visibles au survol et au clavier) */}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              title="Marquer comme lue"
                              aria-label="Marquer comme lue"
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <FiCheck size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            title="Supprimer"
                            aria-label="Supprimer la notification"
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {peutChargerPlus && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={chargerPlus}
                  disabled={rafraichissement}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  {rafraichissement ? 'Chargement…' : 'Charger plus'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
