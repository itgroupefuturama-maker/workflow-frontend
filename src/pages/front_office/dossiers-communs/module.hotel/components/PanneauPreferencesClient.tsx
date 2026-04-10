import { useEffect, useRef, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus } from 'lucide-react'; // Ajout de Plus pour le style si besoin
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchDemandeClient, setActiveTabForPrestation } from '../../../../../app/front_office/parametre_specification/demandeClientSlice';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../../../service/env';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prestationId: string;
};

const PanneauPreferencesClient = ({ isOpen, onClose, prestationId }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { groupesParPrestation = {}, activeTabParPrestation = {}, loading, error } = useSelector(
    (state: RootState) => state.demandeClient
  );

  const url = `${window.location.origin}/formulaire/${prestationId}`;

  const groupes = useMemo(() => groupesParPrestation?.[prestationId] ?? [], [groupesParPrestation, prestationId]);
  const [copied, setCopied] = useState(false);

  // Calcul du numéro pour le nouvel onglet (n+1)
  const nextTabNumber = useMemo(() => {
    if (groupes.length === 0) return 1;
    return Math.max(...groupes.map(g => g.numero)) + 1;
  }, [groupes]);

  const activeTab = activeTabParPrestation[prestationId] ?? 1;
  
  const setActiveTab = (num: number) => {
    dispatch(setActiveTabForPrestation({ prestationId, numero: num }));
  };

  useEffect(() => {
    if (isOpen && prestationId) {
      dispatch(fetchDemandeClient(prestationId));
    }
  }, [isOpen, prestationId]);

  const prevPrestationIdRef = useRef<string>('');

  useEffect(() => {
    if (groupes.length > 0 && prestationId) {
      const isPrestationChange = prevPrestationIdRef.current !== prestationId;
      prevPrestationIdRef.current = prestationId;

      const current = activeTabParPrestation[prestationId];
      const tabExists = groupes.some(g => g.numero === current) || current === nextTabNumber;

      if (!tabExists || (isPrestationChange && current === undefined)) {
        dispatch(setActiveTabForPrestation({ prestationId, numero: groupes[0].numero }));
      }
    }
  }, [groupes, prestationId, activeTabParPrestation, dispatch, nextTabNumber]);

  const activeGroupe = groupes.find(g => g.numero === activeTab);
  const isCreationTab = activeTab === nextTabNumber;

  if (!isOpen) return null;

  return (
    <div className="w-80 xl:w-96 shrink-0 flex flex-col border-l border-neutral-200 bg-white h-full overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-slate-700 shrink-0">
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
            {prestationId.slice(-6).toUpperCase()}
          </p>
          <h2 className="text-xs font-bold text-white">Préférences client</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Onglets ── */}
      <div className="flex items-end gap-1 pt-1 pb-0 overflow-x-auto mb-3 border-b border-neutral-100">
        {groupes.map((groupe) => (
          <button
            key={groupe.numero}
            onClick={() => setActiveTab(groupe.numero)}
            className={`shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-t-md transition-all border-t border-l border-r ${
              activeTab === groupe.numero
                ? 'bg-white text-neutral-900 border-neutral-200 -mb-px'
                : 'bg-transparent text-neutral-500 border-transparent hover:text-neutral-700'
            }`}
          >
            Spec {groupe.numero}
          </button>
        ))}
        
        {/* L'onglet N+1 pour la création */}
        <button
          onClick={() => setActiveTab(nextTabNumber)}
          className={`shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-t-md transition-all border-t border-l border-r ${
            isCreationTab
              ? 'bg-white text-blue-600 border-neutral-200 -mb-px'
              : 'bg-transparent text-blue-500 border-transparent hover:bg-blue-50'
          }`}
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Nouveau
        </button>
      </div>

      {/* ── Contenu scrollable ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-neutral-200 border-t-slate-700 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-[11px] text-red-700">{error}</p>
          </div>
        )}

        {/* Vue de l'onglet de Création (le n+1) */}
        {!loading && isCreationTab && (
          <div className="py-6 px-2">

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 mb-1">Nouvelle spécification</h3>
              <p className="text-xs text-neutral-400 leading-relaxed px-2">
                Configurez une nouvelle fiche de spécification pour ce client.
              </p>
            </div>

            <div className="space-y-2">

              {/* Bouton 1 — Aller à la création */}
              <button
                onClick={() => navigate(`/dossiers-communs/specification-client/${prestationId}`)}
                className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aller à la création
              </button>

              {/* Bouton 2 — Copier le lien avec explication */}
              <div className="border border-neutral-100 rounded-lg mt-5 p-3 bg-neutral-50 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-amber-500" viewBox="0 0 16 16" fill="none">
                      <path d="M10 3H13V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 3L8.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M7 4H4a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-700 leading-tight mb-0.5">
                      Lien à envoyer au client
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Partagez ce lien avec le client afin qu'il puisse ouvrir le formulaire et saisir ses données lui-même.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/formulaire/${prestationId}`;
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className={`w-full px-4 py-2 text-xs font-semibold rounded-lg transition-all border ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {copied ? '✓ Lien copié !' : '⎘ Copier le lien client'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Vue des onglets existants */}
        {!loading && !isCreationTab && activeGroupe && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2 border-b border-neutral-200 pb-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Demande #{activeGroupe.numero}
              </p>
              <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-mono">
                {activeGroupe.items.length} élément(s)
              </span>
            </div>

            {/* Logique de regroupement par nom d'attribut */}
            {Object.entries(
              activeGroupe.items.reduce((acc, item) => {
                const nom = item.demandeClientAttribut.nom;
                if (!acc[nom]) {
                  acc[nom] = [];
                }
                acc[nom].push(item.valeur);
                return acc;
              }, {} as Record<string, string[]>)
            ).map(([nom, valeurs]) => (
              <div key={nom} className="flex items-start justify-between gap-4 py-1.5 border-b border-neutral-50 last:border-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mt-1">
                  {nom}
                </p>
                <div className="flex flex-wrap justify-end gap-1">
                  {valeurs.map((v, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold  ${
                        v.toLowerCase() === 'oui' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : ' text-slate-600'
                      }`}
                    >
                      {v}
                      {/* Petit séparateur visuel si il y a plusieurs valeurs */}
                      {idx < valeurs.length - 1 && <span className="mx-1 opacity-30">/</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message vide si aucun groupe et pas sur l'onglet création */}
        {!loading && !isCreationTab && groupes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
             <p className="text-xs font-medium text-neutral-500">Aucune donnée</p>
             <button 
              onClick={() => setActiveTab(nextTabNumber)}
              className="mt-2 text-[11px] text-blue-600 underline"
             >
               Créer la première spécification
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanneauPreferencesClient;