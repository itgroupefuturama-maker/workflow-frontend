import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiCheckSquare, FiX, FiFileText, FiLayout } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchProspectionLignes, createProspectionLigne, type CreateProspectionLignePayload, type ModePaiement } from '../../../../../app/front_office/prospectionsLignesSlice';
import { fetchDestinations } from '../../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';
import TabContainer from '../../../../../layouts/TabContainer';
// import { TicketingHeader } from '../../../../../components/TicketingBreadcrumb';
import NewLineRow from './NewLigneProspection';
import AddProspectionLigneModal from './AddProspectionLigneModal';
import ProspectionModals from '../../../../../components/modals/ProspectionModals';
import { createProspectionEntete, updateProspectionEntete, type ProspectionEntete } from '../../../../../app/front_office/prospectionsEntetesSlice';
import { TicketingHeader } from '../ticketing.sous.module/components.billet/TicketingHeader';
import { prospectionDetailItems } from '../ticketing.sous.module/components.billet/utils/ticketingHeaderItems';
import axios from '../../../../../service/Axios';
import { createPortal } from 'react-dom';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import { ChevronDown } from 'lucide-react';

export default function ProspectionDetail() {
  const { enteteId } = useParams<{ enteteId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  const prestationId = useMemo(() => 
    dossierActif?.dossierCommunColab
      ?.find((colab) => colab.module?.nom?.toLowerCase() === 'ticketing')
      ?.prestation?.[0]?.id || '',
    [dossierActif]
  );

  const entete = useSelector((state: RootState) =>
      state.prospectionsEntetes.items.find(e => e.id === enteteId)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête prospection' },
    { id: 'billet', label: 'Listes des billets' }
  ];

  const [activeTab, setActiveTab] = useState('prospection');

  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  const [showPenalite, setShowPenalite] = useState(false);

  const { items: destinations, loading: loadingDest } = useSelector((state: RootState) => state.destination);
  const { items: pays, loading: loadingPays } = useSelector((state: RootState) => state.pays);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLigneIds, setSelectedLigneIds] = useState<string[]>([]);

  const {
      items: lignes,
      loading: loadingLignes,
      error: errorLignes,
  } = useSelector((state: RootState) => state.prospectionsLignes);

  const {
    items: servicesDisponibles,
    loading: loadingServices,
    error: errorServices,
  } = useSelector((state: RootState) => state.serviceSpecifique);

  const { data: fournisseurs, loading: fournisseursLoading } = useSelector(
    (state: RootState) => state.fournisseurs
  );

  const loading = loadingLignes || loadingServices || loadingDest || loadingPays;

  const [newLine, setNewLine] = useState<any>(null);

  const [collapsedGroups, setCollapsedGroups] = useState({
    infosVol: false,
    tarifsCieDevise: false,
    tarifsCieAriary: false,   // replié par défaut
    tarifsClientDevise: false,
    tarifsClientAriary: false, // replié par défaut
    commissions: false,
    services: true,
  });

  const toggleGroup = (group: keyof typeof collapsedGroups) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };


  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestionAnchor, setSuggestionAnchor] = useState<DOMRect | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (enteteId) {
      dispatch(fetchProspectionLignes(enteteId));
    }
    if (destinations.length === 0) {
      dispatch(fetchDestinations());
    }
    if (pays.length === 0) {
      dispatch(fetchPays());
    }
  }, [enteteId, dispatch]);

  // FONCTION DE NAVIGATION INTERCEPTÉE
  const handleTabChange = (id: string) => {
    if (id === 'billet') {
      // On remonte au parent (PageView) en passant le state pour l'onglet
      navigate(`/dossiers-communs/ticketing/pages`, { 
        state: { targetTab: 'billet' }
      });
    } else {
      setActiveTab(id);
    }
  };

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

  const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEntete, setNewEntete] = useState({
    fournisseurId: '',
    credit: 'CREDIT_15',     // valeur par défaut
    typeVol: 'LONG_COURRIER', // valeur par défaut
  });

  const [isCreating, setIsCreating] = useState(false);
  const [modalCommission, setModalCommission] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntete, setSelectedEntete] = useState<ProspectionEntete | null>(null);

  const openEditModal = (entete: ProspectionEntete) => {
    setSelectedEntete(entete);
    setModalCommission(entete.commissionAppliquer);
  };

  const closeModal = () => {
    setSelectedEntete(null);
    setModalCommission(0);
    setIsSaving(false);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setIsCreating(false);
  };

  const buildPayload = (formData: any): Omit<CreateProspectionLignePayload, 'prospectionEnteteId'> => {
    const taux   = Number(formData.tauxEchange) || 4900;
    const nombre = Number(formData.nombre) || 1;
    const commissionPct = Number(entete?.commissionAppliquer) || 0;

    // ── PU Compagnie Devise (saisis par l'utilisateur) ──────────────
    const puBilletCieDevise   = Number(formData.puBilletCompagnieDevise)   || 0;
    const puServiceCieDevise  = Number(formData.puServiceCompagnieDevise)  || 0;
    const puPenaliteCieDevise = Number(formData.puPenaliteCompagnieDevise) || 0;

    // ── Montant Compagnie Devise = PU * nombre ───────────────────────
    const mtBilletCieDevise   = puBilletCieDevise   * nombre;
    const mtServiceCieDevise  = puServiceCieDevise  * nombre;
    const mtPenaliteCieDevise = puPenaliteCieDevise * nombre;

    // ── PU Compagnie Ariary = PU Devise * Taux ───────────────────────
    const puBilletCieAriary   = puBilletCieDevise   * taux;
    const puServiceCieAriary  = puServiceCieDevise  * taux;
    const puPenaliteCieAriary = puPenaliteCieDevise * taux;

    // ── Montant Compagnie Ariary = PU Ariary * nombre ────────────────
    const mtBilletCieAriary   = puBilletCieAriary   * nombre;
    const mtServiceCieAriary  = puServiceCieAriary  * nombre;
    const mtPenaliteCieAriary = puPenaliteCieAriary * nombre;

    // ── Montant Client Devise = Mt Cie Devise * (1 + commission%) ────
    const facteur = 1 + commissionPct / 100;
    const mtBilletClientDevise   = mtBilletCieDevise   * facteur;
    const mtServiceClientDevise  = mtServiceCieDevise  * facteur;
    const mtPenaliteClientDevise = mtPenaliteCieDevise * facteur;

    // ── Montant Client Ariary = Mt Client Devise * Taux ──────────────
    const mtBilletClientAriary   = mtBilletClientDevise   * taux;
    const mtServiceClientAriary  = mtServiceClientDevise  * taux;
    const mtPenaliteClientAriary = mtPenaliteClientDevise * taux;

    // ── Commission = Mt Client Devise - Mt Cie Devise ────────────────
    const commissionEnDevise = (mtBilletClientDevise   - mtBilletCieDevise)
                            + (mtServiceClientDevise  - mtServiceCieDevise)
                            + (mtPenaliteClientDevise - mtPenaliteCieDevise);
    const commissionEnAriary = commissionEnDevise * taux;

    return {
      departId:      formData.departId,
      destinationId: formData.destinationId,
      numeroVol:     formData.numeroVol,
      avion:         formData.avion   || null,
      itineraire:    formData.itineraire || null,
      classe:        formData.classe,
      typePassager:  formData.typePassager,
      dateHeureDepart: formData.dateHeureDepart,
      dateHeureArrive: formData.dateHeureArrive || null,
      dureeVol:    formData.dureeVol    || null,
      dureeEscale: formData.dureeEscale || null,
      devise:      formData.devise,
      tauxEchange: taux,
      nombre,

      puBilletCompagnieDevise:   puBilletCieDevise,
      puServiceCompagnieDevise:  puServiceCieDevise,
      puPenaliteCompagnieDevise: puPenaliteCieDevise,

      montantBilletCompagnieDevise:   mtBilletCieDevise,
      montantServiceCompagnieDevise:  mtServiceCieDevise,
      montantPenaliteCompagnieDevise: mtPenaliteCieDevise,

      puBilletCompagnieAriary:   puBilletCieAriary,
      puServiceCompagnieAriary:  puServiceCieAriary,
      puPenaliteCompagnieAriary: puPenaliteCieAriary,

      montantBilletCompagnieAriary:   mtBilletCieAriary,
      montantServiceCompagnieAriary:  mtServiceCieAriary,
      montantPenaliteCompagnieAriary: mtPenaliteCieAriary,

      montantBilletClientDevise:   mtBilletClientDevise,
      montantServiceClientDevise:  mtServiceClientDevise,
      montantPenaliteClientDevise: mtPenaliteClientDevise,

      montantBilletClientAriary:   mtBilletClientAriary,
      montantServiceClientAriary:  mtServiceClientAriary,
      montantPenaliteClientAriary: mtPenaliteClientAriary,

      commissionEnDevise,
      commissionEnAriary,

      // modePaiement: formData.modePaiement || 'COMPTANT',

      services: (formData.services || []).map((s: any) => ({
        serviceSpecifiqueId: s.serviceSpecifiqueId,
        valeur: s.valeur?.trim() || 'false',
      })),
    };
  };

  const handleSearchTrigger = ({
    numeroVol, dateHeureDepart, classe, typePassager, anchorRef,
  }: {
    numeroVol: string;
    dateHeureDepart: string;
    classe: string;
    typePassager: string;
    anchorRef: React.RefObject<HTMLTableCellElement | null>;
  }) => {
    // Debounce
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          numeroVol,
          dateHeureDepart: dateHeureDepart.includes('Z') 
            ? dateHeureDepart 
            : dateHeureDepart.length === 16 
              ? `${dateHeureDepart}:00.000Z` 
              : new Date(dateHeureDepart).toISOString(),
          classe,
          typePassager,
        });

        const response = await axios.get(`/prospections/search?${params}`);

        if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          setSuggestions(response.data.data);
          // Calculer la position de l'ancre
          const rect = anchorRef.current?.getBoundingClientRect();
          if (rect) setSuggestionAnchor(rect);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  const applySuggestion = (s: any) => {
    updateNewLineField('numeroVol',      s.numeroVol      || '');
    updateNewLineField('avion',          s.avion          || '');
    updateNewLineField('itineraire',     s.itineraire     || '');
    updateNewLineField('departId',       s.departId       || '');
    updateNewLineField('destinationId',  s.destinationId  || '');
    updateNewLineField('classe',         s.classe         || 'ECONOMIE');
    updateNewLineField('typePassager',   s.typePassager   || 'ADULTE');
    updateNewLineField('dureeVol',       s.dureeVol       || '');
    updateNewLineField('dureeEscale',    s.dureeEscale    || '');
    // updateNewLineField('modePaiement',   s.modePaiement   || 'COMPTANT');
    updateNewLineField('devise',                    s.devise      || 'EUR');
    updateNewLineField('tauxEchange',               s.tauxEchange || 4900);
    updateNewLineField('puBilletCompagnieDevise',   s.puBilletCompagnieDevise   || 0);
    updateNewLineField('puServiceCompagnieDevise',  s.puServiceCompagnieDevise  || 0);
    updateNewLineField('puPenaliteCompagnieDevise', s.puPenaliteCompagnieDevise || 0);

    // Stocker l'ISO complète pour l'envoi, pas le format datetime-local
    if (s.dateHeureDepart) {
      // Format pour l'input datetime-local (affichage)
      updateNewLineField('dateHeureDepart', s.dateHeureDepart.slice(0, 16));
      // Stocker aussi la valeur originale pour l'envoi
      updateNewLineField('dateHeureDepartISO', s.dateHeureDepart);
    }
    if (s.dateHeureArrive) {
      updateNewLineField('dateHeureArrive', s.dateHeureArrive.slice(0, 16));
      updateNewLineField('dateHeureArriveISO', s.dateHeureArrive);
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Remplacer handleSaveFromModal
  const handleSaveFromModal = async (formData: any) => {
    if (!enteteId) return;
    const payload = {
      prospectionEnteteId: enteteId,
      ...buildPayload(formData),
    };
    await dispatch(createProspectionLigne(payload)).unwrap();
    dispatch(fetchProspectionLignes(enteteId));
  };

  // Remplacer handleSaveNewLine
  const handleSaveNewLine = async () => {
    if (!newLine || !enteteId) return;

    if (!newLine.departId || !newLine.destinationId) {
      alert('Veuillez sélectionner un aéroport de départ et une destination');
      return;
    }
    if (!newLine.numeroVol.trim() || !newLine.dateHeureDepart) {
      alert('Veuillez remplir : numéro vol et date de départ');
      return;
    }

    setNewLine((prev: any) => ({ ...prev, isSaving: true }));

    try {
      const payload = {
        prospectionEnteteId: enteteId,
        ...buildPayload({
          ...newLine,
          dateHeureDepart: newLine.dateHeureDepartISO || new Date(newLine.dateHeureDepart).toISOString(),
          dateHeureArrive: newLine.dateHeureArrive
            ? (newLine.dateHeureArriveISO || new Date(newLine.dateHeureArrive).toISOString())
            : null,
          services: newLine.serviceValues,
        }),
      };

      await dispatch(createProspectionLigne(payload)).unwrap();
      dispatch(fetchProspectionLignes(enteteId));
      setNewLine(null);
    } catch (err: any) {
      alert('Erreur création : ' + (err?.message || 'voir console'));
      setNewLine((prev: any) => ({ ...prev, isSaving: false }));
    }
  };

  const handleSaveModal = async () => {
    if (!selectedEntete) return;

    if (modalCommission === selectedEntete.commissionAppliquer) {
      closeModal();
      return;
    }

    setIsSaving(true);

    try {
      await dispatch(
        updateProspectionEntete({
          id: selectedEntete.id,
          prestationId: selectedEntete.prestationId,
          fournisseurId: selectedEntete.fournisseurId,
          credit: selectedEntete.credit,
          typeVol: selectedEntete.typeVol,
          commissionPropose: selectedEntete.commissionPropose,
          commissionAppliquer: modalCommission,
        })
      ).unwrap();

      // Optionnel : toast de succès
      alert("Commission appliquée mise à jour avec succès");
      closeModal();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la sauvegarde : " + (err?.message || "Erreur inconnue"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEntete = async () => {
    
    if (!entete?.prestationId) return;
    if (!newEntete.fournisseurId) {
      alert("Veuillez sélectionner un fournisseur");
      return;
    }

    setIsCreating(true);

    try {
      await dispatch(
        createProspectionEntete({
          prestationId: entete.prestationId,
          fournisseurId: newEntete.fournisseurId,
          credit: newEntete.credit,
          typeVol: newEntete.typeVol,
        })
      ).unwrap();

      alert("En-tête créé avec succès !");
      closeCreateModal();
      // La liste est déjà mise à jour via le slice (push optimiste)
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la création : " + (err?.message || "Vérifiez la console"));
    } finally {
      setIsCreating(false);
    }
  };

  const updateItineraireAuto = (updatedLine: any) => {
    const depart = destinations.find(d => d.id === updatedLine.departId);
    const dest = destinations.find(d => d.id === updatedLine.destinationId);

    let newItineraire = '';
    if (depart && dest) {
      newItineraire = `${depart?.ville || depart?.code || '?'} → ${dest?.ville || dest?.code || '?'}`;
    } else if (depart) {
      newItineraire = `${depart.ville} - ?`;
    } else if (dest) {
      newItineraire = `? - ${dest.ville}`;
    }

    return {
      ...updatedLine,
      itineraire: newItineraire,
    };
  };

  const updateNewLineField = (field: string, value: any) => {
    setNewLine(prev => {
      let updated = { ...prev, [field]: value };

      if (field === 'departId' || field === 'destinationId') {
        updated = updateItineraireAuto(updated);
      }

      return updated;
    });
  };

  const updateServiceValue = (index: number, newValeur: string) => {
    setNewLine((prev: any) => {
      const newValues = [...prev.serviceValues];
      newValues[index] = { ...newValues[index], valeur: newValeur.trim() };
      return { ...prev, serviceValues: newValues };
    });
  };

  const handleAddNewLine = () => {
    if (newLine) return;

    // Tout déplier quand NewLineRow s'affiche
    setCollapsedGroups({
      infosVol: false,
      tarifsCieDevise: false,
      tarifsCieAriary: false,
      tarifsClientDevise: false,
      tarifsClientAriary: false,
      commissions: false,
      services: false,
    });
    setShowPenalite(true);

    const initialServiceValues = servicesDisponibles.map((s) => ({
      serviceSpecifiqueId: s.id,
      valeur: '',
    }));

    setNewLine({
      tempId: Date.now(),
      departId: '',
      destinationId: '',
      numeroVol: '',
      avion: '',
      itineraire: '',
      classe: 'ECONOMIE',
      typePassager: 'ADULTE',
      dateHeureDepart: '',
      dateHeureArrive: '',
      dureeVol: '',
      dureeEscale: '',
      puBilletCompagnieDevise: 0,
      puServiceCompagnieDevise: 0,
      puPenaliteCompagnieDevise: 0,
      devise: 'EUR',
      tauxEchange: 4900,
      montantBilletCompagnieDevise: 0,
      montantServiceCompagnieDevise: 0,
      montantPenaliteCompagnieDevise: 0,
      montantBilletClientDevise: 0,
      montantServiceClientDevise: 0,
      montantPenaliteClientDevise: 0,
      serviceValues: initialServiceValues,
      // modePaiement: 'COMPTANT' as ModePaiement,
      isSaving: false,
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedLigneIds([]);
    }
  };

  const toggleLigneSelection = (ligneId: string) => {
    setSelectedLigneIds(prev =>
      prev.includes(ligneId)
        ? prev.filter(id => id !== ligneId)
        : [...prev, ligneId]
    );
  };

  const handleCreateDevis = async () => {
    if (selectedLigneIds.length === 0) return;

    try {
      const payload = {
        prospectionEnteteId: enteteId,
        prospectionLigneIds: selectedLigneIds,
      };

      const response = await axios.post('/devis', payload);

      if (response.data?.success) {
        setSelectedLigneIds([]);
        setSelectionMode(false);
        navigate(`/dossiers-communs/ticketing/pages/devis/${enteteId}`)
      } else {
        alert('Réponse invalide du serveur');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors de la création du devis : ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelNewLine = () => {
    setNewLine(null);
  };

  const formatDateISO = (iso: string): string => {
    if (!iso) return '—';
    // Prendre directement les parties de la chaîne ISO
    const [datePart, timePart] = iso.slice(0, 16).split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} ${timePart}`;
  };

  const PANEL_HEIGHT = 320; // hauteur estimée du panneau (max-h-72 = 288px + header + footer)
  const spaceBelow = window.innerHeight - (suggestionAnchor?.bottom + 4);
  const spaceAbove = suggestionAnchor?.top - 4;
  const showAbove = spaceBelow < PANEL_HEIGHT && spaceAbove > spaceBelow;

  const suggestionPortal = showSuggestions && suggestionAnchor && suggestions.length > 0
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: showAbove
              ? suggestionAnchor.top - PANEL_HEIGHT
              : suggestionAnchor.bottom + 4,
            left: suggestionAnchor.left,
            width: 700, // Plus large pour la lisibilité
            zIndex: 9999,
            maxHeight: showAbove
              ? suggestionAnchor.top - 8
              : window.innerHeight - suggestionAnchor.bottom - 8,
          }}
          className="bg-white border border-blue-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        >
          {/* Header - Plus moderne */}
          <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-widest">
                {searchLoading ? 'Recherche en cours...' : `${suggestions.length} Suggestions trouvées`}
              </span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => setShowSuggestions(false)}
              className="text-blue-100 hover:text-white text-[11px] font-bold bg-white/10 px-3 py-1 rounded-lg transition-colors border border-white/10"
            >
              ✕ ESC
            </button>
          </div>

          {/* Liste */}
          <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySuggestion(s)}
                className="w-full px-5 py-4 text-left hover:bg-blue-50/50 hover:shadow-inner transition-all group relative"
              >
                {/* Ligne 1 : Vol & Itinéraire */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-black font-mono text-blue-700 bg-blue-100 border border-blue-200 px-2 py-1 rounded-md shadow-sm">
                      {s.numeroVol}
                    </span>
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {s.itineraire || 'Itinéraire non défini'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded uppercase tracking-tighter">
                    Classe {s.classe}
                  </span>
                </div>

                {/* Grille de données - C'est ici que la lisibilité s'améliore */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Dates (Col 1-5) */}
                  <div className="col-span-5 space-y-1 border-r border-slate-200/60 pr-4">
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="opacity-50 text-blue-500">🛫</span>
                      <span className="font-medium">{s.dateHeureDepart ? formatDateISO(s.dateHeureDepart) : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="opacity-50 text-red-400">🛬</span>
                      <span className="font-medium">{s.dateHeureArrive ? formatDateISO(s.dateHeureArrive) : '—'}</span>
                    </div>
                  </div>

                  {/* Prix (Col 6-12) */}
                  <div className="col-span-7 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">Billet</span>
                      <span className="text-sm font-black text-emerald-600">
                        {s.puBilletCompagnieDevise?.toLocaleString('fr-FR')} <small className="text-[10px]">{s.devise}</small>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">Service</span>
                      <span className="text-sm font-black text-blue-600">
                        {s.puServiceCompagnieDevise?.toLocaleString('fr-FR')} <small className="text-[10px]">{s.devise}</small>
                      </span>
                    </div>
                    <div className="flex flex-col ml-auto text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tight text-right">Taux</span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {s.tauxEchange?.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services Optionnels - Version Badges Épurés */}
                {s.serviceProspectionLigne?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    {s.serviceProspectionLigne.map((svc) => (
                      <span
                        key={svc.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${
                          svc.valeur === 'true' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
                        }`}
                      >
                        {svc.serviceSpecifique?.libelle} : {svc.valeur === 'true' ? 'OUI' : svc.valeur === 'false' ? 'NON' : svc.valeur}
                      </span>
                    ))}
                  </div>
                )}

                {/* Infos Bas de carte */}
                <div className="flex items-center justify-between mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="text-[10px] font-mono text-slate-400">
                      #{s.numeroDosRef} • {s.prospectionEntete?.numeroEntete}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Passager : <span className="text-blue-700 uppercase">{s.typePassager}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 shrink-0 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Sélection rapide • Pré-remplissage actif
            </p>
            {suggestions.length > 5 && (
              <span className="text-[10px] text-blue-600 font-bold">Scrollez pour voir plus ↓</span>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  if (!enteteId) {
    return <div className="p-8 text-center text-red-600">ID en-tête manquant</div>;
  }

  

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 px-4 bg-white">
              <div className='flex items-center justify-between'>
                <TicketingHeader items={prospectionDetailItems(enteteId)} />

                {/* Barre d'Actions - Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  {selectionMode ? (
                    <>
                      {/* Mode Sélection - On se concentre sur l'action finale */}
                      <button
                        onClick={toggleSelectionMode}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
                      >
                        <FiX size={15} className="text-slate-400" />
                        Annuler
                      </button>

                      <button
                        onClick={handleCreateDevis}
                        disabled={selectedLigneIds.length === 0}
                        className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all active:scale-95 shadow-sm ${
                          selectedLigneIds.length === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                        }`}
                      >
                        <FiCheckSquare size={15} />
                        Créer le devis
                        {selectedLigneIds.length > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black">
                            {selectedLigneIds.length}
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Navigation & Consultation */}
                      <button
                        onClick={() => navigate(`/dossiers-communs/ticketing/pages/devis/${enteteId}`)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50/50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-all active:scale-95"
                      >
                        <FiFileText size={15} />
                        Voir les devis
                      </button>

                      <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />

                      {/* Actions de Sélection */}
                      <button
                        onClick={toggleSelectionMode}
                        disabled={lignes.length === 0 || !!newLine || loadingLignes}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 ${
                          lignes.length === 0 || !!newLine || loadingLignes
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'text-emerald-700 bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        <FiCheckSquare size={15} />
                        Sélectionner
                      </button>

                      <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />

                      {/* Actions d'Ajout - Groupées par style */}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={handleAddNewLine}
                          disabled={!!newLine || loadingLignes || selectionMode || isModalOpen}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 border ${
                            !!newLine || loadingLignes || selectionMode || isModalOpen
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <FiPlus size={15} />
                          Ligne
                        </button>

                        <button
                          onClick={() => setIsModalOpen(true)}
                          disabled={!!newLine || loadingLignes || selectionMode}
                          className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all active:scale-95 shadow-lg ${
                            !!newLine || loadingLignes || selectionMode
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                          }`}
                        >
                          <FiPlus size={15} />
                          Modals
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className='px-4 border-b border-neutral-50'>
              <header className="mb-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                  {/* Top Bar - La partie toujours visible */}
                  <div 
                    className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors ${isOpen ? 'border-b border-slate-100' : ''}`}
                    onClick={handleToggle}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Titre et ID */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                            {entete?.numeroEntete}
                          </h1>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-md border border-indigo-100">
                            Prospection : {entete?.prestation?.numeroDos || entete?.prestationId || '—'}
                          </span>
                        </div>
                        
                        {/* Sous-titre visible uniquement quand c'est réduit pour garder l'info essentielle */}
                        {!isOpen && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {entete?.fournisseur?.libelle} • {entete?.typeVol} • {entete?.commissionAppliquer}% Commission
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Actions */}
                      <div className="flex items-center gap-2 mr-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(entete); }}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition-all shadow-sm"
                        >
                          Modifier
                        </button>
                      </div>

                      {/* Toggle Button simple et propre */}
                      <div className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-slate-100 text-slate-600' : 'text-slate-400'}`}>
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Les détails */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-6 bg-slate-50/30">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Fournisseur</label>
                          <p className="text-sm font-semibold text-slate-700">
                            {entete?.fournisseur?.libelle || entete?.fournisseurId || '—'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Type de vol</label>
                          <p className="text-sm font-semibold text-slate-700">{entete?.typeVol}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Crédit</label>
                          <p className="text-sm font-semibold text-slate-700">{entete?.credit}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Commission (%)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Prop: {entete?.commissionPropose}%</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-sm font-bold text-emerald-600">App: {entete?.commissionAppliquer}%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {/* Espace libre pour un statut ou date */}
                          <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Dernière mise à jour</label>
                          <p className="text-sm font-semibold text-slate-700">—</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="flex items-center justify-between">
                <div>
                  <nav className="flex" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTabSousSection('lignes')}
                      className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                        activeTabSousSection === 'lignes'
                          ? 'bg-[#4A77BE] text-white shadow-sm'
                          : 'bg-white text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'
                      }`}
                    >
                      Liste des billets
                    </button>
                    <button
                      onClick={() => setActiveTabSousSection('suivi')}
                      className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                        activeTabSousSection === 'suivi'
                          ? 'bg-[#4A77BE] text-white shadow-sm'
                          : 'bg-white text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'
                      }`}
                    >
                      Suivi
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">
              {activeTabSousSection === 'lignes' && (
                <section className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-white border-b border-gray-200">
                    {/* Mode indicator bar */}
                    {selectionMode && (
                      <div className="bg-green-50 border-b border-green-200 px-6 py-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center justify-center w-5 h-5 bg-green-600 rounded-full">
                            <FiCheckSquare className="text-white" size={12} />
                          </div>
                          <span className="font-medium text-green-900">
                            Mode sélection activé
                          </span>
                          <span className="text-green-700">
                            • Sélectionnez les lignes à inclure dans le devis
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Main action bar */}
                    <div className="px-6 py-4">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        {/* Titre */}
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-slate-700">
                              Lignes de prospection
                            </h2>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                              {lignes.length} {lignes.length !== 1 ? 'lignes' : 'ligne'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectionMode 
                              ? `${selectedLigneIds.length} ligne${selectedLigneIds.length !== 1 ? 's' : ''} sélectionnée${selectedLigneIds.length !== 1 ? 's' : ''}`
                              : 'Gérez vos lignes de prospection et créez des devis'
                            }
                          </p>
                        </div>

                        
                      </div>
                    </div>
                  </div>

                  {/* Barre de contrôle des groupes */}
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 uppercase mr-2">Groupes :</span>
                    {[
                      { key: 'infosVol', label: '✈️ Infos Vol', color: 'slate' },
                      { key: 'tarifsCieDevise', label: '🏢 Cie Devise', color: 'emerald' },
                      { key: 'tarifsCieAriary', label: '🏢 Cie Ariary', color: 'emerald' },
                      { key: 'tarifsClientDevise', label: '👤 Client Devise', color: 'blue' },
                      { key: 'tarifsClientAriary', label: '👤 Client Ariary', color: 'blue' },
                      { key: 'commissions', label: '💰 Commissions', color: 'green' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleGroup(key as keyof typeof collapsedGroups)}
                        disabled={!!newLine}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          newLine
                            ? 'opacity-40 cursor-not-allowed'
                            : collapsedGroups[key as keyof typeof collapsedGroups]
                              ? 'bg-white text-slate-400 border-slate-200 line-through'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    {/* Bouton pénalités — s'applique à tous les groupes */}
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                      <button
                        onClick={() => setShowPenalite(p => !p)}
                        disabled={!!newLine}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          newLine
                            ? 'opacity-40 cursor-not-allowed'
                            : showPenalite
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-white text-slate-400 border-slate-200 line-through'
                        }`}
                      >
                        🚫 Pénalités
                      </button>
                      {/* Tout replier — désactivé si tout est déjà replié */}
                      <button
                        disabled={!!newLine || Object.values(collapsedGroups).every(v => v === true)}
                        onClick={() => setCollapsedGroups({ infosVol: true, tarifsCieDevise: true, tarifsCieAriary: true, tarifsClientDevise: true, tarifsClientAriary: true, commissions: true, services: true })}
                        className={`ml-auto text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          !!newLine || Object.values(collapsedGroups).every(v => v === true)
                            ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        Tout replier
                      </button>

                      {/* Tout déplier — désactivé si tout est déjà déplié */}
                      <button
                        disabled={!!newLine || Object.values(collapsedGroups).every(v => v === false)}
                        onClick={() => setCollapsedGroups({ infosVol: false, tarifsCieDevise: false, tarifsCieAriary: false, tarifsClientDevise: false, tarifsClientAriary: false, commissions: false, services: false })}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          !!newLine || Object.values(collapsedGroups).every(v => v === false)
                            ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        Tout déplier
                      </button>
                    </div>

                  {loadingLignes ? (
                    <div className="p-12 text-center text-slate-500 bg-slate-50 animate-pulse">
                      Chargement des lignes...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          {/* Ligne 1 : en-têtes de groupes */}
                          <tr className="border-b-2 border-slate-300">
                            {selectionMode && <th rowSpan={2} className="px-4 py-2 w-12 bg-slate-100" />}

                            {/* Colonnes fixes */}
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[120px]">N° Dos Ref</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[100px]">Statut</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[80px]">Nb pax</th>

                            {/* Groupe : Infos Vol */}
                            <th
                              colSpan={collapsedGroups.infosVol ? 1 : 11}
                              className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-slate-700 border-x border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                              onClick={() => toggleGroup('infosVol')}
                            >
                              <div className="flex items-center justify-center gap-2">
                                ✈️ Infos Vol
                                <span className="text-slate-300 text-xs">{collapsedGroups.infosVol ? '▶' : '▼'}</span>
                              </div>
                            </th>

                            {/* Groupe : Devise + Taux (toujours visible) */}
                            <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-gray-600 border-x border-gray-400">
                              💱 Devise
                            </th>

                            {/* Groupe : Tarifs Cie Devise */}
                            <th
                              colSpan={collapsedGroups.tarifsCieDevise ? 1 : (showPenalite ? 6 : 4)}
                              className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                              onClick={() => toggleGroup('tarifsCieDevise')}
                            >
                              <div className="flex items-center justify-center gap-2">
                                🏢 Tarifs Cie Devise
                                <span className="text-emerald-300 text-xs">{collapsedGroups.tarifsCieDevise ? '▶' : '▼'}</span>
                              </div>
                            </th>

                            {/* Groupe : Tarifs Cie Ariary */}
                            <th
                              colSpan={collapsedGroups.tarifsCieAriary ? 1 : (showPenalite ? 6 : 4)}
                              className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-emerald-800 border-x border-emerald-600 cursor-pointer hover:bg-emerald-700 transition-colors select-none"
                              onClick={() => toggleGroup('tarifsCieAriary')}
                            >
                              <div className="flex items-center justify-center gap-2">
                                🏢 Tarifs Cie Ariary
                                <span className="text-emerald-300 text-xs">{collapsedGroups.tarifsCieAriary ? '▶' : '▼'}</span>
                              </div>
                            </th>

                            {/* Groupe : Tarifs Client Devise */}
                            <th
                              colSpan={collapsedGroups.tarifsClientDevise ? 1 : (showPenalite ? 3 : 2)}
                              className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-blue-700 border-x border-blue-500 cursor-pointer hover:bg-blue-600 transition-colors select-none"
                              onClick={() => toggleGroup('tarifsClientDevise')}
                            >
                              <div className="flex items-center justify-center gap-2">
                                👤 Tarifs Client Devise
                                <span className="text-blue-300 text-xs">{collapsedGroups.tarifsClientDevise ? '▶' : '▼'}</span>
                              </div>
                            </th>

                            {/* Groupe : Tarifs Client Ariary */}
                            <th
                              colSpan={collapsedGroups.tarifsClientAriary ? 1 : (showPenalite ? 3 : 2)}
                              className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-blue-800 border-x border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors select-none"
                              onClick={() => toggleGroup('tarifsClientAriary')}
                            >
                              <div className="flex items-center justify-center gap-2">
                                👤 Tarifs Client Ariary
                                <span className="text-blue-300 text-xs">{collapsedGroups.tarifsClientAriary ? '▶' : '▼'}</span>
                              </div>
                            </th>

                            {/* Groupe : Commissions */}
                            <th
                              colSpan={collapsedGroups.commissions ? 1 : 2}
                              className="px-4 py-2 text-center text-xs font-bold text-white uppercase bg-green-700 border-x border-green-500 cursor-pointer hover:bg-green-600 transition-colors select-none"
                              onClick={() => toggleGroup('commissions')}
                            >
                              <div className="flex items-center justify-center gap-2">
                                💰 Commissions
                                <span className="text-green-300 text-xs">{collapsedGroups.commissions ? '▶' : '▼'}</span>
                              </div>
                            </th>

                            {/* Services + Actions */}
                            {/* <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[140px]">
                              Mode Paiement
                            </th> */}
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[600px]">Services</th>
                            <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase bg-slate-100 min-w-[100px]">Actions</th>
                          </tr>

                          {/* Ligne 2 : sous-en-têtes */}
                          <tr>
                            {/* Infos Vol */}
                            {!collapsedGroups.infosVol ? (
                              <>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[120px]">N° Vol</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[150px]">Date Départ Pays</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[150px]">Date Arrivée Pays</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[100px]">Classe</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[120px]">Type pax</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[120px]">Avion</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[140px]">Départ</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[140px]">Destination</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[180px]">Itinéraire</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[100px]">Durée vol</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10 min-w-[110px]">Durée escale</th>
                              </>
                            ) : (
                              <th className="px-4 py-2 text-center text-xs text-slate-400 italic bg-slate-800/10">— replié —</th>
                            )}

                            {/* Devise + Taux */}
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-gray-100 min-w-[80px]">Devise</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 bg-gray-100 min-w-[120px]">Taux</th>

                            {/* Tarifs Cie Devise */}
                            {!collapsedGroups.tarifsCieDevise ? (
                              <>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[130px]">PU Billet</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[130px]">PU Service</th>
                                {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[130px]">PU Pénalité</th>}
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[140px]">Mt Billet</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[140px]">Mt Service</th>
                                {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50 min-w-[140px]">Mt Pénalité</th>}
                              </>
                            ) : (
                              <th className="px-4 py-2 text-center text-xs text-emerald-400 italic bg-emerald-50">— replié —</th>
                            )}

                            {/* Tarifs Cie Ariary */}
                            {!collapsedGroups.tarifsCieAriary ? (
                              <>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[130px]">PU Billet Ar</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[130px]">PU Service Ar</th>
                                {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[130px]">PU Pénalité Ar</th>}
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[140px]">Mt Billet Ar</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[140px]">Mt Service Ar</th>
                                {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100 min-w-[140px]">Mt Pénalité Ar</th>}
                              </>
                            ) : (
                              <th className="px-4 py-2 text-center text-xs text-emerald-500 italic bg-emerald-100">— replié —</th>
                            )}

                            {/* Tarifs Client Devise */}
                            {!collapsedGroups.tarifsClientDevise ? (
                              <>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50 min-w-[140px]">Mt Billet</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50 min-w-[140px]">Mt Service</th>
                                {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50 min-w-[140px]">Mt Pénalité</th>}
                              </>
                            ) : (
                              <th className="px-4 py-2 text-center text-xs text-blue-400 italic bg-blue-50">— replié —</th>
                            )}

                            {/* Tarifs Client Ariary */}
                            {!collapsedGroups.tarifsClientAriary ? (
                              <>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100 min-w-[140px]">Mt Billet Ar</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100 min-w-[140px]">Mt Service Ar</th>
                                {showPenalite && <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100 min-w-[140px]">Mt Pénalité Ar</th>}
                              </>
                            ) : (
                              <th className="px-4 py-2 text-center text-xs text-blue-500 italic bg-blue-100">— replié —</th>
                            )}

                            {/* Commissions */}
                            {!collapsedGroups.commissions ? (
                              <>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50 min-w-[150px]">Devise</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50 min-w-[150px]">Ariary</th>
                              </>
                            ) : (
                              <th className="px-4 py-2 text-center text-xs text-green-400 italic bg-green-50">— replié —</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {Array.isArray(lignes) && lignes.length > 0 ? (
                            lignes.map((ligne) => (
                              <tr key={ligne.id} className="hover:bg-blue-50/30 transition-colors">
                                {selectionMode && (
                                  <td className="px-4 py-4 text-center">
                                    <input type="checkbox" checked={selectedLigneIds.includes(ligne.id)}
                                      onChange={() => toggleLigneSelection(ligne.id)}
                                      className="h-4 w-4 text-blue-600 border-slate-300 rounded" />
                                  </td>
                                )}

                                {/* Colonnes fixes */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ligne.numeroDosRef || '—'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 uppercase">
                                  {ligne.status === 'CREER' ? 'créé' : ligne.status === 'MODIFIER' ? 'modifié' : ligne.status}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">{ligne.nombre || '—'}</td>

                                {/* Infos Vol */}
                                {!collapsedGroups.infosVol ? (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{ligne.numeroVol || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                                      {ligne.dateHeureDepart ? formatDateISO(ligne.dateHeureDepart) : '—'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                                      {ligne.dateHeureArrive ? formatDateISO(ligne.dateHeureArrive) : '—'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{ligne.classe || '—'}</span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.typePassager || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.avion || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">-</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">-</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.itineraire || '—'}</td>
                                    
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeVol || '—'}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeEscale || '—'}</td>
                                </>
                                ) : (
                                  <td className="px-4 py-4 text-center text-xs text-slate-400 bg-slate-50 italic">
                                    {ligne.numeroVol} · {ligne.itineraire}
                                  </td>
                                )}

                                {/* Devise + Taux */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-600">{ligne.devise || '—'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{ligne.tauxEchange?.toLocaleString('fr-FR') || '—'}</td>

                                {/* Tarifs Cie Devise */}
                                {!collapsedGroups.tarifsCieDevise ? (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.puBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.puServiceCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.puPenaliteCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>}
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.montantServiceCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-700">{ligne.montantPenaliteCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>}
                                  </>
                                ) : (
                                  <td className="px-4 py-4 text-center text-xs text-emerald-600 bg-emerald-50 font-semibold">
                                    {ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {ligne.devise}
                                  </td>
                                )}

                                {/* Tarifs Cie Ariary */}
                                {!collapsedGroups.tarifsCieAriary ? (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.puBilletCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.puServiceCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                                    {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.puPenaliteCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>}
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.montantBilletCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.montantServiceCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>
                                    {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-800">{ligne.montantPenaliteCompagnieAriary?.toLocaleString('fr-FR') || '—'}</td>}
                                  </>
                                ) : (
                                  <td className="px-4 py-4 text-center text-xs text-emerald-700 bg-emerald-100 font-semibold">
                                    {ligne.montantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                                  </td>
                                )}

                                {/* Tarifs Client Devise */}
                                {!collapsedGroups.tarifsClientDevise ? (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-700">{ligne.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-700">{ligne.montantServiceClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-700">{ligne.montantPenaliteClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>}
                                  </>
                                ) : (
                                  <td className="px-4 py-4 text-center text-xs text-blue-600 bg-blue-50 font-semibold">
                                    {ligne.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {ligne.devise}
                                  </td>
                                )}

                                {/* Tarifs Client Ariary */}
                                {!collapsedGroups.tarifsClientAriary ? (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-800">{ligne.montantBilletClientAriary?.toLocaleString('fr-FR') || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-800">{ligne.montantServiceClientAriary?.toLocaleString('fr-FR') || '—'}</td>
                                    {showPenalite && <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-800">{ligne.montantPenaliteClientAriary?.toLocaleString('fr-FR') || '—'}</td>}
                                  </>
                                ) : (
                                  <td className="px-4 py-4 text-center text-xs text-blue-700 bg-blue-100 font-semibold">
                                    {ligne.montantBilletClientAriary?.toLocaleString('fr-FR')} Ar
                                  </td>
                                )}

                                {/* Commissions */}
                                {!collapsedGroups.commissions ? (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-700 text-right">{ligne.commissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">{ligne.commissionEnAriary?.toLocaleString('fr-FR') || '—'}</td>
                                  </>
                                ) : (
                                  <td className="px-4 py-4 text-center text-xs text-green-700 bg-green-50 font-bold">
                                    {ligne.commissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {ligne.devise}
                                  </td>
                                )}

                                {/* <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                                    {ligne.modePaiement || '—'}
                                  </span>
                                </td> */}

                                {/* Services */}
                                <td className="px-4 py-4 text-sm">
                                  <div className="flex flex-row gap-1 flex-wrap">
                                    {ligne.serviceProspectionLigne?.length > 0 ? (
                                      ligne.serviceProspectionLigne.map((service) => (
                                        <span key={service.id}
                                          className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                                          title={`${service.serviceSpecifique?.libelle} = ${service.valeur}`}
                                        >
                                          {service.serviceSpecifique?.libelle?.slice(0, 6) || '?'}: {service.valeur == 'true' ? 'Oui' : service.valeur == 'false' ? 'Non' : service.valeur}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 italic text-xs">Aucun</span>
                                    )}
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-400">—</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={33} className="px-6 py-10 text-center text-slate-500">
                                {loadingLignes ? 'Chargement des lignes...' : 'Aucune ligne trouvée'}
                              </td>
                            </tr>
                          )}

                          {/* Portal suggestion — en dehors du tableau */}
                          {suggestionPortal}

                          {newLine && (
                            <NewLineRow
                              newLine={newLine}
                              commissionPct={entete?.commissionAppliquer || 0}
                              destinations={destinations}
                              servicesDisponibles={servicesDisponibles}
                              updateNewLineField={updateNewLineField}
                              updateServiceValue={updateServiceValue}
                              handleSaveNewLine={handleSaveNewLine}
                              handleCancelNewLine={handleCancelNewLine}
                              onSearchTrigger={handleSearchTrigger}  // ← nouveau
                            />
                          )}

                          
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
              {/* ── Onglet Suivi ── */}
              {activeTabSousSection === 'suivi' && (
                <SuiviTabSection
                  prestationId={prestationId}
                />
              )}
            </div>
          </div>
        </div>
        <AddProspectionLigneModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          destinations={destinations}
          servicesDisponibles={servicesDisponibles}
          onSave={handleSaveFromModal}
        />
        <ProspectionModals
          selectedEntete={selectedEntete}
          modalCommission={modalCommission}
          setModalCommission={setModalCommission}
          isSaving={isSaving}
          onCloseEdit={closeModal}
          onSaveEdit={handleSaveModal}
          showCreateModal={showCreateModal}
          newEntete={newEntete}
          setNewEntete={setNewEntete}
          isCreating={isCreating}
          fournisseurs={fournisseurs}
          fournisseursLoading={fournisseursLoading}
          onCloseCreate={closeCreateModal}
          onConfirmCreate={handleCreateEntete}
        />
      </TabContainer>
    </div>
  );
}

