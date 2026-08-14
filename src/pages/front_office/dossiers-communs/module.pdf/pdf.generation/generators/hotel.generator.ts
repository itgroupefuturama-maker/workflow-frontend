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
  drawWatermark,
  checkPage,
  setColor,
  fmt,
  makeLayout,
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
  const layout = makeLayout('portrait');

  drawWatermark(doc, design);

  const docTitle = audience === 'client'
    ? 'BENCHMARKING HÔTEL'
    : 'BENCHMARKING HÔTEL — DIRECTION';
  drawHeader(doc, cursor, docTitle, design, logo);

  drawKeyValues(doc, cursor, [
    { label: 'N° Entête',          value: data.numeroEntete },
    { label: 'Dossier',            value: data.prestation?.numeroDos ?? '—' },
    { label: 'Fournisseur',        value: data.fournisseur ? `${data.fournisseur.libelle} (${data.fournisseur.code})` : '—' },
    { label: 'Statut fournisseur', value: data.fournisseur?.status ?? '—' },
    { label: 'Date création',      value: fmt.date(data.createdAt) },
    { label: 'Statut devis',       value: data.isDevis ? 'Devis établi' : 'En prospection' },
  ]);
  drawSeparator(doc, cursor);

  const selectedEntetes = data.benchmarkingEntete.filter((be) =>
    selection.some((s) => s.benchmarkingEnteteId === be.id)
  );

  selectedEntetes.forEach((bench, index) => {
    // ── Un benchmarking = une page ─────────────────────────────────
    // Le premier suit directement l'entête ; les suivants démarrent
    // sur une page neuve pour éviter le texte collé en bas de page.
    if (index > 0) {
      doc.addPage();
      cursor.y = 44; // sous le bandeau header (même valeur que dans drawHeader)
    }

    drawSectionTitle(
      doc, cursor,
      `Benchmarking ${bench.numero}  —  ${bench.ville}, ${bench.pays}`,
      design
    );

    const benchInfos: { label: string; value: string }[] = [
      { label: 'Période', value: `${fmt.date(bench.du)} au ${fmt.date(bench.au)}` },
      { label: 'Nuitées',  value: String(bench.nuite) },
      ...(bench.benchService.length > 0
        ? [{ label: 'Services', value: bench.benchService.map((s) => s.serviceSpecifique.libelle).join(', ') }]
        : []
      ),
    ];

    if (audience === 'direction' && bench.tauxPrixUnitaire > 0) {
      benchInfos.push(
        { label: 'Taux commission (%)',  value: fmt.number(bench.tauxPrixUnitaire) },
        { label: 'Forfait unitaire',     value: fmt.ariary(bench.forfaitaireUnitaire) },
        { label: 'Forfait global',       value: fmt.ariary(bench.forfaitaireGlobal) },
        { label: 'Montant commission',   value: fmt.ariary(bench.montantCommission) },
      );
    }

    drawKeyValues(doc, cursor, benchInfos);

    const selectionForBench = selection.find((s) => s.benchmarkingEnteteId === bench.id);
    const lignes = bench.benchmarkingLigne.filter((l) =>
      selectionForBench?.lignes.some((s) => s.ligneId === l.id)
    );
    const images = selectionForBench?.images ?? [];

    lignes.forEach((ligne) => {
      const ligneSelection = selectionForBench?.lignes.find((l) => l.ligneId === ligne.id);
      const deviseIds = ligneSelection?.deviseIds ?? [];
      _drawLigneCard(doc, cursor, design, layout, audience, ligne, deviseIds, bench, images);
    });

    drawSeparator(doc, cursor);
  });

  const note = audience === 'direction'
    ? `Document confidentiel — Usage interne uniquement — ${fmt.date(new Date().toISOString())}`
    : `Généré le ${fmt.date(new Date().toISOString())}`;

  drawFooter(
    doc, cursor,
    audience === 'direction' ? 'BENCHMARKING DIRECTION' : 'BENCHMARKING HÔTEL',
    '',
    note,
    design,
    stamp
  );

  if (options?.returnDoc) return doc;

  doc.save(
    filename ?? `benchmarking-hotel-${data.numeroEntete}-${data.prestation?.numeroDos ?? data.id}.pdf`
  );
};

// ─────────────────────────────────────────────────────────────────────
// Helpers image
// ─────────────────────────────────────────────────────────────────────

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  return 'JPEG';
}

