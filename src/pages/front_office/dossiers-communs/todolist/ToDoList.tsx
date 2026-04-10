import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiCheckCircle, FiArrowLeft, FiSearch,
  FiGrid, FiList, FiArrowRight, FiX,
  FiAlertCircle,
  FiClock,
  FiAlertTriangle
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
  const [singleDate] = useState('');
  const [rangeStart] = useState('');
  const [rangeEnd] = useState('');

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
  // ── Catégorisation par date ──────────────────────────────────────────────────
  const categorizeTodos = (todos: typeof filteredTodos) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);    // dans 7 jours (exclus)

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);    // il y a 7 jours

    const buckets: Record<string, typeof filteredTodos> = {
      "Aujourd'hui": [],
      'Cette semaine': [],
      '__older':    [],   // avant hier inclus
      '__upcoming': [],   // au-delà de 7 jours
    };

    todos.forEach((todo) => {
      const d = new Date(todo.rappel?.moment);
      d.setHours(0, 0, 0, 0);

      if (d.getTime() === today.getTime()) {
        // ── Aujourd'hui ──
        buckets["Aujourd'hui"].push(todo);
      } else if (d > today && d < weekEnd) {
        // ── Demain → dans 6 jours → "Cette semaine" ──
        buckets['Cette semaine'].push(todo);
      } else if (d >= weekEnd) {
        // ── Dans 7 jours et au-delà ──
        buckets['__upcoming'].push(todo);
      } else {
        // ── Hier et avant ──
        buckets['__older'].push(todo);
      }
    });

    if (showOlder)    buckets["Aujourd'hui"].push(...buckets['__older']);
    if (showUpcoming) buckets['Cette semaine'].push(...buckets['__upcoming']);

    const categories = [
      { label: "Aujourd'hui", color: 'indigo',  items: buckets["Aujourd'hui"]   },
      { label: 'Cette semaine', color: 'emerald', items: buckets['Cette semaine'] },
    ];

    return {
      categories, // ← Ne pas filtrer avec .filter(c => c.items.length > 0)
      olderCount:    buckets['__older'].length,
      upcomingCount: buckets['__upcoming'].length,
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

    // ── Nouveau : si la date n'est pas aujourd'hui, pas d'urgence colorée ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const isActuallyToday = dateObj >= todayStart && dateObj <= todayEnd;

    if (diffMs < 0 && !isActuallyToday) {
      // Tâche ancienne injectée via showOlder → pas de niveau d'urgence coloré
      return null;
    }

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

  // ── Palettes post-it ─────────────────────────────────────────────────────────

  // ── Palette selon urgence ou index ──────────────────────────────────────────

  const urgentPalettes = {
    critical: { bg: '#F4C0D1', text: '#4B1528', tape: '#ED93B1', line: '#993556', moduleBg: 'rgba(75,21,40,.1)'  },
    warning:  { bg: '#FAD177', text: '#412402', tape: '#EF9F27', line: '#854F0B', moduleBg: 'rgba(65,36,2,.1)'   },
    passed:   { bg: '#B5D4F4', text: '#042C53', tape: '#85B7EB', line: '#185FA5', moduleBg: 'rgba(4,44,83,.1)'  },
    
  };

  const neutralPalettes = [
    { bg: '#FFFFFF', text: '#042C53', tape: '#85B7EB', line: '#185FA5', moduleBg: 'rgba(4,44,83,.1)'  },
    { bg: '#FFFFFF', text: '#412402', tape: '#EF9F27', line: '#854F0B', moduleBg: 'rgba(65,36,2,.1)'  },
    { bg: '#FFFFFF', text: '#26215C', tape: '#AFA9EC', line: '#534AB7', moduleBg: 'rgba(38,33,92,.1)' },
    { bg: '#FFFFFF', text: '#4A1B0C', tape: '#F0997B', line: '#993C1D', moduleBg: 'rgba(74,27,12,.1)' },
  ];

  const postitRotations = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]', 'rotate-[1.5deg]', 'rotate-0', '-rotate-[1.2deg]'];

  const getPalette = (
    urgencyLevel: string | undefined,
    categoryLabel: string,
    index: number,
    dateObj?: Date   // ← paramètre optionnel ajouté
  ) => {
    if (
      categoryLabel === "Aujourd'hui" &&
      urgencyLevel !== undefined &&
      urgencyLevel in urgentPalettes
    ) {
      // Garde supplémentaire : la date doit être réellement aujourd'hui
      if (dateObj) {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
        if (dateObj < todayStart || dateObj > todayEnd) {
          return neutralPalettes[index % neutralPalettes.length];
        }
      }
      return urgentPalettes[urgencyLevel as keyof typeof urgentPalettes];
    }
    return neutralPalettes[index % neutralPalettes.length];
  };

  const getUrgencyBadge = (level?: string) => {
    if (level === 'critical') return { label: 'Urgent',  style: 'bg-red-500 text-white'       };
    if (level === 'warning')  return { label: 'Bientôt', style: 'bg-amber-400 text-amber-900' };
    if (level === 'passed')   return { label: 'Dépassé', style: 'bg-slate-800 text-slate-100' };
    return                           { label: 'Normal',  style: 'bg-black/10 text-inherit'    };
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
              // const c = colorMap[cat.color];
              return (
                <div key={cat.label} className="flex-1 overflow-y-auto pr-2">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                      {cat.items.map((todo, index) => {
                        const isEditing   = editingId === todo.rappel?.id;
                        const isFinished  = todo.rappel?.status === 'FAIT';
                        const dateObj     = new Date(todo.rappel?.moment);
                        const rotation    = postitRotations[index % postitRotations.length];

                        const urgency = getTimeUrgency(dateObj, cat.label);
                        const palette = getPalette(urgency?.level, cat.label, index, dateObj); // ← dateObj ajouté
                        const badge   = getUrgencyBadge(urgency?.level);

                        return (
                          <div
                            key={todo.id}
                            className={`flex flex-col rounded-sm transition-transform duration-150 hover:scale-[1.03] hover:z-10 relative ${rotation} ${isFinished ? 'opacity-50' : ''}`}
                            style={{ background: palette.bg, color: palette.text }}
                          >
                            {/* Scotch */}
                            <div
                              className="w-12 h-3.5 mx-auto rounded-sm opacity-50"
                              style={{ background: palette.tape }}
                            />

                            {!isFinished && urgency?.level === 'critical' && (
                              <div className="absolute top-5 right-2.5 flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                <FiAlertCircle size={13} className="animate-pulse" />
                                Urgent
                              </div>
                            )}
                            {!isFinished && urgency?.level === 'warning' && (
                              <div className="absolute top-5 right-2.5 flex items-center gap-1 bg-amber-400 text-white p-1 rounded-full">
                                <FiClock size={13} />
                              </div>
                            )}
                            {!isFinished && urgency?.level === 'passed' && (
                              <div className="absolute top-5 right-2.5 flex items-center gap-1 text-slate-100 px-2 py-0.5 rounded-full">
                                <FiAlertTriangle size={13} />
                              </div>
                            )}

                            <div className="px-4 pt-3 pb-4 flex flex-col gap-2.5 flex-1">

                              {/* Date */}
                              <p className="text-[10px] font-medium uppercase tracking-wide opacity-60">
                                {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                              </p>

                              {/* Titre */}
                              <h4 className={`text-sm font-medium leading-snug ${isFinished ? 'line-through' : ''}`}>
                                {isEditing ? (
                                  <input
                                    value={editForm.objet}
                                    onChange={(e) => setEditForm({ ...editForm, objet: e.target.value })}
                                    className="w-full bg-white/40 rounded px-2 py-1 text-sm outline-none"
                                    style={{ color: palette.text }}
                                  />
                                ) : todo.rappel?.objet}
                              </h4>

                              {/* Lignes déco */}
                              <div className="flex flex-col gap-1.5 my-1">
                                {[0,1,2].map(i => (
                                  <div key={i} className="h-px opacity-20 rounded" style={{ background: palette.line }} />
                                ))}
                              </div>

                              {/* Module */}
                              <span
                                className="text-[10px] font-medium px-2 py-1 rounded-sm w-fit"
                                style={{ background: palette.moduleBg }}
                              >
                                {todo.prestation?.dossierCommunColab?.module?.nom}
                              </span>

                              {/* Footer */}
                              <div
                                className="flex items-center justify-between mt-auto pt-2.5"
                                style={{ borderTop: `1px solid rgba(0,0,0,.1)` }}
                              >
                                {isEditing ? (
                                  <div className="flex gap-2 w-full">
                                    <input
                                      type="datetime-local"
                                      value={editForm.moment}
                                      onChange={(e) => setEditForm({ ...editForm, moment: e.target.value })}
                                      className="flex-1 bg-white/40 rounded px-2 py-1 text-[10px] outline-none"
                                      style={{ color: palette.text }}
                                    />
                                    <button
                                      onClick={() => handleSaveEdit(todo.rappel.id)}
                                      className="px-2 py-1 bg-black/15 rounded text-[10px] font-medium hover:bg-black/25"
                                    >
                                      Ok
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="px-2 py-1 bg-black/10 rounded text-[10px] hover:bg-black/20"
                                    >
                                      <FiX size={10} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-[11px] font-mono font-medium opacity-70">
                                      {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`text-[9px] font-medium px-2 py-1 rounded-full uppercase tracking-wide ${badge.style}`}>
                                      {badge.label == 'Urgent' ? 'A faire d\'ici 2h' : badge.label == 'Bientôt' ? 'A faire d\'ici 4h' : badge.label}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {!isFinished && (
                                        <button
                                          onClick={() => dispatch(markAsDone(todo.rappel.id))}
                                          className="w-5 h-5 rounded-full border border-black/20 flex items-center justify-center hover:bg-black/10 transition-colors"
                                        >
                                          <FiCheckCircle size={11} />
                                        </button>
                                      )}
                                      {/* <button
                                        onClick={() => {
                                          setEditingId(todo.rappel.id);
                                          setEditForm({ objet: todo.rappel.objet, moment: todo.rappel.moment?.slice(0, 16) });
                                        }}
                                        className="w-5 h-5 rounded-full border border-black/20 flex items-center justify-center hover:bg-black/10 transition-colors"
                                      >
                                        <FiEdit2 size={10} />
                                      </button> */}
                                      <button
                                        onClick={() => navigate(`/dossiers-communs/${todo.prestation?.dossierCommunColab?.module?.nom.toLowerCase()}/pages`, {
                                          state: { targetTab: 'prospection' }
                                        })}
                                        className="flex items-center gap-1 px-2 py-1 rounded-sm bg-black/10 hover:bg-black/20 transition-colors text-[9px] font-medium"
                                      >
                                        Dossier <FiArrowRight size={9} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
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