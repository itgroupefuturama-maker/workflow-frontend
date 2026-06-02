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

// ── Utilitaire : rendu Markdown → JSX ────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    result.push(
      <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-[12px] text-[#5a4e44] leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushList();
      result.push(
        <p key={key++} className="text-[12px] font-semibold text-[#3b6b8a] leading-snug mt-1">
          {line.slice(4)}
        </p>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      result.push(
        <p key={key++} className="text-[13px] font-semibold text-[#2d5a7a] leading-snug mt-1.5">
          {line.slice(3)}
        </p>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      result.push(
        <p key={key++} className="text-[14px] font-bold text-[#1e4a6b] leading-snug mt-2">
          {line.slice(2)}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList();
      result.push(<div key={key++} className="h-1" />);
    } else {
      flushList();
      result.push(
        <p key={key++} className="text-[12px] text-[#5a4e44] leading-relaxed">
          {line}
        </p>
      );
    }
  }
  flushList();
  return result;
}

// ── Éditeur Markdown avec aperçu ─────────────────────────────────────────

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Contenu...',
  rows = 5,
}) => {
  const [preview, setPreview] = useState(false);

  const insertSyntax = (syntax: string) => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (!textarea || textarea.tagName !== 'TEXTAREA') {
      onChange(value + syntax);
      return;
    }
    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const newVal = value.slice(0, start) + syntax + value.slice(end);
    onChange(newVal);
    // Reposition le curseur après l'insertion
    requestAnimationFrame(() => {
      textarea.selectionStart = start + syntax.length;
      textarea.selectionEnd   = start + syntax.length;
      textarea.focus();
    });
  };

  return (
    <div className="flex flex-col gap-1 border border-gray-200 rounded-lg overflow-hidden focus-within:border-gray-400 transition-colors">
      {/* Barre d'outils */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-gray-100 bg-gray-50/60">
        <button
          type="button"
          title="Titre principal (# Titre)"
          onClick={() => insertSyntax('\n# ')}
          className="px-2 py-0.5 text-[11px] font-bold text-[#1e4a6b] rounded hover:bg-gray-200 transition-colors"
        >
          H1
        </button>
        <button
          type="button"
          title="Sous-titre (## Sous-titre)"
          onClick={() => insertSyntax('\n## ')}
          className="px-2 py-0.5 text-[11px] font-bold text-[#2d5a7a] rounded hover:bg-gray-200 transition-colors"
        >
          H2
        </button>
        <button
          type="button"
          title="Petit titre (### Titre)"
          onClick={() => insertSyntax('\n### ')}
          className="px-2 py-0.5 text-[11px] font-bold text-[#3b6b8a] rounded hover:bg-gray-200 transition-colors"
        >
          H3
        </button>
        <span className="w-px h-3 bg-gray-200 mx-1" />
        <button
          type="button"
          title="Élément de liste (- item)"
          onClick={() => insertSyntax('\n- ')}
          className="px-2 py-0.5 text-[11px] text-gray-500 rounded hover:bg-gray-200 transition-colors"
        >
          • Liste
        </button>
        <span className="w-px h-3 bg-gray-200 mx-1" />
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors
              ${!preview ? 'bg-white border border-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Éditer
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors
              ${preview ? 'bg-white border border-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Aperçu
          </button>
        </div>
      </div>

      {/* Zone édition / aperçu */}
      {preview ? (
        <div className="px-2.5 py-2 min-h-[80px]">
          {value.trim()
            ? renderMarkdown(value)
            : <p className="text-[12px] text-gray-300 italic">Aucun contenu à prévisualiser.</p>
          }
        </div>
      ) : (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-2.5 py-2 text-[12px] bg-transparent focus:outline-none placeholder:text-gray-300 resize-none font-mono leading-relaxed"
        />
      )}

      {/* Aide syntaxe */}
      <div className="flex items-center gap-3 px-2.5 py-1 border-t border-gray-100 bg-gray-50/40">
        <span className="text-[10px] text-gray-300"># Titre</span>
        <span className="text-[10px] text-gray-300">## Sous-titre</span>
        <span className="text-[10px] text-gray-300">- liste</span>
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

// ── Carte article ──────────────────────────────────────────────────────────

interface ArticleCardProps {
  item: KnowledgeItem;
  colorClass: string;
  themes: Theme[];
  onEditSubmit: (data: { theme: string; sousTheme: string; titre: string; contenu: string }) => Promise<void>;
  loadingItems: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ item, colorClass, themes, onEditSubmit, loadingItems }) => {
  const [isEditing, setIsEditing] = useState(false);

  const [editTheme, setEditTheme]                   = useState(item.subTheme.theme.nom);
  const [editThemeLibre, setEditThemeLibre]         = useState('');
  const [editSousTheme, setEditSousTheme]           = useState(item.subTheme.nom);
  const [editSousThemeLibre, setEditSousThemeLibre] = useState('');
  const [editTitre, setEditTitre]                   = useState(item.titre);
  const [editContenu, setEditContenu]               = useState(item.contenu);

  const themeObj  = themes.find((t) => t.nom === editTheme);
  const subThemes = themeObj?.subThemes ?? [];

  const finalTheme     = editThemeLibre.trim() || editTheme;
  const finalSousTheme = editSousThemeLibre.trim() || editSousTheme;
  const canSubmit      = !!finalTheme && !!finalSousTheme && !!editTitre.trim();

  const handleCancel = () => {
    setIsEditing(false);
    setEditTheme(item.subTheme.theme.nom);
    setEditThemeLibre('');
    setEditSousTheme(item.subTheme.nom);
    setEditSousThemeLibre('');
    setEditTitre(item.titre);
    setEditContenu(item.contenu);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onEditSubmit({
      theme: finalTheme,
      sousTheme: finalSousTheme,
      titre: editTitre.trim(),
      contenu: editContenu.trim(),
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 flex flex-col gap-3 min-h-64">

        {/* Thème */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Thème</label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {themes.map((t) => (
              <button
                key={t.id} type="button"
                onClick={() => { setEditTheme(t.nom); setEditThemeLibre(''); setEditSousTheme(''); setEditSousThemeLibre(''); }}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors
                  ${editTheme === t.nom && !editThemeLibre
                    ? 'border-gray-400 bg-gray-100 text-gray-700'
                    : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'}`}
              >
                {t.nom}
              </button>
            ))}
          </div>
          <input
            type="text" placeholder="Ou nouveau thème..."
            value={editThemeLibre}
            onChange={(e) => { setEditThemeLibre(e.target.value); setEditTheme(''); setEditSousTheme(''); setEditSousThemeLibre(''); }}
            className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>

        {/* Sous-thème */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Sous-thème</label>
          {subThemes.length > 0 && !editThemeLibre && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {subThemes.map((s) => (
                <button
                  key={s.id} type="button"
                  onClick={() => { setEditSousTheme(s.nom); setEditSousThemeLibre(''); }}
                  className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors
                    ${editSousTheme === s.nom && !editSousThemeLibre
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'}`}
                >
                  {s.nom}
                </button>
              ))}
            </div>
          )}
          <input
            type="text" placeholder="Ou nouveau sous-thème..."
            value={editSousThemeLibre}
            onChange={(e) => { setEditSousThemeLibre(e.target.value); setEditSousTheme(''); }}
            className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>

        {/* Titre */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Titre</label>
          <input
            type="text" placeholder="Titre de l'article..."
            value={editTitre} onChange={(e) => setEditTitre(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>

        {/* Contenu — éditeur Markdown */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Contenu</label>
          <MarkdownEditor value={editContenu} onChange={setEditContenu} rows={5} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button" onClick={handleCancel}
            className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button" onClick={handleSubmit}
            disabled={!canSubmit || loadingItems}
            className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors
              ${canSubmit && !loadingItems
                ? 'bg-gray-900 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {loadingItems ? 'Enregistrement...' : 'Modifier'}
          </button>
        </div>
      </div>
    );
  }

  // ── Affichage avec rendu Markdown ─────────────────────────────────────────
  return (
    <div
      className={`${colorClass}
        rounded-xl border border-transparent p-4 flex flex-col gap-2
        min-h-64 cursor-pointer hover:brightness-95 transition-all group relative`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
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

      <p className="text-[14px] font-semibold text-[#1e1a17] leading-snug">
        {item.titre}
      </p>

      {/* Rendu Markdown du contenu */}
      <div className="flex-1 overflow-hidden">
        {renderMarkdown(item.contenu)}
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 text-[#6b5e52]">
          {item.subTheme.nom}
        </span>
      </div>
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────────────────

const PageBaseConnaissance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    themes, items, selectedTheme, selectedSubTheme,
    loadingThemes, loadingItems, error,
  } = useSelector((state: RootState) => state.knowledgeBase);

  const [showInlineForm, setShowInlineForm]         = useState(false);
  const [formSubTheme, setFormSubTheme]             = useState('');
  const [formSubThemeLibre, setFormSubThemeLibre]   = useState('');
  const [formTitre, setFormTitre]                   = useState('');
  const [formContenu, setFormContenu]               = useState('');

  const [showNewThemeInput, setShowNewThemeInput]   = useState(false);
  const [newThemeValue, setNewThemeValue]           = useState('');
  const [savingTheme, setSavingTheme]               = useState(false);

  useEffect(() => { dispatch(fetchThemes()); }, [dispatch]);

  useEffect(() => {
    if (themes.length > 0 && !selectedTheme) {
      dispatch(setSelectedTheme(themes[0].nom));
    }
  }, [themes]); // eslint-disable-line react-hooks/exhaustive-deps

  useAutoSelectFirstSubTheme(themes, selectedTheme, selectedSubTheme, dispatch);

  useEffect(() => {
    if (selectedTheme && selectedSubTheme) {
      dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
    }
  }, [dispatch, selectedTheme, selectedSubTheme]);

  useEffect(() => {
    setShowInlineForm(false);
    setFormSubTheme('');
    setFormSubThemeLibre('');
    setFormTitre('');
    setFormContenu('');
  }, [selectedSubTheme, selectedTheme]);

  const handleSelectTheme = (themeName: string) => dispatch(setSelectedTheme(themeName));

  const handleSelectSubTheme = (sub: SubTheme, parent: Theme) => {
    if (selectedTheme !== parent.nom) dispatch(setSelectedTheme(parent.nom));
    dispatch(setSelectedSubTheme(sub.nom));
  };

  const handleOpenInlineForm = () => {
    setFormSubTheme(selectedSubTheme ?? '');
    setFormSubThemeLibre('');
    setFormTitre('');
    setFormContenu('');
    setShowInlineForm(true);
  };

  const handleCancelInlineForm = () => {
    setShowInlineForm(false);
    setFormSubTheme('');
    setFormSubThemeLibre('');
    setFormTitre('');
    setFormContenu('');
  };

  const handleInlineSubmit = async () => {
    const finalSousTheme = formSubThemeLibre.trim() || formSubTheme;
    if (!selectedTheme || !finalSousTheme || !formTitre.trim()) return;
    const result = await dispatch(createKnowledgeItem({
      theme: selectedTheme,
      sousTheme: finalSousTheme,
      titre: formTitre.trim(),
      contenu: formContenu.trim(),
    }));
    if (createKnowledgeItem.fulfilled.match(result)) {
      handleCancelInlineForm();
      dispatch(fetchThemes());
      if (selectedTheme && selectedSubTheme) {
        dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
      }
    }
  };

  const handleEditSubmit = async (
    data: { theme: string; sousTheme: string; titre: string; contenu: string },
    itemId: string,
  ) => {
    const result = await dispatch(updateKnowledgeItem({ id: itemId, ...data }));
    if (updateKnowledgeItem.fulfilled.match(result)) {
      dispatch(fetchThemes());
      if (selectedTheme && selectedSubTheme) {
        dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
      }
    }
  };

  const handleNewThemeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setShowNewThemeInput(false); setNewThemeValue(''); return; }
    if (e.key !== 'Enter') return;
    const nom = newThemeValue.trim();
    if (!nom) return;
    setSavingTheme(true);
    try {
      await dispatch(createKnowledgeItem({ theme: nom, sousTheme: 'Général', titre: 'Premier article', contenu: '' }));
      await dispatch(fetchThemes());
      dispatch(setSelectedTheme(nom));
    } finally {
      setSavingTheme(false);
      setShowNewThemeInput(false);
      setNewThemeValue('');
    }
  };

  const activeTabTheme           = themes.find((t) => t.nom === selectedTheme);
  const inlineFormSousThemeFinal = formSubThemeLibre.trim() || formSubTheme;
  const inlineFormCanSubmit      = !!selectedTheme && !!inlineFormSousThemeFinal && !!formTitre.trim();

  return (
    <div className="flex h-full text-sm font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 border-r border-[#e0d9d2] bg-slate-200 p-3 overflow-y-auto flex flex-col gap-1">
        <div className="flex flex-col gap-0.5 mb-3">
          {['Recent', 'Reading list', 'Discover'].map((label) => (
            <div key={label} className="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-[13px] text-[#6b5e52] hover:bg-[#ddd8d2] transition-colors">
              <span>{label}</span>
              {label === 'Reading list' && <span className="text-xs text-[#a09080]">24</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-[#a09080] uppercase tracking-widest px-2 pb-1">My library</p>
        {loadingThemes && <p className="text-xs text-[#a09080] px-2">Chargement...</p>}
        {themes.map((theme, idx) => (
          <div key={theme.id} className="mb-0.5">
            <div
              onClick={() => handleSelectTheme(theme.nom)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
                ${selectedTheme === theme.nom ? 'bg-[#d4cdc6] text-[#2d2520] font-semibold' : 'text-[#6b5e52] hover:bg-[#ddd8d2]'}`}
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
                  ${selectedSubTheme === sub.nom && selectedTheme === theme.nom ? 'bg-[#d4cdc6] text-[#2d2520] font-medium' : 'text-[#8a7a6e] hover:bg-[#ddd8d2]'}`}
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

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden p-4 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="text-[#a09080] hover:text-[#6b5e52] text-sm">← Retour</button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-semibold text-[#1e1a17]">Base de connaissance</h1>
        </div>
        <p className="text-[#7a6e64] text-[13px] leading-relaxed max-w-xl mb-6">
          Collection d'articles et de ressources organisés par thèmes. Cette base couvre des sujets variés,
          des concepts fondamentaux aux développements récents.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 items-end shrink-0">
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
          {showNewThemeInput ? (
            <div className="flex items-center gap-1 px-2 py-1.5 bg-[#e8e2db] rounded-t-xl">
              <input
                autoFocus type="text" value={newThemeValue}
                onChange={(e) => setNewThemeValue(e.target.value)}
                onKeyDown={handleNewThemeKeyDown}
                onBlur={() => { setShowNewThemeInput(false); setNewThemeValue(''); }}
                placeholder="Nom du thème..." disabled={savingTheme}
                className="w-32 px-2 py-0.5 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 placeholder:text-gray-300 bg-white"
              />
              <span className="text-[10px] text-[#a09080]">↵</span>
            </div>
          ) : (
            <button
              onClick={() => setShowNewThemeInput(true)}
              className="px-3 py-2 text-[13px] rounded-t-xl text-[#a09080] hover:text-[#4a3f38] bg-[#e8e2db] transition-colors"
            >
              + Thème
            </button>
          )}
        </div>

        {/* Panneau blanc */}
        <div className="bg-white rounded-b-2xl rounded-r-2xl shadow-sm flex flex-col flex-1 min-h-0">

          {/* Zone fixe */}
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
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">{error}</div>
            )}

            {selectedSubTheme && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[13px] text-[#a09080]">
                  {loadingItems ? 'Chargement...' : `Items (${items.length}) · ${selectedSubTheme}`}
                </span>
                <button
                  onClick={handleOpenInlineForm}
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

          {/* Zone scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">

            {!selectedSubTheme && !loadingItems && (
              <div className="flex flex-col items-center justify-center h-full text-[#c0b8b0] gap-3">
                <p className="text-[13px]">Cliquez sur un sous-thème pour voir les articles.</p>
                <button onClick={handleOpenInlineForm} className="px-4 py-2 text-[13px] border border-gray-200 rounded-lg text-[#7a6e64] hover:bg-[#f5f0eb] transition-colors">
                  + Ajouter un article
                </button>
              </div>
            )}

            {loadingItems && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-gray-100 p-4 min-h-64 bg-[#f5f0eb] animate-pulse" />
                ))}
              </div>
            )}

            {!loadingItems && (showInlineForm || items.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                {/* Formulaire ajout inline */}
                {showInlineForm && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 flex flex-col gap-3 min-h-64">

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Sous-thème</label>
                      {activeTabTheme && activeTabTheme.subThemes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {activeTabTheme.subThemes.map((s) => (
                            <button
                              key={s.id} type="button"
                              onClick={() => { setFormSubTheme(s.nom); setFormSubThemeLibre(''); }}
                              className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors
                                ${formSubTheme === s.nom && !formSubThemeLibre
                                  ? 'border-gray-400 bg-gray-100 text-gray-700'
                                  : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'}`}
                            >
                              {s.nom}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        type="text" placeholder="Ou nouveau sous-thème..."
                        value={formSubThemeLibre}
                        onChange={(e) => { setFormSubThemeLibre(e.target.value); setFormSubTheme(''); }}
                        className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Titre</label>
                      <input
                        type="text" placeholder="Titre de l'article..."
                        value={formTitre} onChange={(e) => setFormTitre(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                      />
                    </div>

                    {/* Contenu — éditeur Markdown */}
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Contenu</label>
                      <MarkdownEditor value={formContenu} onChange={setFormContenu} rows={5} />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button" onClick={handleCancelInlineForm}
                        className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="button" onClick={handleInlineSubmit}
                        disabled={!inlineFormCanSubmit || loadingItems}
                        className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors
                          ${inlineFormCanSubmit && !loadingItems
                            ? 'bg-gray-900 text-white hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        {loadingItems ? 'Enregistrement...' : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Articles */}
                {items.map((item, idx) => (
                  <ArticleCard
                    key={item.id}
                    item={item}
                    colorClass={CARD_COLORS[idx % CARD_COLORS.length]}
                    themes={themes}
                    onEditSubmit={(data) => handleEditSubmit(data, item.id)}
                    loadingItems={loadingItems}
                  />
                ))}
              </div>
            )}

            {!loadingItems && selectedSubTheme && items.length === 0 && !error && !showInlineForm && (
              <div className="flex flex-col items-center justify-center h-full text-[#c0b8b0]">
                <p className="text-[13px]">Aucun article trouvé pour ce sous-thème.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageBaseConnaissance;