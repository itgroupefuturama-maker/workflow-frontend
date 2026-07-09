import React, { useState } from 'react';
import type { BilletEntete, BilletLigne, ServiceProspectionLigne, ServiceSpecifique } from '../../../../../../app/front_office/billetSlice';
import { FiFilter, FiX } from 'react-icons/fi';
import { API_URL } from '../../../../../../service/env';
import type { BilletPassagerData, BilletPassagerExigence, BilletPassagerService } from '../../../module.pdf/pdf.generation/generators/billet-passager.generator';
import { useBilletPassagerPdf } from '../../../module.pdf/pdf.generation/hooks/usePdfGenerator';
import type { BilletStyleId } from '../../../module.pdf/pdf.generation/types/pdf-design.types';
import { BILLET_STYLES } from '../../../module.pdf/pdf.generation/config/billet-styles';

// --- Sous-composant pour les cellules de prix (évite la répétition et les erreurs de rendu) ---
const PriceCell = ({ value, isCurrency = false, className = "" }: { value: number, isCurrency?: boolean, className?: string }) => (
  <td className={`px-4 py-3 text-right ${className}`}>
    {value?.toLocaleString('fr-FR', isCurrency ? { minimumFractionDigits: 2 } : {}) || '—'}
  </td>
);

interface BilletTableProps {
  lignes: any[];
  groups: any[];
  billet: any;
  billetLignes: any[];
  handleOpenReservation: (ligne: any) => void;
  handleOpenEmission: (ligne: any) => void;
  handleReprogrammer: (ligne: BilletLigne) => void;   // ← CHANGEMENT ICI : une seule ligne
  handleRemove: (ligne: BilletLigne) => void;
  serviceById: Map<string, ServiceSpecifique>;
  handleReporter: (ligne: BilletLigne) => void; 
}

interface PassagersCellProps {
  billets: BilletLigne['billet'];
  handleReporter: (ligne: BilletLigne) => void;
  ligne: BilletLigne;
  billetEntete: BilletEntete;
}

