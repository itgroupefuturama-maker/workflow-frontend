import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiTrash2, FiCheck } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientBeneficiaireInfos } from '../../app/portail_client/clientBeneficiaireInfosSlice';
import type { ServicePreference } from '../../app/front_office/parametre_ticketing/serviceSpecifiqueSlice';
import ReactDOM from 'react-dom';
import PreferencesInlinePanel from './Hotel/PreferencesInlinePanel';
import { fetchPreferencesBeneficiaire } from '../../app/back_office/clientFacturesSlice';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [prefBeneficiaire, setPrefBeneficiaire] = useState<any>(null);

  const beneficiaires = useSelector(
    (state: RootState) => state.clientFactures.current?.beneficiaires || []
  );

  const { list: infosList, loadingList: infosLoading } = useSelector(
    (state: RootState) => state.clientBeneficiaireInfos
  );

  const defaultDevise = ligne?.prospectionLigne?.devise || 'EUR';
  const defaultTaux = ligne?.prospectionLigne?.tauxEchange || 4900;
  // const nombrePassagersMax = ligne.prospectionLigne?.nombre || 0;

  // ─── États ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    reservation: '',
    devise: defaultDevise,
    resaTauxEchange: defaultTaux,
    puResaBilletCompagnieDevise: 0,
    puResaServiceCompagnieDevise: 0,
    puResaPenaliteCompagnieDevise: 0,
    puResaMontantBilletCompagnieDevise: 0,
    puResaMontantServiceCompagnieDevise: 0,
    puResaMontantPenaliteCompagnieDevise: 0,
  });

  // Remplacer le useState selectedPassagers existant :
  const [selectedPassagers, setSelectedPassagers] = useState<
    Array<{
      beneficiaireId: string;       // clientBeneficiaireId
      infoId: string;               // clientbeneficiaireInfoId
      nomComplet: string;
      servicePreferenceIds: string[]; // ← nouveau
    }>
  >([]);

  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);

  // ─── Calculs dérivés ─────────────────────────────────────
  const nombrePassagers = ligne.prospectionLigne?.nombre || 0;

  const totalBillet = formData.puResaBilletCompagnieDevise * nombrePassagers;
  const totalService = formData.puResaServiceCompagnieDevise * nombrePassagers;
  const totalPenalite = formData.puResaPenaliteCompagnieDevise * nombrePassagers;

  const isFormValid =
    formData.reservation.trim() !== '' &&
    selectedPassagers.length === nombrePassagers &&  // ← exact, pas juste > 0
    formData.puResaBilletCompagnieDevise > 0 &&
    formData.resaTauxEchange > 0;

  // Ajouter ce helper avec les autres (typeClientBadge, etc.)
  const typeClientConfig = (type: string) => ({
    SIMPLE: { bg: 'bg-gray-100',    text: 'text-gray-700',   border: 'border-gray-300',   dot: 'bg-gray-400'   },
    BRONZE: { bg: 'bg-orange-50',   text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
    SILVER: { bg: 'bg-blue-50',     text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
    GOLD:   { bg: 'bg-amber-50',    text: 'text-amber-800',  border: 'border-amber-300',  dot: 'bg-amber-400'  },
    VIP:    { bg: 'bg-purple-50',   text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  }[type] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-400' });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // On cherche l'objet complet correspondant à l'ID sélectionné
  const selectedInfoDetails = infosList.find(info => info.id === currentInfoId);

  // Services actifs sur cette ligne (valeur !== "false" et !== "")
  const servicesActifs = (ligne?.prospectionLigne?.serviceProspectionLigne || []).filter(
    (s: any) => s.valeur && s.valeur !== 'false' && s.valeur !== ''
  );

  // État : préférences sélectionnées par passager (indexé par infoId)
  const [prefParPassager, setPrefParPassager] = useState<Record<string, string[]>>({});

  // Préférences dispo : on récupère depuis le store pour les services actifs
  const servicesStore = useSelector((state: RootState) => state.serviceSpecifique.items);

  // ─── Effets ──────────────────────────────────────────────
  useEffect(() => {
    if (currentBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
    }
  }, [currentBeneficiaireId, dispatch]);

  // Mise à jour automatique des montants totaux
  useEffect(() => {
    if (nombrePassagers > 0) {
      setFormData((prev) => ({
        ...prev,
        puResaMontantBilletCompagnieDevise: totalBillet,
        puResaMontantServiceCompagnieDevise: totalService,
        puResaMontantPenaliteCompagnieDevise: totalPenalite,
      }));
    }
  }, [
    nombrePassagers,
    formData.puResaBilletCompagnieDevise,
    formData.puResaServiceCompagnieDevise,
    formData.puResaPenaliteCompagnieDevise,
  ]);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="beneficiaire"]') && target !== triggerRef.current) {
        setDropdownOpen(false);
      }
    };

    // Recalculer la position si scroll dans le modal
    const handleScroll = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('scroll', handleScroll, true); // true = capture phase pour les scrolls imbriqués
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [dropdownOpen]);

  // ─── Handlers ────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        'puResaBilletCompagnieDevise',
        'puResaServiceCompagnieDevise',
        'puResaPenaliteCompagnieDevise',
        'resaTauxEchange',
        'puResaMontantBilletCompagnieDevise',
        'puResaMontantServiceCompagnieDevise',
        'puResaMontantPenaliteCompagnieDevise',
      ].includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  const addPassager = () => {
    if (!currentBeneficiaireId || !currentInfoId) {
      alert('Veuillez sélectionner un bénéficiaire ET son document');
      return;
    }
    if (selectedPassagers.length >= nombrePassagers) {
      alert(`Nombre maximum de passagers atteint (${nombrePassagers})`);
      return;
    }

    const beneficiaire = beneficiaires.find((b) => b.clientBeneficiaireId === currentBeneficiaireId);
    const info = infosList.find((i) => i.id === currentInfoId);
    if (!beneficiaire || !info) return;

    const nomComplet = `${info.prenom || ''} ${info.nom || ''}`.trim() || beneficiaire.clientBeneficiaire.libelle;

    setSelectedPassagers((prev) => [
      ...prev,
      {
        beneficiaireId: currentBeneficiaireId,
        infoId: currentInfoId,
        nomComplet,
        servicePreferenceIds: [], // ← initialisé vide
      },
    ]);

    // Initialiser les prefs pour ce passager
    setPrefParPassager((prev) => ({ ...prev, [currentInfoId]: [] }));

    setCurrentBeneficiaireId('');
    setCurrentInfoId('');
  };

  const removePassager = (infoId: string) => {
    setSelectedPassagers((prev) => prev.filter((p) => p.infoId !== infoId));
    setPrefParPassager((prev) => {
      const next = { ...prev };
      delete next[infoId];
      return next;
    });
  };

  const handleShowConfirmation = () => {
    if (!isFormValid) {
      alert('Veuillez compléter tous les champs obligatoires.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmAndSubmit = () => {
    const payload = {
      passagers: selectedPassagers.map((p) => ({
        clientbeneficiaireInfoId: p.infoId,
        clientBeneficiaireId: p.beneficiaireId,
        servicePreferenceIds: prefParPassager[p.infoId] || [],
      })),
      nombre: nombrePassagers,
      reservation: formData.reservation,
      puResaBilletCompagnieDevise: formData.puResaBilletCompagnieDevise,
      puResaServiceCompagnieDevise: formData.puResaServiceCompagnieDevise,
      puResaPenaliteCompagnieDevise: formData.puResaPenaliteCompagnieDevise,
      devise: formData.devise,
      resaTauxEchange: formData.resaTauxEchange,
      puResaMontantBilletCompagnieDevise: formData.puResaMontantBilletCompagnieDevise,
      puResaMontantServiceCompagnieDevise: formData.puResaMontantServiceCompagnieDevise,
      puResaMontantPenaliteCompagnieDevise: formData.puResaMontantPenaliteCompagnieDevise,
    };

    onSubmit(payload);
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/5 z-50" />
        {/* ── Conteneur centré qui groupe les 2 modals ── */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`flex items-stretch gap-3 w-full transition-all duration-300 ${
            prefBeneficiaire ? 'max-w-[1200px]' : 'max-w-6xl'
          }`}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header - Fixed */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center ">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Nouvelle Réservation</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    {ligne.prospectionLigne?.numeroVol && (
                      <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                        Vol {ligne.prospectionLigne.numeroVol}
                      </span>
                    )}
                    {ligne.prospectionLigne?.itineraire && (
                      <>
                        <span>•</span>
                        <span>{ligne.prospectionLigne.itineraire}</span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Body - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  
                  {/* 1. Passagers */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                          1
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">Passagers (Max : {nombrePassagers})</h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Sélection obligatoire • Plusieurs passagers possibles
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Sélection */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Bénéficiaire <span className="text-red-600">*</span>
                            </label>

                            <div className="relative">
                              {/* Trigger */}
                              <button
                                ref={triggerRef}
                                type="button"
                                onClick={() => {
                                  if (!dropdownOpen && triggerRef.current) {
                                    const rect = triggerRef.current.getBoundingClientRect();
                                    setDropdownPos({
                                      top: rect.bottom + window.scrollY + 4,
                                      left: rect.left + window.scrollX,
                                      width: rect.width,
                                    });
                                  }
                                  setDropdownOpen((v) => !v);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-left flex items-center justify-between gap-2 bg-white hover:border-gray-400 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                              >
                                {currentBeneficiaireId ? (() => {
                                  const b = beneficiaires.find(b => b.clientBeneficiaireId === currentBeneficiaireId);
                                  if (!b) return <span className="text-gray-400">Sélectionner un bénéficiaire</span>;
                                  const cfg = typeClientConfig(b.clientBeneficiaire.typeClient);
                                  return (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} shrink-0`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        {b.clientBeneficiaire.typeClient}
                                      </span>
                                      <span className="font-medium text-gray-900 truncate">{b.clientBeneficiaire.libelle}</span>
                                      <span className="text-gray-400 font-mono text-xs shrink-0">{b.clientBeneficiaire.code}</span>
                                    </div>
                                  );
                                })() : (
                                  <span className="text-gray-400">Sélectionner un bénéficiaire</span>
                                )}
                                {/* Chevron */}
                                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {/* Dropdown */}
                              {dropdownOpen && ReactDOM.createPortal(
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: dropdownPos.top,
                                    left: dropdownPos.left,
                                    width: dropdownPos.width,
                                    zIndex: 9999,
                                  }}
                                  data-dropdown="beneficiaire"
                                  className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    onClick={() => { setCurrentBeneficiaireId(''); setCurrentInfoId(''); setDropdownOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                                  >
                                    Sélectionner un bénéficiaire
                                  </button>

                                  <div className="max-h-52 overflow-y-auto">
                                    {beneficiaires.map((b) => {
                                      const cfg = typeClientConfig(b.clientBeneficiaire.typeClient);
                                      const isSelected = currentBeneficiaireId === b.clientBeneficiaireId;
                                      return (
                                        <button
                                          key={b.clientBeneficiaireId}
                                          type="button"
                                          onClick={() => {
                                            setCurrentBeneficiaireId(b.clientBeneficiaireId);
                                            setCurrentInfoId('');
                                            setDropdownOpen(false);
                                            dispatch(fetchPreferencesBeneficiaire(b.clientBeneficiaireId));
                                            setPrefBeneficiaire(b);
                                          }}
                                          className={`w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${isSelected ? 'bg-gray-50' : ''}`}
                                        >
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {b.clientBeneficiaire.typeClient}
                                          </span>
                                          <span className="text-sm font-medium text-gray-900 truncate flex-1">
                                            {b.clientBeneficiaire.libelle}
                                          </span>
                                          <span className="text-xs font-mono text-gray-400 shrink-0">
                                            {b.clientBeneficiaire.code}
                                          </span>
                                          {isSelected && (
                                            <svg className="w-4 h-4 text-gray-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>,
                                document.body
                              )}
                            </div>
                          </div>

                          {currentBeneficiaireId && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Document / Info passager <span className="text-red-600">*</span>
                              </label>
                              {infosLoading ? (
                                <div className="text-sm text-gray-500 italic flex items-center gap-2 py-2">
                                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                  Chargement...
                                </div>
                              ) : infosList.length === 0 ? (
                                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded">
                                  Aucun document trouvé pour ce bénéficiaire
                                </div>
                              ) : (
                                <select
                                  value={currentInfoId}
                                  onChange={(e) => setCurrentInfoId(e.target.value)}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                >
                                  <option value="">Sélectionner un document</option>
                                  {infosList
                                    .filter((info) =>
                                      !ligne.prospectionLigne?.typePassager ||   // pas de filtre si typePassager absent
                                      info.clientType === null ||                 // affiche si clientType null
                                      info.clientType === ligne.prospectionLigne?.typePassager
                                    )
                                    .map((info) => (
                                      <option key={info.id} value={info.id}>
                                        {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc}
                                        {info.clientType ? ` (${info.clientType})` : ''}
                                      </option>
                                    ))
                                  }
                                </select>
                              )}
                            </div>
                          )}

                          {/* Détails du document sélectionné */}
                          {selectedInfoDetails && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                Document sélectionné
                              </h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="col-span-2">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Passager</div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {selectedInfoDetails.prenom} {selectedInfoDetails.nom}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Type passager</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">
                                    {selectedInfoDetails.clientType ?? '—'}   {/* ← null géré */}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Nationalité</div>
                                  <div className="text-sm text-gray-900">{selectedInfoDetails.nationalite}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Type document</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">
                                    {selectedInfoDetails.typeDoc}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Référence doc</div>
                                  <div className="text-xs font-mono text-gray-900">{selectedInfoDetails.referenceDoc}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Validité</div>
                                  <div className={`text-xs font-medium ${
                                    new Date(selectedInfoDetails.dateValiditeDoc) < new Date()
                                      ? 'text-red-600'
                                      : 'text-gray-900'
                                  }`}>
                                    {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Del: {new Date(selectedInfoDetails.dateDelivranceDoc).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                                {/* CIN — affiché seulement si présent */}
                                {selectedInfoDetails.referenceCin && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">CIN</div>
                                    <div className="text-xs font-mono text-gray-900">{selectedInfoDetails.referenceCin}</div>
                                  </div>
                                )}
                                {selectedInfoDetails.tel && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Téléphone</div>
                                    <div className="text-xs font-mono text-gray-900">{selectedInfoDetails.tel}</div>
                                  </div>
                                )}
                                {selectedInfoDetails.whatsapp && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">WhatsApp</div>
                                    <div className="text-xs font-mono text-gray-900">{selectedInfoDetails.whatsapp}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                              type="button"
                              onClick={addPassager}
                              disabled={!currentBeneficiaireId || !currentInfoId || selectedPassagers.length >= nombrePassagers}
                              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                currentBeneficiaireId && currentInfoId && selectedPassagers.length < nombrePassagers
                                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                            <span className="text-lg">+</span>
                            Ajouter ce passager
                          </button>
                        </div>

                        {/* Liste sélectionnés */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Passagers sélectionnés
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              selectedPassagers.length === nombrePassagers
                                ? 'bg-green-100 text-green-700'      // ✅ quota exact atteint
                                : selectedPassagers.length > 0
                                  ? 'bg-amber-100 text-amber-700'    // ⚠️ en cours
                                  : 'bg-gray-200 text-gray-700'      // neutre
                            }`}>
                              {selectedPassagers.length} / {nombrePassagers}
                            </span>
                          </label>

                          {selectedPassagers.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded p-8 text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <FiCheck className="text-gray-400" size={24} />
                              </div>
                              <p className="text-sm text-gray-500">Aucun passager ajouté</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {selectedPassagers.map((p, idx) => (
                                <div
                                  key={p.infoId}
                                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-3 hover:border-gray-300 transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{p.nomComplet}</p>
                                      <p className="text-xs text-gray-500 font-mono">
                                        ID: {p.infoId.slice(0, 8)}...
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removePassager(p.infoId)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all"
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 2. Réservation + Taux */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                          2
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Réservation & Taux</h3>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            N° Réservation <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            name="reservation"
                            value={formData.reservation}
                            onChange={handleChange}
                            placeholder="RES-2026-002"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">Devise</label>
                          <input
                            type="text"
                            value={formData.devise}
                            readOnly
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Taux de change <span className="text-red-600">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="resaTauxEchange"
                              value={formData.resaTauxEchange}
                              onChange={handleChange}
                              step="0.01"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              placeholder="4500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                              Ar
                            </span>
                          </div>
                        </div>

                        <div className="flex items-end">
                          <div className="bg-gray-50 border border-gray-200 rounded px-4 py-2 w-full">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-0.5">Passagers</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {nombrePassagers}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. Tarifs Compagnie */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                          3
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Tarifs compagnie <span className="text-gray-600">({formData.devise})</span>
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Prix unitaires */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                          Prix unitaires
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              PU Billet <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="number"
                              name="puResaBilletCompagnieDevise"
                              value={formData.puResaBilletCompagnieDevise}
                              onChange={handleChange}
                              step="0.01"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              placeholder="0.00"
                            />
                            {nombrePassagers > 0 && (
                              <p className="text-xs text-gray-600 mt-1.5">
                                → Total: <span className="font-semibold">{totalBillet.toLocaleString('fr-FR')} {formData.devise}</span>
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">PU Service</label>
                            <input
                              type="number"
                              name="puResaServiceCompagnieDevise"
                              value={formData.puResaServiceCompagnieDevise}
                              onChange={handleChange}
                              step="0.01"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              placeholder="0.00"
                            />
                            {nombrePassagers > 0 && (
                              <p className="text-xs text-gray-600 mt-1.5">
                                → Total: <span className="font-semibold">{totalService.toLocaleString('fr-FR')} {formData.devise}</span>
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">PU Pénalité</label>
                            <input
                              type="number"
                              name="puResaPenaliteCompagnieDevise"
                              value={formData.puResaPenaliteCompagnieDevise}
                              readOnly
                              step="0.01"
                              className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                              placeholder="0.00"
                            />
                            {nombrePassagers > 0 && (
                              <p className="text-xs text-gray-600 mt-1.5">
                                → Total: <span className="font-semibold">{totalPenalite.toLocaleString('fr-FR')} {formData.devise}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Montants totaux */}
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                          Montants totaux
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Billet</label>
                            <input
                              type="number"
                              name="puResaMontantBilletCompagnieDevise"
                              value={formData.puResaMontantBilletCompagnieDevise}
                              onChange={handleChange}
                              step="0.01"
                              className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Service</label>
                            <input
                              type="number"
                              name="puResaMontantServiceCompagnieDevise"
                              value={formData.puResaMontantServiceCompagnieDevise}
                              onChange={handleChange}
                              step="0.01"
                              className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-2 text-sm font-semibold text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Pénalité</label>
                            <input
                              type="number"
                              name="puResaMontantPenaliteCompagnieDevise"
                              value={formData.puResaMontantPenaliteCompagnieDevise}
                              readOnly
                              step="0.01"
                              className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4. Tarifs Client */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                          4
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Tarifs Client <span className="text-gray-600">(Devise & Ariary)</span>
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Tarifs en Devise */}
                        <div className="bg-gray-50 rounded border border-gray-200 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Montants en Devise
                          </h4>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-600">Billet Client</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {ligne?.prospectionLigne?.montantBilletClientDevise || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-600">Service Client</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {ligne?.prospectionLigne?.montantServiceClientDevise || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-gray-600">Pénalité Client</span>
                              <span className="text-sm font-semibold text-red-600">
                                {ligne?.prospectionLigne?.montantPenaliteClientDevise || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tarifs en Ariary */}
                        <div className="bg-gray-50 rounded border border-gray-200 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Montants en Ariary
                          </h4>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-600">Billet Client</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {ligne?.prospectionLigne?.montantBilletClientAriary || '—'} Ar
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-600">Service Client</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {ligne?.prospectionLigne?.montantServiceClientAriary || '—'} Ar
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-gray-600">Pénalité Client</span>
                              <span className="text-sm font-semibold text-red-600">
                                {ligne?.prospectionLigne?.montantPenaliteClientAriary || '—'} Ar
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Commissions */}
                        <div className="bg-gray-50 rounded border border-gray-200 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Commission en Devise
                          </h4>
                          <div className="bg-white border border-gray-300 rounded px-4 py-3">
                            <p className="text-xl font-semibold text-gray-900">
                              {ligne?.prospectionLigne?.commissionEnDevise || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded border border-gray-200 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Commission en Ariary
                          </h4>
                          <div className="bg-white border border-gray-300 rounded px-4 py-3">
                            <p className="text-xl font-semibold text-gray-900">
                              {ligne?.prospectionLigne?.commissionEnAriary || '—'} Ar
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 5. Préférences de services */}
                  {servicesActifs.length > 0 && selectedPassagers.length > 0 && (
                    <section className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                            5
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Préférences de services</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Sélectionnez les préférences pour chaque passager ( les préférences sont relier a un service)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {selectedPassagers.map((passager) => {
                          const prefsPassager = prefParPassager[passager.infoId] || [];

                          return (
                            <div key={passager.infoId} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Header passager */}
                              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {selectedPassagers.indexOf(passager) + 1}
                                </div>
                                <span className="text-sm font-semibold text-gray-800">{passager.nomComplet}</span>
                                {prefsPassager.length > 0 && (
                                  <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                    {prefsPassager.length} préférence{prefsPassager.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>

                              <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {servicesActifs.map((serviceActif: any) => {
                                    const serviceStore = servicesStore.find(
                                      (s) => s.id === serviceActif.serviceSpecifiqueId
                                    );
                                    const prefsDisponibles: ServicePreference[] = serviceStore?.servicePreference || [];
                                    const prefsPassager = prefParPassager[passager.infoId] || [];

                                    return (
                                      <div
                                        key={serviceActif.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden flex flex-col"
                                      >
                                        {/* En-tête du service */}
                                        <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b border-gray-200">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide truncate">
                                              {serviceStore?.libelle
                                                || serviceActif.serviceSpecifique?.libelle
                                                || '—'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                                              {serviceActif.valeur}
                                            </span>
                                          </div>
                                          {prefsDisponibles.length > 0 && (
                                            <span className="text-[10px] text-indigo-600 font-medium shrink-0 ml-2">
                                              {prefsDisponibles.filter(p => prefsPassager.includes(p.id)).length}
                                              /{prefsDisponibles.length}
                                            </span>
                                          )}
                                        </div>

                                        {/* Corps */}
                                        <div className="p-3 flex-1">
                                          {prefsDisponibles.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic text-center py-2">
                                              Aucune préférence disponible
                                            </p>
                                          ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                              {prefsDisponibles.map((pref) => {
                                                const isSelected = prefsPassager.includes(pref.id);
                                                return (
                                                  <button
                                                    key={pref.id}
                                                    type="button"
                                                    onClick={() => {
                                                      setPrefParPassager((prev) => {
                                                        const current = prev[passager.infoId] || [];
                                                        return {
                                                          ...prev,
                                                          [passager.infoId]: isSelected
                                                            ? current.filter((id) => id !== pref.id)
                                                            : [...current, pref.id],
                                                        };
                                                      });
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                                      isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                                    }`}
                                                  >
                                                    {isSelected && <span className="mr-1">✓</span>}
                                                    {pref.preference}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Récapitulatif */}
                  {selectedPassagers.length > 0 && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-5">
                      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900">
                        <FiCheck className="text-gray-900" size={18} />
                        Récapitulatif avant envoi
                      </h3>

                      <div className="bg-white rounded border border-gray-200 p-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Numéro réservation</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.reservation || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                            <p className="text-lg font-semibold text-gray-900">{nombrePassagers}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Devise</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.devise}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Taux</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.resaTauxEchange.toLocaleString('fr-FR')} Ar</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-xs text-gray-500 uppercase mb-2">Liste des passagers</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {selectedPassagers.map((p) => (
                              <div key={p.infoId} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
                                <span className="text-gray-900">✓</span>
                                <span className="text-xs font-medium">{p.nomComplet}</span>
                                <span className="text-xs text-gray-400 font-mono">({p.infoId.slice(0, 8)})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Montants totaux compagnie</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                              <p className="text-xs text-gray-600 font-medium mb-1">BILLET</p>
                              <p className="text-base font-semibold text-gray-900">
                                {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                              </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                              <p className="text-xs text-gray-600 font-medium mb-1">SERVICE</p>
                              <p className="text-base font-semibold text-gray-900">
                                {totalService.toLocaleString('fr-FR')} {formData.devise}
                              </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                              <p className="text-xs text-gray-600 font-medium mb-1">PÉNALITÉ</p>
                              <p className="text-base font-semibold text-gray-900">
                                {totalPenalite.toLocaleString('fr-FR')} {formData.devise}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                <p className="text-xs text-gray-600">
                  <span className="text-red-600 font-semibold">*</span> Champs obligatoires
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={handleShowConfirmation}
                    disabled={!isFormValid}
                    className={`px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                      isFormValid 
                        ? 'bg-gray-900 text-white hover:bg-gray-800' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiCheck size={16} />
                    Vérifier & Confirmer
                  </button>
                </div>
              </div>

              {/* Confirmation overlay */}
              {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header modal confirmation */}
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FiCheck size={20} />
                        Confirmation de réservation
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Vérifiez attentivement avant d'envoyer</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      {/* Infos rapides */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Réservation</p>
                          <p className="text-base font-semibold text-gray-900">{formData.reservation || '—'}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                          <p className="text-base font-semibold text-gray-900">{nombrePassagers}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Total Billet</p>
                          <p className="text-base font-semibold text-gray-900">
                            {totalBillet.toLocaleString('fr-FR')} {formData.devise}
                          </p>
                        </div>
                      </div>

                      {/* JSON payload */}
                      {/* <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Payload JSON à envoyer
                        </p>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                          {JSON.stringify(
                            {
                              passagers: selectedPassagers.map((p) => ({
                                clientbeneficiaireInfoId: p.infoId,
                                clientBeneficiaireId: p.beneficiaireId,
                                servicePreferenceIds: prefParPassager[p.infoId] || [],
                              })),
                              reservation: formData.reservation,
                              puResaBilletCompagnieDevise: formData.puResaBilletCompagnieDevise,
                              puResaServiceCompagnieDevise: formData.puResaServiceCompagnieDevise,
                              puResaPenaliteCompagnieDevise: formData.puResaPenaliteCompagnieDevise,
                              devise: formData.devise,
                              resaTauxEchange: formData.resaTauxEchange,
                              puResaMontantBilletCompagnieDevise: formData.puResaMontantBilletCompagnieDevise,
                              puResaMontantServiceCompagnieDevise: formData.puResaMontantServiceCompagnieDevise,
                              puResaMontantPenaliteCompagnieDevise: formData.puResaMontantPenaliteCompagnieDevise,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div> */}

                      <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-sm text-amber-800">
                          Vérifiez attentivement toutes les valeurs. Cette action sera <strong>irréversible</strong> une fois confirmée.
                        </p>
                      </div>
                    </div>

                    {/* Footer modal */}
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        ← Modifier / Retour
                      </button>
                      <button
                        onClick={handleConfirmAndSubmit}
                        className="px-5 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <FiCheck size={16} />
                        Confirmer et envoyer →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* ── Modal préférences — SÉPARÉ via portal, ancré à droite ── */}
          {prefBeneficiaire && (
            <div className=" shrink-0 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <PreferencesInlinePanel
                beneficiaire={prefBeneficiaire}
                onClose={() => setPrefBeneficiaire(null)}
              />
            </div>
          )}
        </div>
      </> 
  );
};

export default ReservationModal;