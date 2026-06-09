import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../app/store';
import {
  fetchKnowledgeItems,
  fetchThemes,
  setSelectedSubTheme,
  setSelectedTheme,
  createKnowledgeItem,
  updateKnowledgeItem,
  type SubTheme,
  type Theme,
  type KnowledgeItem,
} from '../../../../app/front_office/parametre_base_connaissance/knowledgeBaseSlice';
import { useNavigate } from 'react-router-dom';

// ── Couleurs par thème ────────────────────────────────────────────────────

const DOTS = [
  '#6366f1', '#0d9488', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#10b981', '#f97316',
  '#3b82f6', '#14b8a6',
];

// ── Markdown renderer ─────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    result.push(
      <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-[12px] text-slate-600 leading-relaxed">{item}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushList();
      result.push(<p key={key++} className="text-[12px] font-semibold text-slate-700 mt-1">{line.slice(4)}</p>);
    } else if (line.startsWith('## ')) {
      flushList();
      result.push(<p key={key++} className="text-[13px] font-semibold text-slate-800 mt-1.5">{line.slice(3)}</p>);
    } else if (line.startsWith('# ')) {
      flushList();
      result.push(<p key={key++} className="text-[14px] font-bold text-slate-900 mt-2">{line.slice(2)}</p>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList();
      result.push(<div key={key++} className="h-1" />);
    } else {
      flushList();
      result.push(<p key={key++} className="text-[12px] text-slate-600 leading-relaxed">{line}</p>);
    }
  }
  flushList();
  return result;
}

// ── Éditeur Markdown ──────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  rows?: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, rows = 5 }) => {
  const [preview, setPreview] = useState(false);

  const insertSyntax = (syntax: string) => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (!textarea || textarea.tagName !== 'TEXTAREA') { onChange(value + syntax); return; }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    onChange(value.slice(0, start) + syntax + value.slice(end));
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + syntax.length;
      textarea.focus();
    });
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden focus-within:border-slate-400 transition-colors">
      <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-slate-100 bg-slate-50">
        {(['H1', 'H2', 'H3'] as const).map((h) => (
          <button key={h} type="button"
            onClick={() => insertSyntax(`\n${'#'.repeat(parseInt(h[1]))} `)}
            className="px-2 py-0.5 text-[11px] font-bold text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >{h}</button>
        ))}
        <span className="w-px h-3 bg-slate-200 mx-1" />
        <button type="button" onClick={() => insertSyntax('\n- ')}
          className="px-2 py-0.5 text-[11px] text-slate-500 rounded hover:bg-slate-200 transition-colors">
          • Liste
        </button>
        <div className="flex items-center gap-0.5 ml-auto">
          {(['Éditer', 'Aperçu'] as const).map((label) => (
            <button key={label} type="button" onClick={() => setPreview(label === 'Aperçu')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors
                ${(label === 'Aperçu') === preview
                  ? 'bg-white border border-slate-200 text-slate-700'
                  : 'text-slate-400 hover:text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {preview ? (
        <div className="px-3 py-2 min-h-[80px]">
          {value.trim() ? renderMarkdown(value) : <p className="text-[12px] text-slate-300 italic">Aucun contenu.</p>}
        </div>
      ) : (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
          placeholder="Contenu..."
          className="w-full px-3 py-2 text-[12px] bg-transparent focus:outline-none placeholder:text-slate-300 resize-none font-mono leading-relaxed"
        />
      )}
      <div className="flex gap-3 px-3 py-1 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[10px] text-slate-300"># Titre</span>
        <span className="text-[10px] text-slate-300">## Sous-titre</span>
        <span className="text-[10px] text-slate-300">- liste</span>
      </div>
    </div>
  );
};

// ── Carte article (mode édition inline) ──────────────────────────────────

interface ArticleCardProps {
  item: KnowledgeItem;
  accent: string;
  subThemeName: string;
  themes: Theme[];
  onEditSubmit: (data: { theme: string; sousTheme: string; titre: string; contenu: string }) => Promise<void>;
  loadingItems: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  item, accent, subThemeName, themes, onEditSubmit, loadingItems,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTheme, setEditTheme] = useState(item.subTheme.theme.nom);
  const [editThemeLibre, setEditThemeLibre] = useState('');
  const [editSousTheme, setEditSousTheme] = useState(item.subTheme.nom);
  const [editSousThemeLibre, setEditSousThemeLibre] = useState('');
  const [editTitre, setEditTitre] = useState(item.titre);
  const [editContenu, setEditContenu] = useState(item.contenu);

  const themeObj = themes.find((t) => t.nom === editTheme);
  const subThemes = themeObj?.subThemes ?? [];
  const finalTheme = editThemeLibre.trim() || editTheme;
  const finalSousTheme = editSousThemeLibre.trim() || editSousTheme;
  const canSubmit = !!finalTheme && !!finalSousTheme && !!editTitre.trim();

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
    await onEditSubmit({ theme: finalTheme, sousTheme: finalSousTheme, titre: editTitre.trim(), contenu: editContenu.trim() });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl bg-white p-4 flex flex-col gap-3">
        {/* Thème */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Thème</label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {themes.map((t) => (
              <button key={t.id} type="button"
                onClick={() => { setEditTheme(t.nom); setEditThemeLibre(''); setEditSousTheme(''); setEditSousThemeLibre(''); }}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors
                  ${editTheme === t.nom && !editThemeLibre
                    ? 'border-slate-400 bg-slate-100 text-slate-700'
                    : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'}`}>
                {t.nom}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Ou nouveau thème..."
            value={editThemeLibre}
            onChange={(e) => { setEditThemeLibre(e.target.value); setEditTheme(''); setEditSousTheme(''); setEditSousThemeLibre(''); }}
            className="w-full px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder:text-slate-300 text-slate-800"
          />
        </div>
        {/* Sous-thème */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Sous-thème</label>
          {subThemes.length > 0 && !editThemeLibre && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {subThemes.map((s) => (
                <button key={s.id} type="button"
                  onClick={() => { setEditSousTheme(s.nom); setEditSousThemeLibre(''); }}
                  className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors
                    ${editSousTheme === s.nom && !editSousThemeLibre
                      ? 'border-slate-400 bg-slate-100 text-slate-700'
                      : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'}`}>
                  {s.nom}
                </button>
              ))}
            </div>
          )}
          <input type="text" placeholder="Ou nouveau sous-thème..."
            value={editSousThemeLibre}
            onChange={(e) => { setEditSousThemeLibre(e.target.value); setEditSousTheme(''); }}
            className="w-full px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder:text-slate-300 text-slate-800"
          />
        </div>
        {/* Titre */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Titre</label>
          <input type="text" placeholder="Titre de l'article..."
            value={editTitre} onChange={(e) => setEditTitre(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder:text-slate-300 text-slate-800"
          />
        </div>
        {/* Contenu */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Contenu</label>
          <MarkdownEditor value={editContenu} onChange={setEditContenu} rows={5} />
        </div>
        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={handleCancel}
            className="px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit || loadingItems}
            className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors
              ${canSubmit && !loadingItems
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            {loadingItems ? 'Enregistrement...' : 'Modifier'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3.5 border-b border-slate-100 last:border-none flex gap-4 items-start group">
      <div className="w-[3px] self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: accent }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-slate-900 mb-1 group-hover:text-blue-500 transition-colors cursor-pointer">
          {item.titre}
        </p>
        <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">
          {item.contenu}
        </p>
        <div className="flex gap-2 mt-2 items-center">
          <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            {subThemeName}
          </span>
          <span className="text-[11px] text-slate-400">
            {new Date(item.createdAt).getFullYear()}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 flex-shrink-0">
        ✎ Modifier
      </button>
    </div>
  );
};

// ── Hook auto-sélection ───────────────────────────────────────────────────

function useAutoSelectFirstSubTheme(
  themes: Theme[],
  selectedTheme: string | null,
  selectedSubTheme: string | null,
  dispatch: AppDispatch,
) {
  useEffect(() => {
    if (!selectedTheme) return;
    const themeObj = themes.find((t) => t.nom === selectedTheme);
    if (!themeObj || !themeObj.subThemes.length) return;
    const belongs = themeObj.subThemes.some((s) => s.nom === selectedSubTheme);
    if (!belongs) dispatch(setSelectedSubTheme(themeObj.subThemes[0].nom));
  }, [selectedTheme, themes]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Page principale ───────────────────────────────────────────────────────

const PageBaseConnaissance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    themes, items, selectedTheme, selectedSubTheme,
    loadingThemes, loadingItems, error,
  } = useSelector((state: RootState) => state.knowledgeBase);

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [formSubTheme, setFormSubTheme] = useState('');
  const [formSubThemeLibre, setFormSubThemeLibre] = useState('');
  const [formTitre, setFormTitre] = useState('');
  const [formContenu, setFormContenu] = useState('');

  const [showNewThemeInput, setShowNewThemeInput] = useState(false);
  const [newThemeValue, setNewThemeValue] = useState('');
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => { dispatch(fetchThemes()); }, [dispatch]);

  useEffect(() => {
    if (themes.length > 0 && !selectedTheme) dispatch(setSelectedTheme(themes[0].nom));
  }, [themes]); // eslint-disable-line react-hooks/exhaustive-deps

  useAutoSelectFirstSubTheme(themes, selectedTheme, selectedSubTheme, dispatch);

  useEffect(() => {
    if (selectedTheme && selectedSubTheme)
      dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
  }, [dispatch, selectedTheme, selectedSubTheme]);

  useEffect(() => {
    setShowInlineForm(false);
    setFormSubTheme(''); setFormSubThemeLibre(''); setFormTitre(''); setFormContenu('');
  }, [selectedSubTheme, selectedTheme]);

  const handleSelectTheme = (name: string) => dispatch(setSelectedTheme(name));

  const handleSelectSubTheme = (sub: SubTheme, parent: Theme) => {
    if (selectedTheme !== parent.nom) dispatch(setSelectedTheme(parent.nom));
    dispatch(setSelectedSubTheme(sub.nom));
  };

  const handleInlineSubmit = async () => {
    const finalSousTheme = formSubThemeLibre.trim() || formSubTheme;
    if (!selectedTheme || !finalSousTheme || !formTitre.trim()) return;
    const result = await dispatch(createKnowledgeItem({
      theme: selectedTheme, sousTheme: finalSousTheme,
      titre: formTitre.trim(), contenu: formContenu.trim(),
    }));
    if (createKnowledgeItem.fulfilled.match(result)) {
      setShowInlineForm(false);
      setFormSubTheme(''); setFormSubThemeLibre(''); setFormTitre(''); setFormContenu('');
      dispatch(fetchThemes());
      if (selectedTheme && selectedSubTheme)
        dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
    }
  };

  const handleEditSubmit = async (
    data: { theme: string; sousTheme: string; titre: string; contenu: string },
    itemId: string,
  ) => {
    const result = await dispatch(updateKnowledgeItem({ id: itemId, ...data }));
    if (updateKnowledgeItem.fulfilled.match(result)) {
      dispatch(fetchThemes());
      if (selectedTheme && selectedSubTheme)
        dispatch(fetchKnowledgeItems({ theme: selectedTheme, sousTheme: selectedSubTheme }));
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

  const activeTabTheme = themes.find((t) => t.nom === selectedTheme);
  const themeIdx = themes.findIndex((t) => t.nom === selectedTheme);
  const accent = DOTS[themeIdx % DOTS.length];
  const inlineFormCanSubmit = !!selectedTheme && !!(formSubThemeLibre.trim() || formSubTheme) && !!formTitre.trim();

  return (
    <div className="flex flex-col h-full text-sm font-sans overflow-hidden bg-white">

      {/* Header */}
      <div className="px-7 pt-6 pb-0 shrink-0">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 text-sm mb-3 block">← Retour</button>
        <h1 className="text-xl font-medium text-slate-900 mb-1">Base de connaissance</h1>
        <p className="text-[13px] text-slate-500 mb-5">Ressources et articles accessibles à tous, organisés par thèmes.</p>
      </div>

      {/* Grille de thèmes */}
      <div className="px-7 shrink-0">
        {loadingThemes && <p className="text-xs text-slate-400 mb-3">Chargement...</p>}
        <div className="grid grid-cols-6 gap-1.5 mb-0">
          {themes.map((theme, idx) => (
            <button
              key={theme.id}
              onClick={() => handleSelectTheme(theme.nom)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] transition-all text-left overflow-hidden
                ${selectedTheme === theme.nom
                  ? 'bg-white border-slate-400 text-slate-900 font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 hover:border-slate-300'}`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DOTS[idx % DOTS.length] }} />
              <span className="flex-1 truncate">{theme.nom}</span>
              <span className="text-[11px] text-slate-400 ml-auto shrink-0">{theme.subThemes.length}</span>
            </button>
          ))}
          {showNewThemeInput ? (
            <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
              <input
                autoFocus type="text" value={newThemeValue} disabled={savingTheme}
                onChange={(e) => setNewThemeValue(e.target.value)}
                onKeyDown={handleNewThemeKeyDown}
                onBlur={() => { setShowNewThemeInput(false); setNewThemeValue(''); }}
                placeholder="Nom du thème..."
                className="flex-1 text-[12px] bg-transparent focus:outline-none placeholder:text-slate-300 text-slate-800"
              />
              <span className="text-[10px] text-slate-400">↵</span>
            </div>
          ) : (
            <button
              onClick={() => setShowNewThemeInput(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-200 text-[12px] text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
            >
              + Thème
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-7 my-3.5 border-b border-slate-100 shrink-0" />

      {/* Sous-thèmes pills */}
      {activeTabTheme && activeTabTheme.subThemes.length > 0 && (
        <div className="px-7 flex flex-wrap gap-1.5 mb-3.5 shrink-0">
          {activeTabTheme.subThemes.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSelectSubTheme(sub, activeTabTheme)}
              className={`px-3.5 py-1 rounded-full border text-[12px] transition-all
                ${selectedSubTheme === sub.nom && selectedTheme === activeTabTheme.nom
                  ? 'bg-slate-100 border-slate-400 text-slate-800 font-medium'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              {sub.nom}
            </button>
          ))}
        </div>
      )}

      {/* Zone scrollable */}
      <div className="flex-1 overflow-y-auto px-7 pb-6 min-h-0">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">{error}</div>
        )}

        {selectedSubTheme && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-slate-400">
              {loadingItems ? 'Chargement...' : `${items.length} article${items.length !== 1 ? 's' : ''} · ${selectedSubTheme}`}
            </span>
            <button
              onClick={() => setShowInlineForm(true)}
              className="flex items-center gap-1 px-3 py-1 text-[12px] border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              + Ajouter
            </button>
          </div>
        )}

        {/* Formulaire inline */}
        {showInlineForm && (
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 mb-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Sous-thème</label>
              {activeTabTheme && activeTabTheme.subThemes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {activeTabTheme.subThemes.map((s) => (
                    <button key={s.id} type="button"
                      onClick={() => { setFormSubTheme(s.nom); setFormSubThemeLibre(''); }}
                      className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors
                        ${formSubTheme === s.nom && !formSubThemeLibre
                          ? 'border-slate-400 bg-white text-slate-700'
                          : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'}`}>
                      {s.nom}
                    </button>
                  ))}
                </div>
              )}
              <input type="text" placeholder="Ou nouveau sous-thème..."
                value={formSubThemeLibre}
                onChange={(e) => { setFormSubThemeLibre(e.target.value); setFormSubTheme(''); }}
                className="w-full px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder:text-slate-300 bg-white text-slate-800"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Titre</label>
              <input type="text" placeholder="Titre de l'article..."
                value={formTitre} onChange={(e) => setFormTitre(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder:text-slate-300 bg-white text-slate-800"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Contenu</label>
              <MarkdownEditor value={formContenu} onChange={setFormContenu} rows={5} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowInlineForm(false)}
                className="px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-colors">
                Annuler
              </button>
              <button type="button" onClick={handleInlineSubmit}
                disabled={!inlineFormCanSubmit || loadingItems}
                className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors
                  ${inlineFormCanSubmit && !loadingItems
                    ? 'bg-slate-900 text-white hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {loadingItems ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Liste articles */}
        {loadingItems && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingItems && items.map((item) => (
          <ArticleCard
            key={item.id}
            item={item}
            accent={accent}
            subThemeName={selectedSubTheme ?? ''}
            themes={themes}
            onEditSubmit={(data) => handleEditSubmit(data, item.id)}
            loadingItems={loadingItems}
          />
        ))}

        {!loadingItems && !showInlineForm && selectedSubTheme && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-[13px]">Aucun article dans ce sous-thème.</p>
          </div>
        )}

        {!selectedSubTheme && !loadingItems && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-[13px]">Sélectionnez un sous-thème pour voir les articles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageBaseConnaissance;