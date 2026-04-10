import jsPDF from 'jspdf';
import type { PdfDesign, PdfAudience } from '../types/pdf-design.types';
import type {
  HotelProspectionEnteteItem,
  HotelPdfSelection,
  HotelBenchmarkingLigne,
} from '../types/hotel.types';
import {
  Cursor,
  drawHeader,
  drawFooter,
  drawSectionTitle,
  drawSeparator,
  drawKeyValues,
  drawTable,
  drawWatermark,
  fmt,
} from '../lib/pdf-base';

export const generateHotelPdf = (
  data: HotelProspectionEnteteItem,
  selection: HotelPdfSelection[],
  design: PdfDesign,
  audience: PdfAudience,
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cursor = new Cursor();

  drawWatermark(doc, design);

  // ── Header ───────────────────────────────────────────────────────
  const docTitle = audience === 'client'
    ? 'BENCHMARKING HÔTEL'
    : 'BENCHMARKING HÔTEL — DIRECTION';
  drawHeader(doc, cursor, docTitle, design, logo);

  // ── Infos entête ─────────────────────────────────────────────────
  drawKeyValues(doc, cursor, [
    { label: 'N° Entête',          value: data.numeroEntete },
    { label: 'Dossier',            value: data.prestation.numeroDos },
    { label: 'Fournisseur',        value: `${data.fournisseur.libelle} (${data.fournisseur.code})` },
    { label: 'Statut fournisseur', value: data.fournisseur.status },
    { label: 'Date création',      value: fmt.date(data.createdAt) },
    { label: 'Statut devis',       value: data.isDevis ? 'Devis établi' : 'En prospection' },
  ]);
  drawSeparator(doc, cursor);

  // ── Benchmarkings sélectionnés ───────────────────────────────────
  const selectedEntetes = data.benchmarkingEntete.filter((be) =>
    selection.some((s) => s.benchmarkingEnteteId === be.id)
  );

  selectedEntetes.forEach((bench) => {
    drawSectionTitle(
      doc, cursor,
      `Benchmarking ${bench.numero}  —  ${bench.ville}, ${bench.pays}`,
      design
    );

    // Infos générales
    const benchInfos: { label: string; value: string }[] = [
      { label: 'Période', value: `${fmt.date(bench.du)} au ${fmt.date(bench.au)}` },
      { label: 'Nuitées',  value: String(bench.nuite) },
      ...(bench.benchService.length > 0
        ? [{ label: 'Services', value: bench.benchService.map((s) => s.serviceSpecifique.libelle).join(', ') }]
        : []
      ),
    ];

    // Direction uniquement — commissions
    if (audience === 'direction' && bench.tauxPrixUnitaire > 0) {
      benchInfos.push(
        { label: 'Taux commission (%)',  value: fmt.number(bench.tauxPrixUnitaire) },
        { label: 'Forfait unitaire',     value: fmt.ariary(bench.forfaitaireUnitaire) },
        { label: 'Forfait global',       value: fmt.ariary(bench.forfaitaireGlobal) },
        { label: 'Montant commission',   value: fmt.ariary(bench.montantCommission) },
      );
    }

    drawKeyValues(doc, cursor, benchInfos);

    // Lignes sélectionnées pour ce bench
    const selectionForBench = selection.find((s) => s.benchmarkingEnteteId === bench.id);
    const lignes = bench.benchmarkingLigne.filter((l) =>
      selectionForBench?.lignes.some((s) => s.ligneId === l.id)
    );

    lignes.forEach((ligne) => {
      const ligneSelection = selectionForBench?.lignes.find((l) => l.ligneId === ligne.id);
      const deviseIds = ligneSelection?.deviseIds ?? [];
      _drawLigne(doc, cursor, design, audience, ligne, deviseIds);
    });


    drawSeparator(doc, cursor);
  });

  // ── Footer ───────────────────────────────────────────────────────
  const note = audience === 'direction'
    ? `Document confidentiel — Usage interne uniquement — ${fmt.date(new Date().toISOString())}`
    : `Généré le ${fmt.date(new Date().toISOString())}`;

  drawFooter(
    doc, cursor,
    audience === 'direction' ? 'BENCHMARKING DIRECTION' : 'BENCHMARKING HÔTEL',
    '',   // pas de total global ici — les montants sont par ligne
    note,
    design,
    stamp
  );

  if (options?.returnDoc) return doc;

  doc.save(
    filename ?? `benchmarking-hotel-${data.numeroEntete}-${data.prestation.numeroDos}.pdf`
  );
};

// ─── Rendu d'une ligne de benchmarking ───────────────────────────────

function _drawLigne(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  audience: PdfAudience,
  ligne: HotelBenchmarkingLigne,
  deviseIds: string[] 
): void {
  const isBenchmark = ligne.isBenchMark ? ' ★ Benchmark' : '';
  const refundable  = ligne.isRefundable ? '  •  Remboursable' : '  •  Non remboursable';

  drawSectionTitle(
    doc, cursor,
    `${ligne.hotel}  —  ${ligne.plateforme.nom}${isBenchmark}${refundable}`,
    design
  );

  const ligneInfos: { label: string; value: string }[] = [
    { label: 'Type chambre', value: `${ligne.typeChambre.type} (capacité ${ligne.typeChambre.capacite})` },
    { label: 'Nb chambres',  value: String(ligne.nombreChambre) },
  ];

  const devises = deviseIds.length > 0
    ? ligne.deviseHotel.filter((dv) => deviseIds.includes(dv.id))
    : ligne.deviseHotel; // fallback : toutes si rien sélectionné


  if (ligne.dateLimiteAnnulation) {
    ligneInfos.push({ label: 'Limite annulation', value: fmt.date(ligne.dateLimiteAnnulation) });
  }

  drawKeyValues(doc, cursor, ligneInfos);

  if (devises.length === 0) return;

  // Colonnes selon audience
  if (audience === 'direction') {
    drawTable(doc, cursor, design,
      [
        { label: 'Devise',      width: 20 },
        { label: 'Taux',        width: 22 },
        { label: 'Nuit/Devise', width: 30 },
        { label: 'Nuit/Ar',     width: 30 },
        { label: 'Mnt/Devise',  width: 34 },
        { label: 'Mnt/Ar',      width: 34, align: 'right' },
      ],
      devises.map((dv) => [   // 👈 devises au lieu de ligne.deviseHotel
        dv.devise.devise,
        fmt.number(dv.tauxChange),
        `${fmt.number(dv.nuiteDevise)} ${dv.devise.devise}`,
        fmt.ariary(dv.nuiteAriary),
        `${fmt.number(dv.montantDevise)} ${dv.devise.devise}`,
        fmt.ariary(dv.montantAriary),
      ])
    );
  } else {
    drawTable(doc, cursor, design,
      [
        { label: 'Devise',      width: 24 },
        { label: 'Nuit/Devise', width: 36 },
        { label: 'Nuit/Ar',     width: 36 },
        { label: 'Mnt/Devise',  width: 38 },
        { label: 'Mnt/Ar',      width: 36, align: 'right' },
      ],
      devises.map((dv) => [   // 👈 devises au lieu de ligne.deviseHotel
        dv.devise.devise,
        `${fmt.number(dv.nuiteDevise)} ${dv.devise.devise}`,
        fmt.ariary(dv.nuiteAriary),
        `${fmt.number(dv.montantDevise)} ${dv.devise.devise}`,
        fmt.ariary(dv.montantAriary),
      ])
    );
  }
}