import React, { useState } from 'react';
import type { BilletEntete, BilletLigne } from '../../../../../../app/front_office/billetSlice';
import type { BilletPassagerData, BilletPassagerExigence, BilletPassagerService } from '../../../module.pdf/pdf.generation/generators/billet-passager.generator';
import { useBilletPassagerPdf } from '../../../module.pdf/pdf.generation/hooks/usePdfGenerator';
import type { BilletStyleId } from '../../../module.pdf/pdf.generation/types/pdf-design.types';
import { BILLET_STYLES } from '../../../module.pdf/pdf.generation/config/billet-styles';
import { formatStatut } from '../../../../../../utils/statut';
import { AlertTriangle, ChevronDown, Clock, Download, Eye, FileText, IdCard } from 'lucide-react';
import { API_URL } from '../../../../../../service/env';
import { MiniaturePreuve } from '../../../../../../components/ui/Preuve';

// « Reporter » : bouton masqué en attendant la réponse du backend / métier
// (voir ANALYSE_REPORTER_BILLET.md). Le code reste en place : passer à true pour le réafficher.
const AFFICHER_REPORT = false;

// Couleur du point de statut du billet passager
const POINT_STATUT: Record<string, string> = {
  PLANIFIE: 'bg-blue-500',
  REPORTE: 'bg-amber-500',
  ANNULE: 'bg-red-500',
};

interface PassagersCellProps {
  billets: BilletLigne['billet'];
  handleReporter: (ligne: BilletLigne) => void;
  ligne: BilletLigne;
  billetEntete: BilletEntete;
}

