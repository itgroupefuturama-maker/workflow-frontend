import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  fetchKnowledgeItems,
  fetchThemes,
  setSelectedSubTheme,
  setSelectedTheme,
  createKnowledgeItem,
  type SubTheme,
  type Theme,
  type KnowledgeItem,
  updateKnowledgeItem,
} from '../../../../app/front_office/parametre_base_connaissance/knowledgeBaseSlice';
import { useNavigate } from 'react-router-dom';

const CARD_COLORS = [
  'bg-[#d4e8c2]',
  'bg-[#d4c5f0]',
  'bg-[#f5e6c8]',
  'bg-[#f0d4d4]',
  'bg-[#c5dff0]',
  'bg-[#f0f0c5]',
];

const DOT_COLORS = [
  '#e85d4a',
  '#f0b429',
  '#3b82f6',
  '#a78bfa',
  '#22c55e',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

// ── Formulaire ─────────────────────────────────────────────────────────────

interface AddFormProps {
  themes: Theme[];
  onClose: () => void;
  onSubmit: (data: {
    theme: string;
    sousTheme: string;
    titre: string;
    contenu: string;
  }) => void;
  loading: boolean;
  initialData?: KnowledgeItem;
}

const AddForm: React.FC<AddFormProps> = ({ themes, onClose, onSubmit, loading, initialData }) => {
  const existingTheme     = initialData?.subTheme.theme.nom ?? '';
  const existingSousTheme = initialData?.subTheme.nom ?? '';

  const [theme, setTheme]                   = useState(existingTheme);
  const [themeLibre, setThemeLibre]         = useState('');
  const [sousTheme, setSousTheme]           = useState(existingSousTheme);
  const [sousThemeLibre, setSousThemeLibre] = useState('');
  const [titre, setTitre]                   = useState(initialData?.titre ?? '');
  const [contenu, setContenu]               = useState(initialData?.contenu ?? '');

  const isEdit    = !!initialData;
  const themeObj  = themes.find((t) => t.nom === theme);
  const subThemes = themeObj?.subThemes ?? [];

  const finalTheme     = themeLibre.trim() || theme;
  const finalSousTheme = sousThemeLibre.trim() || sousTheme;
  const canSubmit      = finalTheme && finalSousTheme && titre.trim() && contenu.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ theme: finalTheme, sousTheme: finalSousTheme, titre: titre.trim(), contenu: contenu.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-medium text-gray-900">
            {isEdit ? "Modifier l'article" : 'Nouvel article'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-400">Thème</label>
            <div className="flex flex-wrap gap-2 mb-1">
              {themes.map((t) => (
                <button
                  type="button" key={t.id}
                  onClick={() => { setTheme(t.nom); setThemeLibre(''); setSousTheme(''); setSousThemeLibre(''); }}
                  className={`px-3 py-1 rounded-full border text-[12px] transition-colors
                    ${theme === t.nom && !themeLibre
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
                >
                  {t.nom}
                </button>
              ))}
            </div>
            <input
              type="text" placeholder="Ou saisir un nouveau thème..."
              value={themeLibre}
              onChange={(e) => { setThemeLibre(e.target.value); setTheme(''); setSousTheme(''); setSousThemeLibre(''); }}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-400">Sous-thème</label>
            {subThemes.length > 0 && !themeLibre && (
              <div className="flex flex-wrap gap-2 mb-1">
                {subThemes.map((s) => (
                  <button
                    type="button" key={s.id}
                    onClick={() => { setSousTheme(s.nom); setSousThemeLibre(''); }}
                    className={`px-3 py-1 rounded-full border text-[12px] transition-colors
                      ${sousTheme === s.nom && !sousThemeLibre
                        ? 'border-gray-400 bg-gray-100 text-gray-700'
                        : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
                  >
                    {s.nom}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text" placeholder="Ou saisir un nouveau sous-thème..."
              value={sousThemeLibre}
              onChange={(e) => { setSousThemeLibre(e.target.value); setSousTheme(''); }}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-400">Titre</label>
            <input
              type="text" placeholder="Titre de l'article..."
              value={titre} onChange={(e) => setTitre(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-400">Contenu</label>
            <textarea
              placeholder="Contenu de l'article..."
              value={contenu} onChange={(e) => setContenu(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-[13px] border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={!canSubmit || loading}
              className={`px-4 py-2 text-[13px] rounded-lg transition-colors
                ${canSubmit && !loading
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Hook auto-sélection premier sous-thème ─────────────────────────────────

function useAutoSelectFirstSubTheme(
  themes: Theme[],
  selectedTheme: string | null,
  selectedSubTheme: string | null,
  dispatch: AppDispatch,
) {
  useEffect(() => {
    if (!selectedTheme) return;
    const themeObj = themes.find((t) => t.nom === selectedTheme);
    if (!themeObj || themeObj.subThemes.length === 0) return;
    const belongsToCurrent = themeObj.subThemes.some((s) => s.nom === selectedSubTheme);
    if (!belongsToCurrent) {
      dispatch(setSelectedSubTheme(themeObj.subThemes[0].nom));
    }
  }, [selectedTheme, themes]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Page principale ────────────────────────────────────────────────────────

const PageBaseConnaissance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    themes, items, selectedTheme, selectedSubTheme,
    loadingThemes, loadingItems, error,
  } = useSelector((state: RootState) => state.knowledgeBase);

  // ← Plus de state activeTab : on utilise selectedTheme directement partout
  const [showForm, setShowForm]       = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // 1️⃣ Charger les thèmes au montage
  useEffect(() => {
    dispatch(fetchThemes());
  }, [dispatch]);

  // 2️⃣ Sélectionner le premier thème dès que les thèmes arrivent
  useEffect(() => {
    if (themes.length > 0 && !selectedTheme) {
      dispatch(setSelectedTheme(themes[0].nom));
    }
  }, [themes]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3️⃣ Auto-sélection du premier sous-thème quand le thème change
  useAutoSelectFirstSubTheme(themes, selectedTheme, selectedSubTheme, dispatch);

  // 4️⃣ Fetch des items dès qu'un thème + sous-thème sont prêts
  useEffect(() => {
    if (selectedTheme && selectedSubTheme) {
      dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
    }
  }, [dispatch, selectedTheme, selectedSubTheme]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectTheme = (themeName: string) => {
    dispatch(setSelectedTheme(themeName));
    // Le hook auto-sélectionnera le premier sous-thème → useEffect 4 fetchera
  };

  const handleSelectSubTheme = (sub: SubTheme, parent: Theme) => {
    if (selectedTheme !== parent.nom) dispatch(setSelectedTheme(parent.nom));
    dispatch(setSelectedSubTheme(sub.nom));
  };

  const handleAddSubmit = async (data: {
    theme: string; sousTheme: string; titre: string; contenu: string;
  }) => {
    const result = await dispatch(createKnowledgeItem(data));
    if (createKnowledgeItem.fulfilled.match(result)) {
      setShowForm(false);
      if (selectedTheme && selectedSubTheme) {
        dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
      }
      dispatch(fetchThemes());
    }
  };

  const handleEditSubmit = async (data: {
    theme: string; sousTheme: string; titre: string; contenu: string;
  }) => {
    if (!editingItem) return;
    const result = await dispatch(updateKnowledgeItem({ id: editingItem.id, ...data }));
    if (updateKnowledgeItem.fulfilled.match(result)) {
      setEditingItem(null);
      dispatch(fetchThemes());
      if (selectedTheme && selectedSubTheme) {
        dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
      }
    }
  };

  // Dérivé directement depuis le store, plus de state local activeTab
  const activeTabTheme = themes.find((t) => t.nom === selectedTheme);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /*
      ✅ h-full au lieu de h-screen
      Le composant parent dans ton layout doit avoir :
        - display: flex / flex-col
        - overflow: hidden
        - height: 100% (ou flex-1)
      Ainsi cette page prend exactement l'espace sous l'appbar,
      sans déborder ni scroller au niveau de la fenêtre.
    */
    <div className="flex h-full text-sm font-sans overflow-hidden">

      {showForm && (
        <AddForm themes={themes} onClose={() => setShowForm(false)} onSubmit={handleAddSubmit} loading={loadingItems} />
      )}
      {editingItem && (
        <AddForm themes={themes} onClose={() => setEditingItem(null)} onSubmit={handleEditSubmit} loading={loadingItems} initialData={editingItem} />
      )}

      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 border-r border-[#e0d9d2] bg-slate-200 p-3 overflow-y-auto flex flex-col gap-1">
        <div className="flex flex-col gap-0.5 mb-3">
          {['Recent', 'Reading list', 'Discover'].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-[13px] text-[#6b5e52] hover:bg-[#ddd8d2] transition-colors"
            >
              <span>{label}</span>
              {label === 'Reading list' && <span className="text-xs text-[#a09080]">24</span>}
            </div>
          ))}
        </div>

        <p className="text-[10px] font-semibold text-[#a09080] uppercase tracking-widest px-2 pb-1">
          My library
        </p>

        {loadingThemes && <p className="text-xs text-[#a09080] px-2">Chargement...</p>}

        {themes.map((theme, idx) => (
          <div key={theme.id} className="mb-0.5">
            <div
              onClick={() => handleSelectTheme(theme.nom)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
                ${selectedTheme === theme.nom
                  ? 'bg-[#d4cdc6] text-[#2d2520] font-semibold'
                  : 'text-[#6b5e52] hover:bg-[#ddd8d2]'}`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DOT_COLORS[idx % DOT_COLORS.length] }} />
              <span className="flex-1 text-[13px] truncate">{theme.nom}</span>
              <span className="text-xs text-[#a09080]">{theme.subThemes.length}</span>
            </div>

            {theme.subThemes.map((sub) => (
              <div
                key={sub.id}
                onClick={() => handleSelectSubTheme(sub, theme)}
                className={`flex items-center gap-1.5 pl-6 pr-2 py-1 mx-1 my-0.5 rounded-lg cursor-pointer text-[12px] transition-colors
                  ${selectedSubTheme === sub.nom && selectedTheme === theme.nom
                    ? 'bg-[#d4cdc6] text-[#2d2520] font-medium'
                    : 'text-[#8a7a6e] hover:bg-[#ddd8d2]'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: DOT_COLORS[idx % DOT_COLORS.length] }} />
                <span className="flex-1 truncate">{sub.nom}</span>
              </div>
            ))}
          </div>
        ))}

        <button className="flex items-center gap-1.5 px-2 py-1.5 mt-2 rounded-lg text-[12px] text-[#a09080] hover:bg-[#ddd8d2] transition-colors">
          + New category
        </button>
      </aside>

      {/* ── Main content ── */}
      {/*
        overflow-hidden ici (plus overflow-y-auto) :
        c'est le panneau blanc intérieur qui gère le scroll, pas le main
      */}
      <main className="flex-1 overflow-hidden p-8 min-w-0 flex flex-col">

        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="text-[#a09080] hover:text-[#6b5e52] text-sm">
            ← Retour
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-semibold text-[#1e1a17]">Base de connaissance</h1>
          <button onClick={() => setShowForm(true)} className="text-[#a09080] hover:text-[#6b5e52] text-base ml-1">+</button>
        </div>
        <p className="text-[#7a6e64] text-[13px] leading-relaxed max-w-xl mb-6">
          Collection d'articles et de ressources organisés par thèmes. Cette base couvre des sujets variés,
          des concepts fondamentaux aux développements récents.
        </p>

        {/* Tabs — fixes, ne scrollent pas */}
        <div className="flex gap-1 shrink-0">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelectTheme(theme.nom)}
              className={`px-4 py-2 text-[13px] rounded-t-xl transition-colors whitespace-nowrap
                ${selectedTheme === theme.nom
                  ? 'bg-white text-[#1e1a17] font-semibold shadow-sm'
                  : 'text-[#8a7a6e] hover:text-[#4a3f38] bg-[#e8e2db]'}`}
            >
              {theme.nom}
            </button>
          ))}
        </div>

        {/*
          Panneau blanc : flex-col + min-h-0 + flex-1
          → prend tout l'espace vertical restant sans grandir avec le contenu
        */}
        <div className="bg-white rounded-b-2xl rounded-r-2xl shadow-sm flex flex-col flex-1 min-h-0">

          {/* Zone fixe : sous-thèmes + barre items — ne scroll pas */}
          <div className="px-6 pt-6 shrink-0">

            {activeTabTheme && activeTabTheme.subThemes.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[13px] text-[#1e1a17] font-semibold">Sous-thèmes</p>
                  <div className="grow border-b border-gray-100 ml-2" />
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {activeTabTheme.subThemes.map((sub) => {
                    const parentIdx = themes.findIndex((t) => t.id === activeTabTheme.id);
                    const color     = DOT_COLORS[parentIdx % DOT_COLORS.length];
                    const isActive  = selectedSubTheme === sub.nom && selectedTheme === activeTabTheme.nom;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSubTheme(sub, activeTabTheme)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] transition-colors
                          ${isActive
                            ? 'border-[#c0b8b0] text-[#1e1a17] bg-[#ece7e1] font-medium'
                            : 'border-gray-200 text-[#7a6e64] bg-white hover:bg-[#f5f0eb]'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {sub.nom}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">
                {error}
              </div>
            )}

            {selectedSubTheme && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[13px] text-[#a09080]">
                  {loadingItems ? 'Chargement...' : `Items (${items.length}) · ${selectedSubTheme}`}
                </span>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 px-3 py-1 text-[12px] border border-gray-200 rounded-full text-[#6b5e52] hover:bg-[#f5f0eb] transition-colors"
                >
                  + Add
                </button>
                <button className="flex items-center gap-1 px-3 py-1 text-[12px] border border-gray-200 rounded-full text-[#6b5e52] hover:bg-[#f5f0eb] transition-colors">
                  + Document récent
                </button>
                <div className="grow border-b border-gray-100 ml-1" />
              </div>
            )}
          </div>
          {/* Fin zone fixe */}

          {/* Zone scrollable : uniquement les cartes */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">

            {!selectedSubTheme && !loadingItems && (
              <div className="flex flex-col items-center justify-center h-full text-[#c0b8b0] gap-3">
                <p className="text-[13px]">Cliquez sur un sous-thème pour voir les articles.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-[13px] border border-gray-200 rounded-lg text-[#7a6e64] hover:bg-[#f5f0eb] transition-colors"
                >
                  + Ajouter un article
                </button>
              </div>
            )}

            {loadingItems && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-gray-100 p-4 min-h-40 bg-[#f5f0eb] animate-pulse" />
                ))}
              </div>
            )}

            {!loadingItems && items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`${CARD_COLORS[idx % CARD_COLORS.length]}
                      rounded-xl border border-transparent p-4 flex flex-col gap-2
                      min-h-44 cursor-pointer hover:brightness-95 transition-all group relative`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100
                        transition-opacity px-2 py-1 text-[11px] rounded-lg
                        border border-white/60 bg-white/70 text-[#4a3f38] hover:bg-white"
                    >
                      ✎ Modifier
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6b5e52] font-medium">
                        {new Date(item.createdAt).getFullYear()}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 text-[#6b5e52]">
                        {item.subTheme.theme.nom}
                      </span>
                    </div>

                    <p className="text-[14px] font-semibold text-[#1e1a17] leading-snug flex-1">
                      {item.titre}
                    </p>

                    <p className="text-[12px] text-[#5a4e44] leading-relaxed line-clamp-3">
                      {item.contenu}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 text-[#6b5e52]">
                        {item.subTheme.nom}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingItems && selectedSubTheme && items.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-full text-[#c0b8b0]">
                <p className="text-[13px]">Aucun article trouvé pour ce sous-thème.</p>
              </div>
            )}

          </div>
          {/* Fin zone scrollable */}

        </div>
        {/* Fin panneau blanc */}

      </main>
    </div>
  );
};

export default PageBaseConnaissance;