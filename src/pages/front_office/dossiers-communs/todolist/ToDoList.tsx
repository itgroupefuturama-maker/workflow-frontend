import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiCheckCircle, FiCalendar, FiArrowLeft, FiSearch,
  FiGrid, FiList, FiArrowRight, FiX,
  FiAlertCircle
} from 'react-icons/fi';
import { fetchTodos, markAsDone, updateTodo } from '../../../../app/front_office/todosSlice';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../app/store';

const useAppDispatch = () => useDispatch<AppDispatch>();

type ViewMode = 'grid' | 'list';
type CalendarMode = 'single' | 'range';

export default function ToDoList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: todos, loading: loadingTodos } = useSelector((state: RootState) => state.todos);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ objet: '', moment: '' });

  // ── Filtres ──────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [calendarMode] = useState<CalendarMode>('single');
  const [singleDate, setSingleDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const [showOlder, setShowOlder]   = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);

  // const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  const activeTodos = todos.filter(todo => todo.rappel?.status !== 'SUPPRIMER');
  const [showFinished, setShowFinished] = useState(false);

  // ── Filtrage combiné ─────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    return activeTodos.filter((todo) => {
      // Filtre recherche
      const matchSearch =
        !search.trim() ||
        todo.rappel?.objet?.toLowerCase().includes(search.toLowerCase()) ||
        todo.id?.toLowerCase().includes(search.toLowerCase());

      // Filtre date
      let matchDate = true;
      const momentDate = todo.rappel?.moment ? new Date(todo.rappel.moment) : null;

      if (momentDate) {
        if (calendarMode === 'single' && singleDate) {
          const selected = new Date(singleDate);
          matchDate =
            momentDate.getFullYear() === selected.getFullYear() &&
            momentDate.getMonth() === selected.getMonth() &&
            momentDate.getDate() === selected.getDate();
        } else if (calendarMode === 'range' && rangeStart && rangeEnd) {
          const start = new Date(rangeStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(rangeEnd);
          end.setHours(23, 59, 59, 999);
          matchDate = momentDate >= start && momentDate <= end;
        }
      }

      return matchSearch && matchDate;
    });
  }, [activeTodos, search, calendarMode, singleDate, rangeStart, rangeEnd]);

  const handleSaveEdit = (rappelId: string) => {
    if (!editForm.objet || !editForm.moment) return;
    dispatch(updateTodo({ rappelId, objet: editForm.objet, moment: new Date(editForm.moment).toISOString() }))
      .then(() => setEditingId(null));
  };

  // Badge filtre date actif
  const hasDateFilter = singleDate || (rangeStart && rangeEnd);

  // ── Catégorisation par date ──────────────────────────────────
  const categorizeTodos = (todos: typeof filteredTodos) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    const buckets: Record<string, typeof filteredTodos> = {
      "Aujourd'hui": [],
      'Hier':        [],
      'Cette semaine': [],
      '__older':     [],   // jamais affiché comme onglet direct
      '__upcoming':  [],   // jamais affiché comme onglet direct
    };

    todos.forEach((todo) => {
      const d = new Date(todo.rappel?.moment);
      d.setHours(0, 0, 0, 0);

      if      (d.getTime() === today.getTime())     buckets["Aujourd'hui"].push(todo);
      else if (d.getTime() === yesterday.getTime()) buckets['Hier'].push(todo);
      else if (d >= weekAgo && d < yesterday)       buckets['Cette semaine'].push(todo);
      else if (d < weekAgo)                         buckets['__older'].push(todo);
      else                                          buckets['__upcoming'].push(todo);
    });

    // Injection conditionnelle dans les catégories visibles
    if (showOlder)    buckets["Aujourd'hui"].push(...buckets['__older']);
    if (showUpcoming) buckets['Cette semaine'].push(...buckets['__upcoming']);

    const categories = [
      { label: "Aujourd'hui", color: 'indigo',  items: buckets["Aujourd'hui"] },
      { label: 'Hier',        color: 'emerald', items: buckets['Hier']        },
      { label: 'Cette semaine', color: 'emerald', items: buckets['Cette semaine'] },
    ];

    // Compte brut pour les badges des boutons (indépendant de showOlder/showUpcoming)
    const olderCount   = buckets['__older'].length;
    const upcomingCount = buckets['__upcoming'].length;

    return {
      categories: categories.filter(c => c.items.length > 0),
      olderCount,
      upcomingCount,
    };
  };

  const { categories: categorizedTodos, olderCount, upcomingCount } = categorizeTodos(
    showFinished
      ? filteredTodos
      : filteredTodos.filter(todo => todo.rappel?.status !== 'FAIT')
  );

  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; accent: string }> = {
    indigo:  { bg: 'bg-blue-50',  text: 'text-blue-500',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-400',  accent: 'bg-blue-500'  },
    amber:   { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   badge: 'bg-violet-100 text-violet-700',   accent: 'bg-violet-500'   },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-900',    border: 'border-blue-300',    badge: 'bg-blue-100 text-blue-700',    accent: 'bg-blue-500'    },
    slate:   { bg: 'bg-yellow-50',   text: 'text-yellow-600',   border: 'border-yellow-200',   badge: 'bg-yellow-100 text-yellow-600',   accent: 'bg-yellow-400'   },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-500' },
  };

  // Remplace l'état activeCategory par une valeur calculée
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const activeCategory = useMemo(() => {
    if (categorizedTodos.length === 0) return '';
    // Si la catégorie sélectionnée existe encore, on la garde, sinon on prend la première
    const exists = categorizedTodos.some(c => c.label === selectedCategory);
    return exists ? selectedCategory : categorizedTodos[0].label;
  }, [categorizedTodos, selectedCategory]);

  const getTimeUrgency = (dateObj: Date, categoryLabel: string) => {
    if (categoryLabel !== "Aujourd'hui") return null;

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      return { level: 'passed', label: 'dépassé' };
    } else if (diffHours <= 2) {
      const h = Math.floor(diffHours);
      const m = String(Math.floor((diffHours % 1) * 60)).padStart(2, '0');
      return { level: 'critical', label: `${h}h${m}` };
    } else if (diffHours <= 4) {
      const h = Math.floor(diffHours);
      const m = String(Math.floor((diffHours % 1) * 60)).padStart(2, '0');
      return { level: 'warning', label: `${h}h${m}` };
    }

    return null;
  };

  if (loadingTodos) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
      Chargement...
    </div>
  );

  return (
    <div className="flex flex-col font-sans text-slate-900 h-full overflow-hidden">
      <header className="shrink-0 bg-white border-b border-slate-200 px-8 py-4 z-10">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">

          {/* Gauche */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Planning des Rappels</h1>
              <p className="text-xs text-slate-400 font-medium">
                {filteredTodos.length} rappel{filteredTodos.length > 1 ? 's' : ''}
                {hasDateFilter && <span className="ml-1 text-indigo-500">· filtrés</span>}
              </p>
            </div>
          </div>

          {/* Recherche */}
          <div className="flex-1 max-w-xl relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une tâche ou un ID..."
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-3">
            {/* Toggle vue */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FiGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FiList size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-hidden flex flex-col p-8">
        <div className="max-w-[1600px] w-full mx-auto flex-1 overflow-hidden flex flex-col">
          {/* ── Onglets catégories ── */}
          <div className="flex items-end gap-1 border-b border-slate-100 mb-6 overflow-x-auto shrink-0">

            {/* Onglets normaux */}
            {categorizedTodos.map((cat) => {
              const c = colorMap[cat.color];
              const isActive = activeCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-l border-r transition-all whitespace-nowrap ${
                    isActive
                      ? `${c.bg} ${c.text} ${c.border} border-b-white -mb-px`
                      : 'bg-white text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="uppercase tracking-wider">{cat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? c.badge : 'bg-slate-100 text-slate-400'
                  }`}>
                    {cat.items.length}
                  </span>
                </button>
              );
            })}

            {/* Bouton terminés — reste tout à droite */}
            <div className="ml-auto space-x-2 pb-1 shrink-0 flex">
              <div className="flex items-center text-xs">
                <p className="text-xs font-semibold text-slate-400">Afficher :</p>
              </div>
              {/* Bouton Plus anciens */}
              {olderCount > 0 && activeCategory === "Aujourd'hui" && (
                <button
                  onClick={() => setShowOlder(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2  rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    showOlder
                      ? 'bg-slate-800 text-white border-slate-700'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Plus anciens
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    showOlder ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {olderCount}
                  </span>
                </button>
              )}

              {/* Bouton À venir */}
              {upcomingCount > 0 && activeCategory === 'Cette semaine' && (
                <button
                  onClick={() => setShowUpcoming(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    showUpcoming
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  À venir
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    showUpcoming ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {upcomingCount}
                  </span>
                </button>
              )}

              {/* Séparateur */}
              <div className="w-px h-6 bg-white self-center shrink-0" />

              <button
                onClick={() => setShowFinished(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  showFinished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FiCheckCircle size={13} />
                {showFinished ? 'Masquer terminés' : 'Afficher terminés'}
              </button>
            </div>
          </div>

          {/* ── Contenu de l'onglet actif ── */}
          {categorizedTodos
            .filter((cat) => cat.label === activeCategory)
            .map((cat) => {
              const c = colorMap[cat.color];
              return (
                <div key={cat.label} className="flex-1 overflow-y-auto pr-2">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                      {cat.items.map((todo) => {
                        const isEditing = editingId === todo.rappel?.id;
                        const isFinished = todo.rappel?.status === 'FAIT';
                        const dateObj = new Date(todo.rappel?.moment);

                        return (
                          <div
                            key={todo.id}
                            className={`group bg-white border rounded-2xl transition-all duration-300 hover:shadow-xl flex flex-col relative overflow-hidden ${
                              isFinished ? 'opacity-70 border-slate-200' :
                              (() => {
                                const u = getTimeUrgency(dateObj, cat.label);
                                if (!u) return 'border-slate-200';
                                if (u.level === 'passed') return 'border-slate-300';
                                if (u.level === 'critical') return 'border-red-200';
                                if (u.level === 'warning') return 'border-amber-200';
                                return 'border-slate-200';
                              })()
                            }`}
                          >
                            {/* Barre colorée en haut selon urgence */}
                            {(() => {
                            const u = isFinished ? null : getTimeUrgency(dateObj, cat.label);
                            const barColor =
                              isFinished          ? 'bg-emerald-500' :
                              u?.level === 'passed'   ? 'bg-slate-700' :
                              u?.level === 'critical' ? 'bg-red-500' :
                              u?.level === 'warning'  ? 'bg-amber-400' :
                              c.accent;

                            const icon =
                              isFinished          ? <FiCheckCircle size={11} className="text-white/90" /> :
                              u?.level === 'passed'   ? <FiAlertCircle size={11} className="text-white/80" /> :
                              u?.level === 'critical' ? <FiArrowRight size={11} className="text-white animate-pulse" /> :
                              u?.level === 'warning'  ? <FiCalendar   size={11} className="text-amber-900/70" /> :
                              null;

                            const label =
                              isFinished              ? 'Terminé' :
                              u?.level === 'passed'   ? 'Dépassé' :
                              u?.level === 'critical' ? 'Urgent' :
                              u?.level === 'warning'  ? 'Bientôt' :
                              cat.label;

                            return (
                              <div className={`h-6 w-full ${barColor} flex items-center justify-between px-3`}>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                    u?.level === 'warning' ? 'text-amber-900/70' : 'text-white/80'
                                  }`}>
                                    {label}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-mono font-bold ${
                                  u?.level === 'warning' ? 'text-amber-900/60' : 'text-white/60'
                                }`}>
                                  {icon}
                                </span>
                              </div>
                            );
                          })()}

                            <div className="p-5 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-5">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-sm font-bold text-slate-800 capitalize">
                                    {dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                  </span>
                                </div>

                                {/* Badge heure + pill urgence */}
                                {(() => {
                                  const u = getTimeUrgency(dateObj, cat.label);
                                  return (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono ${
                                        u?.level === 'passed'   ? 'bg-slate-800 text-slate-100' :
                                        u?.level === 'critical' ? 'bg-red-500 text-white' :
                                        u?.level === 'warning'  ? 'bg-amber-400 text-amber-900' :
                                        'bg-slate-900 text-white'
                                      }`}>
                                        {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      {u && (
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                                          u.level === 'passed'   ? 'bg-slate-100 border-slate-300 text-slate-600' :
                                          u.level === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                                          'bg-amber-50 border-amber-200 text-amber-700'
                                        }`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${
                                            u.level === 'passed' ? 'bg-slate-500' :
                                            u.level === 'critical' ? 'bg-red-500' : 'bg-amber-400'
                                          }`} />
                                          {u.level === 'passed' ? 'dépassé' : `dans ${u.label}`}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {isEditing ? (
                                <div className="space-y-3">
                                  <input
                                    value={editForm.objet}
                                    onChange={(e) => setEditForm({ ...editForm, objet: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                  />
                                  <input
                                    type="datetime-local"
                                    value={editForm.moment}
                                    onChange={(e) => setEditForm({ ...editForm, moment: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSaveEdit(todo.rappel.id)} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
                                      Sauvegarder
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200">
                                      <FiX />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className={`text-sm font-bold leading-snug mb-3 ${isFinished ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {todo.rappel?.objet}
                                  </h4>
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono">
                                      {todo.prestation?.dossierCommunColab?.module?.nom}
                                    </span>
                                  </div>
                                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      {!isFinished && (
                                        <button
                                          onClick={() => dispatch(markAsDone(todo.rappel.id))}
                                          className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                          title="Terminer"
                                        >
                                          <FiCheckCircle size={18} />
                                        </button>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => navigate(`/dossiers-communs/${todo.prestation?.dossierCommunColab?.module?.nom.toLowerCase()}/pages`, {
                                        state: { targetTab: 'prospection' }
                                      })}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                                    >
                                      DOSSIER <FiArrowRight size={14} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── VUE LISTE ── */
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-20">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Objet</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Module</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Heure</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {cat.items.map((todo) => {
                            const isFinished = todo.rappel?.status === 'FAIT';
                            const dateObj = new Date(todo.rappel?.moment);
                            return (
                              <tr key={todo.id} className={`hover:bg-slate-50 transition-colors ${isFinished ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4">
                                  <span className={`text-sm font-semibold ${isFinished ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {todo.rappel?.objet}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono">
                                    {todo.prestation?.dossierCommunColab?.module?.nom}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700 capitalize">
                                      {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                    {(() => {
                                      const urgency = getTimeUrgency(dateObj, cat.label);
                                      return (
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                            urgency?.level === 'passed'   ? 'bg-slate-800 text-slate-100' :
                                            urgency?.level === 'critical' ? 'bg-red-500 text-white' :
                                            urgency?.level === 'warning'  ? 'bg-amber-400 text-amber-900' :
                                            'text-slate-400'
                                          }`}>
                                            {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          {urgency && (
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                                              urgency.level === 'passed'   ? 'bg-slate-100 border-slate-300 text-slate-600' :
                                              urgency.level === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                                              'bg-amber-50 border-amber-200 text-amber-700'
                                            }`}>
                                              <div className={`w-1.5 h-1.5 rounded-full ${
                                                urgency.level === 'passed'   ? 'bg-slate-500' :
                                                urgency.level === 'critical' ? 'bg-red-500' : 'bg-amber-400'
                                              }`} />
                                              {urgency.level === 'passed' ? 'dépassé' : `dans ${urgency.label}`}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    isFinished ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {isFinished ? 'Terminé' : 'En attente'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {!isFinished && (
                                      <button
                                        onClick={() => dispatch(markAsDone(todo.rappel.id))}
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                        title="Terminer"
                                      >
                                        <FiCheckCircle size={16} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => navigate(`/dossiers-communs/${todo.prestation?.dossierCommunColab?.module?.nom.toLowerCase()}`)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                                    >
                                      DOSSIER <FiArrowRight size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </main>
    </div>
  );
}