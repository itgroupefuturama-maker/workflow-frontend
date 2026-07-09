// lib/generators/attestation.generator.ts

import jsPDF from 'jspdf';
import type { PdfDesign } from '../types/pdf-design.types';
import type {
  AttestationEnteteItem,
  AttestationLigne,
  AttestationPdfSelection,
  AttestationPdfMode,
  ClientBeneficiaireInfo,
} from '../types/attestation.types';
import {
  Cursor,
  drawWatermark,
  setColor,
  makeLayout,
  type PageLayout,
} from '../lib/pdf-base';

// ─────────────────────────────────────────────────────────────────────
// Sécurité encodage — jsPDF (police standard) = WinAnsiEncoding.
// Les flèches unicode (→ ⇒ ➔ ➜ ⟶ ➔) et autres symboles hors table
// s'affichent comme des caractères cassés ("!'"). On les neutralise.
// ─────────────────────────────────────────────────────────────────────

const ARROW_REGEX = /[\u2192\u21D2\u279C\u27A4\u27F6\u2794\u2794\u21A0\u2799]/gu;
// Filet de sécurité général pour tout texte venant de la base
const UNSAFE_UNICODE_REGEX = /[\u{1F300}-\u{1FAFF}\u2190-\u21FF\u2700-\u27BF]/gu;

function sanitizeForPdf(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(ARROW_REGEX, '-').replace(UNSAFE_UNICODE_REGEX, '');
}

/** Essaie d'extraire deux codes aéroport séparés par une flèche.
 *  Si le format matche, on pourra dessiner une vraie flèche vectorielle. */
function extractItineraireCodes(itineraire: string): [string, string] | null {
  const parts = itineraire
    .split(ARROW_REGEX)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 2) return [parts[0], parts[1]];
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Groupe "lettre" — un groupe = une page (passagers + vols + PNR)
// ─────────────────────────────────────────────────────────────────────

interface LettreVol {
  numeroVol: string;
  dateDepart: string;
  itineraire: string;
  heureDepart: string;
  heureArrivee: string;
}

interface LettrePassager {
  nom: string;
  prenom: string;
}

interface LettreGroupe {
  passagers: LettrePassager[];
  vols: LettreVol[];
  pnr: string;
}

const MOIS_ABBR = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];

function dateShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}${MOIS_ABBR[d.getMonth()]}`;
}

function heureShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

function ligneToVol(l: AttestationLigne): LettreVol {
  return {
    numeroVol: sanitizeForPdf(l.numeroVol),
    dateDepart: dateShort(l.dateHeureDepart),
    itineraire: sanitizeForPdf(l.itineraire),
    heureDepart: heureShort(l.dateHeureDepart),
    heureArrivee: heureShort(l.dateHeureArrive),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Point d'entrée
// ─────────────────────────────────────────────────────────────────────

export const generateAttestationPdf = (
  data: AttestationEnteteItem[],
  selection: AttestationPdfSelection[],
  mode: AttestationPdfMode,
  design: PdfDesign,
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cursor = new Cursor();
  const layout = makeLayout('portrait');

  const selectedEntetes = data
    .filter((e) => selection.some((s) => s.enteteId === e.id))
    .map((e) => {
      const sel = selection.find((s) => s.enteteId === e.id)!;
      return {
        ...e,
        attestationLigne: e.attestationLigne.filter((l) =>
          sel.ligneIds.includes(l.id)
        ),
      };
    })
    .filter((e) => e.attestationLigne.length > 0);

  const groupes =
    mode === 'par_entete'
      ? _buildGroupesParEntete(selectedEntetes)
      : _buildGroupesParPassager(selectedEntetes);

  groupes.forEach((groupe, index) => {
    if (index > 0) doc.addPage();
    cursor.y = 0;

    _drawFrame(doc, design, layout);
    drawWatermark(doc, design, layout);
    _drawLettreHeader(doc, cursor, design, logo, layout);
    _drawLettreTitre(doc, cursor, layout, design);
    _drawIntro(doc, cursor, design, layout);
    _drawPassagersBlock(doc, cursor, design, groupe.passagers, layout);
    _drawVolsBlock(doc, cursor, design, groupe.vols, layout);
    _drawPnrBlock(doc, cursor, design, groupe.pnr, layout);
    _drawCloture(doc, cursor, design, layout, stamp);
  });

  const nbPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= nbPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [180, 180, 180], 'text');
    doc.text(`Page ${i} / ${nbPages}`, layout.pageW - layout.margin, layout.pageH - 8, {
      align: 'right',
    });
  }

  if (options?.returnDoc) return doc;
  doc.save(filename ?? `attestation-voyage.pdf`);
};

// ─────────────────────────────────────────────────────────────────────
// Construction des groupes
// ─────────────────────────────────────────────────────────────────────

function _buildGroupesParEntete(entetes: AttestationEnteteItem[]): LettreGroupe[] {
  const groupes: LettreGroupe[] = [];

  entetes.forEach((entete) => {
    const parPnr = new Map<string, AttestationLigne[]>();

    entete.attestationLigne.forEach((ligne) => {
      const pnr = ligne.numeroReservation || entete.numeroEntete;
      if (!parPnr.has(pnr)) parPnr.set(pnr, []);
      parPnr.get(pnr)!.push(ligne);
    });

    parPnr.forEach((lignes, pnr) => {
      const passagersMap = new Map<string, LettrePassager>();
      lignes.forEach((l) =>
        l.attestationPassager.forEach((p) => {
          const c = p.clientbeneficiaireInfo;
          passagersMap.set(c.id, {
            nom: sanitizeForPdf(c.nom),
            prenom: sanitizeForPdf(c.prenom),
          });
        })
      );

      groupes.push({
        pnr: sanitizeForPdf(pnr),
        passagers: Array.from(passagersMap.values()),
        vols: lignes.map(ligneToVol),
      });
    });
  });

  return groupes;
}

function _buildGroupesParPassager(entetes: AttestationEnteteItem[]): LettreGroupe[] {
  const parPassager = new Map<string, { info: ClientBeneficiaireInfo; lignes: AttestationLigne[] }>();

  entetes.forEach((entete) => {
    entete.attestationLigne.forEach((ligne) => {
      ligne.attestationPassager.forEach((p) => {
        const id = p.clientbeneficiaireInfo.id;
        if (!parPassager.has(id)) {
          parPassager.set(id, { info: p.clientbeneficiaireInfo, lignes: [] });
        }
        parPassager.get(id)!.lignes.push(ligne);
      });
    });
  });

  const groupes: LettreGroupe[] = [];
  parPassager.forEach(({ info, lignes }) => {
    const pnrs = Array.from(new Set(lignes.map((l) => l.numeroReservation).filter(Boolean)));
    groupes.push({
      pnr: sanitizeForPdf(pnrs.join(' / ')),
      passagers: [{ nom: sanitizeForPdf(info.nom), prenom: sanitizeForPdf(info.prenom) }],
      vols: lignes.map(ligneToVol),
    });
  });

  return groupes;
}

// ─────────────────────────────────────────────────────────────────────
// Vecteurs utilitaires — flèche dessinée (pas de caractère de police)
// ─────────────────────────────────────────────────────────────────────

function drawArrowVector(
  doc: jsPDF,
  x: number,
  y: number,
  color: [number, number, number],
  length = 7
): void {
  const lineEnd = x + length - 2.2;
  setColor(doc, color, 'draw');
  doc.setLineWidth(0.5);
  doc.line(x, y, lineEnd, y);
  setColor(doc, color, 'fill');
  doc.triangle(lineEnd, y - 1.1, lineEnd, y + 1.1, lineEnd + 2.4, y, 'F');
}

/** Dessine "CODE_A → CODE_B" centré sur centerX, en vectoriel. */
function drawItineraireCentre(
  doc: jsPDF,
  centerX: number,
  y: number,
  codeA: string,
  codeB: string,
  color: [number, number, number],
  fontSize = 10.5
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const wA = doc.getTextWidth(codeA);
  const wB = doc.getTextWidth(codeB);
  const arrowW = 8;
  const gap = 3;
  const total = wA + gap + arrowW + gap + wB;
  let x = centerX - total / 2;

  setColor(doc, color, 'text');
  doc.text(codeA, x, y);
  x += wA + gap;
  drawArrowVector(doc, x, y - 1.1, color, arrowW);
  x += arrowW + gap;
  doc.text(codeB, x, y);
}

// ─────────────────────────────────────────────────────────────────────
// Rendu — cadre & décor
// ─────────────────────────────────────────────────────────────────────

function _drawFrame(doc: jsPDF, design: PdfDesign, layout: PageLayout): void {
  const { pageW, pageH, margin } = layout;

  // Barre d'accent en haut de page
  setColor(doc, design.colors.accentLine, 'fill');
  doc.rect(0, 0, pageW, 2.5, 'F');

  // Cadre arrondi léger façon certificat
  setColor(doc, [225, 225, 225], 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(margin - 6, 8, pageW - (margin - 6) * 2, pageH - 16, 3, 3, 'S');
}

function _drawLettreHeader(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  logo: string | undefined,
  layout: PageLayout
): void {
  const { pageW, margin } = layout;
  let textX = margin;

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, 12, 22, 22);
      textX = margin + 28;
    } catch {}
  }

  setColor(doc, design.colors.headerBg, 'text');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AL BOURAQ TRAVEL', textX, 19);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [100, 100, 100], 'text');
  doc.text(design.staticTexts?.headerSubtitle ?? 'Notre réactivité à votre service !', textX, 25);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [120, 120, 120], 'text');
  doc.text(
    sanitizeForPdf(
      design.staticTexts?.footerContact ??
        'Bât. MATURA, RDC – Andranamahery Ankorondrano  |  +261 38 01 637 17'
    ),
    textX,
    30
  );

  cursor.y = 44;
  setColor(doc, [210, 210, 210], 'draw');
  doc.setLineWidth(0.25);
  doc.line(margin, cursor.y, pageW - margin, cursor.y);
  cursor.move(16);
}

function _drawLettreTitre(
  doc: jsPDF,
  cursor: Cursor,
  layout: PageLayout,
  design: PdfDesign
): void {
  const { pageW } = layout;
  const spaced = 'ATTESTATION DE RESERVATION'.split('').join(' ');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [20, 20, 20], 'text');
  doc.text(spaced, pageW / 2, cursor.y, { align: 'center' });
  cursor.move(6);

  // Ornement : trait — losange — trait
  const w = doc.getTextWidth(spaced);
  const half = Math.min(w, 60) / 2;
  setColor(doc, design.colors.accentLine, 'draw');
  doc.setLineWidth(0.4);
  doc.line(pageW / 2 - half, cursor.y, pageW / 2 - 3, cursor.y);
  doc.line(pageW / 2 + 3, cursor.y, pageW / 2 + half, cursor.y);
  setColor(doc, design.colors.accentLine, 'fill');
  doc.triangle(pageW / 2 - 1.6, cursor.y, pageW / 2, cursor.y - 1.6, pageW / 2 + 1.6, cursor.y, 'F');
  doc.triangle(pageW / 2 - 1.6, cursor.y, pageW / 2, cursor.y + 1.6, pageW / 2 + 1.6, cursor.y, 'F');
  cursor.move(14);
}

function _drawIntro(doc: jsPDF, cursor: Cursor, design: PdfDesign, layout: PageLayout): void {
  const { margin, contentW } = layout;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [30, 30, 30], 'text');
  doc.text(
    'Nous, soussignés AGENCE DE VOYAGES « AL BOURAQ TRAVEL », attestons par la présente que :',
    margin,
    cursor.y,
    { maxWidth: contentW }
  );
  cursor.move(16);
}

function _sectionLabel(
  doc: jsPDF,
  cursor: Cursor,
  text: string,
  design: PdfDesign,
  layout: PageLayout
): void {
  const { pageW } = layout;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const spaced = text.toUpperCase();
  const w = doc.getTextWidth(spaced) + 8;

  setColor(doc, design.colors.accentLine, 'fill');
  // doc.roundedRect(pageW / 2 - w / 2, cursor.y - 4.5, w, 6, 1.5, 1.5, 'F');
  setColor(doc, [100, 100, 100], 'text');
  doc.text(spaced, pageW / 2, cursor.y, { align: 'center' });
  cursor.move(11);
}

function _drawPassagersBlock(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  passagers: LettrePassager[],
  layout: PageLayout
): void {
  const { pageW } = layout;

  _sectionLabel(doc, cursor, 'Les passagers ci-dessous', design, layout);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [25, 25, 25], 'text');
  passagers.forEach((p, i) => {
    doc.text(`${p.nom.toUpperCase()} ${p.prenom.toUpperCase()}`, pageW / 2, cursor.y, {
      align: 'center',
    });
    cursor.move(7);
    if (i < passagers.length - 1) {
      setColor(doc, [230, 230, 230], 'draw');
      doc.setLineWidth(0.2);
      doc.line(pageW / 2 - 20, cursor.y - 3, pageW / 2 + 20, cursor.y - 3);
      cursor.move(2);
    }
  });
  cursor.move(8);
}

function _drawVolsBlock(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  vols: LettreVol[],
  layout: PageLayout
): void {
  const { margin, pageW, contentW } = layout;

  _sectionLabel(doc, cursor, 'Ont bien réservé sur les vols suivants', design, layout);
  cursor.move(2);

  const rowH = 12;
  const cardX = margin + 6;
  const cardW = contentW - 12;

  vols.forEach((v, i) => {
    // Carte légère
    setColor(doc, [248, 249, 251], 'fill');
    doc.roundedRect(cardX, cursor.y - 2, cardW, rowH, 2, 2, 'F');

    // Pastille numérotée
    setColor(doc, design.colors.accentLine, 'fill');
    doc.circle(cardX + 8, cursor.y + rowH / 2 - 2, 3.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [255, 255, 255], 'text');
    doc.text(String(i + 1), cardX + 8, cursor.y + rowH / 2 - 0.7, { align: 'center' });

    // Numéro de vol
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, design.colors.accentLine, 'text');
    doc.text(v.numeroVol, cardX + 16, cursor.y + rowH / 2 - 0.5);

    // Date
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [130, 130, 130], 'text');
    doc.text(v.dateDepart, cardX + 42, cursor.y + rowH / 2 - 0.5);

    // Itinéraire (vectoriel — corrige le bug de flèche)
    const codes = extractItineraireCodes(v.itineraire);
    const itinCenterX = cardX + cardW / 2 + 8;
    if (codes) {
      drawItineraireCentre(
        doc,
        itinCenterX,
        cursor.y + rowH / 2 - 0.5,
        codes[0].toUpperCase(),
        codes[1].toUpperCase(),
        [40, 40, 40],
        9.5
      );
    } else {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      setColor(doc, [40, 40, 40], 'text');
      doc.text(v.itineraire, itinCenterX, cursor.y + rowH / 2 - 0.5, { align: 'center' });
    }

    // Heures
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [90, 90, 90], 'text');
    doc.text(
      `${v.heureDepart} - ${v.heureArrivee}`,
      cardX + cardW - 6,
      cursor.y + rowH / 2 - 0.5,
      { align: 'right' }
    );

    cursor.move(rowH + 3);
  });

  cursor.move(6);
}

function _drawPnrBlock(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  pnr: string,
  layout: PageLayout
): void {
  const { pageW } = layout;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [130, 130, 130], 'text');
  doc.text('CODE DE RESERVATION', pageW / 2, cursor.y, { align: 'center' });
  cursor.move(8);

  const spaced = pnr.split('').join(' ');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const w = doc.getTextWidth(spaced) + 14;
  const h = 9;

  setColor(doc, design.colors.accentLine, 'draw');
  doc.setLineWidth(0.4);
  doc.roundedRect(pageW / 2 - w / 2, cursor.y - h + 2.5, w, h, 1.5, 1.5, 'S');
  setColor(doc, [25, 25, 25], 'text');
  doc.text(spaced, pageW / 2, cursor.y, { align: 'center' });
  cursor.move(18);
}

function _drawCloture(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  layout: PageLayout,
  stamp?: string
): void {
  const { margin, pageW, contentW } = layout;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [30, 30, 30], 'text');
  const legal = sanitizeForPdf(
    design.staticTexts?.footerLegal ??
      'Cette attestation lui est délivrée pour servir et valoir ce que de droit.'
  );
  doc.text(legal, margin, cursor.y, { maxWidth: contentW });
  cursor.move(22);

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Antananarivo, Le ${dateStr}`, pageW - margin, cursor.y, { align: 'right' });
  cursor.move(30);

  if (stamp) {
    try {
      const size = 30;
      const format = stamp.startsWith('data:image/png')
        ? 'PNG'
        : stamp.startsWith('data:image/jpeg') || stamp.startsWith('data:image/jpg')
        ? 'JPEG'
        : 'PNG';
      doc.addImage(stamp, format, pageW - margin - size - 6, cursor.y - 4, size, size);
    } catch (e) {
      console.warn('Cachet non chargé :', e);
    }
  }
  cursor.move(30);

  // Ligne de signature
  setColor(doc, [80, 80, 80], 'draw');
  doc.setLineWidth(0.3);
  doc.line(pageW - margin - 42, cursor.y - 2, pageW - margin, cursor.y - 2);
  cursor.move(4);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [30, 30, 30], 'text');
  doc.text('LE RESPONSABLE', pageW - margin, cursor.y, { align: 'right' });
}