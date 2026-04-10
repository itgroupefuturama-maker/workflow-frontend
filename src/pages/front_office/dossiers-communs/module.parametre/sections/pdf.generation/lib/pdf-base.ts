import jsPDF from 'jspdf';
import type { PdfDesign } from '../types/pdf-design.types';

export const PAGE_W = 210;
export const MARGIN = 18;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const PAGE_H = 297;

export class Cursor {
  y = 0;
  move(d: number) { this.y += d; }
}

export function setColor(doc: jsPDF, c: [number,number,number], target: 'fill'|'draw'|'text') {
  if (target === 'fill')  doc.setFillColor(...c);
  else if (target === 'draw') doc.setDrawColor(...c);
  else doc.setTextColor(...c);
}

export function checkPage(doc: jsPDF, cursor: Cursor, need: number, design: PdfDesign) {
  if (cursor.y + need > PAGE_H - 20) {
    doc.addPage();
    cursor.y = 20;
    drawWatermark(doc, design);
  }
}

export function drawWatermark(doc: jsPDF, design: PdfDesign) {
  if (!design.watermark) return;
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.setFontSize(72); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.headerBg, 'text');
  doc.text(design.watermark, PAGE_W / 2, PAGE_H / 2, {
    angle: 45, align: 'center', baseline: 'middle',
  });
  doc.restoreGraphicsState();
}

export function drawSeparator(doc: jsPDF, cursor: Cursor) {
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(MARGIN, cursor.y, PAGE_W - MARGIN, cursor.y);
  cursor.move(8);
}

export function drawSectionTitle(doc: jsPDF, cursor: Cursor, title: string, design: PdfDesign) {
  setColor(doc, design.colors.accentLine, 'fill');
  doc.rect(MARGIN, cursor.y - 1, 3, 10, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.accentLine, 'text');
  doc.text(title, MARGIN + 6, cursor.y + 7);
  cursor.move(15);
}

export function drawHeader(
  doc: jsPDF,
  cursor: Cursor,
  docTitle: string,
  design: PdfDesign,
  logo?: string,
) {
  setColor(doc, design.colors.headerBg, 'fill');
  doc.rect(0, 0, PAGE_W, 34, 'F');
  const textX = logo ? MARGIN + 24 : MARGIN;
  if (logo) {
    try { doc.addImage(logo, 'PNG', MARGIN, 4, 22, 22); } catch {}
  }
  setColor(doc, design.colors.headerText, 'text');
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('AL BOURAQ TRAVEL', textX, 12);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.text('Notre réactivité à votre service!', textX, 18);
  doc.text('Bât. MATURA, RDC – Andranamahery Ankorondrano', textX, 23);
  doc.text('+261 38 01 637 17 | albouraqtravel@gmail.com', textX, 28);

  cursor.y = 44;
  doc.setFontSize(17); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.headerBg, 'text');
  doc.text(docTitle, MARGIN, cursor.y);
  cursor.move(12);
}

export function drawTable(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  columns: { label: string; width: number; align?: 'left' | 'right' | 'center' }[],
  rows: string[][],
) {
  const ROW_H = 7.5, HEAD_H = 8.5;

  checkPage(doc, cursor, HEAD_H + ROW_H, design);
  setColor(doc, design.colors.tableHeadBg, 'fill');
  doc.rect(MARGIN, cursor.y - 1, CONTENT_W, HEAD_H, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.tableHeadText, 'text');
  let x = MARGIN;
  columns.forEach(col => {
    doc.text(col.label, x + 1, cursor.y + 5);
    x += col.width;
  });
  cursor.move(HEAD_H);

  rows.forEach((row, i) => {
    checkPage(doc, cursor, ROW_H + 2, design);
    if (i % 2 === 1) {
      doc.setFillColor(248, 249, 251);
      doc.rect(MARGIN, cursor.y - 1, CONTENT_W, ROW_H, 'F');
    }
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    setColor(doc, [30, 30, 30], 'text');
    x = MARGIN;
    columns.forEach((col, ci) => {
      const val = row[ci] ?? '';
      const align = col.align ?? 'left';
      doc.text(val, align === 'right' ? x + col.width - 2 : x + 1, cursor.y + 4.5, {
        align: align === 'right' ? 'right' : 'left',
      });
      x += col.width;
    });
    cursor.move(ROW_H);
  });
  cursor.move(4);
  drawSeparator(doc, cursor);
}

