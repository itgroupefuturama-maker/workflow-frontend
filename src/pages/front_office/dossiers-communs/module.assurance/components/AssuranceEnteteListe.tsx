import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchAssuranceEntetes, type AssuranceLigne } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteSlice';
import { AssuranceHeader } from './AssuranceHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiFile } from 'react-icons/fi';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import AddPassagerAssuranceModal from './AddPassagerAssuranceModal';
import { genererPortailAssurance } from '../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice';
import { API_URL } from '../../../../../service/env';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';
import InfoMessage from '../../../../../components/InfoMessage/InfoMessage';

/* ─────────────────────── helpers ─────────────────────── */

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtNum = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('fr-FR') : '—';

/* ─────────────────────── atoms ───────────────────────── */

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    créé:    'bg-gray-100 text-gray-600 border-gray-200 uppercase',
    assigné: 'bg-emerald-50 text-emerald-700 border-emerald-200 uppercase',
    envoyé:   'bg-emerald-50 text-emerald-700 border-emerald-200 uppercase',
    approuvé: 'bg-emerald-50 text-emerald-700 border-emerald-200 uppercase',
    inactif:  'bg-gray-100 text-gray-500 border-gray-200 uppercase',
  };
  const cls = colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
    {children}
  </th>
);

const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
    {children}
  </td>
);

