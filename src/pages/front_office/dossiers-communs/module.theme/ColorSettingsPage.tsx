import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────
interface CurrentColor {
  name: string;
  bg: string;
  border: string;
  text: string;
  usage: string;
}

interface Palette {
  name: string;
  desc: string;
  emoji: string;
  accent: string;
  accentBorder: string;
  accentText: string;
  bg: string;
  headerBg: string;
  headerText: string;
  chip: string;
  chipText: string;
  colors: string[];
}

interface Theme {
  id: string;
  label: string;
  icon: string;
  desc: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  cardBorderW: string;
  textPrimary: string;
  textSec: string;
  accent1: string;
  accent2: string;
  accent3: string;
  shadow: string;
  modules: string[];
}

interface ModuleCard {
  label: string;
  desc: string;
  color: string;
  border: string;
  text: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const CURRENT_COLORS: CurrentColor[] = [
  { name: 'Blue (module)',      bg: '#3B82F6', border: '#93C5FD', text: '#1D4ED8', usage: 'Dossier, SAV'         },
  { name: 'Teal (To Do)',       bg: '#14B8A6', border: '#5EEAD4', text: '#0F766E', usage: 'To Do List'           },
  { name: 'Cyan (DB)',          bg: '#06B6D4', border: '#67E8F9', text: '#0E7490', usage: 'Base de Données'      },
  { name: 'Amber (Ticket)',     bg: '#F59E0B', border: '#FCD34D', text: '#92400E', usage: 'Ticketing'            },
  { name: 'Orange (Hôtel)',     bg: '#F97316', border: '#FDBA74', text: '#9A3412', usage: 'Hôtel'                },
  { name: 'Green (Assurance)',  bg: '#10B981', border: '#6EE7B7', text: '#065F46', usage: 'Assurance'            },
  { name: 'Indigo (Visa)',      bg: '#6366F1', border: '#A5B4FC', text: '#3730A3', usage: 'Visa'                 },
  { name: 'Rose (Attestation)', bg: '#F43F5E', border: '#FDA4AF', text: '#9F1239', usage: 'Attestation'         },
  { name: 'Violet (Params)',    bg: '#8B5CF6', border: '#C4B5FD', text: '#5B21B6', usage: 'Tous paramètres'     },
  { name: 'Gray (Locked)',      bg: '#D1D5DB', border: '#E5E7EB', text: '#9CA3AF', usage: 'Modules verrouillés' },
  { name: 'Slate bg',           bg: '#64748B', border: '#94A3B8', text: '#1E293B', usage: 'Fond page'           },
  { name: 'Shadow blue',        bg: '#BFDBFE', border: '#93C5FD', text: '#1E40AF', usage: 'Ombre hover blue'    },
];

const PALETTES: Palette[] = [
  {
    name: 'Fort contraste', desc: 'Idéal écrans bas de gamme', emoji: 'HC',
    accent: '#0044CC', accentBorder: '#0033AA', accentText: '#002299',
    bg: '#FFFFFF', headerBg: '#002299', headerText: '#FFFFFF',
    chip: '#E6EDFF', chipText: '#002299',
    colors: ['#0044CC','#0077FF','#00AA55','#FF6600','#CC0044','#7700CC','#005588','#AA4400'],
  },
  {
    name: 'Saturé vif', desc: 'Couleurs très vives', emoji: 'SV',
    accent: '#FF2D00', accentBorder: '#CC2400', accentText: '#990000',
    bg: '#FFFAF0', headerBg: '#1A0000', headerText: '#FFFFFF',
    chip: '#FFECE6', chipText: '#CC0000',
    colors: ['#FF2D00','#FF8800','#00CC44','#0088FF','#CC00FF','#FF0088','#00CCCC','#88CC00'],
  },
  {
    name: 'Sombre (Dark UI)', desc: 'Fond sombre, texte clair', emoji: 'DK',
    accent: '#60A5FA', accentBorder: '#3B82F6', accentText: '#93C5FD',
    bg: '#1E293B', headerBg: '#0F172A', headerText: '#F1F5F9',
    chip: '#334155', chipText: '#CBD5E1',
    colors: ['#60A5FA','#34D399','#FBBF24','#F87171','#A78BFA','#38BDF8','#4ADE80','#FB923C'],
  },
  {
    name: 'Pastel doux', desc: 'Pour bons écrans', emoji: 'PS',
    accent: '#6366F1', accentBorder: '#818CF8', accentText: '#4F46E5',
    bg: '#FAFAFA', headerBg: '#F0F4FF', headerText: '#1E1B4B',
    chip: '#EEF2FF', chipText: '#4338CA',
    colors: ['#818CF8','#34D399','#FCD34D','#F9A8D4','#67E8F9','#A78BFA','#6EE7B7','#FCA5A5'],
  },
  {
    name: 'Professionnel B&W+', desc: 'Minimaliste lisible', emoji: 'PR',
    accent: '#111827', accentBorder: '#374151', accentText: '#111827',
    bg: '#FFFFFF', headerBg: '#111827', headerText: '#FFFFFF',
    chip: '#F3F4F6', chipText: '#111827',
    colors: ['#111827','#374151','#6B7280','#9CA3AF','#D1D5DB','#1D4ED8','#047857','#B45309'],
  },
  {
    name: 'Couleur franche', desc: 'Bordures et ombres visibles', emoji: 'CF',
    accent: '#1D4ED8', accentBorder: '#1E40AF', accentText: '#1E3A8A',
    bg: '#F8FAFC', headerBg: '#1E3A8A', headerText: '#FFFFFF',
    chip: '#DBEAFE', chipText: '#1E40AF',
    colors: ['#1D4ED8','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#BE185D','#92400E'],
  },
];

const THEMES: Theme[] = [
  {
    id: 'low-contrast', label: 'Écran basse qualité', icon: 'LC',
    desc: 'Couleurs fortes, bordures épaisses 2px, pas d\'ombres légères',
    headerBg: '#003399', headerText: '#FFFFFF',
    cardBg: '#FFFFFF', cardBorder: '#0044CC', cardBorderW: '2px',
    textPrimary: '#000000', textSec: '#333333',
    accent1: '#0044CC', accent2: '#CC3300', accent3: '#006622',
    shadow: 'none',
    modules: ['Dossier', 'Ticketing', 'Hôtel', 'Assurance'],
  },
  {
    id: 'old-screen', label: 'Moniteur TN bas gamme', icon: 'TN',
    desc: 'Pas de subtilité, contrastes extrêmes, fond légèrement jaune',
    headerBg: '#1A1A00', headerText: '#FFFF00',
    cardBg: '#FFFFF0', cardBorder: '#333300', cardBorderW: '1.5px',
    textPrimary: '#000000', textSec: '#444400',
    accent1: '#660000', accent2: '#006600', accent3: '#000066',
    shadow: 'none',
    modules: ['Dossier', 'Ticketing', 'Hôtel', 'Assurance'],
  },
  {
    id: 'dark-mode', label: 'Mode sombre adaptatif', icon: 'DM',
    desc: 'Fond sombre, couleurs saturées pour visibilité maximale',
    headerBg: '#0F172A', headerText: '#E2E8F0',
    cardBg: '#1E293B', cardBorder: '#475569', cardBorderW: '1px',
    textPrimary: '#F1F5F9', textSec: '#94A3B8',
    accent1: '#60A5FA', accent2: '#34D399', accent3: '#FBBF24',
    shadow: 'none',
    modules: ['Dossier', 'Ticketing', 'Hôtel', 'Assurance'],
  },
  {
    id: 'high-contrast', label: 'Haut contraste WCAG', icon: 'A11',
    desc: 'Standard WCAG AAA, pour accessibilité maximale',
    headerBg: '#000000', headerText: '#FFFF00',
    cardBg: '#FFFFFF', cardBorder: '#000000', cardBorderW: '2px',
    textPrimary: '#000000', textSec: '#1A1A1A',
    accent1: '#0000CC', accent2: '#006600', accent3: '#CC0000',
    shadow: 'none',
    modules: ['Dossier', 'Ticketing', 'Hôtel', 'Assurance'],
  },
];

const CONTRAST_DATA = [
  { name: 'Bleu sur blanc',         bg: '#3B82F6', tc: '#FFFFFF', ratio: 3.0,  usage: 'Cartes modules'    },
  { name: 'Texte slate sur blanc',  bg: '#FFFFFF', tc: '#1E293B', ratio: 14.1, usage: 'Titres modules'    },
  { name: 'Texte gris sur blanc',   bg: '#FFFFFF', tc: '#6B7280', ratio: 4.5,  usage: 'Descriptions'      },
  { name: 'Amber sur blanc',        bg: '#F59E0B', tc: '#FFFFFF', ratio: 2.3,  usage: 'Ticketing badge'   },
  { name: 'Bordure bleue sur blanc',bg: '#FFFFFF', tc: '#93C5FD', ratio: 1.4,  usage: 'Bordures hover'    },
  { name: 'Ombre bleue hover',      bg: '#FFFFFF', tc: '#BFDBFE', ratio: 1.2,  usage: 'Ombres hover'      },
  { name: 'Gray locked sur fond',   bg: '#D1D5DB', tc: '#9CA3AF', ratio: 1.7,  usage: 'Modules verrouillés' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function copyToClipboard(hex: string, setCopied: (v: string) => void) {
  navigator.clipboard?.writeText(hex);
  setCopied(hex);
  setTimeout(() => setCopied(''), 1500);
}

// ── Sub-components ─────────────────────────────────────────────────────────
function MiniModuleCard({ card, darkBg }: { card: ModuleCard; darkBg: boolean }) {
  return (
    <div
      className="rounded-xl p-3 min-w-[110px] border"
      style={{
        background: darkBg ? '#1E293B' : '#FFFFFF',
        borderColor: card.border,
        borderWidth: '1.5px',
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
        style={{ background: card.color + '20' }}
      >
        <div className="w-3 h-3 rounded" style={{ background: card.color }} />
      </div>
      <p className="text-[13px] font-medium" style={{ color: darkBg ? '#F1F5F9' : card.text }}>
        {card.label}
      </p>
      <p className="text-[11px]" style={{ color: darkBg ? '#94A3B8' : '#6B7280' }}>
        {card.desc}
      </p>
    </div>
  );
}

// ── Tab: Couleurs actuelles ────────────────────────────────────────────────
function TabCurrent({ onCopy }: { onCopy: (hex: string) => void }) {
  const previewCards: ModuleCard[] = [
    { label: 'Dossier',   desc: 'Accédez à vos fichiers', color: '#3B82F6', border: '#93C5FD', text: '#1D4ED8' },
    { label: 'Ticketing', desc: 'Suivez vos demandes',    color: '#F59E0B', border: '#FCD34D', text: '#92400E' },
    { label: 'Visa',      desc: 'Gestion des visas',      color: '#6366F1', border: '#A5B4FC', text: '#3730A3' },
    { label: 'Assurance', desc: 'Contrats et garanties',  color: '#10B981', border: '#6EE7B7', text: '#065F46' },
  ];

  return (
    <div className="space-y-4">
      {/* Liste couleurs */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 mb-3">Couleurs utilisées dans votre HomePage</p>
        <div className="divide-y divide-slate-50">
          {CURRENT_COLORS.map((c) => (
            <div key={c.name} className="flex items-center gap-3 py-2">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ background: c.bg, border: `2px solid ${c.border}` }}
              />
              <span className="text-[13px] text-slate-700 flex-1">{c.name}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ background: c.bg + '20', color: c.text, borderColor: c.border }}
              >
                {c.usage}
              </span>
              <button
                onClick={() => onCopy(c.bg)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                {c.bg}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Aperçu modules */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 mb-3">Aperçu carte module (style actuel)</p>
        <div className="flex flex-wrap gap-2">
          {previewCards.map((card) => (
            <MiniModuleCard key={card.label} card={card} darkBg={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Palettes ──────────────────────────────────────────────────────────
function TabPalettes({ onCopy }: { onCopy: (hex: string) => void }) {
  const [selected, setSelected] = useState(0);
  const p = PALETTES[selected];
  const isDark = p.bg === '#1E293B';

  const previewCards: ModuleCard[] = p.colors.slice(0, 4).map((col, i) => ({
    label: ['Dossier', 'Ticketing', 'Hôtel', 'Visa'][i],
    desc:  ['Fichiers partagés', 'Suivi tickets', 'Réservations', 'Gestion visas'][i],
    color: col,
    border: col + 'AA',
    text: p.headerBg,
  }));

  return (
    <div className="space-y-4">
      {/* Grille palettes */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 mb-3">Cliquez sur une palette pour prévisualiser</p>
        <div className="space-y-3">
          {PALETTES.map((pal, i) => (
            <div
              key={pal.name}
              onClick={() => setSelected(i)}
              className="rounded-xl p-3 cursor-pointer transition-all"
              style={{
                border: i === selected ? '1.5px solid #1E293B' : '0.5px solid #E2E8F0',
              }}
            >
              <p className="text-[14px] font-medium text-slate-800">{pal.name}</p>
              <p className="text-[11px] text-slate-400 mb-2">{pal.desc}</p>
              <div className="flex gap-1">
                {pal.colors.map((col) => (
                  <div
                    key={col}
                    className="flex-1 h-8 rounded cursor-pointer hover:scale-y-110 transition-transform"
                    style={{ background: col }}
                    onClick={(e) => { e.stopPropagation(); onCopy(col); }}
                    title={col}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aperçu palette sélectionnée */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 mb-3">Aperçu module avec palette sélectionnée</p>
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <div
            className="px-4 py-2 text-[13px] font-medium"
            style={{ background: p.headerBg, color: p.headerText }}
          >
            {p.name} — aperçu modules
          </div>
          <div className="p-3 flex flex-wrap gap-2" style={{ background: p.bg }}>
            {previewCards.map((card) => (
              <MiniModuleCard key={card.label} card={card} darkBg={isDark} />
            ))}
          </div>
          <div className="px-3 pb-3 flex gap-2 flex-wrap" style={{ background: p.bg }}>
            {p.colors.map((col) => (
              <div
                key={col}
                onClick={() => onCopy(col)}
                className="w-6 h-6 rounded-full cursor-pointer border"
                style={{ background: col, borderColor: col + '99' }}
                title={col}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Thèmes ────────────────────────────────────────────────────────────
function TabThemes({ onCopy }: { onCopy: (hex: string) => void }) {
  return (
    <div className="space-y-4">
      {THEMES.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-[14px] font-medium text-slate-800 mb-1">{t.label}</p>
          <p className="text-[11px] text-slate-400 mb-3">{t.desc}</p>
          <div className="rounded-xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{ background: t.headerBg }}
            >
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: t.headerText + '22', color: t.headerText }}
              >
                {t.id}
              </span>
              <span className="text-[13px] font-medium" style={{ color: t.headerText }}>
                {t.label}
              </span>
            </div>
            {/* Cards */}
            <div className="p-3 flex flex-wrap gap-2" style={{ background: t.cardBg }}>
              {t.modules.map((mod, idx) => {
                const cols = [t.accent1, t.accent2, t.accent3, t.accent1];
                return (
                  <div
                    key={mod}
                    className="rounded-lg px-3 py-2 min-w-[100px]"
                    style={{
                      background: t.cardBg,
                      border: `${t.cardBorderW} solid ${cols[idx]}`,
                    }}
                  >
                    <p className="text-[13px] font-medium" style={{ color: t.textPrimary }}>{mod}</p>
                    <p className="text-[11px]" style={{ color: t.textSec }}>Module actif</p>
                  </div>
                );
              })}
            </div>
            {/* Footer couleurs */}
            <div
              className="px-3 py-2 flex items-center gap-2 border-t"
              style={{ background: t.cardBg, borderColor: t.cardBorder }}
            >
              {[t.accent1, t.accent2, t.accent3].map((col) => (
                <div
                  key={col}
                  onClick={() => onCopy(col)}
                  className="w-4 h-4 rounded-full cursor-pointer border"
                  style={{ background: col, borderColor: col }}
                  title={col}
                />
              ))}
              <span className="text-[11px]" style={{ color: t.textSec }}>
                Cliquez pour copier
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Contraste ─────────────────────────────────────────────────────────
function TabContrast() {
  const [brightness, setBrightness] = useState(100);

  const swatches = [
    { bg: '#3B82F6', tc: '#FFFFFF', label: 'Blue'   },
    { bg: '#F59E0B', tc: '#7C2D12', label: 'Amber'  },
    { bg: '#10B981', tc: '#FFFFFF', label: 'Green'  },
    { bg: '#6366F1', tc: '#FFFFFF', label: 'Indigo' },
    { bg: '#F43F5E', tc: '#FFFFFF', label: 'Rose'   },
    { bg: '#8B5CF6', tc: '#FFFFFF', label: 'Violet' },
    { bg: '#D1D5DB', tc: '#374151', label: 'Gray'   },
    { bg: '#06B6D4', tc: '#FFFFFF', label: 'Cyan'   },
  ];

  return (
    <div className="space-y-4">
      {/* Simulateur luminosité */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 mb-3">
          Test visibilité — simulez un écran basse qualité
        </p>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-[12px] text-slate-500 w-28 flex-shrink-0">Luminosité écran</label>
          <input
            type="range"
            min={30}
            max={100}
            step={1}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-[13px] font-medium text-slate-700 w-10 text-right">
            {brightness}%
          </span>
        </div>
        {/* Aperçu filtré */}
        <div
          className="rounded-xl overflow-hidden border border-slate-100"
          style={{ filter: `brightness(${brightness / 100})` }}
        >
          <div className="px-4 py-2 bg-blue-700">
            <span className="text-white text-[13px] font-medium">
              En-tête (bleu #1D4ED8 / blanc)
            </span>
          </div>
          <div className="p-3 flex flex-wrap gap-2 bg-white">
            {swatches.map((s) => (
              <div
                key={s.label}
                className="rounded-lg px-3 py-1.5 border-2"
                style={{ background: s.bg, borderColor: s.bg + 'DD' }}
              >
                <p className="text-[12px] font-medium" style={{ color: s.tc }}>{s.label}</p>
                <p className="text-[10px]" style={{ color: s.tc + '88' }}>{s.bg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scores contraste */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 mb-3">Score de visibilité des couleurs actuelles</p>
        <div className="space-y-3">
          {CONTRAST_DATA.map((c) => {
            const ok     = c.ratio >= 4.5;
            const medium = c.ratio >= 3.0 && c.ratio < 4.5;
            const color  = ok ? '#16A34A' : medium ? '#D97706' : '#DC2626';
            const label  = ok ? 'Bon (AA)' : medium ? 'Moyen' : 'Insuffisant';
            const pct    = Math.min(100, Math.round((c.ratio / 7) * 100));
            return (
              <div key={c.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-slate-700">{c.name}</span>
                  <span className="text-[11px] font-medium" style={{ color }}>
                    {label} ({c.ratio}:1)
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.usage}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
type TabId = 'current' | 'palettes' | 'themes' | 'contrast';

const TABS: { id: TabId; label: string }[] = [
  { id: 'current',  label: 'Couleurs actuelles' },
  { id: 'palettes', label: 'Palettes à tester'  },
  { id: 'themes',   label: 'Thèmes écran'       },
  { id: 'contrast', label: 'Test contraste'     },
];

export default function ColorSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('current');
  const [copied, setCopied]       = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    // Mesure initiale
    setHeaderHeight(header.offsetHeight);

    // S'adapte si la fenêtre est redimensionnée
    const observer = new ResizeObserver(() => setHeaderHeight(header.offsetHeight));
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const handleCopy = (hex: string) => copyToClipboard(hex, setCopied);

  return (
    <div className="min-h-screen  bg-slate-50">

      {/* Toast */}
      {copied && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-50 text-green-700 text-[11px] px-3 py-1.5 rounded-lg border border-green-200 shadow-sm pointer-events-none">
          Copié : {copied}
        </div>
      )}

      {/* Header fixe — hauteur auto selon contenu */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-8 py-4 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">
              Gestion des couleurs
            </h1>
            <p className="text-xs text-slate-400">
              Testez et comparez les palettes sur tous vos types d'écrans.
            </p>
          </div>
        </div>
      </header>

      {/* Corps — padding-top égal à la hauteur mesurée du header */}
      <div style={{ paddingTop: headerHeight }}>
        <div className="max-w-3xl mx-auto px-4 py-10">

          <div className="flex gap-2 flex-wrap mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-1.5 rounded-full text-[12px] border transition-all
                  ${activeTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'current'  && <TabCurrent  onCopy={handleCopy} />}
          {activeTab === 'palettes' && <TabPalettes onCopy={handleCopy} />}
          {activeTab === 'themes'   && <TabThemes   onCopy={handleCopy} />}
          {activeTab === 'contrast' && <TabContrast />}

        </div>
      </div>

    </div>
  );
}