import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDemandeClient } from '../../../../../app/front_office/parametre_specification/demandeClientSlice';
import FormulaireDemandeClientFormulaire from './FormulaireDemandeClient';
import { Plus } from 'lucide-react';
import { FiArrowLeft } from 'react-icons/fi';
import FormulaireDemandeClientDropdown from './FormulaireDemandeClientDropdown';

const SpecificationClient = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { groupesParPrestation = {}, loading, error } = useSelector(
    (state: RootState) => state.demandeClient
  );
  const groupes = groupesParPrestation?.[id] ?? [];

  const [activeTab, setActiveTab] = useState<number>(1);

  useEffect(() => {
    if (id) dispatch(fetchDemandeClient(id));
  }, [dispatch, id]);

  // Synchronise l'onglet actif au premier chargement
  useEffect(() => {
    if (groupes.length > 0) {
      setActiveTab(groupes[0].numero);
    }
  }, [groupes.length]);

  const nextNumero = groupes.length > 0
    ? Math.max(...groupes.map(g => g.numero)) + 1
    : 1;

  // Tous les onglets = groupes existants + un onglet "nouveau"
  const allTabs = [
    ...groupes.map(g => g.numero),
    nextNumero,
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const activeGroupe = groupes.find(g => g.numero === activeTab);
  const isNewTab = activeTab === nextNumero;

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group">
                <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Retour</span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-2xl font-bold text-neutral-900">Spécifications client</h1>
        </div>

        {/* ── Barre d'onglets ── */}
        <div className="flex items-end gap-1 border-b border-neutral-200">
            {allTabs.map((num) => {
                const isNew = num === nextNumero;
                const isActive = activeTab === num;
                return (
                    <button
                        key={num}
                        onClick={() => setActiveTab(num)}
                        className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-t-lg transition-all border-t border-l border-r ${
                            isActive
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        {isNew && <Plus className="w-3.5 h-3.5" />}
                        {isNew ? "Nouvelle Demande" : `Demande #${num}`}
                    </button>
                );
            })}
        </div>

        {/* ── Contenu ── */}
        <div className="pt-2 space-y-4">

            {/* 1. Liste des items existants (uniquement sur les anciens onglets) */}
            {!isNewTab && activeGroupe && (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                            Éléments enregistrés — Demande #{activeGroupe.numero}
                        </p>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {activeGroupe.items.map((item) => (
                            <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">
                                        {item.demandeClientAttribut.nom}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white shrink-0">
                                    {item.valeur}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Logique de Formulaire conditionnelle */}
            {isNewTab ? (
                // SI c'est le dernier onglet (n+1) -> On utilise le GRAND formulaire (tableau)
                <FormulaireDemandeClientFormulaire
                    prestationId={id ?? ''}
                    numero={activeTab}
                    onSuccess={() => {
                        dispatch(fetchDemandeClient(id ?? '')).then(() => {
                            // On peut rester sur l'onglet actuel ou basculer
                            setActiveTab(activeTab);
                        });
                    }}
                />
            ) : (
                // SINON (onglets existants) -> On utilise le DROPDOWN en bas de liste
                <FormulaireDemandeClientDropdown
                    prestationId={id ?? ''}
                    numero={activeTab}
                    onSuccess={() => {
                        dispatch(fetchDemandeClient(id ?? ''));
                    }}
                />
            )}
        </div>
    </div>
  );
};

export default SpecificationClient;