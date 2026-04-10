import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { User, Phone, FileText, Tag, XCircle, Calendar, Building2, Hash, ChevronDown } from 'lucide-react';

const extractColorFromGradient = (gradient: string): string => {
  const match = gradient.match(/from-(\w+)-/);
  return match?.[1] ?? 'amber';
};

const colorMap: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  amber:  { bg: '#f59e0b', bgLight: '#fef3c7', text: '#d97706', border: '#fde68a' },
  orange: { bg: '#f97316', bgLight: '#ffedd5', text: '#ea580c', border: '#fed7aa' },
  indigo: { bg: '#6366f1', bgLight: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  violet: { bg: '#8b5cf6', bgLight: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  blue:   { bg: '#3b82f6', bgLight: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  green:  { bg: '#22c55e', bgLight: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  rose:   { bg: '#f43f5e', bgLight: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
  sky:    { bg: '#0ea5e9', bgLight: '#f0f9ff', text: '#0284c7', border: '#bae6fd' },
  teal:   { bg: '#14b8a6', bgLight: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
};

interface FieldProps {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
  accent?: boolean;
  accentColor?: { bg: string; bgLight: string; text: string; border: string };
}

const Field = ({ label, value, icon: Icon, accent = false, accentColor }: FieldProps) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
      {Icon && (
        <div
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
            !accent || !accentColor
              ? 'bg-white text-gray-400 shadow-sm border border-gray-100'
              : ''
          }`}
          style={
            accent && accentColor
              ? { backgroundColor: accentColor.bgLight, color: accentColor.text }
              : undefined
          }
        >
          <Icon size={13} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
};

interface DossierActifCardProps {
  gradient?: string;
}

interface DossierActifCardProps {
  gradient?: string;
}

export default function DossierActifCard({
  gradient = 'from-amber-400 via-orange-400 to-amber-500',
}: DossierActifCardProps) {
  const dossierActif = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId
  );

  // ── État collapse ────────────────────────────────────────────────
  // 1. useState avec lecture initiale depuis localStorage
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('dossierActifCard_isOpen');
    return saved !== null ? saved === 'true' : true;
  });

  // 2. Handler qui sauvegarde à chaque clic
  const handleToggle = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem('dossierActifCard_isOpen', String(next));
      return next;
    });
  };

  if (!dossierActif) return null;

  const isAnnule = !!dossierActif.raisonAnnulation;
  const colorKey = extractColorFromGradient(gradient);
  const color    = colorMap[colorKey] ?? colorMap['amber'];

  return (
    <div className="bg-white z-20 rounded-lg border border-slate-200 overflow-hidden mb-2" >

      {/* ── Hero header ──────────────────────────────────────────── */}
      <div className="relative bg-white px-2 py-2 overflow-hidden " onClick={handleToggle}>

        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 bg-linear-to-r ${gradient}`} />
        <div className={`absolute -bottom-6 -right-12 w-32 h-32 rounded-full opacity-10 bg-linear-to-r ${gradient}`} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: color.bgLight, borderColor: color.border, color: color.text }}
            >
              <FileText size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-[12px] font-semibold mb-0.5">Dossier Commun</p>
              <p className="text-gray-900 text-2xl font-black tracking-tight leading-none">
                {dossierActif.numero}
              </p>
            </div>
          </div>

          {/* Badge + bouton collapse */}
          <div className="flex items-center gap-2">
            {isAnnule ? (
              <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-full">
                <XCircle size={12} /> Annulé
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: color.bgLight, borderColor: color.border, color: color.text }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: color.bg }}
                />
                Actif
              </span>
            )}

            {/* ── Bouton collapse ── */}
            <button
              
              className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              title={isOpen ? 'Réduire' : 'Agrandir'}
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-250 ${isOpen ? '' : '-rotate-90'}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenu collapsible ───────────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Description */}
        {dossierActif.description && (
          <div
            className="px-6 py-3 border-b"
            style={{ backgroundColor: color.bgLight + '80', borderColor: color.border + '99' }}
          >
            <p className="text-xs font-medium italic leading-relaxed" style={{ color: color.text + 'cc' }}>
              {dossierActif.description}
            </p>
          </div>
        )}

        {/* Grille d'infos */}
        <div className="p-5">
          {isAnnule && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <XCircle size={15} className="text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-400 mb-0.5">Raison d'annulation</p>
                <p className="text-sm font-semibold text-red-700">{dossierActif.raisonAnnulation}</p>
                {dossierActif.dateAnnulation && (
                  <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                    <Calendar size={10} /> {dossierActif.dateAnnulation}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            <Field label="Contact principal"   value={dossierActif.contactPrincipal}       icon={User}      accent accentColor={color} />
            <Field label="WhatsApp"            value={dossierActif.whatsapp}               icon={Phone}     accent accentColor={color} />
            <Field label="Client facturé"      value={dossierActif.clientfacture?.libelle} icon={Building2} />
            <Field label="Code client"         value={dossierActif.clientfacture?.code}    icon={Hash}      />
            <Field label="Réf. Travel Planner" value={dossierActif.referenceTravelPlaner}  icon={Tag}       />
            <Field label="N° dossier"          value={dossierActif.numero?.toString()}     icon={FileText}  />
          </div>
        </div>
      </div>
    </div>
  );
}