/* ── Ligne expandée ── */
const LigneDetail = ({ ligne }: { ligne: AssuranceLigne }) => {
  const vp = ligne.assuranceProspectionLigne;
  const ap = vp?.assuranceParams;

  return (
    <div className="space-y-4">

      {/* Séjour */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Séjour</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Départ',       value: fmtDate(vp?.dateDepart) },
            { label: 'Retour',       value: fmtDate(vp?.dateRetour) },
            { label: 'Durée',        value: vp?.duree ? `${vp.duree} jours` : '—' },
            { label: 'Taux change',  value: vp?.tauxChange ? `${fmtNum(vp.tauxChange)} Ar` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Facturation */}
      {(ligne.puFactureClientAriary || ligne.numeroPolice || ligne.numeroQuittance) && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-2">Facturation</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'PU assureur (Ar)',  value: fmtNum(ligne.puFactureAssureurAriary) },
              { label: 'Commission (Ar)',   value: fmtNum(ligne.commissionFactureAriary) },
              { label: 'PU client (Ar)',    value: fmtNum(ligne.puFactureClientAriary) },
              { label: 'N° police',         value: ligne.numeroPolice ?? '—' },
              { label: 'N° quittance',      value: ligne.numeroQuittance ?? '—' },
              { label: 'Taux change',       value: fmtNum(ligne.tauxChangeFacture) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Params assurance */}
        {ap && (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-3">Paramètres assurance</p>

            <div className="space-y-4">

            {/* Info générale */}
            <div className="bg-white border border-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Zone destination</span>
                <span className="font-semibold text-gray-800">{ap.zoneDestination}</span>
                </div>
            </div>

            {/* Tarifs plein */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Tarifs plein</p>
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                    {ap.assuranceTarifPlein?.length ?? 0}
                </span>
                </div>
                {!ap.assuranceTarifPlein || ap.assuranceTarifPlein.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucun tarif plein</p>
                ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-amber-50">
                        <th className="px-3 py-2 text-left font-semibold text-amber-600">Borne (j)</th>
                        <th className="px-3 py-2 text-left font-semibold text-amber-600">Devise</th>
                        <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix assureur</th>
                        <th className="px-3 py-2 text-right font-semibold text-amber-600">Commission</th>
                        <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix client</th>
                        <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix client (Ar)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ap.assuranceTarifPlein.map((t) => (
                        <tr key={t.id} className="bg-white border-t border-gray-100">
                            <td className="px-3 py-2">
                            <span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">
                                {t.borneInf} – {t.borneSup}
                            </span>
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-gray-700">{t.devise}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{fmtNum(t.prixAssureurDevise)}</td>
                            <td className="px-3 py-2 text-right text-amber-600 font-semibold">{fmtNum(t.commissionDevise)}</td>
                            <td className="px-3 py-2 text-right text-indigo-700 font-bold">{fmtNum(t.prixClientDevise)}</td>
                            <td className="px-3 py-2 text-right text-indigo-700 font-bold">{fmtNum(t.prixClientAriary)} Ar</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* Tarifs réduit */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Tarifs réduits</p>
                <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                    {ap.assuranceTarifReduit?.length ?? 0}
                </span>
                </div>
                {!ap.assuranceTarifReduit || ap.assuranceTarifReduit.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucun tarif réduit</p>
                ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-violet-50">
                        <th className="px-3 py-2 text-left font-semibold text-violet-600">Borne (j)</th>
                        <th className="px-3 py-2 text-left font-semibold text-violet-600">Taux appliqué</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ap.assuranceTarifReduit.map((t) => (
                        <tr key={t.id} className="bg-white border-t border-gray-100">
                            <td className="px-3 py-2">
                            <span className="font-mono bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-semibold">
                                {t.borneInf} – {t.borneSup}
                            </span>
                            </td>
                            <td className="px-3 py-2">
                            <span className="text-lg font-bold text-violet-600">
                                {(t.tauxApplique * 100).toFixed(0)}%
                            </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* Documents requis */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Documents requis</p>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                    {ap.assuranceDocParams?.length ?? 0}
                </span>
                </div>
                {!ap.assuranceDocParams || ap.assuranceDocParams.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucun document requis</p>
                ) : (
                <div className="flex flex-wrap gap-2">
                    {ap.assuranceDocParams.map((doc) => (
                    <div key={doc.id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <span className="text-sm">📄</span>
                        <span className="text-xs font-semibold text-gray-800 font-mono">{doc.assuranceDoc.codeDoc}</span>
                        <span className="text-xs font-semibold text-gray-800 font-mono">{doc.assuranceDoc.document}</span>
                    </div>
                    ))}
                </div>
                )}
            </div>

            </div>
        </div>
        )}
    </div>
  );
};

/* ─────────────────────── composant principal ─────────────────────── */

const AssuranceEnteteListe = () => {
  const location = useLocation();
  const { entetes, loading, error } = useSelector((s: RootState) => s.assuranceEntete);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedLignes, setExpandedLignes] = useState<Record<string, boolean>>({});

  const toggleEntete = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const toggleLigne  = (id: string) => setExpandedLignes(p => ({ ...p, [id]: !p[id] }));
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [genLoading, setGenLoading] = useState<Record<string, boolean>>({});
  const [genDone,    setGenDone]    = useState<Record<string, boolean>>({});

  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  const handleGenerer = async (e: React.MouseEvent, assuranceEnteteId: string) => {
    e.stopPropagation();
    setGenLoading(p => ({ ...p, [assuranceEnteteId]: true }));
    try {
      await dispatch(genererPortailAssurance(assuranceEnteteId)).unwrap();
      dispatch(fetchAssuranceEntetes(prestationId));
      setGenDone(p => ({ ...p, [assuranceEnteteId]: true }));
    } catch (err) {
      // tu peux gérer l'erreur ici si besoin
    } finally {
      setGenLoading(p => ({ ...p, [assuranceEnteteId]: false }));
    }
  };


  const [addPassagerModal, setAddPassagerModal] = useState<{
    assuranceEnteteId: string;
    lignes: AssuranceLigne[];
  } | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Spinner /> <span className="text-sm">Chargement…</span>
    </div>
  );

  if (error) return <InfoMessage title={error} icon="info" />;

  if (entetes.length === 0) return (
    <InfoMessage title="Aucune assurance trouvée." icon="empty" />
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <AssuranceHeader
          numeroassurance={''}
          nomPassager={''}
          navigate={navigate}
          isDetail={false}
          isProspection={false}
          isDevis={false}
          />

      <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />

      <div className="flex items-center justify-between">
        {/* Tab headers */}
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
              Liste des assurances ({entetes.length})
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
            width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className={`transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
        </button>
      </div>

      {activeTabSousSection === 'lignes' && (
        <div className="space-y-4 overflow-hidden">
          {[...entetes]
            .sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            })
            .map((entete) => (
            <div key={entete.id} className="bg-white border border-gray-200 rounded-br-xl rounded-bl-xl rounded-tr-xl shadow-sm overflow-hidden">

              {/* ── Header entete ── */}
              <div
                className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => toggleEntete(entete.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                    <FiFile/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {entete.assuranceProspectionEntete.fournisseur.libelle}
                      {' · '}
                      {entete.assuranceProspectionEntete.fournisseur.code}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entete.assuranceProspectionEntete.prestation.numeroDos}
                    </p>
                  </div>
                  {/* <StatusBadge status={entete.statut} /> */}
                  <StatusBadge status={entete.statutEntete == 'CREER' ? 'créé' : entete.statutEntete == 'ASSIGNER' ? 'assigné' : entete.statutEntete == 'ENVOYE' ? 'envoyé' : entete.statutEntete == 'APPROUVE' ? 'approuvé' : entete.statutEntete == 'INACTIF' ? 'inactif' : entete.statutEntete} />
                  {entete.pdfLogin != null && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={`${API_URL}/${entete.pdfLogin}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="
                          flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700
                          bg-linear-to-b from-white to-[#f0f0f0]
                          border border-gray-300 rounded-md
                          hover:text-orange-600 transition-all duration-200
                          active:translate-y-[1px] active:shadow-inner
                        "
                      >
                        <FiFile className="text-lg text-orange-500" />
                        <span>Voir le PDF</span>
                      </a>
                    </div>
                  )}

                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                    {entete.assurance.length} ligne{entete.assurance.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-400">{fmtDate(entete.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                  disabled = {entete.statutEntete === 'ASSIGNER'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddPassagerModal({
                        assuranceEnteteId: entete.id,
                        lignes: entete.assurance,
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    👤 Ajouter passager
                  </button>

                  <button
                    disabled = {genLoading[entete.id] || entete.statutEntete === 'ASSIGNER'}
                    onClick={(e) => handleGenerer(e, entete.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-sm"
                  >
                    {genLoading[entete.id] ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : genDone[entete.id] ? '✓' : '⚡'}
                    {genLoading[entete.id] ? 'Génération…' : genDone[entete.id] ? 'Généré' : 'Générer portail'}
                  </button>
                </div>
              </div>

              {/* ── Lignes assurance ── */}
              {/* {expanded[entete.id] && ( */}
                <div className="divide-y divide-gray-50">
                  {entete.assurance.length === 0 ? (
                    <p className="text-sm text-gray-400 italic px-5 py-4">Aucune ligne assurance.</p>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mx-4 my-4">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <Th></Th>
                            <Th>Référence</Th>
                            <Th>Zone · Fournisseur</Th>
                            <Th>Période</Th>
                            <Th>Durée</Th>
                            {/* <Th>Statut</Th> */}
                            <Th>Statut ligne</Th>
                            <Th>N° police</Th>
                            <Th></Th> 
                          </tr>
                        </thead>
                        <tbody>
                          {entete.assurance.map((ligne) => (
                            <React.Fragment key={ligne.id}>
                              {/* ligne principale */}
                              <tr
                                className="hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => toggleLigne(ligne.id)}
                              >
                                <Td>
                                  <svg
                                    className={`h-4 w-4 text-gray-400 transition-transform ${expandedLignes[ligne.id] ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </Td>
                                <Td>
                                  <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                    {ligne.referenceLine ?? '—'}
                                  </span>
                                </Td>
                                <Td>
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {ligne.assuranceProspectionLigne?.assuranceParams?.zoneDestination ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {entete.assuranceProspectionEntete.fournisseur.libelle}
                                    </p>
                                  </div>
                                </Td>
                                <Td>
                                  <span className="text-xs">
                                    {fmtDate(ligne.assuranceProspectionLigne?.dateDepart)}
                                    {' → '}
                                    {fmtDate(ligne.assuranceProspectionLigne?.dateRetour)}
                                  </span>
                                </Td>
                                <Td>
                                  <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                                    {ligne.assuranceProspectionLigne?.duree ?? '—'} j
                                  </span>
                                </Td>
                                {/* <Td><StatusBadge status={ligne.statut} /></Td> */}
                                <Td><StatusBadge status={ligne.statusLigne} /></Td>
                                <Td className="text-gray-400 text-xs">{ligne.numeroPolice ?? '—'}</Td>
                                <Td>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); 
                                      navigate(`/dossiers-communs/assurance/detailsAssurance/${ligne.id}`, {
                                        state: {
                                          numeroDos: entete.assuranceProspectionEntete.prestation.numeroDos,
                                          fournisseur: entete.assuranceProspectionEntete.fournisseur.libelle,
                                        }
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition"
                                  >
                                    Détail <FiArrowRight/>
                                  </button>
                                </Td>
                              </tr>

                              {/* ligne expandée */}
                              {expandedLignes[ligne.id] && (
                                <tr>
                                  <td colSpan={9} className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                                    <LigneDetail ligne={ligne} />
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              {/* )} */}
            </div>
          ))}
        </div>
      )}

      {/* ── Onglet Suivi ── */}
      {activeTabSousSection === 'suivi' && (
        <SuiviTabSection
          prestationId={prestationId}
        />
      )}
      
      {addPassagerModal && (
        <AddPassagerAssuranceModal
          assuranceEnteteId={addPassagerModal.assuranceEnteteId}
          lignes={addPassagerModal.lignes}
          onClose={() => setAddPassagerModal(null)}
          onSuccess={() => {
            // re-fetch ta liste si nécessaire
          }}
        />
      )}
    </div>
  );
};

export default AssuranceEnteteListe;