import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDemandeClient } from '../../../../../app/front_office/parametre_specification/demandeClientSlice';
import FormulaireDemandeClientFormulaire from './FormulaireDemandeClient';
import FormulaireDemandeClientDropdown from './FormulaireDemandeClientDropdown';
import { Plus, FileText, Info, CheckCircle, Sun, Shield, BookOpen } from 'lucide-react';

// ─── Composant sidebar card ───────────────────────────────────────────────────

interface SidebarCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}

const SidebarCard = ({ icon, iconBg, title, children }: SidebarCardProps) => (
  <div className="bg-white border border-neutral-200 rounded-xl p-4">
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center mb-2"
      style={{ background: iconBg }}
    >
      {icon}
    </div>
    <h4 className="text-xs font-medium text-neutral-800 mb-2">{title}</h4>
    <div className="border-t border-neutral-100 pt-2 space-y-1">
      {children}
    </div>
  </div>
);

// ─── Étape numérotée ─────────────────────────────────────────────────────────

const Step = ({ num, children }: { num: number; children: React.ReactNode }) => (
  <div className="flex items-start gap-2 text-xs text-neutral-500 leading-relaxed">
    <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
      {num}
    </span>
    <span>{children}</span>
  </div>
);

// ─── Point indicateur ─────────────────────────────────────────────────────────

const Dot = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 text-xs text-neutral-500 leading-relaxed">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
    <span>{children}</span>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

const SpecificationClientForClient = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { groupesParPrestation = {}, loading, error } = useSelector(
    (state: RootState) => state.demandeClient
  );
  const groupes = groupesParPrestation?.[id ?? ''] ?? [];

  const [activeTab, setActiveTab] = useState<number>(1);

  useEffect(() => {
    if (id) dispatch(fetchDemandeClient(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (groupes.length > 0) {
      setActiveTab(groupes[0].numero);
    }
  }, [groupes.length]);

  const nextNumero =
    groupes.length > 0 ? Math.max(...groupes.map((g) => g.numero)) + 1 : 1;

  const allTabs = [...groupes.map((g) => g.numero), nextNumero];
  const activeGroupe = groupes.find((g) => g.numero === activeTab);
  const isNewTab = activeTab === nextNumero;

  // Progression : nombre de champs remplis / total (exemple basé sur items)
  const totalItems = activeGroupe?.items.length ?? 0;
  const filledItems = activeGroupe?.items.filter((i) => i.valeur).length ?? 0;
  const progressPct = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  // ── Écran de chargement ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Écran d'erreur ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 overflow-y-auto">
      <div className="w-full mx-auto flex gap-5 p-8">

        {/* ── Sidebar gauche ── */}
        <aside className="w-64 shrink-0 flex flex-col gap-3 pt-[84px]">

          <SidebarCard
            icon={<Info className="w-3.5 h-3.5 text-blue-600" />}
            iconBg="#EFF6FF"
            title="Comment remplir ?"
          >
            <Step num={1}>Lisez attentivement chaque intitulé de champ</Step>
            <Step num={2}>Remplissez avec des informations précises</Step>
            <Step num={3}>Vérifiez puis cliquez sur <span className="font-medium text-neutral-700">Soumettre</span></Step>
          </SidebarCard>

          <SidebarCard
            icon={<CheckCircle className="w-3.5 h-3.5 text-green-600" />}
            iconBg="#F0FDF4"
            title="Avancement"
          >
            {isNewTab ? (
              <p className="text-xs text-neutral-400">Aucune demande en cours</p>
            ) : (
              <>
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>{filledItems} / {totalItems} champs</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </>
            )}
          </SidebarCard>

          <SidebarCard
            icon={<Sun className="w-3.5 h-3.5 text-amber-600" />}
            iconBg="#FFFBEB"
            title="Besoin d'aide ?"
          >
            <p className="text-xs text-neutral-500 leading-relaxed">
              Contactez votre prestataire si un champ n'est pas clair ou si vous avez des questions.
            </p>
          </SidebarCard>

        </aside>

        {/* ── Contenu principal ── */}
        <main className="flex-1 min-w-0">

          {/* Header client */}
          <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 mb-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 mb-0.5 uppercase tracking-wide">
                Fiche de spécification
              </p>
              <h1 className="text-lg font-medium text-neutral-900">
                Remplissez votre demande
              </h1>
            </div>
            {!isNewTab && (
              <span className="ml-auto text-[11px] font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                En cours
              </span>
            )}
          </div>

          {/* Onglets */}
          <div className="flex items-end gap-1 border-b border-neutral-200 mb-0">
            {allTabs.map((num) => {
              const isNew = num === nextNumero;
              const isActive = activeTab === num;
              return (
                <button
                  key={num}
                  onClick={() => setActiveTab(num)}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-t-lg transition-all border-t border-l border-r ${
                    isActive
                      ? 'bg-white text-neutral-900 border-neutral-200 shadow-sm'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {isNew && <Plus className="w-3.5 h-3.5" />}
                  {isNew ? 'Nouvelle demande' : `Demande #${num}`}
                </button>
              );
            })}
          </div>

          {/* Contenu de l'onglet */}
          <div className="bg-white border border-neutral-200 rounded-b-xl rounded-tr-xl p-6 space-y-4">

            {/* Liste des items existants */}
            {!isNewTab && activeGroupe && (
              <div className="border border-neutral-100 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Éléments enregistrés — Demande #{activeGroupe.numero}
                  </p>
                </div>
                <div className="divide-y divide-neutral-50">
                  {activeGroupe.items.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between gap-6 hover:bg-neutral-50 transition-colors"
                    >
                      <p className="text-xs font-medium text-neutral-600">
                        {item.demandeClientAttribut.nom}
                      </p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 text-white shrink-0">
                        {item.valeur}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire conditionnel */}
            {isNewTab ? (
              <FormulaireDemandeClientFormulaire
                prestationId={id ?? ''}
                numero={activeTab}
                onSuccess={() => {
                  dispatch(fetchDemandeClient(id ?? '')).then(() => {
                    setActiveTab(activeTab);
                  });
                }}
              />
            ) : (
              <FormulaireDemandeClientDropdown
                prestationId={id ?? ''}
                numero={activeTab}
                onSuccess={() => {
                  dispatch(fetchDemandeClient(id ?? ''));
                }}
              />
            )}
          </div>
        </main>

        {/* ── Sidebar droite ── */}
        <aside className="w-64 shrink-0 flex flex-col gap-3 pt-[84px]">

          <SidebarCard
            icon={<BookOpen className="w-3.5 h-3.5 text-pink-600" />}
            iconBg="#FDF2F8"
            title="Conseils de saisie"
          >
            <Dot>Soyez le plus précis possible dans vos réponses</Dot>
            <Dot>Indiquez des contraintes si vous en avez</Dot>
            <Dot>Mentionnez vos délais impératifs</Dot>
            <Dot>Utilisez des exemples concrets si possible</Dot>
          </SidebarCard>

          <SidebarCard
            icon={<Shield className="w-3.5 h-3.5 text-green-600" />}
            iconBg="#F0FDF4"
            title="Confidentialité"
          >
            <p className="text-xs text-neutral-500 leading-relaxed">
              Vos données sont transmises uniquement à votre prestataire, en toute sécurité.
            </p>
          </SidebarCard>

          <SidebarCard
            icon={<FileText className="w-3.5 h-3.5 text-neutral-500" />}
            iconBg="#F5F5F4"
            title="Vos demandes"
          >
            {groupes.length === 0 ? (
              <p className="text-xs text-neutral-400">Aucune demande soumise pour l'instant.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    {groupes.length} complété{groupes.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    1 en cours
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Retrouvez vos demandes dans les onglets ci-dessus.
                </p>
              </>
            )}
          </SidebarCard>

        </aside>

      </div>
    </div>
  );
};

export default SpecificationClientForClient;