function drawImageCover(
  doc: jsPDF,
  dataUrl: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (!dataUrl) {
    // Placeholder si aucune photo fournie
    doc.setFillColor(238, 238, 240);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(170, 170, 170);
    doc.text('Aucune photo', x + w / 2, y + h / 2, { align: 'center' });
    return;
  }
  try {
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y, w, h, undefined, 'FAST');
  } catch (e) {
    console.warn('Image non chargée :', e);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Carte "réservation hôtel" — remplace l'ancien _drawLigne
// ─────────────────────────────────────────────────────────────────────

function _drawLigneCard(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  layout: ReturnType<typeof makeLayout>,
  audience: PdfAudience,
  ligne: HotelBenchmarkingLigne,
  deviseIds: string[],
  bench: { du: string; au: string; nuite: number; ville: string; pays: string },
  images: string[]
): void {
  const { margin, contentW } = layout;

  const MAIN_IMG_W = 55;
  const MAIN_IMG_H = 42;
  const BOTTOM_IMG_H = 32;
  const hasBottomImages = images.length > 1;
  const cardHeight =
    MAIN_IMG_H + 6 +
    22 +                                  // bloc "vous avez sélectionné"
    16 +                                  // tarifs
    (hasBottomImages ? BOTTOM_IMG_H + 6 : 0) +
    10;

  checkPage(doc, cursor, cardHeight, design, layout);

  const cardTop = cursor.y;
  const infoX = margin + MAIN_IMG_W + 8;
  const infoW = contentW - MAIN_IMG_W - 8;

  // ── Photo principale ──────────────────────────────────────────────
  drawImageCover(doc, images[0], margin, cardTop, MAIN_IMG_W, MAIN_IMG_H);

  // ── Nom hôtel + plateforme + badges ─────────────────────────────
  let y = cardTop + 5;
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [25, 25, 25], 'text');
  doc.text(ligne.hotel, infoX, y, { maxWidth: infoW });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [110, 110, 110], 'text');
  doc.text(`${bench.ville}, ${bench.pays}`, infoX, y, { maxWidth: infoW });
  y += 7;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [90, 90, 90], 'text');
  doc.text('ARRIVÉE', infoX, y);
  doc.text('DÉPART', infoX + infoW / 2, y);
  y += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [25, 25, 25], 'text');
  doc.text(fmt.date(bench.du), infoX, y);
  doc.text(fmt.date(bench.au), infoX + infoW / 2, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 140], 'text');
  doc.text(ligne.plateforme.nom, infoX, y);
  doc.text(
    ligne.isRefundable ? 'Remboursable' : 'Non remboursable',
    infoX + infoW / 2,
    y
  );

  cursor.y = cardTop + MAIN_IMG_H + 8;

  // ── "Vous avez sélectionné" ─────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [110, 110, 110], 'text');
  doc.text('Vous avez sélectionné', margin, cursor.y);
  cursor.move(5.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [25, 25, 25], 'text');
  const desc = `${bench.nuite} nuit${bench.nuite > 1 ? 's' : ''}, ${ligne.nombreChambre} chambre${ligne.nombreChambre > 1 ? 's' : ''} — ${ligne.typeChambre.type} (capacité ${ligne.typeChambre.capacite})`;
  doc.text(desc, margin, cursor.y, { maxWidth: contentW });
  cursor.move(7);

  if (ligne.isBenchMark) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [200, 140, 0], 'text');
    doc.text('★ Retenu comme référence de benchmark', margin, cursor.y);
    cursor.move(6);
  }

  if (ligne.dateLimiteAnnulation) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [130, 130, 130], 'text');
    doc.text(`Limite d'annulation : ${fmt.date(ligne.dateLimiteAnnulation)}`, margin, cursor.y);
    cursor.move(6);
  }
  cursor.move(2);

  // ── Tarifs — surlignés, un par devise ───────────────────────────
  const devises = deviseIds.length > 0
    ? ligne.deviseHotel.filter((dv) => deviseIds.includes(dv.id))
    : ligne.deviseHotel;

  devises.forEach((dv) => {
    doc.setFillColor(255, 240, 150);
    doc.rect(margin, cursor.y - 4, contentW, 7, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [40, 40, 40], 'text');
    const label = audience === 'direction'
      ? `Tarif ${dv.devise.devise} (taux ${fmt.number(dv.tauxChange)})`
      : `Tarif ${dv.devise.devise}`;
    doc.text(label, margin + 3, cursor.y + 1);

    doc.setFontSize(9);
    const valueText = `${fmt.ariary(dv.montantAriary)}  (${fmt.number(dv.montantDevise)} ${dv.devise.devise})`;
    doc.text(valueText, margin + contentW - 3, cursor.y + 1, { align: 'right' });

    cursor.move(9);
  });

  if (audience === 'direction' && devises.length === 0) {
    cursor.move(2);
  }

  cursor.move(4);

  // ── Deux photos complémentaires côte à côte ─────────────────────
  if (hasBottomImages) {
    const gap = 4;
    const halfW = (contentW - gap) / 2;
    drawImageCover(doc, images[1], margin, cursor.y, halfW, BOTTOM_IMG_H);
    drawImageCover(doc, images[2], margin + halfW + gap, cursor.y, halfW, BOTTOM_IMG_H);
    cursor.move(BOTTOM_IMG_H + 6);
  }

  cursor.move(4);
}