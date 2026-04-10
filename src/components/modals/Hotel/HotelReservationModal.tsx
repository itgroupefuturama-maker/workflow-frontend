import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiTrash2, FiCheck } from 'react-icons/fi';
import ReactDOM from 'react-dom';
import type { AppDispatch, RootState } from '../../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientBeneficiaireInfos } from '../../../app/portail_client/clientBeneficiaireInfosSlice';
import { fetchPreferencesBeneficiaire } from '../../../app/back_office/clientFacturesSlice';
import PreferencesInlinePanel from './PreferencesInlinePanel';

interface HotelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
}

const ROWS = 4;

// ─── Badge typeClient (copié depuis ReservationModal) ──────────────────────
const typeClientConfig = (type: string) => ({
  SIMPLE: { bg: 'bg-gray-100',  text: 'text-gray-700',   border: 'border-gray-300',   dot: 'bg-gray-400'   },
  BRONZE: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  SILVER: { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
  GOLD:   { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-300',  dot: 'bg-amber-400'  },
  VIP:    { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
}[type] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-400' });

const HotelReservationModal: React.FC<HotelReservationModalProps> = ({
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
  // Services spécifiques pour les préférences
  const servicesStore = useSelector((state: RootState) => state.serviceSpecifique.items);

  const [formData, setFormData] = useState({
    numeroResa: '',
    puResaNuiteHotelDevise: 0,
    resaTauxChange: 4800,
    puResaNuiteHotelAriary: 0,
    puResaMontantDevise: 0,
    puResaMontantAriary: 0,
    pourcentageCommission: 5,
    commissionUnitaire: 0,
    objet: '',
    moment: '',
    googleAccountId: '',
  });

  // ─── Passagers avec servicePreferenceIds (même structure que ReservationModal) ──
  const [selectedPassagers, setSelectedPassagers] = useState<
    Array<{
      beneficiaireId: string;
      infoId: string;
      nomComplet: string;
    }>
  >([]);

  // Préférences par passager (indexé par infoId, comme ReservationModal)
  const [prefParPassager, setPrefParPassager] = useState<Record<string, string[]>>({});

  const [currentBeneficiaireId, setCurrentBeneficiaireId] = useState('');
  const [currentInfoId, setCurrentInfoId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ─── Dropdown portal (copié depuis ReservationModal) ──────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ─── Services actifs sur cette ligne ──────────────────────────────────────
  const servicesActifs = ligne?.BenchmarkingLigne?.benchmarkingEntete?.benchService || [];

  // ─── Calculs automatiques ─────────────────────────────────────────────────
  useEffect(() => {
    const montantDevise = formData.puResaNuiteHotelDevise * selectedPassagers.length;
    setFormData(prev => ({ ...prev, puResaMontantDevise: montantDevise }));
  }, [formData.puResaNuiteHotelDevise, selectedPassagers.length]);

  useEffect(() => {
    const nuiteAriary = formData.puResaNuiteHotelDevise * formData.resaTauxChange;
    const montantAriary = formData.puResaMontantDevise * formData.resaTauxChange;
    setFormData(prev => ({
      ...prev,
      puResaNuiteHotelAriary: nuiteAriary,
      puResaMontantAriary: montantAriary,
    }));
  }, [formData.puResaNuiteHotelDevise, formData.puResaMontantDevise, formData.resaTauxChange]);

  useEffect(() => {
    const commission = (formData.puResaMontantAriary * formData.pourcentageCommission) / 100;
    setFormData(prev => ({ ...prev, commissionUnitaire: Math.round(commission) }));
  }, [formData.puResaMontantAriary, formData.pourcentageCommission]);

  useEffect(() => {
    if (currentBeneficiaireId) {
      dispatch(fetchClientBeneficiaireInfos(currentBeneficiaireId));
    }
  }, [currentBeneficiaireId, dispatch]);

  // ─── Dropdown : fermeture et repositionnement au scroll ───────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="beneficiaire-hotel"]') && target !== triggerRef.current) {
        setDropdownOpen(false);
      }
    };
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
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [dropdownOpen]);

  const isFormValid =
    formData.numeroResa.trim() !== '' &&
    selectedPassagers.length > 0 &&
    formData.puResaNuiteHotelDevise > 0 &&
    formData.resaTauxChange > 0;

  const selectedInfoDetails = infosList.find(info => info.id === currentInfoId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: [
        'puResaNuiteHotelDevise', 'resaTauxChange', 'puResaNuiteHotelAriary',
        'puResaMontantDevise', 'puResaMontantAriary', 'pourcentageCommission', 'commissionUnitaire',
      ].includes(name) ? Number(value) || 0 : value,
    }));
  };

  const addPassager = () => {
    if (!currentBeneficiaireId || !currentInfoId) {
      alert('Veuillez sélectionner un bénéficiaire ET son document');
      return;
    }
    const beneficiaire = beneficiaires.find(b => b.clientBeneficiaireId === currentBeneficiaireId);
    const info = infosList.find(i => i.id === currentInfoId);
    if (!beneficiaire || !info) return;

    const nomComplet = `${info.prenom || ''} ${info.nom || ''}`.trim()
      || beneficiaire.clientBeneficiaire.libelle;

    setSelectedPassagers(prev => [
      ...prev,
      { beneficiaireId: currentBeneficiaireId, infoId: currentInfoId, nomComplet },
    ]);
    // Initialiser les prefs pour ce passager (comme ReservationModal)
    setPrefParPassager(prev => ({ ...prev, [currentInfoId]: [] }));

    setCurrentBeneficiaireId('');
    setCurrentInfoId('');
  };

  const removePassager = (infoId: string) => {
    setSelectedPassagers(prev => prev.filter(p => p.infoId !== infoId));
    setPrefParPassager(prev => {
      const next = { ...prev };
      delete next[infoId];
      return next;
    });
  };

  const handleShowConfirmation = () => {
    if (!isFormValid) { alert('Veuillez compléter tous les champs obligatoires.'); return; }
    setShowConfirmation(true);
  };

  // ─── Payload final adapté au nouveau format API ───────────────────────────
  const buildPayload = () => ({
    hotelLigneId: ligne.id,
    numeroResa: formData.numeroResa,
    puResaNuiteHotelDevise: formData.puResaNuiteHotelDevise,
    resaTauxChange: formData.resaTauxChange,
    puResaNuiteHotelAriary: formData.puResaNuiteHotelAriary,
    puResaMontantDevise: formData.puResaMontantDevise,
    puResaMontantAriary: formData.puResaMontantAriary,
    pourcentageCommission: formData.pourcentageCommission,
    commissionUnitaire: formData.commissionUnitaire,
    passagers: selectedPassagers.map(p => ({
      clientbeneficiaireInfoId: p.infoId,
      clientBeneficiaireId: p.beneficiaireId,
      servicePreferenceIds: prefParPassager[p.infoId] || [],
    })),
    // ← inclus seulement si renseignés (champs optionnels)
    ...(formData.objet.trim()         && { objet: formData.objet.trim() }),
    ...(formData.moment               && { moment: formData.moment }),
    ...(formData.googleAccountId.trim() && { googleAccountId: formData.googleAccountId.trim() }),
  });

  const handleConfirmAndSubmit = () => {
    onSubmit(buildPayload());
    setShowConfirmation(false);
  };

  // Grille colonne-first pour la liste passagers ajoutés
  const colonnesPassagers: typeof selectedPassagers[] = [];
  for (let i = 0; i < selectedPassagers.length; i += ROWS) {
    colonnesPassagers.push(selectedPassagers.slice(i, i + ROWS));
  }

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop commun ── */}
      <div className="fixed inset-0 bg-black/5 z-50" />
        {/* ── Conteneur centré qui groupe les 2 modals ── */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`flex items-stretch gap-3 w-full transition-all duration-300 ${
            prefBeneficiaire ? 'max-w-[1200px]' : 'max-w-6xl'
          }`}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">

              {/* Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Nouvelle Réservation Hôtel</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                      {ligne?.BenchmarkingLigne?.hotel || 'Hôtel'}
                    </span>
                    <span>•</span>
                    <span>{ligne?.BenchmarkingLigne?.typeChambre?.type || 'Chambre'}</span>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded">
                  <FiX size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">

                  {/* ── Section 1 : Passagers ── */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">1</div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">Passagers</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Sélection obligatoire • Plusieurs passagers possibles</p>
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

                            {/* ─── Dropdown portal (style ReservationModal) ─── */}
                            <div className="relative">
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
                                  setDropdownOpen(v => !v);
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
                                })() : <span className="text-gray-400">Sélectionner un bénéficiaire</span>}
                                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {dropdownOpen && ReactDOM.createPortal(
                                <div
                                  style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
                                  data-dropdown="beneficiaire-hotel"
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
                                    {beneficiaires.map(b => {
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
                                          <span className="text-sm font-medium text-gray-900 truncate flex-1">{b.clientBeneficiaire.libelle}</span>
                                          <span className="text-xs font-mono text-gray-400 shrink-0">{b.clientBeneficiaire.code}</span>
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
                                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                  Chargement...
                                </div>
                              ) : infosList.length === 0 ? (
                                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded">
                                  Aucun document trouvé pour ce bénéficiaire
                                </div>
                              ) : (
                                <select
                                  value={currentInfoId}
                                  onChange={e => setCurrentInfoId(e.target.value)}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                >
                                  <option value="">Sélectionner un document</option>
                                  {infosList.map(info => (
                                    <option key={info.id} value={info.id}>
                                      {info.prenom} {info.nom} • {info.typeDoc} {info.referenceDoc}
                                      {info.clientType ? ` (${info.clientType})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}

                          {selectedInfoDetails && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Document sélectionné</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="col-span-2">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Passager</div>
                                  <div className="text-sm font-semibold text-gray-900">{selectedInfoDetails.prenom} {selectedInfoDetails.nom}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Type</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">
                                    {selectedInfoDetails.clientType ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Nationalité</div>
                                  <div className="text-sm text-gray-900">{selectedInfoDetails.nationalite}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Document</div>
                                  <div className="text-xs font-medium text-gray-700 bg-gray-200 rounded px-2 py-0.5 inline-block">{selectedInfoDetails.typeDoc}</div>
                                  <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedInfoDetails.referenceDoc}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Validité</div>
                                  <div className={`text-xs font-medium ${new Date(selectedInfoDetails.dateValiditeDoc) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                                    {new Date(selectedInfoDetails.dateValiditeDoc).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={addPassager}
                            disabled={!currentBeneficiaireId || !currentInfoId}
                            className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              currentBeneficiaireId && currentInfoId
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-lg leading-none">+</span>
                            Ajouter ce passager
                          </button>
                        </div>

                        {/* Liste passagers (grille colonne-first conservée) */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs font-medium text-gray-700">Passagers sélectionnés</label>
                            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                              {selectedPassagers.length}
                            </span>
                          </div>

                          {selectedPassagers.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded p-8 text-center">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <FiCheck className="text-gray-400" size={20} />
                              </div>
                              <p className="text-sm text-gray-400">Aucun passager ajouté</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <div className="flex flex-row w-max gap-0">
                                {colonnesPassagers.map((colonne, colIndex) => (
                                  <div
                                    key={colIndex}
                                    className={`flex flex-col min-w-[220px] ${colIndex < colonnesPassagers.length - 1 ? 'border-r border-gray-100 pr-2' : ''} ${colIndex > 0 ? 'pl-3' : ''}`}
                                  >
                                    {colonne.map((p, rowIndex) => {
                                      const globalIdx = colIndex * ROWS + rowIndex;
                                      return (
                                        <div key={p.infoId} className="flex items-center gap-2 py-1.5 px-1 group">
                                          <span className="text-xs text-gray-400 w-4 shrink-0 text-right">{globalIdx + 1}.</span>
                                          <span className="text-sm text-gray-800 flex-1 truncate">{p.nomComplet}</span>
                                          <button
                                            onClick={() => removePassager(p.infoId)}
                                            className="text-gray-300 hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                          >
                                            <FiTrash2 size={13} />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Section 2 : Informations de réservation ── */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">2</div>
                        <h3 className="text-sm font-semibold text-gray-900">Informations de réservation</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            N° Réservation <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            name="numeroResa"
                            value={formData.numeroResa}
                            onChange={handleChange}
                            placeholder="RESA-2024-001"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Taux de change (Ar) <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            name="resaTauxChange"
                            value={formData.resaTauxChange}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="4800"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Section 3 : Tarifs ── */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">3</div>
                        <h3 className="text-sm font-semibold text-gray-900">Tarifs</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-5">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Prix en devise</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Prix Nuitée Hôtel (Devise) <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="number"
                              name="puResaNuiteHotelDevise"
                              value={formData.puResaNuiteHotelDevise}
                              onChange={handleChange}
                              step="0.01"
                              placeholder="150.00"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Montant Total (Devise)
                              <span className="ml-2 text-gray-400 font-normal normal-case">
                                = Nuitée × {selectedPassagers.length} passager{selectedPassagers.length > 1 ? 's' : ''}
                              </span>
                            </label>
                            <input
                              type="number"
                              value={formData.puResaMontantDevise}
                              readOnly
                              className="w-full bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm font-semibold text-gray-900 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Prix en Ariary <span className="font-normal normal-case text-gray-400">(calculés automatiquement)</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Prix Nuitée Hôtel (Ariary)</label>
                            <input type="number" value={formData.puResaNuiteHotelAriary} readOnly className="w-full bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm font-semibold text-gray-900 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Montant Total (Ariary)</label>
                            <input type="number" value={formData.puResaMontantAriary} readOnly className="w-full bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm font-semibold text-gray-900 cursor-not-allowed" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Commission</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Pourcentage Commission (%)</label>
                            <input
                              type="number"
                              name="pourcentageCommission"
                              value={formData.pourcentageCommission}
                              onChange={handleChange}
                              step="0.1"
                              placeholder="5"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Commission Unitaire (Ariary)</label>
                            <input type="number" value={formData.commissionUnitaire} readOnly className="w-full bg-emerald-50 border border-emerald-200 rounded px-3 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Section 4 : Préférences de services ── */}
                  {servicesActifs.length > 0 && selectedPassagers.length > 0 && (
                    <section className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">4</div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Préférences de services</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Sélectionnez les préférences pour chaque passager
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {selectedPassagers.map(passager => {
                          const prefsPassager = prefParPassager[passager.infoId] || [];
                          return (
                            <div key={passager.infoId} className="border border-gray-200 rounded-lg overflow-hidden">
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
                                    // ← Recherche via serviceSpecifique.id (structure benchService)
                                    const serviceStore = servicesStore.find(
                                      s => s.id === serviceActif.serviceSpecifique?.id
                                    );
                                    const prefsDisponibles = serviceStore?.servicePreference || [];

                                    return (
                                      <div key={serviceActif.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                                        {/* En-tête du service */}
                                        <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b border-gray-200">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide truncate">
                                              {/* ← libelle depuis serviceSpecifique directement */}
                                              {serviceActif.serviceSpecifique?.libelle || serviceStore?.libelle || '—'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                                              {/* ← code au lieu de valeur */}
                                              {serviceActif.serviceSpecifique?.code || '—'}
                                            </span>
                                          </div>
                                          {/* Compteur toujours affiché, même si 0 préférences dispo */}
                                          <span className="text-[10px] text-indigo-600 font-medium shrink-0 ml-2">
                                            {prefsDisponibles.filter((p: any) => prefsPassager.includes(p.id)).length}
                                            /{prefsDisponibles.length}
                                          </span>
                                        </div>

                                        {/* Corps */}
                                        <div className="p-3 flex-1">
                                          {prefsDisponibles.length === 0 ? (
                                            // ← Affiché même sans préférences (au lieu d'être masqué)
                                            <p className="text-xs text-gray-400 italic text-center py-2">
                                              Aucune préférence disponible
                                            </p>
                                          ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                              {prefsDisponibles.map((pref: any) => {
                                                const isSelected = prefsPassager.includes(pref.id);
                                                return (
                                                  <button
                                                    key={pref.id}
                                                    type="button"
                                                    onClick={() => {
                                                      setPrefParPassager(prev => {
                                                        const current = prev[passager.infoId] || [];
                                                        return {
                                                          ...prev,
                                                          [passager.infoId]: isSelected
                                                            ? current.filter(id => id !== pref.id)
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

                  {/* ── Section 5 : Note / Rappel (optionnel) ── */}
                  <section className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-semibold">
                          {servicesActifs.length > 0 ? '5' : '4'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Note & Rappel</h3>
                            <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              Optionnel
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ajoutez une note ou un rappel associé à cette réservation
                          </p>
                        </div>

                        {/* Indicateur visuel si note renseignée */}
                        {(formData.objet || formData.moment || formData.googleAccountId) && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                            Note ajoutée
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Objet */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Objet du rappel
                        </label>
                        <input
                          type="text"
                          name="objet"
                          value={formData.objet}
                          onChange={handleChange}
                          placeholder="Ex : Rappel pour le billet, Confirmer la chambre..."
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Moment */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Date & heure du rappel
                          </label>
                          <input
                            type="datetime-local"
                            name="moment"
                            value={formData.moment}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-700"
                          />
                        </div>

                        {/* Google Account ID */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Google Account ID
                            <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
                              (agenda Google)
                            </span>
                          </label>
                          <input
                            type="text"
                            name="googleAccountId"
                            value={formData.googleAccountId}
                            onChange={handleChange}
                            placeholder="clxxxxxxxxxxxxxxxxxx"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 font-mono"
                          />
                        </div>
                      </div>

                      {/* Aperçu du rappel si objet + moment renseignés */}
                      {formData.objet && formData.moment && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-start gap-3">
                          {/* Icône calendrier */}
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-indigo-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-indigo-800 truncate">{formData.objet}</p>
                            <p className="text-[11px] text-indigo-600 mt-0.5">
                              {new Date(formData.moment).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                            {formData.googleAccountId && (
                              <p className="text-[10px] text-indigo-400 font-mono mt-0.5 truncate">
                                Agenda : {formData.googleAccountId}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Avertissement si moment sans objet ou objet sans moment */}
                      {(formData.objet && !formData.moment) && (
                        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          Ajoutez une date pour activer le rappel
                        </p>
                      )}
                      {(!formData.objet && formData.moment) && (
                        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          Ajoutez un objet pour activer le rappel
                        </p>
                      )}
                    </div>
                  </section>

                  {/* ── Récapitulatif ── */}
                  {selectedPassagers.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900">
                        <FiCheck size={16} />
                        Récapitulatif avant envoi
                      </h3>
                      <div className="bg-white rounded border border-gray-200 p-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Numéro réservation</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.numeroResa || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                            <p className="text-lg font-semibold text-gray-900">{selectedPassagers.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Montant Total</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.puResaMontantAriary.toLocaleString('fr-FR')} Ar</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Commission</p>
                            <p className="text-sm font-semibold text-emerald-700">{formData.commissionUnitaire.toLocaleString('fr-FR')} Ar</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs text-gray-500 uppercase mb-2">Liste des passagers</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {selectedPassagers.map(p => (
                              <div key={p.infoId} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
                                <FiCheck size={12} className="text-gray-400 shrink-0" />
                                <span className="text-xs font-medium text-gray-700">{p.nomComplet}</span>
                                {(prefParPassager[p.infoId]?.length ?? 0) > 0 && (
                                  <span className="ml-auto text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                                    {prefParPassager[p.infoId].length} pref.
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {(formData.objet || formData.moment) && (
                          <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-500 uppercase mb-2">Note / Rappel</p>
                            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded px-3 py-2">
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-indigo-500 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="min-w-0">
                                {formData.objet && (
                                  <p className="text-xs font-medium text-indigo-800">{formData.objet}</p>
                                )}
                                {formData.moment && (
                                  <p className="text-[10px] text-indigo-500">
                                    {new Date(formData.moment).toLocaleDateString('fr-FR', {
                                      day: '2-digit', month: 'long', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  <span className="text-red-500">*</span> Champs obligatoires
                </p>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={handleShowConfirmation}
                    disabled={!isFormValid}
                    className={`px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                      isFormValid ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiCheck size={16} />
                    Vérifier & Confirmer
                  </button>
                </div>
              </div>

              {/* ── Overlay de confirmation ── */}
              {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FiCheck size={20} />
                        Confirmation de réservation hôtel
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Vérifiez attentivement avant d'envoyer</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Réservation</p>
                          <p className="text-base font-semibold text-gray-900">{formData.numeroResa || '—'}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Passagers</p>
                          <p className="text-base font-semibold text-gray-900">{selectedPassagers.length}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                          <p className="text-base font-semibold text-gray-900">{formData.puResaMontantAriary.toLocaleString('fr-FR')} Ar</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Payload JSON à envoyer</p>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                          {JSON.stringify(buildPayload(), null, 2)}
                        </pre>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
                        <span className="text-base">⚠️</span>
                        <p className="text-sm text-amber-800">
                          Vérifiez attentivement toutes les valeurs. Cette action sera <strong>irréversible</strong> une fois confirmée.
                        </p>
                      </div>
                    </div>

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

export default HotelReservationModal;