const PassagersCell: React.FC<PassagersCellProps> = ({ billets, handleReporter, ligne, billetEntete }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [styleIds, setStyleIds]       = useState<Record<string, BilletStyleId>>({});
  const [billetAReporter, setBilletAReporter] = useState<BilletLigne['billet'][0] | null>(null);
  const [dateReport, setDateReport]   = useState('');
  const { generate, preview, loading: pdfLoading } = useBilletPassagerPdf();

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
        ?.map(pv => pv.exigenceVoyage)
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
        destinationVoyage: p.destinationVoyage as any,
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
    handleReporter(billetAReporter);
    setBilletAReporter(null);
  };

  if (!billets || billets.length === 0)
    return <span className="text-slate-400 text-xs italic">Aucun passager</span>;

  const infoReporter = billetAReporter?.clientbeneficiaireInfo;
  const nomReporter  = `${infoReporter?.prenom ?? ''} ${infoReporter?.nom ?? ''}`.trim() || 'Passager inconnu';

  return (
    <>
      <div className="flex flex-col gap-2.5 min-w-[340px]">
        {billets.map((b, idx) => {
          const info       = b.clientbeneficiaireInfo;
          const nomComplet = `${info?.prenom ?? ''} ${info?.nom ?? ''}`.trim() || 'Passager inconnu';
          const expanded   = expandedIds.has(b.id);
          const styleId    = getStyle(b.id);
          const docExpire  = info?.dateValiditeDoc
            ? new Date(info.dateValiditeDoc) < new Date()
            : false;

          return (
            <div key={b.id} className="border border-slate-300/80 rounded-xl bg-white overflow-hidden">

              {/* ── Header ── */}
              <button
                type="button"
                onClick={() => toggleExpand(b.id)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="w-[22px] h-[22px] rounded-full bg-slate-100 border border-slate-200
                                 flex items-center justify-center text-[11px] font-medium text-slate-500 shrink-0">
                  {idx + 1}
                </span>
                <span className="flex-1 text-[13px] font-medium text-slate-800 truncate">{nomComplet}</span>
                {b.numeroBillet && (
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700
                                   border border-emerald-200 rounded-md px-1.5 py-0.5 shrink-0">
                    {b.numeroBillet}
                  </span>
                )}
                {b.statut && (
                  <span className="text-[10px] font-medium bg-amber-50 text-amber-700
                                   border border-amber-200 rounded-md px-1.5 py-0.5 shrink-0">
                    {b.statut}
                  </span>
                )}
                <svg className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ── Préférences ── */}
              {b.servicePreference && b.servicePreference.length > 0 && (
                <div className="flex flex-wrap gap-1 px-3.5 py-2 border-t border-slate-100 bg-slate-50/60">
                  {b.servicePreference.map((pref, i) => (
                    <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md
                                            bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ✓ {pref}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Corps ── */}
              {expanded && (
                <div className="flex border-t border-slate-100">

                  {/* Grille d'infos */}
                  <div className="flex-1 grid grid-cols-2 px-3.5 py-3 min-w-0">
                    {[
                      { label: 'Type doc',      value: info.typeDoc,      cls: '' },
                      { label: 'Nationalité',   value: info.nationalite,  cls: '' },
                      { label: 'Référence',     value: info.referenceDoc, cls: 'font-mono' },
                      { label: 'Type passager', value: info.clientType,   cls: '' },
                      {
                        label: 'Validité doc',
                        value: info.dateValiditeDoc
                          ? new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR')
                          : '—',
                        cls:    docExpire ? 'text-red-600' : 'text-emerald-700',
                        suffix: docExpire ? ' ⚠️' : '',
                      },
                      ...(info.tel ? [{ label: 'Téléphone', value: info.tel, cls: 'font-mono' }] : []),
                    ].map(({ label, value, cls, suffix }, i, arr) => (
                      <div key={label}
                        className={`flex flex-col gap-0.5 py-1.5 ${i < arr.length - 2 ? 'border-b border-slate-100' : ''}`}>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                        <span className={`text-[12px] font-medium text-slate-700 ${cls}`}>
                          {value || '—'}{suffix}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Colonne d'actions */}
                  <div className="flex flex-col gap-2 px-3.5 py-3 border-l border-slate-100 min-w-[130px] justify-center">

                    {/* Sélecteur de style */}
                    <div className="flex flex-wrap gap-1">
                      {Object.values(BILLET_STYLES).map((s) => (
                        <button key={s.id} onClick={() => setStyle(b.id, s.id as BilletStyleId)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors
                            ${styleId === s.id
                              ? 'border-slate-700 bg-slate-700 text-white'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'}`}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.preview }} />
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Reporter → ouvre le dialogue */}
                    <button
                      disabled={b.statut !== 'PLANIFIE'}
                      onClick={() => ouvrirDialogue(b)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border w-full transition-all
                        ${b.statut !== 'PLANIFIE'
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-50 active:scale-95'}`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reporter
                    </button>

                    {/* Aperçu */}
                    <button onClick={() => preview(buildBilletData(b, ligne, billetEntete), styleId)} disabled={pdfLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border w-full
                                 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40 transition-colors">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Aperçu
                    </button>

                    {/* Billet PDF */}
                    <button onClick={() => generate(buildBilletData(b, ligne, billetEntete), styleId)} disabled={pdfLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border w-full
                                 border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-40 transition-colors">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {pdfLoading ? '…' : 'Billet PDF'}
                    </button>
                  </div>
                </div>
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
                Voulez-vous vraiment reporter ce billet ? Cette action est irréversible.
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
    </>
  );
};

// ────────────────────────────────────────────────
// Sous-composant pour afficher les services spécifiques
// ────────────────────────────────────────────────
const ServicesSpecifiquesCell = ({
  services,
}: {
  services: ServiceProspectionLigne[] | undefined;
}) => {
  if (!services || services.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  return (
    <div className="flex flex-row gap-1">
      {services.map((svc) => {
        const libelle = svc.serviceSpecifique?.libelle ?? '—';
        const valeur =
          svc.valeur === 'true'  ? 'Oui' :
          svc.valeur === 'false' ? 'Non' :
          svc.valeur;

        return (
          <span
            key={svc.id}
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200"
            title={svc.serviceSpecifique?.code ?? ''}
          >
            {libelle} : {valeur}
          </span>
        );
      })}
    </div>
  );
};

const BilletTable: React.FC<BilletTableProps> = ({
  lignes,
  groups,
  billet,
  handleOpenReservation,
  handleOpenEmission,
  handleReprogrammer,
  handleRemove,
  handleReporter,
  serviceById,
}) => {
  const [sortOriginAsc, setSortOriginAsc] = useState(true);

  // On trie les lignes (copie pour ne pas muter la prop)
  const sortedLignes = [...lignes].sort((a, b) => {
    const valA = (a.referenceLine || '').toString().trim().toLowerCase();
    const valB = (b.referenceLine || '').toString().trim().toLowerCase();
    
    if (valA < valB) return sortOriginAsc ? -1 : 1;
    if (valA > valB) return sortOriginAsc ? 1 : -1;
    return 0;
  });

  const toggleSortOrigin = () => {
    setSortOriginAsc(prev => !prev);
  };

  const [collapsedGroups, setCollapsedGroups] = useState({
    infosVol:        false,
    puCieDevise:     false,   // replié par défaut
    puCieAriary:     false,
    puClientDevise:  false,
    puClientAriary:  false,
    mtCieDevise:     false,
    mtCieAriary:     false,
    mtClientDevise:  false,
    mtClientAriary:  false,
    mtResa:          false,
    commissions:     false,
    annulation:      false,
    services:        false,
  });

  const toggleGroup = (group: keyof typeof collapsedGroups) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };


  if (lignes.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucune ligne enregistrée pour ce billet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-white overflow-hidden border border-slate-300">
        {/* Titre + icône filtre */}
        <div className="border-b p-3 border-slate-300 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
            Lignes du billet
          </h2>
          <button
            onClick={toggleSortOrigin}
            className="flex items-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-300 transition-all text-xs font-semibold"
            title="Trier par Origin Ligne"
          >
            <FiFilter size={14} />
            <span>Origin Ligne</span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              sortOriginAsc
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {sortOriginAsc ? '▲ A→Z' : '▼ Z→A'}
            </span>
          </button>
        </div>

        {/* Dans le div header, après le titre */}
        <div className="px-5 py-2 bg-slate-200 border-b border-slate-300 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Groupes :</span>
          {([
            { key: 'infosVol',       label: '✈️ Infos Vol',       color: 'slate'  },
            { key: 'puCieDevise',    label: '🏢 PU Cie Devise',   color: 'emerald'},
            { key: 'puCieAriary',    label: '🏢 PU Cie Ar',       color: 'emerald'},
            { key: 'puClientDevise', label: '👤 PU Client Devise', color: 'blue'   },
            { key: 'puClientAriary', label: '👤 PU Client Ar',    color: 'blue'   },
            { key: 'mtCieDevise',    label: '🏢 Mt Cie Devise',   color: 'teal'   },
            { key: 'mtCieAriary',    label: '🏢 Mt Cie Ar',       color: 'teal'   },
            { key: 'mtClientDevise', label: '👤 Mt Client Devise', color: 'indigo' },
            { key: 'mtClientAriary', label: '👤 Mt Client Ar',    color: 'indigo' },
            { key: 'mtResa',         label: '🎫 Mt Résa',         color: 'violet' },
            { key: 'commissions',    label: '💰 Commissions',     color: 'green'  },
            { key: 'annulation',     label: '⚠️ Conditions',      color: 'orange' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleGroup(key)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                collapsedGroups[key]
                  ? 'bg-white text-slate-400 border-slate-200 line-through'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Tout replier — désactivé si tout est déjà replié */}
          <button
            disabled={ Object.values(collapsedGroups).every(v => v === true)}
            onClick={() => setCollapsedGroups(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])) as any)}
            className={`ml-auto text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                Object.values(collapsedGroups).every(v => v === true)
                ? 'opacity-40 cursor-not-allowed border-white text-slate-700'
                : 'border-red-200 text-red-500 hover:bg-red-50'
            }`}
          >
            Tout replier
          </button>

          {/* Tout déplier — désactivé si tout est déjà déplié */}
          <button
            disabled={ Object.values(collapsedGroups).every(v => v === false)}
            onClick={() => setCollapsedGroups(prev => Object.fromEntries(Object.keys(prev).map(k => [k, false])) as any)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                Object.values(collapsedGroups).every(v => v === false)
                ? 'opacity-40 cursor-not-allowed border-white text-slate-700'
                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Tout déplier
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-200 sticky top-0 z-10 text-xs">
              {/* Ligne 1 — groupes */}
              <tr className="border-b-2 border-slate-300">
                {/* Colonnes fixes (rowSpan=2) */}
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 w-12">N°</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Origin Ligne</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Fournisseur</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">N° Résa</th>
                <th rowSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700 uppercase bg-slate-100">Taux Prospection</th>
                <th rowSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700 uppercase bg-slate-100">Taux Resa</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100">Statut</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100">Nb pax</th>

                {/* Groupe Infos Vol */}
                <th
                  colSpan={collapsedGroups.infosVol ? 1 : 12}
                  onClick={() => toggleGroup('infosVol')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-slate-700 border-x border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    ✈️ Infos Vol
                    <span className="text-slate-300 text-xs">{collapsedGroups.infosVol ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* ********************** Prix Prospection ********************** */}
                {/* Groupe PU Cie Devise */}
                <th
                  colSpan={collapsedGroups.puCieDevise ? 1 : 6}
                  onClick={() => toggleGroup('puCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 PU Cie Devise Prospection
                    <span className="text-xs">{collapsedGroups.puCieDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Cie Ariary */}
                <th
                  colSpan={collapsedGroups.puCieAriary ? 1 : 3}
                  onClick={() => toggleGroup('puCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-800 border-x border-emerald-600 cursor-pointer hover:bg-emerald-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 PU Cie Ariary Prospection
                    <span className="text-xs">{collapsedGroups.puCieAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Client Devise */}
                <th
                  colSpan={collapsedGroups.puClientDevise ? 1 : 3}
                  onClick={() => toggleGroup('puClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-blue-700 border-x border-blue-500 cursor-pointer hover:bg-blue-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 PU Client Devise Prospection
                    <span className="text-xs">{collapsedGroups.puClientDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Client Ariary */}
                <th
                  colSpan={collapsedGroups.puClientAriary ? 1 : 3}
                  onClick={() => toggleGroup('puClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-blue-800 border-x border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 PU Client Ariary Prospection
                    <span className="text-xs">{collapsedGroups.puClientAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Cie Devise */}
                <th
                  colSpan={collapsedGroups.mtCieDevise ? 1 : 3}
                  onClick={() => toggleGroup('mtCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-teal-700 border-x border-teal-500 cursor-pointer hover:bg-teal-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 Mt Cie Devise Prospection
                    <span className="text-xs">{collapsedGroups.mtCieDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Cie Ariary */}
                <th
                  colSpan={collapsedGroups.mtCieAriary ? 1 : 3}
                  onClick={() => toggleGroup('mtCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-teal-800 border-x border-teal-600 cursor-pointer hover:bg-teal-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 Mt Cie Ariary Prospection
                    <span className="text-xs">{collapsedGroups.mtCieAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Client Devise */}
                <th
                  colSpan={collapsedGroups.mtClientDevise ? 1 : 3}
                  onClick={() => toggleGroup('mtClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-indigo-700 border-x border-indigo-500 cursor-pointer hover:bg-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 Mt Client Devise Prospection
                    <span className="text-xs">{collapsedGroups.mtClientDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Client Ariary */}
                <th
                  colSpan={collapsedGroups.mtClientAriary ? 1 : 3}
                  onClick={() => toggleGroup('mtClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-indigo-800 border-x border-indigo-600 cursor-pointer hover:bg-indigo-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 Mt Client Ariary Prospection
                    <span className="text-xs">{collapsedGroups.mtClientAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Réservation */}
                <th
                  colSpan={collapsedGroups.mtResa ? 1 : 3}
                  onClick={() => toggleGroup('mtResa')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🎫 Mt Total CIE Prospection
                    <span className="text-xs">{collapsedGroups.mtResa ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* ****************************** Prix Reservation ****************************** */}

                {/* Groupe PU Cie Devise */}
                <th
                  colSpan={collapsedGroups.puCieDevise ? 1 : 3}
                  onClick={() => toggleGroup('puCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-700 border-x border-emerald-500 cursor-pointer hover:bg-emerald-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 PU Cie Devise Réservation
                    <span className="text-xs">{collapsedGroups.puCieDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Cie Ariary */}
                <th
                  colSpan={collapsedGroups.puCieAriary ? 1 : 3}
                  onClick={() => toggleGroup('puCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-emerald-800 border-x border-emerald-600 cursor-pointer hover:bg-emerald-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 PU Cie Ariary Réservation
                    <span className="text-xs">{collapsedGroups.puCieAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Client Devise */}
                <th
                  colSpan={collapsedGroups.puClientDevise ? 1 : 3}
                  onClick={() => toggleGroup('puClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-blue-700 border-x border-blue-500 cursor-pointer hover:bg-blue-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 PU Client Devise Réservation
                    <span className="text-xs">{collapsedGroups.puClientDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe PU Client Ariary */}
                <th
                  colSpan={collapsedGroups.puClientAriary ? 1 : 3}
                  onClick={() => toggleGroup('puClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-blue-800 border-x border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 PU Client Ariary Réservation
                    <span className="text-xs">{collapsedGroups.puClientAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Cie Devise */}
                <th
                  colSpan={collapsedGroups.mtCieDevise ? 1 : 3}
                  onClick={() => toggleGroup('mtCieDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-teal-700 border-x border-teal-500 cursor-pointer hover:bg-teal-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 Mt Cie Devise Réservation
                    <span className="text-xs">{collapsedGroups.mtCieDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Cie Ariary */}
                <th
                  colSpan={collapsedGroups.mtCieAriary ? 1 : 3}
                  onClick={() => toggleGroup('mtCieAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-teal-800 border-x border-teal-600 cursor-pointer hover:bg-teal-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🏢 Mt Cie Ariary Réservation
                    <span className="text-xs">{collapsedGroups.mtCieAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Client Devise */}
                <th
                  colSpan={collapsedGroups.mtClientDevise ? 1 : 3}
                  onClick={() => toggleGroup('mtClientDevise')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-indigo-700 border-x border-indigo-500 cursor-pointer hover:bg-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 Mt Client Devise Réservation
                    <span className="text-xs">{collapsedGroups.mtClientDevise ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Client Ariary */}
                <th
                  colSpan={collapsedGroups.mtClientAriary ? 1 : 3}
                  onClick={() => toggleGroup('mtClientAriary')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-indigo-800 border-x border-indigo-600 cursor-pointer hover:bg-indigo-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    👤 Mt Client Ariary Réservation
                    <span className="text-xs">{collapsedGroups.mtClientAriary ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Mt Réservation */}
                <th
                  colSpan={collapsedGroups.mtResa ? 1 : 3}
                  onClick={() => toggleGroup('mtResa')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-violet-700 border-x border-violet-500 cursor-pointer hover:bg-violet-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    🎫 Mt Réservation Réservation
                    <span className="text-xs">{collapsedGroups.mtResa ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Commissions */}
                <th
                  colSpan={collapsedGroups.commissions ? 1 : 2}
                  onClick={() => toggleGroup('commissions')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-green-700 border-x border-green-500 cursor-pointer hover:bg-green-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    💰 Commissions
                    <span className="text-xs">{collapsedGroups.commissions ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Groupe Annulation */}
                <th
                  colSpan={collapsedGroups.annulation ? 1 : 2}
                  onClick={() => toggleGroup('annulation')}
                  className="px-4 py-2 text-center font-bold text-white uppercase bg-orange-700 border-x border-orange-500 cursor-pointer hover:bg-orange-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    ⚠️ Conditions
                    <span className="text-xs">{collapsedGroups.annulation ? '▶' : '▼'}</span>
                  </div>
                </th>

                {/* Services + Actions fixes */}
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Mode de paiement</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100">Services</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-slate-700 uppercase bg-slate-100 min-w-[600px]">
                  Passagers & Billets
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 min-w-[220px]">Preuve</th>
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-slate-700 uppercase bg-slate-100 min-w-[220px]">Actions</th>
              </tr>

              {/* Ligne 2 — sous-en-têtes */}
              <tr>
                {/* Infos Vol */}
                {!collapsedGroups.infosVol ? (
                  <>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Avion</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">N° Vol</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Compagnie</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Itinéraire</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Classe</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-800/10">Type pax</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Date départ</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Date arrivée</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Aéroport départ</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Aéroport arrivée</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Durée vol</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-800/10">Durée escale</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-slate-400 italic bg-slate-800/10">— replié —</th>
                )}

                {/* PU Cie Devise */}
                {!collapsedGroups.puCieDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Pénalité</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Taux Taxe</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Taxe Devise</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Taxe Ariary</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-emerald-400 italic bg-emerald-50">— replié —</th>
                )}

                {/* PU Cie Ariary */}
                {!collapsedGroups.puCieAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-emerald-500 italic bg-emerald-100">— replié —</th>
                )}

                {/* PU Client Devise */}
                {!collapsedGroups.puClientDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-blue-400 italic bg-blue-50">— replié —</th>
                )}

                {/* PU Client Ariary */}
                {!collapsedGroups.puClientAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-blue-500 italic bg-blue-100">— replié —</th>
                )}

                {/* Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-teal-400 italic bg-teal-50">— replié —</th>
                )}

                {/* Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-teal-500 italic bg-teal-100">— replié —</th>
                )}

                {/* Mt Client Devise */}
                {!collapsedGroups.mtClientDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-indigo-400 italic bg-indigo-50">— replié —</th>
                )}

                {/* Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-indigo-500 italic bg-indigo-100">— replié —</th>
                )}

                {/* Mt Réservation */}
                {!collapsedGroups.mtResa ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-violet-400 italic bg-violet-50">— replié —</th>
                )}


                {/* ********************** Prix resa ******************* */}

                {/* PU Cie Devise */}
                {!collapsedGroups.puCieDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700 bg-emerald-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-emerald-400 italic bg-emerald-50">— replié —</th>
                )}

                {/* PU Cie Ariary */}
                {!collapsedGroups.puCieAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-800 bg-emerald-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-emerald-500 italic bg-emerald-100">— replié —</th>
                )}

                {/* PU Client Devise */}
                {!collapsedGroups.puClientDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-700 bg-blue-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-blue-400 italic bg-blue-50">— replié —</th>
                )}

                {/* PU Client Ariary */}
                {!collapsedGroups.puClientAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-800 bg-blue-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-blue-500 italic bg-blue-100">— replié —</th>
                )}

                {/* Mt Cie Devise */}
                {!collapsedGroups.mtCieDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-700 bg-teal-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-teal-400 italic bg-teal-50">— replié —</th>
                )}

                {/* Mt Cie Ariary */}
                {!collapsedGroups.mtCieAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-teal-800 bg-teal-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-teal-500 italic bg-teal-100">— replié —</th>
                )}

                {/* Mt Client Devise */}
                {!collapsedGroups.mtClientDevise ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 bg-indigo-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-indigo-400 italic bg-indigo-50">— replié —</th>
                )}

                {/* Mt Client Ariary */}
                {!collapsedGroups.mtClientAriary ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Billet Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Service Ar</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-800 bg-indigo-100">Pénalité Ar</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-indigo-500 italic bg-indigo-100">— replié —</th>
                )}

                {/* Mt Réservation */}
                {!collapsedGroups.mtResa ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Billet</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Service</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-violet-700 bg-violet-50">Pénalité</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-violet-400 italic bg-violet-50">— replié —</th>
                )}

                {/* Commissions */}
                {!collapsedGroups.commissions ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50">Devise</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 bg-green-50">Ariary</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-green-400 italic bg-green-50">— replié —</th>
                )}

                {/* Conditions */}
                {!collapsedGroups.annulation ? (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-orange-700 bg-orange-50">Modif</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-orange-700 bg-orange-50">Annulation</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-center text-xs text-orange-400 italic bg-orange-50">— replié —</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {sortedLignes.map((ligne, index) => {
                const p = ligne.prospectionLigne;
                const fournisseurLibelle = billet?.prospectionEntete?.fournisseur?.libelle || '—';
                const prospectionEntete = billet?.prospectionEntete;

                // Calculs simples par ligne (plus de group)
                const isReserved = !!ligne.reservation?.trim();
                const isEmitted  = ligne.statut === 'CLOTURER';
                const canReserve = !isReserved && !['MODIFIER', 'ANNULER', 'FAIT'].includes(ligne.statut || '') ;
                const canEmit    = ligne.statut === 'FAIT' && billet?.statut !== 'CREER';
                const isAnnulerDisabled =
                  ['ANNULER', 'CLOTURER', 'MODIFIER', 'CREER'].includes(ligne.statut);

                return (
                    <tr key={ligne.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                      {/* Colonnes fixes */}
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ligne.referenceLine}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ligne.reservation || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{ligne.prospectionLigne.tauxEchange || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{ligne.resaTauxEchange || '—'}</td>
                      <td className="px-4 py-3 text-center text-xs">{ligne.statusLigne == 'ANNULER' ? 'ANNULÉ' : ligne.statusLigne == 'CLOTURER' ? 'CLÔTURÉ' : ligne.statusLigne == 'MODIFIER' ? 'MODIFIÉ' : ligne.statusLigne == 'CREER' ? 'CRÉÉ' : ligne.statusLigne || '—'}</td>
                      <td className="px-4 py-3 text-center font-medium">{ligne.prospectionLigne.nombre || '—'}</td>

                      {/* Infos Vol */}
                      {!collapsedGroups.infosVol ? (
                        <>
                          <td className="px-4 py-3">{p?.avion || '—'}</td>
                          <td className="px-4 py-3 font-medium">{p?.numeroVol || '—'}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{fournisseurLibelle}</td>
                          <td className="px-4 py-3">{p?.itineraire || '—'}</td>
                          <td className="px-4 py-3">{p?.classe || '—'}</td>
                          <td className="px-4 py-3">{p?.typePassager || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            {p?.dateHeureDepart ? new Date(p.dateHeureDepart).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p?.dateHeureArrive ? new Date(p.dateHeureArrive).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td className="px-4 py-3">{p?.aeroportDepart || '—'}</td>
                          <td className="px-4 py-3">{p?.aeroportArrivee || '—'}</td>
                          <td className="px-4 py-3">{p?.dureeVol || '—'}</td>
                          <td className="px-4 py-3">{p?.dureeEscale || '—'}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-slate-400 bg-slate-50 italic">
                          {p?.numeroVol} · {p?.itineraire}
                        </td>
                      )}

                      {/* **************************** Prix Prospection **************************** */}

                      {/* ===== SECTION PRIX PROSPECTION (depuis ligne.prospectionLigne) ===== */}

                      {/* PU Cie Devise - Prospection */}
                      {!collapsedGroups.puCieDevise ? (
                        <>
                          <PriceCell value={p?.puBilletCompagnieDevise} isCurrency />
                          <PriceCell value={p?.puServiceCompagnieDevise} isCurrency />
                          <PriceCell value={p?.puPenaliteCompagnieDevise} isCurrency />
                          <PriceCell value={p?.tauxTaxe} isCurrency />
                          <PriceCell value={p?.montantTaxeDevise} isCurrency />
                          <PriceCell value={p?.montantTaxeAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-emerald-600 bg-emerald-50 font-semibold">
                          {p?.puBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* PU Cie Ariary - Prospection */}
                      {!collapsedGroups.puCieAriary ? (
                        <>
                          <PriceCell value={p?.puBilletCompagnieAriary} isCurrency />
                          <PriceCell value={p?.puServiceCompagnieAriary} isCurrency />
                          <PriceCell value={p?.puPenaliteCompagnieAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-emerald-700 bg-emerald-100 font-semibold">
                          {p?.puBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* PU Client Devise - Prospection */}
                      {/* ⚠️ ProspectionLigne n'a PAS de puBilletClientDevise séparé,
                          il a montantBilletClientDevise — à adapter selon votre modèle */}
                      {!collapsedGroups.puClientDevise ? (
                        <>
                          <PriceCell value={p?.montantBilletClientDevise} isCurrency />
                          <PriceCell value={p?.montantServiceClientDevise} isCurrency />
                          <PriceCell value={p?.montantPenaliteClientDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-blue-600 bg-blue-50 font-semibold">
                          {p?.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* PU Client Ariary - Prospection */}
                      {!collapsedGroups.puClientAriary ? (
                        <>
                          <PriceCell value={p?.montantBilletClientAriary} isCurrency />
                          <PriceCell value={p?.montantServiceClientAriary} isCurrency />
                          <PriceCell value={p?.montantPenaliteClientAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-blue-700 bg-blue-100 font-semibold">
                          {p?.montantBilletClientAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Cie Devise - Prospection */}
                      {!collapsedGroups.mtCieDevise ? (
                        <>
                          <PriceCell value={p?.montantBilletCompagnieDevise} isCurrency />
                          <PriceCell value={p?.montantServiceCompagnieDevise} isCurrency />
                          <PriceCell value={p?.montantPenaliteCompagnieDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-teal-600 bg-teal-50 font-semibold">
                          {p?.montantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Mt Cie Ariary - Prospection */}
                      {!collapsedGroups.mtCieAriary ? (
                        <>
                          <PriceCell value={p?.montantBilletCompagnieAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={p?.montantServiceCompagnieAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={p?.montantPenaliteCompagnieAriary} className="font-medium text-emerald-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-teal-700 bg-teal-100 font-semibold">
                          {p?.montantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Client Devise - Prospection */}
                      {!collapsedGroups.mtClientDevise ? (
                        <>
                          <PriceCell value={p?.montantBilletClientDevise} isCurrency />
                          <PriceCell value={p?.montantServiceClientDevise} isCurrency />
                          <PriceCell value={p?.montantPenaliteClientDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-indigo-600 bg-indigo-50 font-semibold">
                          {p?.montantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Mt Client Ariary - Prospection */}
                      {!collapsedGroups.mtClientAriary ? (
                        <>
                          <PriceCell value={p?.montantBilletClientAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={p?.montantServiceClientAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={p?.montantPenaliteClientAriary} className="font-medium text-emerald-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-indigo-700 bg-indigo-100 font-semibold">
                          {p?.montantBilletClientAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Réservation - Prospection (commission + total) */}
                      {!collapsedGroups.mtResa ? (
                        <>
                          <PriceCell value={p?.montantBilletCompagnieAriary} className="font-medium text-violet-700" />
                          <PriceCell value={p?.montantServiceCompagnieAriary} className="font-medium text-violet-700" />
                          <PriceCell value={p?.montantPenaliteCompagnieAriary} className="font-medium text-violet-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-violet-600 bg-violet-50 font-semibold">
                          {p?.montantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* **************************** Prix Resa **************************** */}
                      {/* PU Cie Devise */}
                      {!collapsedGroups.puCieDevise ? (
                        <>
                          <PriceCell value={ligne.puResaBilletCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaServiceCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteCompagnieDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-emerald-600 bg-emerald-50 font-semibold">
                          {ligne.puResaBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* PU Cie Ariary */}
                      {!collapsedGroups.puCieAriary ? (
                        <>
                          <PriceCell value={ligne.puResaBilletCompagnieAriary} isCurrency />
                          <PriceCell value={ligne.puResaServiceCompagnieAriary} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteCompagnieAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-emerald-700 bg-emerald-100 font-semibold">
                          {ligne.puResaBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* PU Client Devise */}
                      {!collapsedGroups.puClientDevise ? (
                        <>
                          <PriceCell value={ligne.puResaBilletClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaServiceClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteClientDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-blue-600 bg-blue-50 font-semibold">
                          {ligne.puResaBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* PU Client Ariary */}
                      {!collapsedGroups.puClientAriary ? (
                        <>
                          <PriceCell value={ligne.puResaBilletClientAriary} isCurrency />
                          <PriceCell value={ligne.puResaServiceClientAriary} isCurrency />
                          <PriceCell value={ligne.puResaPenaliteClientAriary} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-blue-700 bg-blue-100 font-semibold">
                          {ligne.puResaBilletClientAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Cie Devise */}
                      {!collapsedGroups.mtCieDevise ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-teal-600 bg-teal-50 font-semibold">
                          {ligne.puResaMontantBilletCompagnieDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Mt Cie Ariary */}
                      {!collapsedGroups.mtCieAriary ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-emerald-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-teal-700 bg-teal-100 font-semibold">
                          {ligne.puResaMontantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Mt Client Devise */}
                      {!collapsedGroups.mtClientDevise ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantServiceClientDevise} isCurrency />
                          <PriceCell value={ligne.puResaMontantPenaliteClientDevise} isCurrency />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-indigo-600 bg-indigo-50 font-semibold">
                          {ligne.puResaMontantBilletClientDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Mt Client Ariary */}
                      {!collapsedGroups.mtClientAriary ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletClientAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantServiceClientAriary} className="font-medium text-emerald-700" />
                          <PriceCell value={ligne.puResaMontantPenaliteClientAriary} className="font-medium text-emerald-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-indigo-700 bg-indigo-100 font-semibold">
                          {ligne.puResaMontantBilletClientAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}
                      

                      {/* Mt Réservation */}
                      {!collapsedGroups.mtResa ? (
                        <>
                          <PriceCell value={ligne.puResaMontantBilletCompagnieAriary} className="font-medium text-violet-700" />
                          <PriceCell value={ligne.puResaMontantServiceCompagnieAriary} className="font-medium text-violet-700" />
                          <PriceCell value={ligne.puResaMontantPenaliteCompagnieAriary} className="font-medium text-violet-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-violet-600 bg-violet-50 font-semibold">
                          {ligne.puResaMontantBilletCompagnieAriary?.toLocaleString('fr-FR')} Ar
                        </td>
                      )}

                      {/* Commissions */}
                      {!collapsedGroups.commissions ? (
                        <>
                          <PriceCell value={ligne.resaCommissionEnDevise} className="font-medium text-green-700" />
                          <PriceCell value={ligne.resaCommissionEnAriary} className="font-medium text-green-700" />
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-green-700 bg-green-50 font-bold">
                          {ligne.resaCommissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Conditions */}
                      {!collapsedGroups.annulation ? (
                        <>
                          <td className="px-4 py-3">{p?.conditionModif || '—'}</td>
                          <td className="px-4 py-3">{p?.conditionAnnul || '—'}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center text-xs text-orange-600 bg-orange-50 italic">
                          {p?.conditionModif ? '⚠️' : '—'}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        {ligne.prospectionLigne?.modePaiement}
                      </td>

                      <td className="px-4 py-3">
                        <ServicesSpecifiquesCell 
                          services={ligne.prospectionLigne?.serviceProspectionLigne} 
                        />
                      </td>

                      <td className="px-4 py-3 align-top">
                        <PassagersCell billets={ligne.billet} handleReporter={handleReporter} ligne={ligne} billetEntete={billet} />
                      </td>

                      {/* Preuve client — image séparée car pas un simple texte */}
                      <td className='flex flex-row gap-2 '>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">Preuve client</p>
                          {prospectionEntete?.preuveClient ? (
                            <a
                              href={`${API_URL}/${prospectionEntete.preuveClient}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={`${API_URL}/${prospectionEntete.preuveClient}`}
                                alt="Preuve client"
                                className="h-10 w-16 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </a>
                          ) : (
                            <p className="text-sm text-slate-400 italic">—</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">Preuve Resa</p>
                          {ligne.preuveResa ? (
                            <a
                              href={`${API_URL}/${ligne.preuveResa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={`${API_URL}/${ligne.preuveResa}`}
                                alt="Preuve resa"
                                className="h-10 w-16 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </a>
                          ) : (
                            <p className="text-sm text-slate-400 italic">—</p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center min-w-[220px]">
                        <div className="flex items-center justify-center gap-2 flex-wrap">

                          {canReserve && 
                            ligne.statusLigne !== 'ANNULATION' && 
                            ligne.statusLigne !== 'ANNULER' && (
                            <button
                              onClick={() => handleOpenReservation(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Réserver
                            </button>
                          )}

                          {canEmit && 
                            ligne.statusLigne !== 'ANNULATION' && 
                            ligne.statusLigne !== 'ANNULER' && (
                            <button
                              onClick={() => handleOpenEmission(ligne)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                              </svg>
                              Émettre
                            </button>
                          )}

                          <button
                            disabled={isAnnulerDisabled}
                            onClick={() => handleReprogrammer(ligne)}
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                              ${isAnnulerDisabled
                                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white active:scale-95'}
                            `}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Modifier
                          </button>

                          <button
                            disabled={isAnnulerDisabled}
                            onClick={() => handleRemove(ligne)}
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                              ${isAnnulerDisabled
                                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white active:scale-95'}
                            `}
                          >
                            <FiX size={14} />
                            Annuler
                          </button>

                          {isEmitted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              TERMINÉ
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BilletTable;