export function drawKeyValues(
  doc: jsPDF,
  cursor: Cursor,
  pairs: { label: string; value: string }[],
) {
  doc.setFontSize(8);
  pairs.forEach(p => {
    doc.setFont('helvetica', 'bold'); setColor(doc, [60, 60, 60], 'text');
    doc.text(`${p.label} :`, MARGIN, cursor.y);
    doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30], 'text');
    doc.text(p.value, MARGIN + 45, cursor.y);
    cursor.move(6.5);
  });
  cursor.move(2);
}

export function drawFooter(
  doc: jsPDF,
  cursor: Cursor,
  totalLabel: string,
  totalValue: string,
  noteText: string,
  design: PdfDesign,
  stamp?: string,
) {
  // ── S'assurer qu'il y a assez de place pour total + cachet ────────
  const stampSize = 36;
  const neededSpace = 14 + (stamp ? stampSize + 6 : 0) + 16;
  checkPage(doc, cursor, neededSpace, design);

  // ── Bloc total ────────────────────────────────────────────────────
  setColor(doc, design.colors.accentBg, 'fill');
  doc.rect(MARGIN, cursor.y, CONTENT_W, 14, 'F');
  setColor(doc, design.colors.accentText, 'text');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(totalLabel, MARGIN + 4, cursor.y + 9);
  doc.setFontSize(12);
  doc.text(totalValue, PAGE_W - MARGIN - 4, cursor.y + 9, { align: 'right' });
  cursor.move(20);

  // ── Cachet ────────────────────────────────────────────────────────
  if (stamp) {
    try {
      // Détecter le format de l'image
      const format = stamp.startsWith('data:image/png') ? 'PNG'
        : stamp.startsWith('data:image/jpeg') || stamp.startsWith('data:image/jpg') ? 'JPEG'
        : 'PNG';

      doc.addImage(
        stamp,
        format,
        PAGE_W - MARGIN - stampSize,   // x : aligné à droite
        cursor.y,                       // y : juste sous le total
        stampSize,
        stampSize,
      );
    } catch (e) {
      console.warn('Cachet non chargé :', e);
    }
    cursor.move(stampSize + 4);
  }

  // ── Note bas de page + numéros ────────────────────────────────────
  const n = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    if (noteText) {
      doc.setFontSize(7); doc.setFont('helvetica', 'italic');
      setColor(doc, [150, 150, 150], 'text');
      doc.text(noteText, PAGE_W / 2, PAGE_H - 10, { align: 'center' });
    }
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    setColor(doc, [180, 180, 180], 'text');
    doc.text(`Page ${i} / ${n}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
  }
}

// ─── Formatters ──────────────────────────────────────────────────────
export const fmt = {
  date: (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),

  time: (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),

  datetime: (iso: string) => `${fmt.date(iso)} ${fmt.time(iso)}`,

  // ✅ Remplacer l'espace insécable \u00A0 par un espace normal
  number: (n: number, decimals = 2) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals })
      .format(n)
      .replace(/\u00A0/g, ' ')
      .replace(/\u202F/g, ' '),

  ariary: (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
      .format(n)
      .replace(/\u00A0/g, ' ')
      .replace(/\u202F/g, ' ') + ' Ar',

  replace_: (s: string) => s.replace(/_/g, ' '),

  nullish: (v: string | null | undefined, fallback = '-') => v ?? fallback,
};