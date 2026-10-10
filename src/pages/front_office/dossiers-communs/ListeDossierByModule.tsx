import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDossiersCommunsPaginated, setCurrentClientFactureId, type DossierCommun } from '../../../app/front_office/dossierCommunSlice';
import { fetchDevisPaginated } from '../../../app/front_office/devisSlice';
import { fetchBilletLignesPaginated } from '../../../app/front_office/billetLigneSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import {FiFolder, FiSearch, FiRefreshCw, FiArrowLeft, FiCheck, FiChevronDown, FiChevronRight} from 'react-icons/fi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import Pagination from '../../../components/Pagination';

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CREER', label: 'Actif' },
  { value: 'ANNULER', label: 'Annulé' },
];

const DEVIS_STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CREER', label: 'Créé' },
  { value: 'DEVIS_A_APPROUVER', label: 'À approuver' },
  { value: 'DEVIS_APPROUVE', label: 'Approuvé' },
  { value: 'BC_CLIENT_A_APPROUVER', label: 'BC client à approuver' },
  { value: 'BILLET_EMIS', label: 'Billet émis' },
  { value: 'FACTURE_EMISE', label: 'Facture émise' },
  { value: 'FACTURE_REGLEE', label: 'Facture réglée' },
  { value: 'MODIFIER', label: 'Modifié' },
  { value: 'ANNULER', label: 'Annulé' },
];

const LIGNE_STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CREER', label: 'Créé' },
  { value: 'ASSIGNER', label: 'Assigné' },
  { value: 'CLOTURER', label: 'Clôturé' },
  { value: 'EMIS', label: 'Émis' },
  { value: 'ANNULER', label: 'Annulé' },
];

const STATUS_LIGNE_OPTIONS = [
  { value: '', label: 'Tous (ligne)' },
  { value: 'INITIALE', label: 'Initiale' },
  { value: 'MODIFIER', label: 'Modifiée' },
  { value: 'ANNULER', label: 'Annulée' },
  { value: 'ANNULATION', label: 'Annulation' },
];

const useAppDispatch = () => useDispatch<AppDispatch>();

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-600 whitespace-nowrap">
      {children}
    </span>
  );
}

// Formatte un prix/pourcentage — null/undefined → "—", sinon séparateur de milliers FR.
function fmtNum(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function fmtDate(value: any, withTime = false): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' });
}