export const PassagersCell: React.FC<PassagersCellProps> = ({ billets, handleReporter, ligne, billetEntete }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [styleIds, setStyleIds]       = useState<Record<string, BilletStyleId>>({});
  const [billetAReporter, setBilletAReporter] = useState<BilletLigne['billet'][0] | null>(null);
  const [, setDateReport]   = useState('');
  const [exigenceModal, setExigenceModal] = useState<{ billet: BilletLigne['billet'][0]; action: 'preview' | 'generate' } | null>(null);
  const [importantIdsByBillet, setImportantIdsByBillet] = useState<Record<string, Set<string>>>({});
  const { generate, preview, loading: pdfLoading } = useBilletPassagerPdf();

  // Liste dédupliquée des exigences de voyage rattachées à la ligne (identique pour tous les passagers de la ligne)
  const collectExigences = (): BilletPassagerExigence[] => {
    const p = ligne.prospectionLigne;
    const raw = p.destinationVoyage?.pays?.paysVoyage
      ?.map((pv: { exigenceVoyage: BilletPassagerExigence }) => pv.exigenceVoyage)
      .filter(Boolean) ?? [];
    const seen = new Set<string>();
    return raw.filter((e: BilletPassagerExigence) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  };

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const getStyle = (id: string): BilletStyleId => styleIds[id] ?? 'elegant';
  const setStyle = (id: string, s: BilletStyleId) =>
    setStyleIds(prev => ({ ...prev, [id]: s }));

  // À adapter dans PassagersCell — reçoit aussi `ligne: BilletLigne` et `billet: BilletEntete`
  const buildBilletData = (
    b: BilletLigne['billet'][0],
    ligne: BilletLigne,
    billetEntete: BilletEntete,
  ): BilletPassagerData => {
    const info = b.clientbeneficiaireInfo;
    const p    = ligne.prospectionLigne;
    const ent  = billetEntete.prospectionEntete;

    // Collecte des exigences depuis la destination (comme le devis)
    const exigences: BilletPassagerExigence[] =
      p.destinationVoyage?.pays?.paysVoyage
        ?.map((pv: { exigenceVoyage: BilletPassagerExigence }) => pv.exigenceVoyage)
        .filter(Boolean) ?? [];

    // Services depuis prospectionLigne (comme le devis)
    const services: BilletPassagerService[] =
      (p.serviceProspectionLigne ?? []).map(s => ({
        libelle:     s.serviceSpecifique?.libelle    ?? '—',
        code:        s.serviceSpecifique?.code       ?? '—',
        type:        s.serviceSpecifique?.type       ?? null,
        typeService: s.serviceSpecifique?.typeService ?? '—',
        valeur:      s.valeur,
      }));

    return {
      // Passager
      nom:             info.nom,
      prenom:          info.prenom,
      nationalite:     info.nationalite,
      typeDoc:         info.typeDoc,
      referenceDoc:    info.referenceDoc,
      dateValiditeDoc: info.dateValiditeDoc,
      clientType:      info.clientType ?? '—',
      tel:             info.tel       || undefined,
      whatsapp:        info.whatsapp  || undefined,
      // Billet
      numeroBillet:        b.numeroBillet,
      statut:              b.statut,
      numeroBilletEntete:  billetEntete.numeroBillet,
      totalCompagnie:      billetEntete.totalCompagnie,
      commissionPropose:   billetEntete.commissionPropose,
      commissionAppliquer: billetEntete.commissionAppliquer,
      totalCommission:     billetEntete.totalCommission,
      // Dossier
      numeroDossier: ent?.prestation?.numeroDos   ?? '—',
      fournisseur:   ent?.fournisseur?.libelle    ?? '—',
      typeVol:       ent?.typeVol                 ?? '—',
      credit:        ent?.credit                  ?? '—',
      dateEmission:  b.createdAt,
      agence:        'AGT — AL BOURAQ TRAVEL',
      // Ligne de vol — tout ce qui est dans BilletLigne + ProspectionLigne
      ligne: {
        numeroDosRef:   p.numeroDosRef           ?? '—',
        numeroVol:      p.numeroVol              ?? '—',
        avion:          p.avion                  ?? '—',
        itineraire:     p.itineraire             ?? '—',
        classe:         p.classe                 ?? '—',
        typePassager:   p.typePassager           ?? '—',
        nombre:         p.nombre                 ?? 1,
        dateHeureDepart: p.dateHeureDepart,
        dateHeureArrive: p.dateHeureArrive,
        dureeVol:       p.dureeVol               ?? '—',
        dureeEscale:    p.dureeEscale            ?? '—',
        devise:         p.devise                 ?? '—',
        tauxEchange:    p.tauxEchange            ?? 0,
        // Prospection
        puBilletCompagnieDevise:         p.puBilletCompagnieDevise       ?? 0,
        puServiceCompagnieDevise:        p.puServiceCompagnieDevise      ?? 0,
        puPenaliteCompagnieDevise:       p.puPenaliteCompagnieDevise     ?? 0,
        montantBilletClientDevise:       p.montantBilletClientDevise     ?? 0,
        montantServiceClientDevise:      p.montantServiceClientDevise    ?? 0,
        montantPenaliteClientDevise:     p.montantPenaliteClientDevise   ?? 0,
        montantBilletCompagnieAriary:    p.montantBilletCompagnieAriary  ?? 0,
        montantServiceCompagnieAriary:   p.montantServiceCompagnieAriary ?? 0,
        montantPenaliteCompagnieAriary:  p.montantPenaliteCompagnieAriary ?? 0,
        montantBilletClientAriary:       p.montantBilletClientAriary     ?? 0,
        montantServiceClientAriary:      p.montantServiceClientAriary    ?? 0,
        montantPenaliteClientAriary:     p.montantPenaliteClientAriary   ?? 0,
        commissionEnDevise:              p.commissionEnDevise            ?? 0,
        commissionEnAriary:              p.commissionEnAriary            ?? 0,
        conditionModif:                  p.conditionModif,
        conditionAnnul:                  p.conditionAnnul,
        modePaiement:                    p.modePaiement                  ?? '—',
        // Réservation (depuis BilletLigne)
        reservation:                        ligne.reservation,
        puResaBilletCompagnieDevise:         ligne.puResaBilletCompagnieDevise,
        puResaServiceCompagnieDevise:        ligne.puResaServiceCompagnieDevise,
        puResaPenaliteCompagnieDevise:       ligne.puResaPenaliteCompagnieDevise,
        resaTauxEchange:                     ligne.resaTauxEchange,
        puResaBilletClientAriary:            ligne.puResaBilletClientAriary,
        puResaServiceClientAriary:           ligne.puResaServiceClientAriary,
        puResaPenaliteClientAriary:          ligne.puResaPenaliteClientAriary,
        puResaMontantBilletCompagnieAriary:  ligne.puResaMontantBilletCompagnieAriary,
        puResaMontantServiceCompagnieAriary: ligne.puResaMontantServiceCompagnieAriary,
        puResaMontantPenaliteCompagnieAriary:ligne.puResaMontantPenaliteCompagnieAriary,
        resaCommissionEnDevise:              ligne.resaCommissionEnDevise,
        resaCommissionEnAriary:              ligne.resaCommissionEnAriary,
        // Émission (depuis BilletLigne)
        emissionTauxChange:                     ligne.emissionTauxChange,
        emissionMontantBilletCompagnieAriary:    ligne.emissionMontantBilletCompagnieAriary,
        emissionMontantServiceCompagnieAriary:   ligne.emissionMontantServiceCompagnieAriary,
        emissionMontantPenaliteCompagnieAriary:  ligne.emissionMontantPenaliteCompagnieAriary,
        emissionMontantBilletClientAriary:       ligne.emissionMontantBilletClientAriary,
        emissionMontantServiceClientAriary:      ligne.emissionMontantServiceClientAriary,
        emissionMontantPenaliteClientAriary:     ligne.emissionMontantPenaliteClientAriary,
        emissionCommissionEnDevise:              ligne.emissionCommissionEnDevise,
        emissionCommissionEnAriary:              ligne.emissionCommissionEnAriary,
        // Services & destination
        services,
        destinationVoyage: p.destinationVoyage,
      },
      exigences,
    };
  };

  const ouvrirDialogue = (b: BilletLigne['billet'][0]) => {
    setBilletAReporter(b);
    setDateReport('');
  };

  const confirmerReport = () => {
    if (!billetAReporter) return;
    // `handleReporter` reporte la ligne de vol entière (reporterLigne utilise ligne.id,
    // pas l'id du billet passager) — on passe donc `ligne`, pas `billetAReporter`.
    handleReporter(ligne);
    setBilletAReporter(null);
  };

  if (!billets || billets.length === 0)
    return <span className="text-slate-400 text-xs italic">Aucun passager</span>;

  const infoReporter = billetAReporter?.clientbeneficiaireInfo;
  const nomReporter  = `${infoReporter?.prenom ?? ''} ${infoReporter?.nom ?? ''}`.trim() || 'Passager inconnu';

  return (
    <>
      {/* Liste compacte des passagers : une ligne par passager, détails à la demande */}
      <div className="min-w-[380px] divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
        {billets.map((b, idx) => {
          const info       = b.clientbeneficiaireInfo;
          const nomComplet = `${info?.prenom ?? ''} ${info?.nom ?? ''}`.trim() || 'Passager inconnu';
          const expanded   = expandedIds.has(b.id);
          const docExpire  = info?.dateValiditeDoc
            ? new Date(info.dateValiditeDoc) < new Date()
            : false;
          const peutReporter = b.statut === 'PLANIFIE';
          // Le billet PDF n'a de sens qu'après l'émission (n° de billet saisi, ligne clôturée)
          // et avec le fichier du document du passager (ex. passeport).
          const estEmis = ligne.statut === 'CLOTURER' && !!b.numeroBillet;
          const aPasseport = !!info?.document;
          const raisonPdf = !estEmis
            ? "Disponible après l'émission (achat) du billet"
            : !aPasseport ? 'Fichier du document du passager (ex. passeport) manquant' : null;
          const iconBtn = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

          return (
            <div key={b.id} className="px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-slate-400">{idx + 1}</span>

                {/* Nom + n° billet + statut : clic = détails du document */}
                <button
                  type="button"
                  onClick={() => toggleExpand(b.id)}
                  aria-expanded={expanded}
                  title={expanded ? 'Masquer les détails' : 'Voir le document du passager'}
                  className="group min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium text-slate-800 group-hover:text-slate-950">{nomComplet}</span>
                    {docExpire && (
                      <AlertTriangle size={12} className="shrink-0 text-red-500" aria-label="Document expiré" />
                    )}
                    {!aPasseport && (
                      <span title="Fichier du document (ex. passeport) non joint" className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-700">
                        <IdCard size={11} /> fichier manquant
                      </span>
                    )}
                    <ChevronDown size={12} className={`shrink-0 text-slate-300 transition-transform group-hover:text-slate-500 ${expanded ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    {b.numeroBillet
                      ? <span className="font-mono text-slate-600">{b.numeroBillet}</span>
                      : <span className="italic">N° billet non saisi</span>}
                    {b.statut && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${POINT_STATUT[b.statut] ?? 'bg-slate-400'}`} />
                        {formatStatut(b.statut)}
                      </>
                    )}
                  </span>
                </button>

                {/* Actions en icônes */}
                <div className="flex shrink-0 items-center">
                  {/* E-billet de la compagnie (fichier joint à l'achat) */}
                  {b.pjBillet && (
                    <a href={`${API_URL}/${b.pjBillet}`} target="_blank" rel="noopener noreferrer"
                      className={iconBtn} title="E-billet de la compagnie (joint à l'achat)" aria-label="E-billet de la compagnie">
                      <FileText size={15} />
                    </a>
                  )}
                  <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden="true" />
                  {/* Billet agence généré (PDF) : seulement après émission */}
                  <button type="button" className={iconBtn}
                    title={raisonPdf ?? 'Aperçu du billet agence'} aria-label="Aperçu du billet agence"
                    disabled={pdfLoading || !!raisonPdf} onClick={() => setExigenceModal({ billet: b, action: 'preview' })}>
                    <Eye size={15} />
                  </button>
                  <button type="button" className={iconBtn}
                    title={raisonPdf ?? 'Générer le billet agence (PDF)'} aria-label="Générer le billet agence"
                    disabled={pdfLoading || !!raisonPdf} onClick={() => setExigenceModal({ billet: b, action: 'generate' })}>
                    <Download size={15} />
                  </button>
                  {AFFICHER_REPORT && (
                    <button type="button" className={`${iconBtn} hover:!bg-amber-50 hover:!text-amber-700`}
                      title={peutReporter ? 'Reporter le vol (toute la ligne)' : 'Report possible uniquement pour un billet « Planifié »'}
                      aria-label="Reporter"
                      disabled={!peutReporter} onClick={() => ouvrirDialogue(b)}>
                      <Clock size={15} />
                    </button>
                  )}
                </div>
              </div>

              {b.servicePreference && b.servicePreference.length > 0 && (
                <p className="mt-0.5 truncate pl-[26px] text-[11px] text-slate-500" title={b.servicePreference.join(', ')}>
                  Préférences : {b.servicePreference.join(', ')}
                </p>
              )}

              {expanded && (
                <dl className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1.5 pl-[26px] text-[11px]">
                  {/* Document : type + fichier joint (ex. « Fichier : Passeport ») */}
                  <div className="min-w-0">
                    <dt className="text-slate-400">Document</dt>
                    <dd className="truncate text-slate-700">{info?.typeDoc ? formatStatut(info.typeDoc) : '—'}</dd>
                    <dd className="truncate">
                      {info?.document ? (
                        <a href={`${API_URL}/${info.document}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          title="Ouvrir le fichier du document">
                          <FileText size={11} className="shrink-0" />
                          Fichier : {info?.typeDoc ? formatStatut(info.typeDoc) : 'document'}
                        </a>
                      ) : (
                        <span className="text-amber-700">Aucun fichier joint</span>
                      )}
                    </dd>
                  </div>
                  {[
                    { label: 'Référence', value: info?.referenceDoc, cls: 'font-mono' },
                    {
                      label: 'Validité',
                      value: info?.dateValiditeDoc ? new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR') : null,
                      cls: docExpire ? 'text-red-600 font-semibold' : '',
                    },
                    { label: 'Nationalité', value: info?.nationalite },
                    { label: 'Type', value: info?.clientType },
                    { label: 'Téléphone', value: info?.tel, cls: 'font-mono' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-slate-400">{label}</dt>
                      <dd className={`truncate text-slate-700 ${cls ?? ''}`}>{value || '—'}</dd>
                    </div>
                  ))}
                  <div className="min-w-0">
                    <dt className="text-slate-400">E-billet compagnie</dt>
                    <dd className="mt-0.5"><MiniaturePreuve chemin={b.pjBillet} libelle="E-billet de la compagnie" taille="sm" /></dd>
                  </div>
                </dl>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dialogue de confirmation Reporter ── */}
      {billetAReporter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setBilletAReporter(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-4">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-slate-800">Reporter le billet</h3>
                <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                  {nomReporter}
                  {billetAReporter.numeroBillet && (
                    <span className="ml-1.5 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {billetAReporter.numeroBillet}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setBilletAReporter(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Avertissement */}
            <div className="mx-5 mb-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Le report s'applique à <strong>toute la ligne de vol</strong>
                {billets.length > 1 ? ` (${billets.length} passagers)` : ''}, pas seulement à ce passager.
                Cette action est irréversible.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 px-5 pb-5">
              <button onClick={() => setBilletAReporter(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200
                          text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={confirmerReport}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white
                          bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de sélection des exigences de voyage importantes ── */}
      {exigenceModal && (() => {
        const { billet: b, action } = exigenceModal;
        const info = b.clientbeneficiaireInfo;
        const nomPassager = `${info?.prenom ?? ''} ${info?.nom ?? ''}`.trim() || 'Passager inconnu';
        const list = collectExigences();
        const selected = importantIdsByBillet[b.id] ?? new Set<string>();

        const toggleImportant = (exigenceId: string) =>
          setImportantIdsByBillet(prev => {
            const next = new Set(prev[b.id] ?? []);
            if (next.has(exigenceId)) {
              next.delete(exigenceId);
            } else {
              next.add(exigenceId);
            }
            return { ...prev, [b.id]: next };
          });

        const confirmExigences = () => {
          const data = buildBilletData(b, ligne, billetEntete);
          if (selected.size > 0) data.exigencesImportantesIds = Array.from(selected);
          const styleId = getStyle(b.id);
          if (action === 'preview') preview(data, styleId);
          else generate(data, styleId);
          setExigenceModal(null);
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setExigenceModal(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-5 pt-5 pb-4">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-slate-800">Exigences de voyage</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5 truncate">{nomPassager}</p>
                </div>
                <button onClick={() => setExigenceModal(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Liste des exigences */}
              <div className="mx-5 mb-4">
                {list.length === 0 ? (
                  <p className="text-[12px] text-slate-400 italic px-1">
                    Aucune exigence de voyage pour cette destination.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-400 px-1 mb-2">
                      Cliquez sur une exigence pour la mettre en valeur (rouge) dans le PDF généré.
                    </p>
                    <ul className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {list.map(e => {
                        const isImportant = selected.has(e.id);
                        return (
                          <li
                            key={e.id}
                            onClick={() => toggleImportant(e.id)}
                            className={`px-3.5 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${
                              isImportant ? 'bg-red-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <span className={`flex-1 min-w-0 text-[12px] ${
                              isImportant ? 'text-red-700 font-semibold' : 'text-slate-600'
                            }`}>
                              <span className="font-medium">{e.type}</span>
                              {e.description ? ` — ${e.description}` : ''}
                            </span>
                            {isImportant && (
                              <span className="text-[9px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                Important
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>

              {/* Style du billet PDF */}
              <div className="mx-5 mb-4">
                <p className="mb-1.5 px-1 text-[11px] text-slate-400">Style du billet</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(BILLET_STYLES).map((s) => (
                    <button key={s.id} type="button" onClick={() => setStyle(b.id, s.id as BilletStyleId)}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        getStyle(b.id) === s.id
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      }`}>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.preview }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 px-5 pb-5">
                <button onClick={() => setExigenceModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200
                            text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={confirmExigences}
                  disabled={pdfLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white
                            bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {action === 'preview' ? 'Aperçu' : 'Générer le PDF'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
