import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiSearch, FiType, FiLayout, FiSliders,
  FiMoon, FiBell, FiGlobe, FiEye, FiToggleLeft, FiToggleRight,
} from 'react-icons/fi';

// ── Types ──────────────────────────────────────────────────────────────────

type SettingType = 'toggle' | 'select' | 'range' | 'color';

interface SettingItem {
  id: string;
  label: string;
  desc: string;
  type: SettingType;
  value: any;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  unit?: string;
}

interface SettingGroup {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  settings: SettingItem[];
}

// ── Données statiques ──────────────────────────────────────────────────────

const INITIAL_GROUPS: SettingGroup[] = [
  {
    key: 'typography',
    label: 'Typographie',
    desc: 'Tailles et styles des textes dans l\'application.',
    icon: FiType,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    settings: [
      { id: 'font_titre1',  label: 'Titre 1',      desc: 'Taille des titres principaux (H1)',         type: 'range',  value: 32, min: 24, max: 48, unit: 'px' },
      { id: 'font_titre2',  label: 'Titre 2',      desc: 'Taille des titres de section (H2)',         type: 'range',  value: 24, min: 18, max: 36, unit: 'px' },
      { id: 'font_titre3',  label: 'Titre 3',      desc: 'Taille des sous-titres (H3)',               type: 'range',  value: 18, min: 14, max: 28, unit: 'px' },
      { id: 'font_body',    label: 'Description',  desc: 'Taille du texte courant et descriptions',  type: 'range',  value: 14, min: 12, max: 18, unit: 'px' },
      { id: 'font_family',  label: 'Police',       desc: 'Police de caractères globale',             type: 'select', value: 'inter',
        options: [
          { label: 'Inter',       value: 'inter'      },
          { label: 'Roboto',      value: 'roboto'     },
          { label: 'Poppins',     value: 'poppins'    },
          { label: 'DM Sans',     value: 'dm_sans'    },
          { label: 'Nunito',      value: 'nunito'     },
        ]
      },
    ],
  },
  {
    key: 'layout',
    label: 'Mise en page',
    desc: 'Comportement de la navigation et de la structure de l\'interface.',
    icon: FiLayout,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    settings: [
      { id: 'sidebar_default', label: 'Sidebar étendue par défaut',  desc: 'Ouvre la barre latérale en mode agrandi au démarrage',    type: 'toggle', value: true  },
      { id: 'sidebar_hover',   label: 'Expansion au survol',         desc: 'Étend automatiquement la sidebar quand la souris passe dessus', type: 'toggle', value: false },
      { id: 'sticky_header',   label: 'En-tête fixe',                desc: 'Maintient l\'en-tête visible lors du défilement',         type: 'toggle', value: true  },
      { id: 'content_width',   label: 'Largeur du contenu',          desc: 'Largeur maximale de la zone de contenu principal',        type: 'select', value: '1400px',
        options: [
          { label: 'Compact (1200px)',  value: '1200px' },
          { label: 'Normal (1400px)',   value: '1400px' },
          { label: 'Large (1600px)',    value: '1600px' },
          { label: 'Plein écran',       value: '100%'   },
        ]
      },
      { id: 'density',         label: 'Densité d\'affichage',        desc: 'Espacement général entre les éléments de l\'interface',   type: 'select', value: 'normal',
        options: [
          { label: 'Compact',  value: 'compact' },
          { label: 'Normal',   value: 'normal'  },
          { label: 'Aéré',     value: 'spacious'},
        ]
      },
    ],
  },
  {
    key: 'appearance',
    label: 'Apparence',
    desc: 'Thème, couleurs et préférences visuelles.',
    icon: FiEye,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    settings: [
      { id: 'theme',          label: 'Thème',                desc: 'Apparence générale de l\'interface',              type: 'select', value: 'light',
        options: [
          { label: 'Clair',      value: 'light'  },
          { label: 'Sombre',     value: 'dark'   },
          { label: 'Automatique (système)', value: 'auto' },
        ]
      },
      { id: 'primary_color',  label: 'Couleur principale',   desc: 'Couleur d\'accentuation principale',              type: 'color',  value: '#6366f1' },
      { id: 'border_radius',  label: 'Arrondi des coins',    desc: 'Rayon de bordure des cartes et boutons',          type: 'range',  value: 12, min: 0, max: 24, unit: 'px' },
      { id: 'animations',     label: 'Animations',           desc: 'Active les transitions et animations de l\'UI',   type: 'toggle', value: true  },
      { id: 'compact_cards',  label: 'Cartes compactes',     desc: 'Réduit le padding interne des cartes',            type: 'toggle', value: false },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    desc: 'Contrôle des alertes et messages système.',
    icon: FiBell,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    settings: [
      { id: 'notif_success',  label: 'Notifications de succès',   desc: 'Affiche un toast lors d\'une action réussie',        type: 'toggle', value: true  },
      { id: 'notif_error',    label: 'Notifications d\'erreur',   desc: 'Affiche une alerte en cas d\'erreur',                type: 'toggle', value: true  },
      { id: 'notif_duration', label: 'Durée d\'affichage',        desc: 'Temps d\'affichage des notifications (en secondes)', type: 'range',  value: 4, min: 2, max: 10, unit: 's' },
      { id: 'notif_position', label: 'Position',                  desc: 'Emplacement des notifications à l\'écran',           type: 'select', value: 'top-right',
        options: [
          { label: 'Haut droite',   value: 'top-right'    },
          { label: 'Haut gauche',   value: 'top-left'     },
          { label: 'Bas droite',    value: 'bottom-right' },
          { label: 'Bas gauche',    value: 'bottom-left'  },
          { label: 'Centré haut',   value: 'top-center'   },
        ]
      },
    ],
  },
  {
    key: 'regional',
    label: 'Régional & Langue',
    desc: 'Langue, fuseau horaire et format des données.',
    icon: FiGlobe,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    settings: [
      { id: 'language',    label: 'Langue',           desc: 'Langue de l\'interface utilisateur',           type: 'select', value: 'fr',
        options: [
          { label: 'Français',  value: 'fr' },
          { label: 'Anglais',   value: 'en' },
          { label: 'Malgache',  value: 'mg' },
        ]
      },
      { id: 'timezone',    label: 'Fuseau horaire',   desc: 'Fuseau horaire utilisé pour les dates',        type: 'select', value: 'Indian/Antananarivo',
        options: [
          { label: 'Antananarivo (UTC+3)', value: 'Indian/Antananarivo' },
          { label: 'Paris (UTC+1/+2)',     value: 'Europe/Paris'        },
          { label: 'UTC',                  value: 'UTC'                 },
        ]
      },
      { id: 'date_format', label: 'Format de date',   desc: 'Affichage des dates dans l\'application',     type: 'select', value: 'dd/MM/yyyy',
        options: [
          { label: 'JJ/MM/AAAA', value: 'dd/MM/yyyy' },
          { label: 'MM/JJ/AAAA', value: 'MM/dd/yyyy' },
          { label: 'AAAA-MM-JJ', value: 'yyyy-MM-dd' },
        ]
      },
      { id: 'currency',    label: 'Devise',           desc: 'Devise affichée dans les montants',            type: 'select', value: 'MGA',
        options: [
          { label: 'Ariary (MGA)', value: 'MGA' },
          { label: 'Euro (EUR)',   value: 'EUR' },
          { label: 'Dollar (USD)', value: 'USD' },
        ]
      },
    ],
  },
  {
    key: 'advanced',
    label: 'Avancé',
    desc: 'Options techniques et comportements système.',
    icon: FiSliders,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    settings: [
      { id: 'debug_mode',      label: 'Mode débogage',          desc: 'Affiche des informations techniques dans la console',   type: 'toggle', value: false },
      { id: 'cache_duration',  label: 'Durée du cache',         desc: 'Durée de conservation des données en cache (minutes)', type: 'range',  value: 30, min: 5, max: 120, unit: 'min' },
      { id: 'pagination_size', label: 'Taille de pagination',   desc: 'Nombre d\'éléments par page dans les listes',           type: 'select', value: '25',
        options: [
          { label: '10 éléments',  value: '10'  },
          { label: '25 éléments',  value: '25'  },
          { label: '50 éléments',  value: '50'  },
          { label: '100 éléments', value: '100' },
        ]
      },
      { id: 'auto_save',       label: 'Sauvegarde automatique', desc: 'Enregistre automatiquement les formulaires en cours',   type: 'toggle', value: true  },
      { id: 'session_timeout', label: 'Expiration de session',  desc: 'Déconnexion automatique après inactivité (minutes)',    type: 'range',  value: 60, min: 15, max: 480, unit: 'min' },
    ],
  },
];

// ── Composants de contrôle ─────────────────────────────────────────────────

function ToggleControl({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-indigo-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function SelectControl({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition min-w-[160px]"
    >
      {options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function RangeControl({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
      />
      <span className="text-sm font-medium text-indigo-600 min-w-[52px] text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  );
}

function ColorControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
      />
      <span className="text-xs font-mono text-gray-500">{value}</span>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function ParametresPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SettingGroup[]>(INITIAL_GROUPS);
  const [search, setSearch] = useState('');

  const updateValue = (groupKey: string, settingId: string, newValue: any) => {
    setGroups(prev => prev.map(g =>
      g.key !== groupKey ? g : {
        ...g,
        settings: g.settings.map(s => s.id !== settingId ? s : { ...s, value: newValue }),
      }
    ));
  };

  const query = search.toLowerCase().trim();
  const filtered = groups
    .map(g => ({
      ...g,
      settings: query
        ? g.settings.filter(s => s.label.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query))
        : g.settings,
    }))
    .filter(g => g.settings.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Système</p>
              <h1 className="text-base font-semibold text-gray-800 mt-0.5">Paramètres</h1>
            </div>
          </div>
          <div className="flex-1 max-w-sm mx-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un paramètre..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FiSearch size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun paramètre trouvé pour <strong>"{search}"</strong></p>
          </div>
        )}

        {filtered.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* En-tête de groupe */}
              <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${group.iconBg}`}>
                  <GroupIcon size={15} className={group.iconColor} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">{group.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{group.desc}</p>
                </div>
              </div>

              {/* Lignes de paramètres */}
              <div className="divide-y divide-gray-50">
                {group.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between gap-6 px-6 py-4 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700">{setting.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{setting.desc}</p>
                    </div>

                    <div className="flex-shrink-0">
                      {setting.type === 'toggle' && (
                        <ToggleControl
                          value={setting.value}
                          onChange={(v) => updateValue(group.key, setting.id, v)}
                        />
                      )}
                      {setting.type === 'select' && (
                        <SelectControl
                          value={setting.value}
                          options={setting.options!}
                          onChange={(v) => updateValue(group.key, setting.id, v)}
                        />
                      )}
                      {setting.type === 'range' && (
                        <RangeControl
                          value={setting.value}
                          min={setting.min!}
                          max={setting.max!}
                          unit={setting.unit}
                          onChange={(v) => updateValue(group.key, setting.id, v)}
                        />
                      )}
                      {setting.type === 'color' && (
                        <ColorControl
                          value={setting.value}
                          onChange={(v) => updateValue(group.key, setting.id, v)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}