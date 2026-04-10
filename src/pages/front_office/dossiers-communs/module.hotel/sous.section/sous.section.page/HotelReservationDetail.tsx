// src/pages/parametres/hotel/HotelReservationDetail.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import {
  annulerHotelEntete, approuverHotelReservation, confirmerHotelLigne,
  createHotelReservation, emissionBilletHotel, emissionFactureHotel,
  fetchHotelReservationDetail, reglerFactureHotel,
  type HotelLigne,
} from '../../../../../../app/front_office/parametre_hotel/hotelReservationEnteteSlice';
import { fetchClientFactureById } from '../../../../../../app/back_office/clientFacturesSlice';
import HotelReservationModal from '../../../../../../components/modals/Hotel/HotelReservationModal';
import HotelConfirmationModal from '../../components/HotelConfirmationModal';
import { fetchRaisonsAnnulation } from '../../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import { HotelHeader } from '../../components/HotelHeader';
import TabContainer from '../../../../../../layouts/TabContainer';
import ActionButton from '../../components/ActionButton';
import SuiviTabSection from '../../../module.suivi/SuiviTabSection';
import PanneauPreferencesClient from '../../components/PanneauPreferencesClient';
import { setShowPreferences, togglePreferences } from '../../../../../../app/uiSlice';
import { ChevronDown } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v: number) => v?.toLocaleString('fr-FR') ?? '0';
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const statusLigneConfig: Record<string, { label: string; style: string }> = {
  INITIALE:  { label: 'Initiale',  style: 'bg-gray-100 text-gray-600' },
  FAIT:      { label: 'Réservée',  style: 'bg-blue-100 text-blue-700' },
  CONFIRMEE: { label: 'Confirmée', style: 'bg-green-100 text-green-700' },
  ANNULEE:   { label: 'Annulée',   style: 'bg-red-100 text-red-700' },
};

// ── Sous-composant : carte d'une ligne ─────────────────────────────────────
interface LigneCardProps {
  ligne: HotelLigne;
  enteteStatut: string;
  onReserver: (l: HotelLigne) => void;
  onConfirmer: (l: HotelLigne) => void;
}