// Grille compacte label/valeur — réutilisée par toutes les sections de détail (prix,
// pourcentages, dates...) des lignes dépliables ci-dessous.
function FieldGrid({ title, fields, accent }: { title: string; fields: { label: string; value: React.ReactNode }[]; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${accent || 'bg-slate-50 text-slate-500'}`}>
        {title}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 p-3">
        {fields.map((f, i) => (
          <div key={i}>
            <p className="text-[9px] uppercase tracking-wide text-slate-400 font-medium mb-0.5">{f.label}</p>
            <p className="text-xs font-semibold text-slate-700 truncate">{f.value ?? '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet "Liste de devis" — GET /devis paginé (tous dossiers confondus)  */
/* ------------------------------------------------------------------ */
function DevisTabSection({ toolbarTarget }: { toolbarTarget: HTMLDivElement | null }) {
  const dispatch = useAppDispatch();
  const { listData: devisList, listMeta: meta, listLoading: loading, listError: error } = useSelector(
    (state: RootState) => state.devis
  );

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statutFilter, setStatutFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter]);

  useEffect(() => {
    dispatch(fetchDevisPaginated({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: statutFilter || undefined,
    }));
  }, [dispatch, page, limit, debouncedSearch, statutFilter]);

  const toolbar = (
    <>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Rechercher un devis (référence, fournisseur)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
        />
      </div>
      <select
        value={statutFilter}
        onChange={(e) => setStatutFilter(e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors outline-none"
      >
        {DEVIS_STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </>
  );

  return (
    <>
      {toolbarTarget && createPortal(toolbar, toolbarTarget)}

      <div className="flex-1 min-h-0 mb-4">
        <div className="h-full flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dossier</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Commission (%)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="px-6 py-6"><div className="h-10 bg-slate-100 rounded-lg" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-red-600">{error}</td></tr>
                ) : devisList.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">Aucun devis trouvé.</td></tr>
                ) : devisList.map((devis) => {
                  // Sur GET /devis (liste globale paginée), `devis.data` est parfois null —
                  // les infos fiables sont les champs frères prospectionEntete/prospectionLigne
                  // (voir FRONTEND_API_PAGINATION_DEVIS_BILLET_LIGNE.http).
                  const entete: any = devis.prospectionEntete || {};
                  const lignes: any[] = devis.prospectionLigne || [];
                  const isOpen = openId === devis.id;
                  return (
                    <>
                      <tr
                        key={devis.id}
                        onClick={() => setOpenId(isOpen ? null : devis.id)}
                        className={`cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/30'}`}
                      >
                        <td className="pl-4">
                          {isOpen ? <FiChevronDown size={14} className="text-slate-400" /> : <FiChevronRight size={14} className="text-slate-400" />}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{devis.reference}</td>
                        <td className="px-6 py-4 text-slate-600">{entete.prestation?.numeroDos || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{entete.fournisseur?.libelle || '—'}</td>
                        <td className="px-6 py-4 text-right text-slate-600">
                          {entete.commissionAppliquer != null ? `${entete.commissionAppliquer}%` : '—'}
                          {entete.commissionPropose != null && (
                            <span className="text-slate-400"> (prop. {entete.commissionPropose}%)</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><Pill>{devis.statut}</Pill></td>
                        <td className="px-6 py-4 text-right font-medium text-slate-800">{fmtNum(devis.totalGeneral)} Ar</td>
                        <td className="px-6 py-4 text-slate-500">{fmtDate(devis.createdAt)}</td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={8} className="px-4 pb-5 pt-1">
                            <div className="space-y-3">
                              <FieldGrid
                                title="Entête"
                                fields={[
                                  { label: 'N° entête', value: entete.numeroEntete },
                                  { label: 'Dossier', value: entete.prestation?.numeroDos },
                                  { label: 'Fournisseur', value: entete.fournisseur?.libelle },
                                  { label: 'Code fournisseur', value: entete.fournisseur?.code },
                                  { label: 'Crédit', value: entete.credit },
                                  { label: 'Type de vol', value: entete.typeVol },
                                  { label: 'Commission proposée (%)', value: fmtNum(entete.commissionPropose) },
                                  { label: 'Commission appliquée (%)', value: fmtNum(entete.commissionAppliquer) },
                                  { label: 'Transformé en billet le', value: fmtDate(devis.transformeEnBilletAt, true) },
                                  { label: 'Billet entête ID', value: devis.billetEnteteId },
                                ]}
                              />

                              {lignes.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-3">Aucune ligne dans ce devis</p>
                              ) : lignes.map((ligne: any) => (
                                <div key={ligne.id} className="space-y-2 border border-slate-200 rounded-lg p-3 bg-white">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <p className="text-sm font-semibold text-indigo-700">
                                      {ligne.numeroVol || 'N/A'} — {ligne.itineraire || '—'}
                                      <span className="ml-2 text-xs font-normal text-slate-400">Réf : {ligne.numeroDosRef || '—'}</span>
                                    </p>
                                    <Pill>{ligne.status}</Pill>
                                  </div>

                                  <FieldGrid
                                    title="Vol"
                                    fields={[
                                      { label: 'Avion', value: ligne.avion },
                                      { label: 'Classe', value: ligne.classe },
                                      { label: 'Type passager', value: ligne.typePassager },
                                      { label: 'Nombre', value: ligne.nombre },
                                      { label: 'Départ', value: fmtDate(ligne.dateHeureDepart, true) },
                                      { label: 'Arrivée', value: fmtDate(ligne.dateHeureArrive, true) },
                                      { label: 'Durée vol', value: ligne.dureeVol },
                                      { label: 'Durée escale', value: ligne.dureeEscale },
                                      { label: 'Aéroport départ', value: ligne.aeroportDepart },
                                      { label: 'Aéroport arrivée', value: ligne.aeroportArrivee },
                                      { label: 'Devise', value: ligne.devise },
                                      { label: 'Taux échange', value: fmtNum(ligne.tauxEchange) },
                                    ]}
                                  />

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <FieldGrid
                                      title="Compagnie — Devise"
                                      accent="bg-emerald-50 text-emerald-700"
                                      fields={[
                                        { label: 'PU Billet', value: fmtNum(ligne.puBilletCompagnieDevise) },
                                        { label: 'PU Service', value: fmtNum(ligne.puServiceCompagnieDevise) },
                                        { label: 'PU Pénalité', value: fmtNum(ligne.puPenaliteCompagnieDevise) },
                                        { label: 'Mt Billet', value: fmtNum(ligne.montantBilletCompagnieDevise) },
                                        { label: 'Mt Service', value: fmtNum(ligne.montantServiceCompagnieDevise) },
                                        { label: 'Mt Pénalité', value: fmtNum(ligne.montantPenaliteCompagnieDevise) },
                                      ]}
                                    />
                                    <FieldGrid
                                      title="Compagnie — Ariary"
                                      accent="bg-emerald-50 text-emerald-700"
                                      fields={[
                                        { label: 'PU Billet', value: fmtNum(ligne.puBilletCompagnieAriary) },
                                        { label: 'PU Service', value: fmtNum(ligne.puServiceCompagnieAriary) },
                                        { label: 'PU Pénalité', value: fmtNum(ligne.puPenaliteCompagnieAriary) },
                                        { label: 'Mt Billet', value: fmtNum(ligne.montantBilletCompagnieAriary) },
                                        { label: 'Mt Service', value: fmtNum(ligne.montantServiceCompagnieAriary) },
                                        { label: 'Mt Pénalité', value: fmtNum(ligne.montantPenaliteCompagnieAriary) },
                                      ]}
                                    />
                                    <FieldGrid
                                      title="Client — Devise"
                                      accent="bg-indigo-50 text-indigo-700"
                                      fields={[
                                        { label: 'Mt Billet', value: fmtNum(ligne.montantBilletClientDevise) },
                                        { label: 'Mt Service', value: fmtNum(ligne.montantServiceClientDevise) },
                                        { label: 'Mt Pénalité', value: fmtNum(ligne.montantPenaliteClientDevise) },
                                      ]}
                                    />
                                    <FieldGrid
                                      title="Client — Ariary"
                                      accent="bg-indigo-50 text-indigo-700"
                                      fields={[
                                        { label: 'Mt Billet', value: fmtNum(ligne.montantBilletClientAriary) },
                                        { label: 'Mt Service', value: fmtNum(ligne.montantServiceClientAriary) },
                                        { label: 'Mt Pénalité', value: fmtNum(ligne.montantPenaliteClientAriary) },
                                      ]}
                                    />
                                  </div>

                                  <FieldGrid
                                    title="Commission & Taxe"
                                    accent="bg-amber-50 text-amber-700"
                                    fields={[
                                      { label: 'Commission Devise', value: fmtNum(ligne.commissionEnDevise) },
                                      { label: 'Commission Ariary', value: fmtNum(ligne.commissionEnAriary) },
                                      { label: 'Taux taxe (%)', value: fmtNum(ligne.tauxTaxe) },
                                      { label: 'Mt taxe Devise', value: fmtNum(ligne.montantTaxeDevise) },
                                      { label: 'Mt taxe Ariary', value: fmtNum(ligne.montantTaxeAriary) },
                                      { label: 'Condition modif.', value: ligne.conditionModif },
                                      { label: 'Condition annul.', value: ligne.conditionAnnul },
                                    ]}
                                  />

                                  {ligne.serviceProspectionLigne?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {ligne.serviceProspectionLigne.map((svc: any) => (
                                        <span key={svc.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded border border-slate-200">
                                          {svc.serviceSpecifique?.libelle}: {svc.valeur === 'true' ? 'Oui' : svc.valeur === 'false' ? 'Non' : svc.valeur}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} itemLabel="devis" />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet "Liste des billets lignes" — GET /billet/ligne paginé           */
/* ------------------------------------------------------------------ */
function BilletLigneTabSection({ toolbarTarget }: { toolbarTarget: HTMLDivElement | null }) {
  const dispatch = useAppDispatch();
  const { items, meta, loading, error } = useSelector((state: RootState) => state.billetLigne);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statutFilter, setStatutFilter] = useState('');
  const [statusLigneFilter, setStatusLigneFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter, statusLigneFilter]);

  useEffect(() => {
    dispatch(fetchBilletLignesPaginated({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: statutFilter || undefined,
      statusLigne: statusLigneFilter || undefined,
    }));
  }, [dispatch, page, limit, debouncedSearch, statutFilter, statusLigneFilter]);

  const toolbar = (
    <>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Rechercher (PNR, n° billet, n° vol, itinéraire)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
        />
      </div>
      <select
        value={statutFilter}
        onChange={(e) => setStatutFilter(e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors outline-none"
      >
        {LIGNE_STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        value={statusLigneFilter}
        onChange={(e) => setStatusLigneFilter(e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors outline-none"
      >
        {STATUS_LIGNE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </>
  );

  return (
    <>
      {toolbarTarget && createPortal(toolbar, toolbarTarget)}

      <div className="flex-1 min-h-0 mb-4">
        <div className="h-full flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Vol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Itinéraire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Départ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Billet</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Passagers</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut ligne</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={10} className="px-6 py-6"><div className="h-10 bg-slate-100 rounded-lg" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-red-600">{error}</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-16 text-center text-sm text-slate-400">Aucune ligne de billet trouvée.</td></tr>
                ) : items.map((ligne) => {
                  const ligneAny: any = ligne;
                  const vol = ligneAny.prospectionLigne || {};
                  const entete = ligneAny.billetEntete || {};
                  const passagers = (ligneAny.billet || [])
                    .map((b: any) => ({ ...b.clientbeneficiaireInfo, _billetStatut: b.statut, _numeroBillet: b.numeroBillet, _pjBillet: b.pjBillet }))
                    .filter((p: any) => p.id);
                  const isOpen = openId === ligne.id;
                  return (
                    <>
                      <tr
                        key={ligne.id}
                        onClick={() => setOpenId(isOpen ? null : ligne.id)}
                        className={`cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/30'}`}
                      >
                        <td className="pl-4">
                          {isOpen ? <FiChevronDown size={14} className="text-slate-400" /> : <FiChevronRight size={14} className="text-slate-400" />}
                        </td>
                        <td className="px-6 py-4 font-medium text-indigo-600">{vol.numeroVol || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{vol.itineraire || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{fmtDate(vol.dateHeureDepart, true)}</td>
                        <td className="px-6 py-4 text-slate-600">{vol.classe || '—'}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">{entete.numeroBillet || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {passagers.length === 0
                            ? '—'
                            : passagers.map((p: any) => `${p.prenom ?? ''} ${p.nom ?? ''}`.trim()).join(', ')}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-800">{fmtNum(entete.totalCompagnie)} Ar</td>
                        <td className="px-6 py-4"><Pill>{ligne.statut}</Pill></td>
                        <td className="px-6 py-4"><Pill>{ligne.statusLigne}</Pill></td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={10} className="px-4 pb-5 pt-1">
                            <div className="space-y-3">
                              <FieldGrid
                                title="Vol & itinéraire"
                                fields={[
                                  { label: 'N° vol', value: vol.numeroVol },
                                  { label: 'Avion', value: vol.avion },
                                  { label: 'Itinéraire', value: vol.itineraire },
                                  { label: 'Classe', value: vol.classe },
                                  { label: 'Type passager', value: vol.typePassager },
                                  { label: 'Départ', value: fmtDate(vol.dateHeureDepart, true) },
                                  { label: 'Arrivée', value: fmtDate(vol.dateHeureArrive, true) },
                                  { label: 'Durée vol', value: vol.dureeVol },
                                  { label: 'Durée escale', value: vol.dureeEscale },
                                  { label: 'Aéroport départ', value: vol.aeroportDepart },
                                  { label: 'Aéroport arrivée', value: vol.aeroportArrivee },
                                  { label: 'Réf. ligne prospection', value: vol.numeroDosRef },
                                  { label: 'Devise', value: vol.devise },
                                  { label: 'Taux échange vol', value: fmtNum(vol.tauxEchange) },
                                ]}
                              />

                              <FieldGrid
                                title="Billet (entête)"
                                accent="bg-slate-100 text-slate-600"
                                fields={[
                                  { label: 'N° billet', value: entete.numeroBillet },
                                  { label: 'Statut entête', value: entete.statut },
                                  { label: 'Total compagnie', value: `${fmtNum(entete.totalCompagnie)} Ar` },
                                  { label: 'Commission proposée (%)', value: fmtNum(entete.commissionPropose) },
                                  { label: 'Commission appliquée (%)', value: fmtNum(entete.commissionAppliquer) },
                                  { label: 'Total commission', value: `${fmtNum(entete.totalCommission)} Ar` },
                                  { label: 'Raison annulation', value: entete.raisonAnnul },
                                ]}
                              />

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                <FieldGrid
                                  title="Réservation — Compagnie Devise"
                                  accent="bg-emerald-50 text-emerald-700"
                                  fields={[
                                    { label: 'PU Billet', value: fmtNum(ligneAny.puResaBilletCompagnieDevise) },
                                    { label: 'PU Service', value: fmtNum(ligneAny.puResaServiceCompagnieDevise) },
                                    { label: 'PU Pénalité', value: fmtNum(ligneAny.puResaPenaliteCompagnieDevise) },
                                    { label: 'Mt Billet', value: fmtNum(ligneAny.puResaMontantBilletCompagnieDevise) },
                                    { label: 'Mt Service', value: fmtNum(ligneAny.puResaMontantServiceCompagnieDevise) },
                                    { label: 'Mt Pénalité', value: fmtNum(ligneAny.puResaMontantPenaliteCompagnieDevise) },
                                  ]}
                                />
                                <FieldGrid
                                  title="Réservation — Compagnie Ariary"
                                  accent="bg-emerald-50 text-emerald-700"
                                  fields={[
                                    { label: 'PU Billet', value: fmtNum(ligneAny.puResaBilletCompagnieAriary) },
                                    { label: 'PU Service', value: fmtNum(ligneAny.puResaServiceCompagnieAriary) },
                                    { label: 'PU Pénalité', value: fmtNum(ligneAny.puResaPenaliteCompagnieAriary) },
                                    { label: 'Mt Billet', value: fmtNum(ligneAny.puResaMontantBilletCompagnieAriary) },
                                    { label: 'Mt Service', value: fmtNum(ligneAny.puResaMontantServiceCompagnieAriary) },
                                    { label: 'Mt Pénalité', value: fmtNum(ligneAny.puResaMontantPenaliteCompagnieAriary) },
                                  ]}
                                />
                                <FieldGrid
                                  title="Réservation — Client Devise"
                                  accent="bg-indigo-50 text-indigo-700"
                                  fields={[
                                    { label: 'PU Billet', value: fmtNum(ligneAny.puResaBilletClientDevise) },
                                    { label: 'PU Service', value: fmtNum(ligneAny.puResaServiceClientDevise) },
                                    { label: 'PU Pénalité', value: fmtNum(ligneAny.puResaPenaliteClientDevise) },
                                    { label: 'Mt Billet', value: fmtNum(ligneAny.puResaMontantBilletClientDevise) },
                                    { label: 'Mt Service', value: fmtNum(ligneAny.puResaMontantServiceClientDevise) },
                                    { label: 'Mt Pénalité', value: fmtNum(ligneAny.puResaMontantPenaliteClientDevise) },
                                  ]}
                                />
                                <FieldGrid
                                  title="Réservation — Client Ariary"
                                  accent="bg-indigo-50 text-indigo-700"
                                  fields={[
                                    { label: 'PU Billet', value: fmtNum(ligneAny.puResaBilletClientAriary) },
                                    { label: 'PU Service', value: fmtNum(ligneAny.puResaServiceClientAriary) },
                                    { label: 'PU Pénalité', value: fmtNum(ligneAny.puResaPenaliteClientAriary) },
                                    { label: 'Mt Billet', value: fmtNum(ligneAny.puResaMontantBilletClientAriary) },
                                    { label: 'Mt Service', value: fmtNum(ligneAny.puResaMontantServiceClientAriary) },
                                    { label: 'Mt Pénalité', value: fmtNum(ligneAny.puResaMontantPenaliteClientAriary) },
                                  ]}
                                />
                              </div>

                              <FieldGrid
                                title="Réservation — Commission & PNR"
                                accent="bg-amber-50 text-amber-700"
                                fields={[
                                  { label: 'PNR / Réservation', value: ligneAny.reservation },
                                  { label: 'Taux échange résa', value: fmtNum(ligneAny.resaTauxEchange) },
                                  { label: 'Commission Devise', value: fmtNum(ligneAny.resaCommissionEnDevise) },
                                  { label: 'Commission Ariary', value: fmtNum(ligneAny.resaCommissionEnAriary) },
                                  { label: 'Condition modif.', value: ligneAny.conditionModif },
                                  { label: 'Condition annul.', value: ligneAny.conditionAnnul },
                                  { label: 'Raison annulation', value: ligneAny.raisonAnnul },
                                ]}
                              />

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                <FieldGrid
                                  title="Émission — Compagnie Ariary"
                                  accent="bg-emerald-50 text-emerald-700"
                                  fields={[
                                    { label: 'Taux change émission', value: fmtNum(ligneAny.emissionTauxChange) },
                                    { label: 'PU Billet', value: fmtNum(ligneAny.puEmissionBilletCompagnieAriary) },
                                    { label: 'PU Service', value: fmtNum(ligneAny.puEmissionServiceCompagnieAriary) },
                                    { label: 'PU Pénalité', value: fmtNum(ligneAny.puEmissionPenaliteCompagnieAriary) },
                                    { label: 'Mt Billet', value: fmtNum(ligneAny.emissionMontantBilletCompagnieAriary) },
                                    { label: 'Mt Service', value: fmtNum(ligneAny.emissionMontantServiceCompagnieAriary) },
                                    { label: 'Mt Pénalité', value: fmtNum(ligneAny.emissionMontantPenaliteCompagnieAriary) },
                                  ]}
                                />
                                <FieldGrid
                                  title="Émission — Client Ariary & Commission"
                                  accent="bg-indigo-50 text-indigo-700"
                                  fields={[
                                    { label: 'PU Billet', value: fmtNum(ligneAny.puEmissionBilletClientAriary) },
                                    { label: 'PU Service', value: fmtNum(ligneAny.puEmissionServiceClientAriary) },
                                    { label: 'PU Pénalité', value: fmtNum(ligneAny.puEmissionPenaliteClientAriary) },
                                    { label: 'Mt Billet', value: fmtNum(ligneAny.emissionMontantBilletClientAriary) },
                                    { label: 'Mt Service', value: fmtNum(ligneAny.emissionMontantServiceClientAriary) },
                                    { label: 'Mt Pénalité', value: fmtNum(ligneAny.emissionMontantPenaliteClientAriary) },
                                    { label: 'Commission Devise', value: fmtNum(ligneAny.emissionCommissionEnDevise) },
                                    { label: 'Commission Ariary', value: fmtNum(ligneAny.emissionCommissionEnAriary) },
                                  ]}
                                />
                              </div>

                              {passagers.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Passagers</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {passagers.map((p: any) => (
                                      <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <p className="text-xs font-semibold text-slate-800">{p.prenom} {p.nom}</p>
                                          <Pill>{p._billetStatut}</Pill>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                          <p className="text-slate-500">Nationalité <span className="text-slate-700 font-medium">{p.nationalite || '—'}</span></p>
                                          <p className="text-slate-500">Type <span className="text-slate-700 font-medium">{p.clientType || '—'}</span></p>
                                          <p className="text-slate-500">Doc <span className="text-slate-700 font-medium">{p.typeDoc || '—'} {p.referenceDoc || ''}</span></p>
                                          <p className="text-slate-500">Validité <span className="text-slate-700 font-medium">{fmtDate(p.dateValiditeDoc)}</span></p>
                                          <p className="text-slate-500">Tél <span className="text-slate-700 font-medium">{p.tel || '—'}</span></p>
                                          <p className="text-slate-500">N° billet <span className="text-slate-700 font-mono">{p._numeroBillet || '—'}</span></p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} itemLabel="ligne" />
        </div>
      </div>
    </>
  );
}

function ListeDossierByModule() {
  const { module } = useParams<{ module: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Onglets "Liste de devis" / "Liste des billets lignes" — uniquement pour le module ticketing.
  const [activeTab, setActiveTab] = useState<'dossiers' | 'devis' | 'billets'>('dossiers');

  const {
    listData: filteredDossiers = [],
    listMeta: meta = { total: 0, page: 1, limit: 10, totalPages: 1 },
    listLoading: loadingDossiers,
  } = useSelector((state: RootState) => state.dossierCommun);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statutFilter, setStatutFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Ferme les menus Filtrer/Trier au clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) setShowFilterMenu(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Revenir à la page 1 quand la recherche ou le filtre changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter]);

  const loadList = () => {
    dispatch(fetchDossiersCommunsPaginated({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: statutFilter || undefined,
      module,
    }));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, limit, debouncedSearch, statutFilter, module]);

  // Tri appliqué sur la page courante (la liste est déjà paginée côté serveur)
  const sortedDossiers = [...filteredDossiers].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleRefresh = () => {
    loadList();
  };

  const handleOpenDossier = async (dossier: DossierCommun) => {
    await dispatch(setCurrentClientFactureId(dossier));
    navigate(`/dossiers-communs/${module}/pages`, {
      state: { targetTab: 'prospection' }
    });
  };

  const ACCENTS = {
    attestation: { text: 'text-red-600', border: 'border-red-600', soft: 'bg-red-50 text-red-600' },
    ticketing:   { text: 'text-amber-600', border: 'border-amber-500', soft: 'bg-amber-50 text-amber-600' },
    hotel:       { text: 'text-orange-600', border: 'border-orange-600', soft: 'bg-orange-50 text-orange-600' },
  } as const;
  const accent = ACCENTS[module as keyof typeof ACCENTS] ?? {
    text: 'text-indigo-600', border: 'border-indigo-600', soft: 'bg-indigo-50 text-indigo-600',
  };
  
  const tabs: { key: 'dossiers' | 'devis' | 'billets'; label: string }[] = [
    { key: 'dossiers' as const, label: 'Dossiers' },
    ...(module === 'ticketing'
      ? [
          { key: 'devis' as const, label: 'Devis' },
          { key: 'billets' as const, label: 'Billets lignes' },
        ]
      : []),
  ];
  
  const STATUS_STYLE: Record<string, { label: string; dot: string; pill: string }> = {
    CREER:   { label: 'Actif',   dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
    ANNULER: { label: 'Annulé',  dot: 'bg-red-500',     pill: 'bg-red-50 text-red-700' },
  };
  
  // Emplacement dans la barre du haut où Devis / Billets injectent leur propre barre d'outils
  // (⚠️ hook : à garder au même niveau que tes autres useState, avant tout return conditionnel)
  const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null);
  
  const ctrl =
    'h-9 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors';
  
  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-6 py-5 flex flex-col flex-1 min-h-0 gap-4">
  
        {/* ── Barre supérieure : retour + titre + actions sur UNE ligne ── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              title="Retour à l'accueil"
              className={`${ctrl} w-9 justify-center`}
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              Dossiers <span className={`capitalize ${accent.text}`}>{module}</span>
            </h1>
          </div>
  
          {/* Bar de recherche Dossier */}
          {activeTab === 'dossiers' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Recherche */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-64 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                />
              </div>
  
              {/* Actualiser */}
              <button
                onClick={handleRefresh}
                disabled={loadingDossiers}
                title="Actualiser"
                className={`${ctrl} w-9 justify-center disabled:opacity-50`}
              >
                <FiRefreshCw size={15} className={loadingDossiers ? 'animate-spin' : ''} />
              </button>
  
              {/* Filtrer */}
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => { setShowFilterMenu(o => !o); setShowSortMenu(false); }}
                  className={`${ctrl} px-3 ${statutFilter ? '!border-slate-900 !text-slate-900' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                  </svg>
                  Statut
                  {statutFilter && <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                    {STATUT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setStatutFilter(opt.value); setShowFilterMenu(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {opt.label}
                        {statutFilter === opt.value && <FiCheck size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
  
              {/* Trier */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => { setShowSortMenu(o => !o); setShowFilterMenu(false); }}
                  className={`${ctrl} px-3`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3" />
                  </svg>
                  {sortOrder === 'desc' ? 'Récents' : 'Anciens'}
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                    {([
                      { value: 'desc', label: 'Plus récents' },
                      { value: 'asc', label: 'Plus anciens' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortOrder(opt.value); setShowSortMenu(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {opt.label}
                        {sortOrder === opt.value && <FiCheck size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
  
          {/* Les onglets Devis / Billets affichent ici leur recherche + filtres (via portal) */}
          {activeTab !== 'dossiers' && (
            <div ref={setToolbarEl} className="flex flex-wrap items-center gap-2" />
          )}
        </div>
  
        {/* ── Onglets (affichés seulement s'il y en a plusieurs) ── */}
        {tabs.length > 1 && (
          <div className="shrink-0 flex gap-6 border-b border-slate-200">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`-mb-px pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key
                    ? `${accent.text} ${accent.border}`
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
  
        {activeTab === 'devis' && module === 'ticketing' && <DevisTabSection toolbarTarget={toolbarEl} />}
        {activeTab === 'billets' && module === 'ticketing' && <BilletLigneTabSection toolbarTarget={toolbarEl} />}
  
        {/* ── Tableau : prend l'espace restant, scroll interne ── */}
        {activeTab === 'dossiers' && (
          <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    {['Dossier', 'Réf Travel', 'Création', 'Statut', 'Responsable', 'Description', 'Client', 'Contact', 'WhatsApp', 'Créé par'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap border-b border-slate-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
  
                <tbody className="divide-y divide-slate-100">
                  {loadingDossiers ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={10} className="px-4 py-3">
                          <div className="h-5 bg-slate-100 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : sortedDossiers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-20 text-center">
                        <FiSearch size={28} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">
                          {searchTerm ? <>Aucun résultat pour « {searchTerm} »</> : 'Aucun dossier pour le moment'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sortedDossiers.map((dossier) => {
                      const st = STATUS_STYLE[dossier.status] ?? {
                        label: dossier.status, dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600',
                      };
                      return (
                        <tr
                          key={dossier.id}
                          onClick={() => handleOpenDossier(dossier)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${accent.soft}`}>
                                <FiFolder size={14} />
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{dossier.numero}</span>
                              {/* Phase 1 visibilité élargie — voir
                                  FRONTEND_PROMPT_DOSSIER_VISIBILITE_NON_RESPONSABLE.md : dossier
                                  visible mais non géré par l'utilisateur connecté pour ce module. */}
                              {dossier.isResponsable === false && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                                  title={
                                    dossier.responsable
                                      ? `Responsable : ${dossier.responsable.prenom} ${dossier.responsable.nom}`
                                      : 'Vous n\'êtes pas responsable de ce dossier pour ce module'
                                  }
                                >
                                  Lecture seule
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {dossier.referenceTravelPlaner || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap tabular-nums">
                            {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {dossier.responsable ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm text-slate-700">
                                  {dossier.responsable.prenom} {dossier.responsable.nom}
                                </span>
                                {dossier.isResponsable === false && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Lecture seule
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-slate-600 max-w-[220px] truncate" title={dossier.description}>
                              {dossier.description || <span className="text-slate-300">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                            {dossier.clientfacture?.libelle || <span className="font-normal text-slate-400">Non défini</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            {dossier.contactPrincipal || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {dossier.whatsapp ? (
                              <a
                                href={`https://wa.me/${dossier.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline tabular-nums"
                              >
                                {dossier.whatsapp}
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {dossier.user?.nom} {dossier.user?.prenom}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
  
            <div className="shrink-0 border-t border-slate-200">
              <Pagination
                meta={meta}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
                itemLabel="dossier"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListeDossierByModule;