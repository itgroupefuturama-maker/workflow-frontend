import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import { fetchHotelReservations } from '../../../../../../app/front_office/parametre_hotel/hotelReservationEnteteSlice';
import { useNavigate } from 'react-router-dom';
import { HotelHeader } from '../../components/HotelHeader';
import DossierActifCard from '../../../../../../components/CarteDossierActif/DossierActifCard';
import { setShowPreferences, togglePreferences } from '../../../../../../app/uiSlice';
import SuiviTabSection from '../../../module.suivi/SuiviTabSection';
import PanneauPreferencesClient from '../../components/PanneauPreferencesClient';

interface Props {
  prestationId: string;
  dossierNumero?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const statutLabel: Record<string, string> = {
  CREER: 'Créé',
  APPORUVER: 'Approuvé',
  FACTURE_EMISE: 'Facture émise',
  ANNULER: 'Annulé',
};

const statutStyle: Record<string, string> = {
  FACTURE_EMISE: 'bg-green-100 text-green-800',
  ANNULER: 'bg-red-100 text-red-800',
  APPORUVER: 'bg-blue-100 text-blue-800',
  CREER: 'bg-amber-100 text-amber-800',
};

const statusLigneStyle: Record<string, string> = {
  INITIALE:     'bg-gray-100 text-gray-600',
  RESERVEE:     'bg-blue-100 text-blue-700',
  CONFIRMEE:    'bg-green-100 text-green-700',
  ANNULEE:      'bg-red-100 text-red-700',
};

const formatMontant = (v: number) => v.toLocaleString('fr-FR');
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Composant principal ────────────────────────────────────────────────────
const HotelReservationsList = ({ prestationId, dossierNumero }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const showPreferences = useSelector((state: RootState) => state.ui.showPreferences);
  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  // Ligne expandée pour voir le détail (devises + services + passagers)
  const [expandedLigneId, setExpandedLigneId] = useState<string | null>(null);

  const {
    items: reservations = [],
    loading: reservationsLoading,
    error: reservationsError,
  } = useSelector((state: RootState) => state.hotelReservationEntete);

  useEffect(() => {
    if (!prestationId) return;
    dispatch(fetchHotelReservations(prestationId));
  }, [dispatch, prestationId]);

  const sorted = [...reservations].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* ── Header fixe — ne scrolle PAS ── */}
        <div className="shrink-0 px-4 pt-2 bg-white">
          <div className='flex items-center justify-between'>
            <HotelHeader numerohotel={dossierNumero} navigate={navigate} isBenchmarking={false} />
            <button
              onClick={() => dispatch(togglePreferences())}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                showPreferences
                  ? 'bg-slate-700 text-white'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {showPreferences ? 'Masquer les préférences' : 'Préférences client'}
            </button> 
          </div>
        </div>
        <div className='px-4'>
          <DossierActifCard gradient="from-orange-400 via-red-400 to-orange-500 " />
          {/* ── Header page ── */}
          <div className='flex items-center justify-between'> 
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
                  Liste des Réservations Hôtel
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
            <button
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
            >
              <svg
                width="13" height="13" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}
                className={`transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-4">
          {activeTabSousSection === 'lignes' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* ── États ── */}
              {reservationsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">Chargement des réservations...</p>
                  </div>
                </div>
              ) : reservationsError ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm">
                  {reservationsError}
                </div>
              ) : reservations.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-neutral-500">Aucune réservation trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sorted.map(entete => {
                    const montantTotal = entete.hotelLigne.reduce((s, l) => s + (l.puResaMontantAriary || 0), 0);
                    const commission   = entete.hotelLigne.reduce((s, l) => s + (l.commissionUnitaire || 0), 0);

                    return (
                      <div key={entete.id} className="bg-white border border-neutral-200 overflow-hidden shadow-sm">

                        {/* ── En-tête de la carte ── */}
                        <div
                          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                          onClick={() => navigate(`/dossiers-communs/hotel/detailsHotel/${entete.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            {/* Numéro */}
                            <div className="font-mono text-sm font-semibold text-neutral-900 bg-neutral-100 px-3 py-1.5 rounded-lg">
                              {entete.HotelProspectionEntete.numeroEntete}
                            </div>

                            {/* Statut */}
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statutStyle[entete.statut] ?? 'bg-neutral-100 text-neutral-600'}`}>
                              {statutLabel[entete.statut] ?? entete.statut}
                            </span>

                            {/* Fournisseur */}
                            <div className="hidden sm:flex flex-col">
                              <span className="text-sm font-medium text-neutral-800">
                                {entete.HotelProspectionEntete.fournisseur.libelle}
                              </span>
                              <span className="text-xs text-neutral-400 font-mono">
                                {entete.HotelProspectionEntete.fournisseur.code}
                                {' · '}
                                {entete.HotelProspectionEntete.prestation.numeroDos}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Totaux */}
                            <div className="text-right hidden md:block">
                              <div className="text-xs text-neutral-400 mb-0.5">Total hôtel</div>
                              <div className="font-mono text-sm font-semibold text-neutral-900">
                                {formatMontant(montantTotal)} Ar
                              </div>
                            </div>
                            <div className="text-right hidden md:block">
                              <div className="text-xs text-neutral-400 mb-0.5">Commission</div>
                              <div className="font-mono text-sm font-semibold text-emerald-700">
                                {formatMontant(commission)} Ar
                              </div>
                            </div>
                            {/* Nb lignes */}
                            <div className="text-right">
                              <div className="text-xs text-neutral-400 mb-0.5">Lignes</div>
                              <div className="text-sm font-semibold text-neutral-800">{entete.hotelLigne.length}</div>
                            </div>
                            {/* Date */}
                            <div className="text-right hidden lg:block">
                              <div className="text-xs text-neutral-400 mb-0.5">Créé le</div>
                              <div className="text-xs text-neutral-600">{formatDate(entete.createdAt)}</div>
                            </div>
                            {/* Chevron détail */}
                            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        {/* ── Lignes hôtel ── */}
                        {entete.hotelLigne.length > 0 && (
                          <div className="border-t border-neutral-100 divide-y divide-neutral-100">
                            {entete.hotelLigne.map(ligne => {
                              const bench  = ligne.BenchmarkingLigne;
                              const enteteB = bench?.benchmarkingEntete;
                              const isExpanded = expandedLigneId === ligne.id;

                              return (
                                <div key={ligne.id}>

                                  {/* ── Ligne principale ── */}
                                  <div className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors">

                                    {/* Gauche : hôtel + chambre + plateforme */}
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Ref */}
                                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                                        {ligne.referenceLine}
                                      </span>

                                      {/* Hôtel */}
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-neutral-900 truncate">
                                          {bench?.hotel ?? '—'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                          {bench?.typeChambre && (
                                            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                                              {bench.typeChambre.type}
                                              {bench.typeChambre.capacite ? ` · ${bench.typeChambre.capacite} pers.` : ''}
                                            </span>
                                          )}
                                          {bench?.plateforme && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                              {bench.plateforme.nom}
                                            </span>
                                          )}
                                          {enteteB && (
                                            <span className="text-[10px] text-neutral-400">
                                              {formatDate(enteteB.du)} → {formatDate(enteteB.au)}
                                              {' · '}{enteteB.nuite} nuit{enteteB.nuite > 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Centre : statut ligne + numéro resa */}
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusLigneStyle[ligne.statusLigne] ?? 'bg-gray-100 text-gray-500'}`}>
                                        {ligne.statusLigne}
                                      </span>
                                      {ligne.numeroResa ? (
                                        <span className="font-mono text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                                          {ligne.numeroResa}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-neutral-400 italic">Pas de réservation</span>
                                      )}
                                    </div>

                                    {/* Droite : montant + expand */}
                                    <div className="flex items-center gap-4 shrink-0">
                                      {ligne.puResaMontantAriary > 0 && (
                                        <div className="text-right">
                                          <div className="font-mono text-sm font-semibold text-neutral-900">
                                            {formatMontant(ligne.puResaMontantAriary)} Ar
                                          </div>
                                          {ligne.commissionUnitaire > 0 && (
                                            <div className="font-mono text-xs text-emerald-600">
                                              com. {formatMontant(ligne.commissionUnitaire)} Ar
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Bouton expand devises/services/passagers */}
                                      <button
                                        onClick={() => setExpandedLigneId(isExpanded ? null : ligne.id)}
                                        className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                      >
                                        <svg
                                          width="10" height="10" fill="none" viewBox="0 0 24 24"
                                          stroke="currentColor" strokeWidth={2.5}
                                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                        {isExpanded ? 'Réduire' : 'Détails'}
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── Panneau expandé ── */}
                                  {isExpanded && (
                                    <div className="px-5 pb-4 pt-1 bg-neutral-50/70 border-t border-neutral-100">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        {/* Devises */}
                                        <div>
                                          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                                            Tarifs par devise
                                          </p>
                                          {bench?.deviseHotel?.length > 0 ? (
                                            <div className="space-y-1.5">
                                              {bench.deviseHotel.map(d => (
                                                <div key={d.id} className="bg-white border border-neutral-200 rounded-lg px-3 py-2">
                                                  <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded font-mono">
                                                      {d.devise.devise}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">
                                                      1 {d.devise.devise} = {formatMontant(d.tauxChange)} Ar
                                                    </span>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-x-3 text-[10px] text-neutral-500">
                                                    <div>Nuitée <span className="font-semibold text-neutral-800">{d.nuiteDevise} {d.devise.devise}</span></div>
                                                    <div>Nuitée <span className="font-semibold text-neutral-800">{formatMontant(d.nuiteAriary)} Ar</span></div>
                                                    <div>Total <span className="font-semibold text-neutral-800">{d.montantDevise} {d.devise.devise}</span></div>
                                                    <div>Total <span className="font-semibold text-neutral-800">{formatMontant(d.montantAriary)} Ar</span></div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-neutral-400 italic">Aucune devise</p>
                                          )}
                                        </div>

                                        {/* Services inclus */}
                                        <div>
                                          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                                            Services inclus
                                          </p>
                                          {enteteB?.benchService?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {enteteB.benchService.map(s => (
                                                <span
                                                  key={s.id}
                                                  className="inline-flex items-center gap-1 text-[10px] font-medium bg-white border border-neutral-200 text-neutral-700 px-2 py-1 rounded-lg"
                                                >
                                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                  {s.serviceSpecifique.libelle}
                                                  <span className="text-neutral-300 font-mono">{s.serviceSpecifique.code}</span>
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-neutral-400 italic">Aucun service</p>
                                          )}

                                          {/* Infos séjour */}
                                          {enteteB && (
                                            <div className="mt-3 space-y-1 text-[10px] text-neutral-500">
                                              <div className="flex justify-between">
                                                <span>Ville</span>
                                                <span className="font-medium text-neutral-700">{enteteB.ville}, {enteteB.pays}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Commission</span>
                                                <span className="font-medium text-emerald-700">{formatMontant(enteteB.montantCommission)} Ar</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Taux commission</span>
                                                <span className="font-medium text-neutral-700">{enteteB.tauxPrixUnitaire}%</span>
                                              </div>
                                              {bench?.isRefundable !== undefined && (
                                                <div className="flex justify-between">
                                                  <span>Remboursable</span>
                                                  <span className={`font-medium ${bench.isRefundable ? 'text-green-600' : 'text-red-500'}`}>
                                                    {bench.isRefundable ? 'Oui' : 'Non'}
                                                  </span>
                                                </div>
                                              )}
                                              {bench?.dateLimiteAnnulation && (
                                                <div className="flex justify-between">
                                                  <span>Limite annulation</span>
                                                  <span className="font-medium text-amber-700">{formatDate(bench.dateLimiteAnnulation)}</span>
                                                </div>
                                              )}
                                            </div>
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
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── Pied de carte ── */}
                        <div className="bg-neutral-50 border-t border-neutral-100 px-5 py-2.5 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-400">
                            Créé le {formatDate(entete.createdAt)}
                          </span>
                          <button
                            onClick={() => navigate(`/dossiers-communs/hotel/detailsHotel/${entete.id}`)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors flex items-center gap-1"
                          >
                            Voir le détail complet
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div> 
              )}
            </div>
          )}
          {activeTabSousSection === 'suivi' && (
            <SuiviTabSection
              prestationId={prestationId}
            />
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
  );
};

export default HotelReservationsList;