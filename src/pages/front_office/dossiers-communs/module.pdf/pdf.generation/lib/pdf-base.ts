import jsPDF from 'jspdf';
import type { PdfDesign } from '../types/pdf-design.types';

// ─── Constantes portrait (rétrocompatibilité) ────────────────────────
export const PAGE_W    = 210;
export const PAGE_H    = 297;
export const MARGIN    = 18;
export const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Layout dynamique ────────────────────────────────────────────────
export interface PageLayout {
  pageW:    number;
  pageH:    number;
  margin:   number;
  contentW: number;
}

export function makeLayout(orientation: 'portrait' | 'landscape' = 'portrait'): PageLayout {
  const margin = 18;
  if (orientation === 'landscape') {
    return { pageW: 297, pageH: 210, margin, contentW: 297 - margin * 2 };
  }
  // Mode A4 portrait
  return { pageW: 210, pageH: 297, margin, contentW: 210 - margin * 2 }; 
  // return { pageW: 297, pageH: 210, margin, contentW: 297 - margin * 2 };
}

// ─── Cursor ──────────────────────────────────────────────────────────
export class Cursor {
  y = 0;
  move(d: number) { this.y += d; }
}

// ─── Couleurs ────────────────────────────────────────────────────────
export function setColor(doc: jsPDF, c: [number, number, number], target: 'fill' | 'draw' | 'text') {
  if (target === 'fill')       doc.setFillColor(...c);
  else if (target === 'draw')  doc.setDrawColor(...c);
  else                         doc.setTextColor(...c);
}

// ─── checkPage — accepte layout optionnel ────────────────────────────
export function checkPage(
  doc: jsPDF,
  cursor: Cursor,
  need: number,
  design: PdfDesign,
  layout?: PageLayout
) {
  const { pageH, margin, contentW } = layout ?? makeLayout('portrait');
  if (cursor.y + need > pageH - margin) {
    doc.addPage();
    cursor.y = 20;
    drawWatermark(doc, design, layout);
  }
}

// ─── Watermark ───────────────────────────────────────────────────────
export function drawWatermark(doc: jsPDF, design: PdfDesign, layout?: PageLayout) {
  if (!design.watermark) return;
  const { pageW, pageH } = layout ?? makeLayout('portrait');
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.setFontSize(72); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.headerBg, 'text');
  doc.text(design.watermark, pageW / 2, pageH / 2, {
    angle: 45, align: 'center', baseline: 'middle',
  });
  doc.restoreGraphicsState();
}

// ─── Séparateur ──────────────────────────────────────────────────────
export function drawSeparator(doc: jsPDF, cursor: Cursor, layout?: PageLayout) {
  const { pageW, margin } = layout ?? makeLayout('portrait');
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(margin, cursor.y, pageW - margin, cursor.y);
  cursor.move(8);
}

// ─── Section title ───────────────────────────────────────────────────
export function drawSectionTitle(
  doc: jsPDF,
  cursor: Cursor,
  title: string,
  design: PdfDesign,
  layout?: PageLayout
) {
  const { margin } = layout ?? makeLayout('portrait');
  setColor(doc, design.colors.accentLine, 'fill');
  doc.rect(margin, cursor.y - 1, 3, 10, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.accentLine, 'text');
  doc.text(title, margin + 6, cursor.y + 7);
  cursor.move(15);
}

// ─── Header ──────────────────────────────────────────────────────────
export function drawHeader(
  doc: jsPDF,
  cursor: Cursor,
  docTitle: string,
  design: PdfDesign,
  logo?: string,
  layout?: PageLayout
) {
  const { pageW, margin } = layout ?? makeLayout('portrait');
  setColor(doc, design.colors.headerBg, 'fill');
  doc.rect(0, 0, pageW, 34, 'F');
  const textX = logo ? margin + 24 : margin;
  if (logo) {
    try { doc.addImage(logo, 'PNG', margin, 4, 22, 22); } catch {}
  }
  setColor(doc, design.colors.headerText, 'text');
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('AL BOURAQ TRAVEL', textX, 12);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.text('Notre réactivité à votre service!', textX, 18);
  doc.text('Bât. MATURA, RDC – Andranamahery Ankorondrano', textX, 23);
  doc.text('+261 38 01 637 17 | albouraqtravel@gmail.com', textX, 28);

  // Titre du document — aligné à droite pour profiter de la largeur en paysage
  const titleX = pageW - margin;
  cursor.y = 44;
  doc.setFontSize(17); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.headerBg, 'text');
  doc.text(docTitle, titleX, cursor.y, { align: 'right' });
  cursor.move(12);
}

// ─── Table ───────────────────────────────────────────────────────────
export function drawTable(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  columns: { label: string; width: number; align?: 'left' | 'right' | 'center' }[],
  rows: string[][],
  layout?: PageLayout
) {
  const { margin, contentW } = layout ?? makeLayout('portrait');
  const ROW_H = 7.5, HEAD_H = 8.5;

  checkPage(doc, cursor, HEAD_H + ROW_H, design, layout);
  setColor(doc, design.colors.tableHeadBg, 'fill');
  doc.rect(margin, cursor.y - 1, contentW, HEAD_H, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.tableHeadText, 'text');
  let x = margin;
  columns.forEach(col => {
    doc.text(col.label, x + 1, cursor.y + 5);
    x += col.width;
  });
  cursor.move(HEAD_H);

  rows.forEach((row, i) => {
    checkPage(doc, cursor, ROW_H + 2, design, layout);
    if (i % 2 === 1) {
      doc.setFillColor(248, 249, 251);
      doc.rect(margin, cursor.y - 1, contentW, ROW_H, 'F');
    }
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    setColor(doc, [30, 30, 30], 'text');
    x = margin;
    columns.forEach((col, ci) => {
      const val   = row[ci] ?? '';
      const align = col.align ?? 'left';
      doc.text(
        val,
        align === 'right' ? x + col.width - 2 : x + 1,
        cursor.y + 4.5,
        { align: align === 'right' ? 'right' : 'left' }
      );
      x += col.width;
    });
    cursor.move(ROW_H);
  });
  cursor.move(4);
  drawSeparator(doc, cursor, layout);
}

// ─── KeyValues ───────────────────────────────────────────────────────
export function drawKeyValues(
  doc: jsPDF,
  cursor: Cursor,
  pairs: { label: string; value: string }[],
  layout?: PageLayout
) {
  const { margin } = layout ?? makeLayout('portrait');
  doc.setFontSize(8);
  pairs.forEach(p => {
    doc.setFont('helvetica', 'bold'); setColor(doc, [60, 60, 60], 'text');
    doc.text(`${p.label} :`, margin, cursor.y);
    doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30], 'text');
    doc.text(p.value, margin + 45, cursor.y);
    cursor.move(6.5);
  });
  cursor.move(2);
}

// ─── Footer ──────────────────────────────────────────────────────────
export function drawFooter(
  doc: jsPDF,
  cursor: Cursor,
  totalLabel: string,
  totalValue: string,
  noteText: string,
  design: PdfDesign,
  stamp?: string,
  layout?: PageLayout
) {
  const { pageW, pageH, margin, contentW } = layout ?? makeLayout('portrait');
  const stampSize   = 36;
  const neededSpace = 14 + (stamp ? stampSize + 6 : 0) + 16;
  checkPage(doc, cursor, neededSpace, design, layout);

  // Bloc total
  setColor(doc, design.colors.accentBg, 'fill');
  doc.rect(margin, cursor.y, contentW, 14, 'F');
  setColor(doc, design.colors.accentText, 'text');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(totalLabel, margin + 4, cursor.y + 9);
  doc.setFontSize(12);
  doc.text(totalValue, pageW - margin - 4, cursor.y + 9, { align: 'right' });
  cursor.move(20);

  // Cachet
  if (stamp) {
    try {
      const format = stamp.startsWith('data:image/png') ? 'PNG'
        : stamp.startsWith('data:image/jpeg') || stamp.startsWith('data:image/jpg') ? 'JPEG'
        : 'PNG';
      doc.addImage(stamp, format, pageW - margin - stampSize, cursor.y, stampSize, stampSize);
    } catch (e) { console.warn('Cachet non chargé :', e); }
    cursor.move(stampSize + 4);
  }

  // Numéros de page + note
  const n = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    if (noteText) {
      doc.setFontSize(7); doc.setFont('helvetica', 'italic');
      setColor(doc, [150, 150, 150], 'text');
      doc.text(noteText, pageW / 2, pageH - 10, { align: 'center' });
    }
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    setColor(doc, [180, 180, 180], 'text');
    doc.text(`Page ${i} / ${n}`, pageW - margin, pageH - 5, { align: 'right' });
  }
}

// ─── Formatters ──────────────────────────────────────────────────────
export const fmt = {
  date: (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  time: (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  datetime: (iso: string) => `${fmt.date(iso)} ${fmt.time(iso)}`,
  number: (n: number, decimals = 2) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals })
      .format(n).replace(/\u00A0/g, ' ').replace(/\u202F/g, ' '),
  ariary: (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
      .format(n).replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ') + ' Ar',
  replace_: (s: string) => s.replace(/_/g, ' '),
  nullish: (v: string | null | undefined, fallback = '-') => v ?? fallback,
};