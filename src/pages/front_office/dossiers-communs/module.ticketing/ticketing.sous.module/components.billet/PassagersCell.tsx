import React, { useState } from 'react';
import type { BilletEntete, BilletLigne } from '../../../../../../app/front_office/billetSlice';
import type { BilletPassagerData, BilletPassagerExigence, BilletPassagerService } from '../../../module.pdf/pdf.generation/generators/billet-passager.generator';
import { useBilletPassagerPdf } from '../../../module.pdf/pdf.generation/hooks/usePdfGenerator';
import type { BilletStyleId } from '../../../module.pdf/pdf.generation/types/pdf-design.types';
import { BILLET_STYLES } from '../../../module.pdf/pdf.generation/config/billet-styles';

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
                    <button onClick={() => setExigenceModal({ billet: b, action: 'preview' })} disabled={pdfLoading}
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
                    <button onClick={() => setExigenceModal({ billet: b, action: 'generate' })} disabled={pdfLoading}
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
