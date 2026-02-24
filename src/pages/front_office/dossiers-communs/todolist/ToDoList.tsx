import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiCheckCircle, FiCalendar, FiArrowLeft, FiSearch,
  FiGrid, FiList, FiArrowRight, FiX, FiChevronLeft, FiChevronRight
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

  // ── Calendrier ───────────────────────────────────────────────
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('single');
  const [singleDate, setSingleDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  // Mois affiché dans le picker
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  const activeTodos = todos.filter(todo => todo.rappel?.status !== 'SUPPRIMER');

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

  const clearDateFilter = () => {
    setSingleDate('');
    setRangeStart('');
    setRangeEnd('');
  };

  // ── Rendu d'un jour dans le mini calendrier ──────────────────
  const renderCalendarDays = () => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Décalage lundi = 0
    const offset = (firstDay + 6) % 7;
    const days = [];

    // Cases vides
    for (let i = 0; i < offset; i++) {
      days.push(<div key={`e-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected =
        calendarMode === 'single'
          ? singleDate === dateStr
          : (rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd) ||
            dateStr === rangeStart ||
            dateStr === rangeEnd;

      const isStart = dateStr === rangeStart;
      const isEnd = dateStr === rangeEnd;

      days.push(
        <button
          key={d}
          onClick={() => {
            if (calendarMode === 'single') {
              setSingleDate(dateStr === singleDate ? '' : dateStr);
            } else {
              // Sélection intervalle : 1er clic = début, 2ème = fin
              if (!rangeStart || (rangeStart && rangeEnd)) {
                setRangeStart(dateStr);
                setRangeEnd('');
              } else {
                if (dateStr < rangeStart) {
                  setRangeEnd(rangeStart);
                  setRangeStart(dateStr);
                } else {
                  setRangeEnd(dateStr);
                }
              }
            }
          }}
          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
            ${isStart || isEnd ? 'bg-slate-900 text-white' : ''}
            ${isSelected && !isStart && !isEnd ? 'bg-slate-200 text-slate-800' : ''}
            ${!isSelected ? 'hover:bg-slate-100 text-slate-700' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('fr-FR', {
    month: 'long', year: 'numeric',
  });

  // Badge filtre date actif
  const hasDateFilter = singleDate || (rangeStart && rangeEnd);

  if (loadingTodos) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
      Chargement...
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* ── HEADER ── */}
      <header className="fixed top-5 left-0 right-0 bg-white border-b border-slate-200 px-8 pt-20 pb-2 z-30">
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

            {/* Bouton calendrier avec badge si filtre actif */}
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  hasDateFilter
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <FiCalendar size={16} />
                <span>
                  {singleDate
                    ? new Date(singleDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : rangeStart && rangeEnd
                    ? `${new Date(rangeStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${new Date(rangeEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                    : 'Calendrier'
                  }
                </span>
                {hasDateFilter && (
                  <span
                    onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}
                    className="ml-1 hover:text-red-300 transition-colors"
                    title="Effacer le filtre"
                  >
                    <FiX size={14} />
                  </span>
                )}
              </button>

              {/* ── Dropdown Calendrier ── */}
              {showCalendar && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 w-80 overflow-hidden">
                  {/* Mode selector */}
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => { setCalendarMode('single'); setRangeStart(''); setRangeEnd(''); }}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        calendarMode === 'single' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Date précise
                    </button>
                    <button
                      onClick={() => { setCalendarMode('range'); setSingleDate(''); }}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        calendarMode === 'range' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Intervalle
                    </button>
                  </div>

                  <div className="p-4">
                    {/* Navigation mois */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCalendarMonth(prev => {
                          const d = new Date(prev.year, prev.month - 1);
                          return { year: d.getFullYear(), month: d.getMonth() };
                        })}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <FiChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-bold text-slate-800 capitalize">{monthLabel}</span>
                      <button
                        onClick={() => setCalendarMonth(prev => {
                          const d = new Date(prev.year, prev.month + 1);
                          return { year: d.getFullYear(), month: d.getMonth() };
                        })}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <FiChevronRight size={16} />
                      </button>
                    </div>

                    {/* Jours de la semaine */}
                    <div className="grid grid-cols-7 mb-2">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                        <div key={i} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Grille des jours */}
                    <div className="grid grid-cols-7 gap-y-1">
                      {renderCalendarDays()}
                    </div>

                    {/* Indication mode range */}
                    {calendarMode === 'range' && (
                      <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">
                        {!rangeStart ? 'Cliquez sur le début de l\'intervalle'
                          : !rangeEnd ? 'Cliquez sur la fin de l\'intervalle'
                          : `Du ${new Date(rangeStart).toLocaleDateString('fr-FR')} au ${new Date(rangeEnd).toLocaleDateString('fr-FR')}`
                        }
                      </p>
                    )}

                    {/* Boutons footer */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={clearDateFilter}
                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Effacer
                      </button>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="flex-1 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-hidden flex flex-col p-8 mt-20">
        <div className="max-w-[1600px] w-full mx-auto flex-1 overflow-y-auto pr-2">

          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <FiCalendar size={40} className="mb-4 opacity-30" />
              <p className="text-sm font-medium">Aucun rappel trouvé</p>
              {(search || hasDateFilter) && (
                <button
                  onClick={() => { setSearch(''); clearDateFilter(); }}
                  className="mt-3 text-xs text-indigo-500 hover:underline"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── VUE GRILLE ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
              {filteredTodos.map((todo) => {
                const isEditing = editingId === todo.rappel?.id;
                const isFinished = todo.rappel?.status === 'FAIT';
                const dateObj = new Date(todo.rappel?.moment);

                return (
                  <div
                    key={todo.id}
                    className={`group bg-white border border-slate-200 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-slate-300 flex flex-col relative ${isFinished ? 'opacity-70' : ''}`}
                  >
                    {!isFinished && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-500 rounded-b-full shadow-sm shadow-indigo-200" />
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-sm font-bold text-slate-800 capitalize">
                            {dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })}
                          </span>
                        </div>
                        <div className="bg-slate-900 text-white px-2 py-1 rounded-md text-[10px] font-black">
                          {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
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
                          <h4 className={`text-base font-bold leading-snug mb-4 ${isFinished ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {todo.rappel?.objet}
                          </h4>
                          <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono">
                              Module: {todo.prestation?.dossierCommunColab?.module?.nom}
                            </span>
                          </div>
                          <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
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
                              onClick={() => navigate(`/dossiers-communs/${todo.prestation?.dossierCommunColab?.module?.nom.toLowerCase()}`)}
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
                  {filteredTodos.map((todo) => {
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
                            <span className="text-[10px] text-slate-400 font-mono">
                              {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
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
      </main>
    </div>
  );
}