import jsPDF from 'jspdf';
import type { BilletStyle } from '../types/pdf-design.types';

// ─── Types nécessaires ───────────────────────────────────────────────

export interface BilletPassagerData {
  // Passager
  nom: string;
  prenom: string;
  nationalite: string;
  typeDoc: string;
  referenceDoc: string;
  dateValiditeDoc: string | null;
  // Vol
  numeroVol: string;
  itineraire: string;
  classe: string;
  typePassager: string;
  dateDepart: string;
  heureDepart: string;
  heureArrive: string;
  // Billet
  numeroBillet: string | null;
  reservation: string | null;
  // Optionnel
  avion?: string;
  dureeVol?: string;
}

// ─── Dimensions A6 paysage ────────────────────────────────────────────

const BW     = 148;  // largeur A6
const BH     = 105;  // hauteur A6
const BM     = 8;    // marge
const BCW    = BW - BM * 2;

// ─── Utilitaires ─────────────────────────────────────────────────────

function setC(doc: jsPDF, c: [number,number,number], t: 'fill'|'draw'|'text') {
  if (t === 'fill') doc.setFillColor(...c);
  else if (t === 'draw') doc.setDrawColor(...c);
  else doc.setTextColor(...c);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ─── Générateur principal ────────────────────────────────────────────

export const generateBilletPassagerPdf = (
  data: BilletPassagerData,
  style: BilletStyle,
  logo?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a6',   // 148×105mm
  });

  _drawBillet(doc, data, style, logo);

  if (options?.returnDoc) return doc;
  const nomFichier = data.numeroBillet
    ? `billet-${data.numeroBillet}.pdf`
    : `billet-${data.nom}-${data.numeroVol}.pdf`;
  doc.save(nomFichier);
};

// ─── Rendu d'un billet ───────────────────────────────────────────────

function _drawBillet(
  doc: jsPDF,
  data: BilletPassagerData,
  style: BilletStyle,
  logo?: string
): void {
  const { colors } = style;

  // ── Fond blanc ────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, BW, BH, 'F');

  // ── Bande latérale gauche (décorative) ────────────────────────────
  setC(doc, colors.stripeBg, 'fill');
  doc.rect(0, 0, 6, BH, 'F');

  // ── Header (bandeau haut) ─────────────────────────────────────────
  setC(doc, colors.headerBg, 'fill');
  doc.rect(6, 0, BW - 6, 22, 'F');

  // Logo
  if (logo) {
    try { doc.addImage(logo, 'PNG', 9, 3, 14, 14); } catch {
        console.error('Logo non trouvé');
    }
  }

  // Nom compagnie
  const hTextX = logo ? 26 : 10;
  setC(doc, colors.headerText, 'text');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('AL BOURAQ TRAVEL', hTextX, 10);
  doc.setFontSize(6); doc.setFont('helvetica', 'normal');
  doc.text('Billet de voyage', hTextX, 15);

  // Numéro billet en haut à droite
  if (data.numeroBillet) {
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(data.numeroBillet, BW - BM, 10, { align: 'right' });
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
    doc.text('N° Billet', BW - BM, 14, { align: 'right' });
  }

  // ── Ligne de séparation tiretée (style boarding pass) ────────────
  setC(doc, colors.borderColor, 'draw');
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.line(6, 22, BW, 22);
  doc.setLineDashPattern([], 0); // reset

  // ── ZONE PRINCIPALE ───────────────────────────────────────────────
  // Divisée en 2 colonnes : gauche (passager) | droite (vol)
  const colLeft  = BM;
  const colRight = BW / 2 + 2;
  let y = 28;

  // ── Colonne gauche — Passager ─────────────────────────────────────
  setC(doc, colors.accentBg, 'fill');
  doc.setFontSize(6); doc.setFont('helvetica', 'bold');
  setC(doc, colors.labelColor, 'text');
  doc.text('PASSAGER', colLeft, y);
  y += 4;

  // Nom en grand
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  setC(doc, colors.valueColor, 'text');
  doc.text(
    `${data.prenom} ${data.nom}`.toUpperCase(),
    colLeft, y
  );
  y += 6;

  // Grille infos passager — 2 colonnes dans la colonne gauche
  const lgFields: [string, string][] = [
    ['Type passager', data.typePassager ?? '—'],
    ['Type doc.',     data.typeDoc],
    ['N° doc.',       data.referenceDoc],
    ['Nationalité',   data.nationalite],
    ['Validité doc.', fmtDate(data.dateValiditeDoc)],
  ];

  lgFields.forEach(([label, value]) => {
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
    setC(doc, colors.labelColor, 'text');
    doc.text(label, colLeft, y);

    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    setC(doc, colors.valueColor, 'text');
    doc.text(value, colLeft + 28, y);
    y += 5.5;
  });

  // ── Séparateur vertical ───────────────────────────────────────────
  setC(doc, colors.borderColor, 'draw');
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(BW / 2, 24, BW / 2, BH - 10);
  doc.setLineDashPattern([], 0);

  // ── Colonne droite — Vol ──────────────────────────────────────────
  let yR = 28;

  doc.setFontSize(6); doc.setFont('helvetica', 'bold');
  setC(doc, colors.labelColor, 'text');
  doc.text('VOL & ITINÉRAIRE', colRight, yR);
  yR += 4;

  // Itinéraire en grand
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  setC(doc, colors.valueColor, 'text');
  // Tronquer si trop long
  const iti = data.itineraire.length > 28
    ? data.itineraire.slice(0, 27) + '…'
    : data.itineraire;
  doc.text(iti, colRight, yR);
  yR += 6;

  // Grille infos vol
  const rgFields: [string, string][] = [
    ['N° Vol',      data.numeroVol],
    ['Classe',      data.classe],
    ['Date départ', fmtDate(data.dateDepart)],
    ['Départ',      data.heureDepart ?? '—'],
    ['Arrivée',     data.heureArrive ?? '—'],
    ...(data.dureeVol ? [['Durée', data.dureeVol] as [string, string]] : []),
    ...(data.avion    ? [['Avion', data.avion]    as [string, string]] : []),
  ];

  rgFields.forEach(([label, value]) => {
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
    setC(doc, colors.labelColor, 'text');
    doc.text(label, colRight, yR);

    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    setC(doc, colors.valueColor, 'text');
    doc.text(value, colRight + 22, yR);
    yR += 5.5;
  });

  // ── Réservation ───────────────────────────────────────────────────
  if (data.reservation) {
    const resaY = BH - 16;
    setC(doc, colors.stripeBg, 'fill');
    doc.roundedRect(colRight, resaY - 4, BCW / 2, 10, 2, 2, 'F');
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
    setC(doc, [255, 255, 255], 'text');
    doc.text('RÉSERVATION', colRight + 2, resaY);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(data.reservation, colRight + 2, resaY + 5);
  }

  // ── Pied de page ──────────────────────────────────────────────────
  setC(doc, colors.borderColor, 'fill');
  doc.rect(6, BH - 7, BW - 6, 7, 'F');
  doc.setFontSize(5); doc.setFont('helvetica', 'italic');
  setC(doc, colors.labelColor, 'text');
  doc.text(
    'AL BOURAQ TRAVEL — +261 38 01 637 17 | albouraqtravel@gmail.com',
    BW / 2, BH - 3,
    { align: 'center' }
  );
}