import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  createAssuranceProspection,
  createAssuranceProspectionLigne,
  createAssuranceDevis,
  fetchAssuranceProspections,
  type AssuranceProspectionLigne,
  type AssuranceProspectionEntete,
  clearCreateError,
} from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import { useNavigate } from 'react-router-dom';
import { AssuranceHeader } from './AssuranceHeader';
import DossierActifCard from '../../../../../components/CarteDossierActif/DossierActifCard';
import InfoMessage from '../../../../../components/InfoMessage/InfoMessage';
import SuiviTabSection from '../../module.suivi/SuiviTabSection';

/* ── helpers ── */
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── atoms ── */
const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIF:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    créé:   'bg-blue-50 text-blue-700 border-blue-200',
    INACTIF: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const cls = colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border uppercase ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

const Spinner = ({ size = 5 }: { size?: number }) => (
  <svg className={`animate-spin h-${size} w-${size} text-gray-400`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

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

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder:text-gray-300"
    />
  </div>
);

const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <select
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
    >
      {children}
    </select>
  </div>
);

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 transition text-lg leading-none"
        >×</button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  </div>
);

/* ── type local pour la modal ligne ── */
type LigneModalState = { enteteId: string; numeroDos: string } | null;

/* ── composant principal ── */
const AssuranceProspectionListe = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceProspection);
  const { data: fournisseurs }                          = useSelector((s: RootState) => s.fournisseurs);
  const { params }                                      = useSelector((s: RootState) => s.assuranceParams);

  const dossierActif = useSelector((s: RootState) => s.dossierCommun.currentClientFactureId);
  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'assurance')
    ?.prestation?.[0]?.id ?? '';

  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({});
  const [openCreate,    setOpenCreate]    = useState(false);
  const [fournisseurId, setFournisseurId] = useState('');

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [activeTabSousSection, setActiveTabSousSection] = useState('lignes');

  // modal ajout ligne — stocke l'enteteId + numeroDos pour le titre
  const [ligneModal, setLigneModal] = useState<LigneModalState>(null);
  const [ligneForm,  setLigneForm]  = useState({
    assuranceParamsId: '',
    dateDepart:        '',
    dateRetour:        '',
    duree:             '',
    tauxChange:        '',
  });

  type DevisModalState = {
    enteteId:   string;
    numeroDos:  string;
    lignes:     AssuranceProspectionLigne[];
    } | null;

    const [devisModal,        setDevisModal]        = useState<DevisModalState>(null);
    const [selectedLigneIds,  setSelectedLigneIds]  = useState<string[]>([]);

    /* ── calcul du total général ── */
    const calcTotal = (lignes: AssuranceProspectionLigne[], ids: string[]) =>
    lignes
        .filter(l => ids.includes(l.id))
        .reduce((sum, l) => {
        const tarifPlein = l.assuranceTarifPlein;
        const prix = tarifPlein?.prixClientAriary ?? 0;
        return sum + prix;
        }, 0);

    const toggleLigneId = (id: string) =>
        setSelectedLigneIds(p =>
            p.includes(id) ? p.filter(x => x !== id) : [...p, id]
        );

  const toggle  = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const setL    = (k: string, v: string) => setLigneForm(p => ({ ...p, [k]: v }));

  /* ── calcul auto de la durée ── */
  const handleDateChange = (k: 'dateDepart' | 'dateRetour', v: string) => {
    setLigneForm(p => {
      const next = { ...p, [k]: v };
      if (next.dateDepart && next.dateRetour) {
        const diff = Math.round(
          (new Date(next.dateRetour).getTime() - new Date(next.dateDepart).getTime())
          / (1000 * 60 * 60 * 24)
        );
        next.duree = diff > 0 ? String(diff) : '';
      }
      return next;
    });
  };

  /* ── submit création prospection ── */
  const handleCreateProspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestationId) return;
    const res = await dispatch(createAssuranceProspection({ prestationId, fournisseurId }));
    if (createAssuranceProspection.fulfilled.match(res)) {
      setOpenCreate(false);
      setFournisseurId('');
      dispatch(fetchAssuranceProspections(prestationId));
    }
  };

  /* ── submit ajout ligne ── */
  const handleCreateLigne = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearCreateError());
    if (!ligneModal) return;
    const res = await dispatch(createAssuranceProspectionLigne({
      assuranceProspectionEnteteId: ligneModal.enteteId,
      assuranceParamsId:            ligneForm.assuranceParamsId,
      dateDepart:                   new Date(ligneForm.dateDepart).toISOString(),
      dateRetour:                   new Date(ligneForm.dateRetour).toISOString(),
      duree:                        Number(ligneForm.duree),
      tauxChange:                   Number(ligneForm.tauxChange),
    }));
    if (createAssuranceProspectionLigne.fulfilled.match(res)) {
      setLigneModal(null);
      setLigneForm({ assuranceParamsId: '', dateDepart: '', dateRetour: '', duree: '', tauxChange: '' });
      dispatch(fetchAssuranceProspections(prestationId));
    }
  };

  const handleOpenDevis = (entete: AssuranceProspectionEntete) => {
    const lignes = entete.assuranceProspectionLigne ?? [];
    // pré-sélectionne toutes les lignes par défaut
    setSelectedLigneIds(lignes.map(l => l.id));
    setDevisModal({ enteteId: entete.id, numeroDos: entete.prestation.numeroDos, lignes });
    };

    const handleCreateDevis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devisModal || selectedLigneIds.length === 0) return;
    const total = calcTotal(devisModal.lignes, selectedLigneIds);
    const res = await dispatch(createAssuranceDevis({
        assuranceProspectionEnteteId: devisModal.enteteId,
        assuranceProspectionLigneIds: selectedLigneIds,
        totalGeneral:                 total,
    }));
    if (createAssuranceDevis.fulfilled.match(res)) {
        setDevisModal(null);
        setSelectedLigneIds([]);
        dispatch(fetchAssuranceProspections(prestationId));
    }
    };

  if (loading) return <div className="flex justify-center items-center py-16"><Spinner size={8} /></div>;
  if (error) return <InfoMessage title={error} icon="info" />;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AssuranceHeader
        numeroassurance={prestationId}
        nomPassager={''}
        navigate={navigate}
        isDetail={false}
        isProspection={true}
        isDevis={false}
      />

      <DossierActifCard gradient="from-green-400 via-green-400 to-green-500" />
      {/* ── Header ── */}
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
              Prospections assurance ({list.length})
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

        <div className="flex items-center gap-2">
          {/* Bouton tri */}
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

          {/* Bouton créer (inchangé) */}
          <button
            onClick={() => setOpenCreate(true)}
            disabled={!prestationId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition shadow-sm"
          >
            + Nouvelle prospection
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {activeTabSousSection === 'lignes' && (
        <div className="bg-white space-y-4 overflow-hidden">
          {list.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400 italic">
              Aucune prospection trouvée.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-br-xl rounded-bl-xl rounded-tr-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th></Th>
                    <Th>N° Dossier</Th>
                    <Th>Fournisseur</Th>
                    <Th>Lignes</Th>
                    <Th>Statut</Th>
                    <Th>Créé le</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {[...list]
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt).getTime();
                      const dateB = new Date(b.createdAt).getTime();
                      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                    })
                    .map((entete) => (
                    <React.Fragment key={entete.id}>

                      {/* ── Ligne principale ── */}
                      <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={() => toggle(entete.id)}>
                        <Td>
                          <svg
                            className={`h-4 w-4 text-gray-400 transition-transform ${expanded[entete.id] ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </Td>
                        <Td><span className="font-semibold text-gray-900">{entete.prestation.numeroDos}</span></Td>
                        <Td>
                          <div>
                            <p className="font-medium text-gray-800">{entete.fournisseur.libelle}</p>
                            <p className="text-xs text-gray-400 font-mono">{entete.fournisseur.code}</p>
                          </div>
                        </Td>
                        <Td>
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                            {entete.assuranceProspectionLigne?.length ?? 0} ligne{(entete.assuranceProspectionLigne?.length ?? 0) > 1 ? 's' : ''}
                          </span>
                        </Td>
                        <Td><Badge status={entete.prestation.status == 'CREER' ? 'créé' : entete.prestation.status} /></Td>
                        <Td className="text-gray-400 text-xs">{fmtDate(entete.createdAt)}</Td>
                        <Td>
                            <div className="flex items-center gap-2">
                                {/* ── Bouton ajout ligne ── */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(clearCreateError()); // ← ajoute cette ligne
                                        setLigneModal({ enteteId: entete.id, numeroDos: entete.prestation.numeroDos });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg transition"
                                >
                                + Ligne
                                </button>

                                {/* ── Bouton devis ── */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(clearCreateError());
                                        handleOpenDevis(entete);
                                    }}
                                    disabled={!entete.assuranceProspectionLigne?.length}
                                    title={!entete.assuranceProspectionLigne?.length ? 'Aucune ligne disponible' : 'Créer un devis'}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 hover:bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    📋 Devis
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/dossiers-communs/assurance/detailsProspection/${entete.id}`, {
                                        state: { numeroDos: entete.prestation.numeroDos }
                                        });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg transition"
                                >
                                    👁 Détail
                                </button>
                            </div>
                        </Td>
                      </tr>

                      {/* ── Lignes expandées ── */}
                      {expanded[entete.id] && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Lignes de prospection</p>
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                                {entete.assuranceProspectionLigne?.length ?? 0}
                              </span>
                            </div>
                            {!entete.assuranceProspectionLigne || entete.assuranceProspectionLigne.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Aucune ligne. Cliquez sur "+ Ligne" pour en ajouter une.</p>
                            ) : (
                              <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-indigo-50">
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Zone</th>
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Départ</th>
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Retour</th>
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Durée</th>
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Taux change</th>
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Réf. devis</th>
                                      <th className="px-3 py-2 text-left font-semibold text-indigo-600">Date devis</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entete.assuranceProspectionLigne.map((ligne) => (
                                      <tr key={ligne.id} className="bg-white border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-3 py-2 font-semibold text-gray-800">{ligne.assuranceParams.zoneDestination}</td>
                                        <td className="px-3 py-2 text-gray-700">{fmtDate(ligne.dateDepart)}</td>
                                        <td className="px-3 py-2 text-gray-700">{fmtDate(ligne.dateRetour)}</td>
                                        <td className="px-3 py-2">
                                          <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">{ligne.duree} j</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{ligne.tauxChange.toLocaleString('fr-FR')} Ar</td>
                                        <td className="px-3 py-2 text-gray-500 italic">{ligne.referenceDevis ?? '—'}</td>
                                        <td className="px-3 py-2 text-gray-500">{fmtDate(ligne.dateDevis)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
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
      )}
      
      {/* ── Onglet Suivi ── */}
      {activeTabSousSection === 'suivi' && (
        <SuiviTabSection
          prestationId={prestationId}
        />
      )}

      {/* ── Modal création prospection ── */}
      {openCreate && (
        <Modal title="Nouvelle prospection assurance" onClose={() => setOpenCreate(false)}>
          <form onSubmit={handleCreateProspection} className="space-y-4">
            {/* <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Prestation</label>
              <div className="px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-500 font-mono truncate">
                {prestationId}
              </div>
            </div> */}
            <Select label="Fournisseur" value={fournisseurId} onChange={e => setFournisseurId(e.target.value)} required>
              <option value="">— Sélectionner un fournisseur —</option>
              {fournisseurs?.map((f: any) => (
                <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
              ))}
            </Select>
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating || !fournisseurId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
              >
                {creating ? <Spinner size={3} /> : null}
                {creating ? 'Création…' : 'Créer la prospection'}
              </button>
            </div>
          </form>
        </Modal>
      )}

        {/* ── Modal création devis ── */}
        {devisModal && (
        <Modal
            title={`Créer un devis — ${devisModal.numeroDos}`}
            onClose={() => setDevisModal(null)}
        >
            <form onSubmit={handleCreateDevis} className="space-y-4">

            {/* ── Sélection des lignes ── */}
            <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-2">
                Lignes à inclure
                </label>
                {devisModal.lignes.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucune ligne disponible.</p>
                ) : (
                <div className="space-y-2">
                    {devisModal.lignes.map((ligne) => {
                    const tarifPlein = ligne?.assuranceTarifPlein;
                    const prixLigne  = tarifPlein?.prixClientAriary;
                    const checked    = selectedLigneIds.includes(ligne.id);

                    return (
                        <label
                        key={ligne.id}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                            checked
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        >
                        <div className="flex items-center gap-2.5">
                            <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLigneId(ligne.id)}
                            className="h-3.5 w-3.5 accent-indigo-600"
                            />
                            <div>
                            <p className="text-xs font-semibold text-gray-800">
                                {ligne.assuranceParams.zoneDestination}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {new Date(ligne.dateDepart).toLocaleDateString('fr-FR')} →{' '}
                                {new Date(ligne.dateRetour).toLocaleDateString('fr-FR')} · {ligne.duree} j
                            </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-700 shrink-0">
                            {prixLigne.toLocaleString('fr-FR')} Ar
                        </span>
                        </label>
                    );
                    })}
                </div>
                )}
            </div>

            {/* ── Total calculé ── */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total général</span>
                <span className="text-base font-bold text-indigo-700">
                {calcTotal(devisModal.lignes, selectedLigneIds).toLocaleString('fr-FR')} Ar
                </span>
            </div>

            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}

            <div className="flex justify-end pt-2">
                <button
                type="submit"
                disabled={creating || selectedLigneIds.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
                >
                {creating ? <Spinner size={3} /> : '📋'}
                {creating ? 'Création…' : 'Créer le devis'}
                </button>
            </div>
            </form>
        </Modal>
        )}

      {/* ── Modal ajout ligne ── */}
      {ligneModal && (
        <Modal
          title={`Nouvelle ligne — ${ligneModal.numeroDos}`}
          onClose={() => setLigneModal(null)}
        >
          <form onSubmit={handleCreateLigne} className="space-y-4">
            <Select
              label="Paramètre assurance (zone)"
              value={ligneForm.assuranceParamsId}
              onChange={e => setL('assuranceParamsId', e.target.value)}
              required
            >
              <option value="">— Sélectionner un paramètre —</option>
              {params?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.zoneDestination} · {p.fournisseur.libelle}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date de départ"
                type="date"
                value={ligneForm.dateDepart}
                onChange={e => handleDateChange('dateDepart', e.target.value)}
                required
              />
              <Input
                label="Date de retour"
                type="date"
                value={ligneForm.dateRetour}
                onChange={e => handleDateChange('dateRetour', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Durée (jours)"
                type="number"
                placeholder="Calculé automatiquement"
                value={ligneForm.duree}
                onChange={e => setL('duree', e.target.value)}
                required
              />
              <Input
                label="Taux de change (Ar)"
                type="number"
                placeholder="ex: 4500"
                value={ligneForm.tauxChange}
                onChange={e => setL('tauxChange', e.target.value)}
                required
              />
            </div>

            {createError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-500">⚠️ {createError}</p>

                    <p className="text-xs text-red-500 mt-2">Veuillez crée de nouveau bornes pour ce paramètre. <span className="text-indigo-600 cursor-pointer" 
                      onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dossiers-communs/assurance/parametres`, { 
                            state: { targetTab: 'tarifPlein' }
                          });
                      }}
                      >Cliquer ici
                      </span>
                    </p>
                </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating || !ligneForm.assuranceParamsId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
              >
                {creating ? <Spinner size={3} /> : null}
                {creating ? 'Ajout…' : 'Ajouter la ligne'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default AssuranceProspectionListe;