const LigneCard = ({ ligne, enteteStatut, onReserver, onConfirmer }: LigneCardProps) => {
  const [open, setOpen] = useState(false);
  const bench  = ligne.BenchmarkingLigne;
  const enteteB = bench?.benchmarkingEntete;
  const cfg = statusLigneConfig[ligne.statut] ?? { label: ligne.statut, style: 'bg-gray-100 text-gray-500' };

  const canReserver  = ligne.statut === 'CREER';
  const canConfirmer = ligne.statut === 'FAIT' && enteteStatut === 'BC_CLIENT_A_APPROUVER';

  return (
    <div className="border border-neutral-200 overflow-hidden bg-white shadow-sm">
      {/* ── Barre titre ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded">
            {ligne.referenceLine}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.style}`}>
            {cfg.label}
          </span>
          {ligne.numeroResa ? (
            <span className="font-mono text-xs text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded">
              {ligne.numeroResa}
            </span>
          ) : (
            <span className="text-xs text-neutral-400 italic">Pas encore réservé</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            disabled={!canReserver}
            onClick={() => onReserver(ligne)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              canReserver
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Réserver
          </button>
          <button
            disabled={!canConfirmer}
            onClick={() => onConfirmer(ligne)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              canConfirmer
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Confirmer
          </button>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded transition"
          >
            <svg
              width="11" height="11" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {open ? 'Réduire' : 'Détails'}
          </button>
        </div>
      </div>

      {/* ── Résumé toujours visible ── */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Hôtel */}
        <div className="col-span-2">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">Hôtel</p>
          <p className="text-sm font-semibold text-neutral-900">{bench?.hotel ?? '—'}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {bench?.typeChambre && (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                {bench.typeChambre.type} · {bench.typeChambre.capacite} pers.
              </span>
            )}
            {bench?.plateforme && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                {bench.plateforme.nom}
              </span>
            )}
            {bench?.isRefundable !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${bench.isRefundable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {bench.isRefundable ? 'Remboursable' : 'Non remboursable'}
              </span>
            )}
          </div>
        </div>

        {/* Séjour */}
        {enteteB && (
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">Séjour</p>
            <p className="text-xs font-medium text-neutral-800">{fmtDate(enteteB.du)} → {fmtDate(enteteB.au)}</p>
            <p className="text-[10px] text-neutral-500">{enteteB.nuite} nuit{enteteB.nuite > 1 ? 's' : ''} · {enteteB.ville}</p>
          </div>
        )}

        {/* Montant résa */}
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">Montant résa</p>
          <p className="text-sm font-semibold text-neutral-900 font-mono">{fmt(ligne.puResaMontantAriary)} Ar</p>
          {ligne.puResaMontantDevise > 0 && (
            <p className="text-[10px] text-neutral-500 font-mono">{ligne.puResaMontantDevise} dev.</p>
          )}
        </div>

        {/* Commission */}
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">Commission</p>
          <p className="text-sm font-semibold text-emerald-700 font-mono">{fmt(ligne.commissionUnitaire)} Ar</p>
          {ligne.pourcentageCommission > 0 && (
            <p className="text-[10px] text-neutral-500">{ligne.pourcentageCommission}%</p>
          )}
        </div>

        {/* Passagers */}
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">Passagers</p>
          {ligne.passagers?.length > 0 ? (
            <div className="space-y-0.5">
              {ligne.passagers.map((p, i) => (
                <p key={p.id} className="text-xs text-neutral-700">
                  <span className="text-neutral-400 mr-1">{i + 1}.</span>
                  {p.clientbeneficiaireInfo
                    ? `${p.clientbeneficiaireInfo.prenom} ${p.clientbeneficiaireInfo.nom}`
                    : <span className="font-mono text-[10px] text-neutral-400">
                        {p.clientbeneficiaireInfoId?.slice(0, 10) ?? '—'}…
                      </span>
                  }
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 italic">Aucun passager</p>
          )}
        </div>
      </div>

      {/* ── Panneau détail expandable ── */}
      {open && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-5 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ── Col 1 : Tarifs réservation ── */}
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-3">
                Tarifs réservation
              </p>

              {/* Benchmarking (référence) */}
              {bench?.deviseHotel?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-neutral-400 mb-1.5">Tarif référence (Benchmarking)</p>
                  <div className="space-y-1.5">
                    {bench.deviseHotel.map(d => (
                      <div key={d.id} className="bg-white border border-neutral-200 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold font-mono text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded">
                            {d.devise.devise}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            1 {d.devise.devise} = {fmt(d.tauxChange)} Ar
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                          <span className="text-neutral-500">Nuitée</span>
                          <span className="font-semibold text-neutral-800 font-mono">{d.nuiteDevise} {d.devise.devise}</span>
                          <span className="text-neutral-500">Nuitée</span>
                          <span className="font-semibold text-neutral-800 font-mono">{fmt(d.nuiteAriary)} Ar</span>
                          <span className="text-neutral-500">Total</span>
                          <span className="font-semibold text-neutral-800 font-mono">{d.montantDevise} {d.devise.devise}</span>
                          <span className="text-neutral-500">Total</span>
                          <span className="font-semibold text-neutral-800 font-mono">{fmt(d.montantAriary)} Ar</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Réservation réelle */}
              {ligne.numeroResa && (
                <div>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Tarif réservation réelle</p>
                  <div className="bg-white border border-blue-200 rounded-lg px-3 py-2.5 space-y-1.5">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      <span className="text-neutral-500">Taux de change</span>
                      <span className="font-semibold text-neutral-800 font-mono">{fmt(ligne.resaTauxChange)} Ar</span>
                      <span className="text-neutral-500">Nuit hôtel devise</span>
                      <span className="font-semibold text-neutral-800 font-mono">{ligne.puResaNuiteHotelDevise}</span>
                      <span className="text-neutral-500">Nuit hôtel Ar</span>
                      <span className="font-semibold text-neutral-800 font-mono">{fmt(ligne.puResaNuiteHotelAriary)} Ar</span>
                      <span className="text-neutral-500">Montant devise</span>
                      <span className="font-semibold text-neutral-800 font-mono">{ligne.puResaMontantDevise}</span>
                      <span className="text-neutral-500">Montant Ar</span>
                      <span className="font-semibold text-blue-700 font-mono">{fmt(ligne.puResaMontantAriary)} Ar</span>
                      <span className="text-neutral-500">% Commission</span>
                      <span className="font-semibold text-neutral-800">{ligne.pourcentageCommission}%</span>
                      <span className="text-neutral-500">Commission Ar</span>
                      <span className="font-semibold text-emerald-700 font-mono">{fmt(ligne.commissionUnitaire)} Ar</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Col 2 : Confirmation ── */}
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-3">
                Tarifs confirmation
              </p>
              {ligne.puConfPrixNuitHotelAriary > 0 ? (
                <div className="bg-white border border-green-200 rounded-lg px-3 py-2.5 space-y-1.5">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                    <span className="text-neutral-500">Prix nuit hôtel Ar</span>
                    <span className="font-semibold text-neutral-800 font-mono">{fmt(ligne.puConfPrixNuitHotelAriary)} Ar</span>
                    <span className="text-neutral-500">Montant nuit hôtel Ar</span>
                    <span className="font-semibold text-neutral-800 font-mono">{fmt(ligne.puConfMontantNuitHotelAriary)} Ar</span>
                    <span className="text-neutral-500">Prix nuit client Ar</span>
                    <span className="font-semibold text-neutral-800 font-mono">{fmt(ligne.puConfPrixNuitClientArary)} Ar</span>
                    <span className="text-neutral-500">Montant nuit client Ar</span>
                    <span className="font-semibold text-neutral-800 font-mono">{fmt(ligne.puConfMontantNuitClientAriary)} Ar</span>
                    <span className="text-neutral-500">Commission conf. Ar</span>
                    <span className="font-semibold text-emerald-700 font-mono">{fmt(ligne.confirmationCommissionAriary)} Ar</span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
                  <p className="text-xs text-neutral-400">Pas encore confirmé</p>
                </div>
              )}

              {/* Services inclus */}
              {enteteB?.benchService?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">
                    Services inclus
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {enteteB.benchService.map(s => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-white border border-neutral-200 text-neutral-700 px-2 py-1 rounded-lg"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        {s.serviceSpecifique.libelle}
                        <span className="text-neutral-300 font-mono text-[9px]">{s.serviceSpecifique.code}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos séjour complémentaires */}
              {enteteB && (
                <div className="mt-4 space-y-1 text-[10px]">
                  <p className="font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Infos séjour</p>
                  <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Lieu</span>
                      <span className="font-medium text-neutral-800">{enteteB.ville}, {enteteB.pays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Ref. benchmarking</span>
                      <span className="font-mono font-medium text-neutral-800">{enteteB.numero}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Commission bench.</span>
                      <span className="font-medium text-emerald-700">{fmt(enteteB.montantCommission)} Ar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Taux commission</span>
                      <span className="font-medium text-neutral-800">{enteteB.tauxPrixUnitaire}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Forfait / chambre</span>
                      <span className="font-medium text-neutral-800">{fmt(enteteB.forfaitaireUnitaire)} Ar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Forfait global</span>
                      <span className="font-medium text-neutral-800">{fmt(enteteB.forfaitaireGlobal)} Ar</span>
                    </div>
                    {bench?.dateLimiteAnnulation && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Limite annulation</span>
                        <span className="font-medium text-amber-700">{fmtDate(bench.dateLimiteAnnulation)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Col 3 : Passagers détaillés ── */}
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-3">
                Passagers
                <span className="ml-1.5 bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-full">
                  {ligne.passagers?.length ?? 0}
                </span>
              </p>

              {ligne.passagers?.length > 0 ? (
                <div className="space-y-2">
                  {ligne.passagers.map((p, i) => (
                    <div key={p.id} className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          {p.clientbeneficiaireInfo ? (
                            <>
                              <p className="text-xs font-semibold text-neutral-900">
                                {p.clientbeneficiaireInfo.prenom} {p.clientbeneficiaireInfo.nom}
                              </p>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                {p.clientbeneficiaireInfo.typeDoc} · {p.clientbeneficiaireInfo.referenceDoc}
                              </p>
                              {p.clientbeneficiaireInfo.tel && (
                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                  {p.clientbeneficiaireInfo.tel}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {p.clientbeneficiaireInfoId?.slice(0, 14) ?? '—'}…
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Préférences de service (string[] de labels) */}
                      {p.servicePreference?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-100">
                          <p className="text-[9px] text-neutral-400 uppercase tracking-wide mb-1">
                            Préférences
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.servicePreference.map((pref, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-medium"
                              >
                                {pref}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
                  <p className="text-xs text-neutral-400">Aucun passager assigné</p>
                  {ligne.statusLigne === 'INITIALE' && (
                    <p className="text-[10px] text-neutral-300 mt-1">
                      Cliquez sur "Réserver" pour ajouter des passagers
                    </p>
                  )}
                </div>
              )}

              {bench?.nombreChambre != null && (
                <div className="mt-3 text-[10px] text-neutral-400 bg-white border border-neutral-100 rounded-lg px-3 py-2">
                  {bench.nombreChambre} chambre{bench.nombreChambre > 1 ? 's' : ''} · capacité {bench.typeChambre?.capacite ?? '?'} pers.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Composant principal ────────────────────────────────────────────────────
const HotelReservationDetail = () => {
  const { enteteId } = useParams<{ enteteId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const showPreferences = useSelector((state: RootState) => state.ui.showPreferences);

  const { selectedDetail, detailLoading, detailError } = useSelector(
    (state: RootState) => state.hotelReservationEntete
  );
  const clientFactureId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.clientfacture?.id
  );
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((c: any) => c.module?.nom?.toLowerCase() === 'hotel')
    ?.prestation?.[0]?.id || '';

  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [selectedLigne, setSelectedLigne]       = useState<HotelLigne | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedLigneConfirmation, setSelectedLigneConfirmation] = useState<HotelLigne | null>(null);
  const [confirmationLoading, setConfirmationLoading] = useState(false);

  // Approbation
  const [showApprouverModal, setShowApprouverModal] = useState(false);
  const [approuverForm, setApprouverForm] = useState({ totalHotel: 0, totalCommission: 0 });
  const [approuverLoading, setApprouverLoading] = useState(false);

  // Emission Billet
  const [showEmissionBilletModal, setShowEmissionBilletModal] = useState(false);
  const [emissionBilletForm, setEmissionBilletForm] = useState({ referenceBcClient: '', totalHotel: 0, totalCommission: 0 });
  const [emissionBilletLoading, setEmissionBilletLoading] = useState(false);

  // Emission Facture
  const [showEmissionFactureModal, setShowEmissionFactureModal] = useState(false);
  const [emissionFactureForm, setEmissionFactureForm] = useState({ referenceFacClient: '' });
  const [emissionFactureLoading, setEmissionFactureLoading] = useState(false);

  // Régler Facture
  const [showReglerModal, setShowReglerModal] = useState(false);
  const [reglerLoading, setReglerLoading]     = useState(false);

  // Annulation
  const [showAnnulationModal, setShowAnnulationModal] = useState(false);
  const [annulationForm, setAnnulationForm] = useState({ rasionAnnulationId: '', conditionAnnul: '' });
  const [annulationLoading, setAnnulationLoading] = useState(false);

  const { items: raisonsAnnulation, loading: raisonsLoading } = useSelector(
    (state: RootState) => state.raisonAnnulation
  );

  const [selectedBenefForPrefs, setSelectedBenefForPrefs] = useState<any>(null);

  const tabs = [
    { id: 'prospection', label: 'Listes des entête benchmarking' },
    { id: 'hotel',       label: 'Listes des reservation hotel' },
  ];
  const [activeTab, setActiveTab]                   = useState(location.state?.targetTab || 'hotel');
  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  useEffect(() => {
    if (enteteId) dispatch(fetchHotelReservationDetail(enteteId));
  }, [dispatch, enteteId]);

  useEffect(() => {
    if (clientFactureId) dispatch(fetchClientFactureById(clientFactureId));
  }, [dispatch, clientFactureId]);

  useEffect(() => {
    if (showAnnulationModal && raisonsAnnulation.length === 0) dispatch(fetchRaisonsAnnulation());
  }, [showAnnulationModal, dispatch, raisonsAnnulation.length]);

  const reload = () => dispatch(fetchHotelReservationDetail(enteteId!));

  const handleTabChange = (id: string) => {
    if (id === 'prospection') navigate('/dossiers-communs/hotel/pages', { state: { targetTab: 'prospection' } });
    else setActiveTab(id);
  };

  const handleSubmitReservation = async (payload: any) => {
    try {
      await dispatch(createHotelReservation({ ligneId: selectedLigne!.HotelEnteteId, payload })).unwrap();
      setIsModalOpen(false);
      reload();
    } catch { alert('Erreur lors de la création de la réservation'); }
  };

  const handleApprouver = async () => {
    try {
      setApprouverLoading(true);
      await dispatch(approuverHotelReservation({ id: entete!.id, ...approuverForm })).unwrap();
      setShowApprouverModal(false);
      reload();
    } catch { alert("Erreur lors de l'approbation"); }
    finally { setApprouverLoading(false); }
  };

  const handleSubmitConfirmation = async (payload: any) => {
    try {
      setConfirmationLoading(true);
      await dispatch(confirmerHotelLigne({ ligneId: entete!.id, payload })).unwrap();
      setIsConfirmationModalOpen(false);
      reload();
    } catch { alert('Erreur lors de la confirmation'); }
    finally { setConfirmationLoading(false); }
  };

  const handleEmissionBillet = async () => {
    try {
      setEmissionBilletLoading(true);
      await dispatch(emissionBilletHotel({ id: entete!.id, payload: emissionBilletForm })).unwrap();
      setShowEmissionBilletModal(false);
      reload();
    } catch { alert("Erreur lors de l'émission du billet"); }
    finally { setEmissionBilletLoading(false); }
  };

  const handleEmissionFacture = async () => {
    try {
      setEmissionFactureLoading(true);
      await dispatch(emissionFactureHotel({ id: entete!.id, payload: emissionFactureForm })).unwrap();
      setShowEmissionFactureModal(false);
      reload();
    } catch { alert("Erreur lors de l'émission de la facture"); }
    finally { setEmissionFactureLoading(false); }
  };

  const handleReglerFacture = async () => {
    try {
      setReglerLoading(true);
      await dispatch(reglerFactureHotel(entete!.id)).unwrap();
      setShowReglerModal(false);
      reload();
    } catch { alert('Erreur lors du règlement'); }
    finally { setReglerLoading(false); }
  };

  const handleAnnuler = async () => {
    try {
      setAnnulationLoading(true);
      await dispatch(annulerHotelEntete({ id: entete!.id, payload: annulationForm })).unwrap();
      setShowAnnulationModal(false);
      navigate(-1);
    } catch { alert("Erreur lors de l'annulation"); }
    finally { setAnnulationLoading(false); }
  };

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('dossierActifCard_isOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggle = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem('dossierActifCard_isOpen', String(next));
      return next;
    });
  };

  const entete = selectedDetail;
  const hasNonRefundableLignes = entete?.hotelLigne.some(l => !l.BenchmarkingLigne?.isRefundable);

  const totalHotel      = entete?.hotelLigne.reduce((s, l) => s + (l.puResaMontantAriary || 0), 0) ?? 0;
  const totalCommission = entete?.hotelLigne.reduce((s, l) => s + (l.commissionUnitaire || 0), 0) ?? 0;

  const toutesLignesFait =
    (entete?.hotelLigne.length ?? 0) > 0 &&
    entete!.hotelLigne.every(l => l.statut === 'FAIT');

  const canApprouverBillet =
    entete?.statut === 'CREER' && toutesLignesFait;

  const toutesLignesCloturees =
    (entete?.hotelLigne.length ?? 0) > 0 &&
    entete!.hotelLigne.every(l => l.statut === 'CLOTURER');

  const canEmissionBillet =
    entete?.statut === 'BC_CLIENT_A_APPROUVER' && toutesLignesCloturees;

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* ── Header fixe — ne scrolle PAS ── */}
            <div className="shrink-0 px-4 pt-2 bg-white">
              <div className="flex justify-between">
                <HotelHeader numerohotel={entete?.HotelProspectionEntete.numeroEntete} navigate={navigate} isDetail={true} />
                {/* ── Titre + actions ── */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <ActionButton label="BC Approuver" enabled={canApprouverBillet} variant="success"
                      onClick={() => { setApprouverForm({ totalHotel, totalCommission }); setShowApprouverModal(true); }}
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    />
                    <ActionButton
                      label="Émission Billet"
                      enabled={canEmissionBillet}
                      variant="primary"
                      onClick={() => {
                        setEmissionBilletForm({ referenceBcClient: '', totalHotel, totalCommission });
                        setShowEmissionBilletModal(true);
                      }}
                      icon={
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      }
                    />
                    <ActionButton label="Émission Facture" enabled={entete?.statut === 'BILLET_EMIS'} variant="purple"
                      onClick={() => { setEmissionFactureForm({ referenceFacClient: '' }); setShowEmissionFactureModal(true); }}
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    />
                    <ActionButton label="Régler Facture" enabled={entete?.statut === 'FACTURE_EMISE'} variant="warning"
                      onClick={() => setShowReglerModal(true)}
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    />
                    <ActionButton label="Annuler" enabled={entete?.statut !== 'ANNULER'} variant="danger"
                      onClick={() => { setAnnulationForm({ rasionAnnulationId: '', conditionAnnul: '' }); setShowAnnulationModal(true); }}
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
                    />
                    <button
                      onClick={() => dispatch(togglePreferences())}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-md transition-colors ${
                        showPreferences
                          ? 'bg-slate-700 text-white border border-neutral-300'
                          : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {/* {showPreferences ? 'Préférences' : 'Préférences'} */}
                      Préférences
                    </button> 
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-slate-200 pl-2 pr-2 mb-2'>
                <div className='cursor-pointer pl-4 ' onClick={handleToggle}>
                  <div className='flex items-center gap-2 justify-between'>
                    <div className='flex items-center gap-2'>
                      <h1 className="text-xl font-bold text-neutral-800 uppercase">
                        {entete?.HotelProspectionEntete.numeroEntete}
                      </h1>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Statut : <span className="font-semibold">{entete?.statut === 'CREER' ? 'Créé' : (entete?.statut ?? '…')}</span>
                      </p>
                    </div>
                    <button
                      className="px-1 gap-2 rounded-lg text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                      title={isOpen ? 'Réduire' : 'Agrandir'}
                      >
                      Detail
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-250 ${isOpen ? '' : '-rotate-90'}`}
                      /> 
                    </button>
                  </div>
                  
                </div>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  >
                  {/* ── Infos générales ── */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-4 pr-4 my-2">
                    <div className="">
                      <p className="text-xs text-neutral-500 mb-1">Fournisseur</p>
                      <p className="text-sm font-semibold text-neutral-900">{entete?.HotelProspectionEntete.fournisseur.libelle}</p>
                      <p className="text-xs text-neutral-400 font-mono">{entete?.HotelProspectionEntete.fournisseur.code}</p>
                    </div>
                    <div className="">
                      <p className="text-xs text-neutral-500 mb-1">Dossier</p>
                      <p className="text-sm font-semibold text-neutral-900">{entete?.HotelProspectionEntete.prestation.numeroDos || '—'}</p>
                    </div>
                    <div className="">
                      <p className="text-xs text-neutral-500 mb-1">Total hôtel</p>
                      <p className="text-sm font-semibold text-neutral-900 font-mono">{fmt(totalHotel)} Ar</p>
                    </div>
                    <div className="">
                      <p className="text-xs text-neutral-500 mb-1">Total commission</p>
                      <p className="text-sm font-semibold text-emerald-700 font-mono">{fmt(totalCommission)} Ar</p>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex mb-0" aria-label="Tabs">
                {(['lignes', 'suivi'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTabSousSection(tab)}
                    className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                      activeTabSousSection === tab
                        ? 'bg-[#4A77BE] text-white shadow-sm'
                        : 'bg-white text-[#1E3A8A] hover:bg-[#f2f7fe] border-t border-l border-r border-slate-200'
                    }`}
                  >
                    {tab === 'lignes' ? `Lignes de réservation (${entete?.hotelLigne.length ?? 0})` : 'Suivi'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">
              {/* ── Onglets internes ── */}
              {selectedDetail && (
                <div>
                  <div className="bg-white border border-slate-100 rounded-b-lg rounded-tr-lg">
                    {/* ── Lignes ── */}
                    {activeTabSousSection === 'lignes' && (
                      <div className="space-y-4">
                        {detailLoading && (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                          </div>
                        )}
                        {!detailLoading && entete?.hotelLigne.length === 0 && (
                          <div className="text-center py-12 text-neutral-400 text-sm">Aucune ligne de réservation</div>
                        )}
                        {entete?.hotelLigne.map(ligne => (
                          <LigneCard
                            key={ligne.id}
                            ligne={ligne}
                            enteteStatut={entete.statut}
                            onReserver={(l) => { setSelectedLigne(l); setIsModalOpen(true); }}
                            onConfirmer={(l) => { setSelectedLigneConfirmation(l); setIsConfirmationModalOpen(true); }}
                          />
                        ))}
                      </div>
                    )}

                    {/* ── Suivi ── */}
                    {activeTabSousSection === 'suivi' && (
                      <SuiviTabSection prestationId={prestationId} />
                    )}
                  </div>
                </div>
              )}

              {/* ── Modals (inchangés) ── */}
              <HotelConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => setIsConfirmationModalOpen(false)}
                onSubmit={handleSubmitConfirmation}
                ligne={selectedLigneConfirmation}
                loading={confirmationLoading}
              />
              <HotelReservationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitReservation}
                ligne={selectedLigne}
              />

              {/* Modal Approbation */}
              {showApprouverModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">BC à approuver</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{entete?.HotelProspectionEntete.numeroEntete}</p>
                      </div>
                      <button onClick={() => setShowApprouverModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { key: 'totalHotel', label: 'Total Hôtel (Ar)', calc: totalHotel },
                        { key: 'totalCommission', label: 'Total Commission (Ar)', calc: totalCommission },
                      ].map(({ key, label, calc }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">{label} <span className="text-red-600">*</span></label>
                          <input type="number" value={(approuverForm as any)[key]}
                            onChange={e => setApprouverForm(p => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">Calculé depuis les lignes : {fmt(calc)} Ar</p>
                        </div>
                      ))}
                      <div className="bg-green-50 border border-green-200 rounded p-4 space-y-2 text-sm">
                        <p className="text-xs font-semibold text-green-800 uppercase">Récapitulatif</p>
                        <div className="flex justify-between"><span className="text-gray-600">Total Hôtel</span><span className="font-semibold">{fmt(approuverForm.totalHotel)} Ar</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total Commission</span><span className="font-semibold text-emerald-700">{fmt(approuverForm.totalCommission)} Ar</span></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => setShowApprouverModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                      <button onClick={handleApprouver} disabled={approuverLoading}
                        className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${approuverLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {approuverLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</> : '✓ Confirmer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Émission Billet */}
              {showEmissionBilletModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Émission Billet Hôtel</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{entete?.HotelProspectionEntete.numeroEntete}</p>
                      </div>
                      <button onClick={() => setShowEmissionBilletModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Référence BC Client <span className="text-red-600">*</span></label>
                        <input type="text" value={emissionBilletForm.referenceBcClient}
                          onChange={e => setEmissionBilletForm(p => ({ ...p, referenceBcClient: e.target.value }))}
                          placeholder="BC-2024-001"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {[
                        { key: 'totalHotel', label: 'Total Hôtel (Ar)' },
                        { key: 'totalCommission', label: 'Total Commission (Ar)' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">{label} <span className="text-red-600">*</span></label>
                          <input type="number" value={(emissionBilletForm as any)[key]}
                            onChange={e => setEmissionBilletForm(p => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                      <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-2 text-sm">
                        <p className="text-xs font-semibold text-blue-800 uppercase">Récapitulatif</p>
                        <div className="flex justify-between"><span className="text-gray-600">Référence BC</span><span className="font-semibold">{emissionBilletForm.referenceBcClient || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total Hôtel</span><span className="font-semibold">{fmt(emissionBilletForm.totalHotel)} Ar</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total Commission</span><span className="font-semibold text-emerald-700">{fmt(emissionBilletForm.totalCommission)} Ar</span></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => setShowEmissionBilletModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                      <button onClick={handleEmissionBillet} disabled={emissionBilletLoading || !emissionBilletForm.referenceBcClient}
                        className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${emissionBilletLoading || !emissionBilletForm.referenceBcClient ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {emissionBilletLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</> : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Émission Facture */}
              {showEmissionFactureModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Émission Facture Hôtel</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{entete?.HotelProspectionEntete.numeroEntete}</p>
                      </div>
                      <button onClick={() => setShowEmissionFactureModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Référence Facture Client <span className="text-red-600">*</span></label>
                        <input type="text" value={emissionFactureForm.referenceFacClient}
                          onChange={e => setEmissionFactureForm({ referenceFacClient: e.target.value })}
                          placeholder="FAC-2024-001"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                      <div className="bg-violet-50 border border-violet-200 rounded p-4 text-sm">
                        <p className="text-xs font-semibold text-violet-800 uppercase mb-2">Récapitulatif</p>
                        <div className="flex justify-between"><span className="text-gray-600">Référence Facture</span><span className="font-semibold">{emissionFactureForm.referenceFacClient || '—'}</span></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => setShowEmissionFactureModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                      <button onClick={handleEmissionFacture} disabled={emissionFactureLoading || !emissionFactureForm.referenceFacClient}
                        className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${emissionFactureLoading || !emissionFactureForm.referenceFacClient ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                      >
                        {emissionFactureLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</> : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Régler Facture */}
              {showReglerModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Régler la Facture</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{entete?.HotelProspectionEntete.numeroEntete}</p>
                      </div>
                      <button onClick={() => setShowReglerModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                        <p className="text-sm font-semibold text-orange-800">Confirmez-vous le règlement de cette facture ?</p>
                        <p className="text-xs text-orange-600 mt-1">Cette action marquera la facture comme réglée.</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">En-tête</span><span className="font-semibold">{entete?.HotelProspectionEntete.numeroEntete}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Fournisseur</span><span className="font-semibold">{entete?.HotelProspectionEntete.fournisseur.libelle}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Total hôtel</span><span className="font-semibold">{fmt(totalHotel)} Ar</span></div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                        <span>⚠️</span>
                        <p className="text-xs text-amber-800">Cette action est <strong>irréversible</strong>.</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => setShowReglerModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                      <button onClick={handleReglerFacture} disabled={reglerLoading}
                        className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${reglerLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                      >
                        {reglerLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</> : 'Confirmer le règlement'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Annulation */}
              {showAnnulationModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-red-800">Annulation de réservation</h3>
                        <p className="text-sm text-red-600 mt-0.5">
                          {entete?.HotelProspectionEntete.numeroEntete} — {entete?.HotelProspectionEntete.fournisseur.libelle}
                        </p>
                      </div>
                      <button onClick={() => setShowAnnulationModal(false)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Raison d'annulation <span className="text-red-600">*</span></label>
                        {raisonsLoading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Chargement des raisons...
                          </div>
                        ) : (
                          <select value={annulationForm.rasionAnnulationId}
                            onChange={e => setAnnulationForm(p => ({ ...p, rasionAnnulationId: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          >
                            <option value="">Sélectionner une raison</option>
                            {raisonsAnnulation.filter(r => r.statut === 'ACTIF').map(r => (
                              <option key={r.id} value={r.id}>{r.libelle}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Condition d'annulation <span className="text-red-600">*</span></label>
                        <input type="text" value={annulationForm.conditionAnnul}
                          onChange={e => setAnnulationForm(p => ({ ...p, conditionAnnul: e.target.value }))}
                          placeholder="Ex: Annulation client, force majeure..."
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      {(annulationForm.rasionAnnulationId || annulationForm.conditionAnnul) && (
                        <div className="bg-red-50 border border-red-200 rounded p-4 space-y-2 text-sm">
                          <p className="text-xs font-semibold text-red-800 uppercase">Récapitulatif</p>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Raison</span>
                            <span className="font-semibold">{raisonsAnnulation.find(r => r.id === annulationForm.rasionAnnulationId)?.libelle || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Condition</span>
                            <span className="font-semibold">{annulationForm.conditionAnnul || '—'}</span>
                          </div>
                        </div>
                      )}
                      <div className={`border rounded p-3 flex items-start gap-2 ${hasNonRefundableLignes ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-200'}`}>
                        <span>{hasNonRefundableLignes ? '🚨' : '⚠️'}</span>
                        <div>
                          <p className={`text-xs font-bold ${hasNonRefundableLignes ? 'text-red-800' : 'text-amber-800'}`}>
                            Cette action est <strong>irréversible</strong>.
                          </p>
                          {hasNonRefundableLignes && (
                            <p className="text-xs text-red-700 mt-1 font-semibold">
                              Certaines lignes sont <strong>non remboursables</strong>. Des frais d'annulation peuvent s'appliquer.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => setShowAnnulationModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Fermer</button>
                      <button onClick={handleAnnuler}
                        disabled={annulationLoading || !annulationForm.rasionAnnulationId || !annulationForm.conditionAnnul.trim()}
                        className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                          annulationLoading || !annulationForm.rasionAnnulationId || !annulationForm.conditionAnnul.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {annulationLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Annulation...</> : "Confirmer l'annulation"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* ── Panneau latéral persistant ── */}
          <PanneauPreferencesClient
            isOpen={showPreferences}
            onClose={() => dispatch(setShowPreferences(false))}
            prestationId={prestationId}
          />
        </div>
      </TabContainer>
    </div>
  );
};

export default HotelReservationDetail;