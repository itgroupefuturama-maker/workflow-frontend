import jsPDF from 'jspdf';
import type { BilletStyle, PdfDesign } from '../types/pdf-design.types';
import {
  Cursor, checkPage, drawWatermark, drawHeader, drawSeparator, fmt,
  MARGIN, CONTENT_W, setColor,
  type PageLayout,
  makeLayout,
} from '../lib/pdf-base';
import avionPng from '@/assets/images/avion.png';

export const AVION_IMG = avionPng;

// ─── Types ───────────────────────────────────────────────────────────

export interface BilletPassagerExigence {
  id: string;
  type: string;
  description: string;
  perimetre: string;
}

export interface BilletPassagerService {
  libelle: string;
  code: string;
  type: string | null;
  typeService: string;
  valeur: string;
}

export interface BilletPassagerLigne {
  numeroDosRef: string;
  numeroVol: string | null;
  avion: string;
  itineraire: string;
  classe: string;
  typePassager: string;
  nombre: number;
  dateHeureDepart: string;
  dateHeureArrive: string;
  dureeVol: string;
  dureeEscale: string;
  devise: string;
  tauxEchange: number;
  puBilletCompagnieDevise: number;
  puServiceCompagnieDevise: number;
  puPenaliteCompagnieDevise: number;
  montantBilletClientDevise: number;
  montantServiceClientDevise: number;
  montantPenaliteClientDevise: number;
  montantBilletCompagnieAriary: number;
  montantServiceCompagnieAriary: number;
  montantPenaliteCompagnieAriary: number;
  montantBilletClientAriary: number;
  montantServiceClientAriary: number;
  montantPenaliteClientAriary: number;
  commissionEnDevise: number;
  commissionEnAriary: number;
  conditionModif: string | null;
  conditionAnnul: string | null;
  modePaiement: string;
  reservation: string | null;
  puResaBilletCompagnieDevise?: number;
  puResaServiceCompagnieDevise?: number;
  puResaPenaliteCompagnieDevise?: number;
  resaTauxEchange?: number;
  puResaBilletClientAriary?: number;
  puResaServiceClientAriary?: number;
  puResaPenaliteClientAriary?: number;
  puResaMontantBilletCompagnieAriary?: number;
  puResaMontantServiceCompagnieAriary?: number;
  puResaMontantPenaliteCompagnieAriary?: number;
  resaCommissionEnDevise?: number;
  resaCommissionEnAriary?: number;
  emissionTauxChange?: number;
  emissionMontantBilletCompagnieAriary?: number;
  emissionMontantServiceCompagnieAriary?: number;
  emissionMontantPenaliteCompagnieAriary?: number;
  emissionMontantBilletClientAriary?: number;
  emissionMontantServiceClientAriary?: number;
  emissionMontantPenaliteClientAriary?: number;
  emissionCommissionEnDevise?: number;
  emissionCommissionEnAriary?: number;
  services: BilletPassagerService[];
  destinationVoyage?: {
    ville: string;
    pays: {
      pays: string;
      paysVoyage?: {
        exigenceVoyage: BilletPassagerExigence;
      }[];
    };
  };
}

export interface BilletPassagerData {
  nom: string;
  prenom: string;
  nationalite: string;
  typeDoc: string;
  referenceDoc: string;
  dateValiditeDoc: string | null;
  clientType: string;
  tel?: string;
  whatsapp?: string;
  numeroBillet: string | null;
  statut: string;
  numeroBilletEntete: string;
  totalCompagnie: number;
  commissionPropose: number;
  commissionAppliquer: number;
  totalCommission: number;
  numeroDossier: string;
  fournisseur: string;
  typeVol: string;
  credit: string;
  dateEmission: string;
  agence?: string;
  ligne: BilletPassagerLigne;
  exigences: BilletPassagerExigence[];
}

// ─── Sanitize ─────────────────────────────────────────────────────────
function sanitize(s: string): string {
  return (s ?? '')
    .replace(/→/g, '>').replace(/←/g, '<').replace(/↔/g, '<>')
    .replace(/⇒/g, '=>').replace(/⇐/g, '<=')
    .replace(/–/g, '-').replace(/—/g, '-')
    .replace(/«/g, '"').replace(/»/g, '"')
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ')
    .replace(/·/g, '.').replace(/•/g, '-')
    .replace(/×/g, 'x').replace(/÷/g, '/');
}

// ─────────────────────────────────────────────────────────────────────
// FONCTIONS PRIVÉES
// ─────────────────────────────────────────────────────────────────────

// ─── Bande méta ───────────────────────────────────────────────────────
function drawBilletMeta(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
) {
  const items = [
    { label: 'Compagnie', value: sanitize(data.fournisseur) },
  ];

  const bandH = 18;
  doc.setFillColor(...(style.colors.headerBg as [number, number, number]));
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, bandH, 'F');

  const colW = CONTENT_W / items.length;
  items.forEach((item, i) => {
    const x = MARGIN + i * colW;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [160, 170, 200], 'text');
    doc.text(item.label.toUpperCase(), x + 2, cur.y + 5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [255, 255, 255], 'text');
    doc.text(item.value, x + 2, cur.y + 13);
  });
  cur.move(bandH + 6);
}

// ─── Horaires importants (check-in) — EN TOUT PREMIER ────────────────
function drawBilletCheckin(
  doc: jsPDF,
  cur: Cursor,
  style: BilletStyle,
) {
  checkPage(doc, cur, 30, style as any);

  const accentColor = (style.colors.accentLine ?? style.colors.accentBg) as [number, number, number];

  // Label section sobre
  setColor(doc, accentColor, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text('HORAIRES IMPORTANTS', MARGIN + 5, cur.y + 6);
  cur.move(13);

  const steps = [
    { icon: '[A]', label: 'Arrivee aeroport', value: '3h avant', detail: '4h si exigences speciales' },
    { icon: '[P]', label: 'Controle passeport', value: '90 min', detail: 'avant le depart' },
    { icon: '[E]', label: 'Economy / Premium', value: '60 min', detail: 'avant le depart, a la porte' },
    { icon: '[B]', label: 'Business / First', value: '45 min', detail: 'avant le depart, a la porte' },
  ];

  // Fond gris très léger commun
  doc.setFillColor(246, 247, 249);
  doc.rect(MARGIN - 2, cur.y - 1, CONTENT_W + 4, 25, 'F');

  const stepsW = CONTENT_W / steps.length;

  steps.forEach((s, i) => {
    const cx = MARGIN + i * stepsW + stepsW / 2;

    // Cercle plein accent
    doc.setFillColor(...(style.colors.headerBg as [number, number, number]));
    doc.circle(cx, cur.y + 4, 4, 'F');

    // Lettre dans le cercle
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [255, 255, 255], 'text');
    doc.text(String(i + 1), cx, cur.y + 5.5, { align: 'center' });

    // Valeur temps — grande
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [26, 39, 68], 'text');
    doc.text(s.value, cx, cur.y + 12, { align: 'center' });

    // Label
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [100, 100, 100], 'text');
    doc.text(s.label, cx, cur.y + 16, { align: 'center' });

    // Détail
    doc.setFontSize(5);
    setColor(doc, [160, 160, 160], 'text');
    doc.text(s.detail, cx, cur.y + 19, { align: 'center' });

    // Trait de connexion entre cercles (sauf le dernier)
    if (i < steps.length - 1) {
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.3);
      doc.line(cx + 4, cur.y + 4, cx + stepsW - 4, cur.y + 4);
    }
  });

  cur.move(24);
  drawSeparator(doc, cur);
}

// ─── Consignes + avertissement + destination ─────────────────────────
function drawBilletConsignes(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
) {
  checkPage(doc, cur, 70, style as any);

  const accentColor = (style.colors.accentLine ?? style.colors.accentBg) as [number, number, number];

  // ── Titre section ─────────────────────────────────────────────────
  setColor(doc, accentColor, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text('INFORMATIONS IMPORTANTES', MARGIN + 5, cur.y + 6);
  cur.move(13);

  // ── 3 blocs de consignes ─────────────────────────────────────────
  const consignes = [
    {
      title: 'Votre billet',
      text:  'Votre billet est enregistre dans notre systeme de reservation. Ce recepisse constitue votre justificatif et fait partie de vos conditions de transport. Vous pourriez avoir a le presenter pour acceder a l\'aeroport ou justifier votre voyage aupres des services d\'immigration.',
    },
    {
      title: 'Bagages et liquides',
      text:  'Verifiez les restrictions concernant le transport de liquides, aerosols et gels en bagage cabine aupres de votre aeroport de depart. Consultez egalement les exigences en matiere de visa pour votre destination.',
    },
    {
      title: 'Marchandises dangereuses',
      text:  'Certains articles sont interdits ou soumis a restrictions : appareils electroniques, batteries de rechange, bagages connectes. Consultez les informations sur les marchandises dangereuses avant votre depart.',
    },
  ];

  const colW  = (CONTENT_W - 8) / 3;
  const gap   = 4;
  const blkH  = 30;

  consignes.forEach((c, i) => {
    const x = MARGIN + i * (colW + gap);

    doc.setFillColor(248, 249, 252);
    doc.rect(x, cur.y, colW, blkH, 'F');
    setColor(doc, accentColor, 'fill');
    doc.rect(x, cur.y, 2, blkH, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [26, 39, 68], 'text');
    doc.text(c.title, x + 5, cur.y + 5);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [80, 80, 80], 'text');
    const lines = doc.splitTextToSize(c.text, colW - 8);
    doc.text(lines.slice(0, 6), x + 5, cur.y + 10);
  });

  cur.move(blkH + 5);

  // ── Avertissement + mention sanitaire — même bloc sobre ───────────

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [100, 70, 0], 'text');
  doc.text(
    'Si les conditions ne sont pas respectees, vous risquez d\'etre refuse(e) a l\'embarquement.\nLes conditions sont susceptibles de changer en fonction de la situation sanitaire.',
    MARGIN + 3, cur.y + 5,
  );

  cur.move(18);

  drawSeparator(doc, cur);
}

// ─── Exigences de voyage en rouge ────────────────────────────────────
function drawBilletExigences(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
) {
  const seen = new Set<string>();
  const exigences: Array<{ type: string; description: string; perimetre: string }> = [];

  data.exigences.forEach(e => {
    const key = `${e.type}|${e.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      exigences.push({
        type:        sanitize(e.type ?? '-'),
        description: sanitize(e.description ?? '-'),
        perimetre:   sanitize(e.perimetre ?? '-'),
      });
    }
  });

  const l = data.ligne;
  (l.destinationVoyage?.pays?.paysVoyage ?? []).forEach(pv => {
    const e = pv.exigenceVoyage;
    if (!e) return;
    const key = `${e.type}|${e.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      exigences.push({
        type:        sanitize(e.type ?? '-'),
        description: sanitize(e.description ?? '-'),
        perimetre:   sanitize(e.perimetre ?? '-'),
      });
    }
  });

  if (exigences.length === 0) return;

  checkPage(doc, cur, 14 + exigences.length * 13, style as any);

  // Bandeau rouge titre
  doc.setFillColor(215, 25, 33);
  doc.rect(MARGIN - 2, cur.y - 1, CONTENT_W + 4, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('EXIGENCES DE VOYAGE - IMPORTANT', MARGIN + 3, cur.y + 6);
  cur.move(13);

  exigences.forEach(e => {
    checkPage(doc, cur, 14, style as any);

    // Fond rose très pâle + bordure rouge gauche
    doc.setFillColor(255, 250, 250);
    doc.rect(MARGIN - 2, cur.y - 1, CONTENT_W + 4, 11, 'F');
    doc.setFillColor(215, 25, 33);
    doc.rect(MARGIN - 2, cur.y - 1, 2, 11, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [160, 20, 20], 'text');
    doc.text(e.type, MARGIN + 3, cur.y + 4.5);

    doc.setFont('helvetica', 'normal');
    setColor(doc, [70, 70, 70], 'text');
    const desc = doc.splitTextToSize(e.description, CONTENT_W - 52);
    doc.text(desc[0] ?? '', MARGIN + 46, cur.y + 4.5);

    doc.setFontSize(6.5);
    setColor(doc, [150, 150, 150], 'text');
    doc.text(e.perimetre, MARGIN + CONTENT_W, cur.y + 4.5, { align: 'right' });

    cur.move(13);
  });

  cur.move(3);
  drawSeparator(doc, cur);
}

// ─── Passager : style Receipt billet d'avion ─────────────────────────
// ─── Passager : style Receipt billet d'avion (SANS PRIX) ─────────────
function drawBilletPassager(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
) {
  checkPage(doc, cur, 40, style as any);

  const accentColor = (style.colors.accentLine ?? style.colors.accentBg) as [number, number, number];
  const l = data.ligne;

  // ── Label section ─────────────────────────────────────────────────
  setColor(doc, accentColor, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text('PASSAGER', MARGIN + 5, cur.y + 6);
  cur.move(13);

  // ── Bloc receipt sur fond blanc avec bordure fine ─────────────────
  const blockH = 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, blockH, 'FD');

  // Bandeau titre
  doc.setFillColor(...(style.colors.headerBg as [number, number, number]));
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('Billet & Reçu', MARGIN + 2, cur.y + 5.5);

  // Numéro billet à droite dans le bandeau
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [200, 210, 230], 'text');
  doc.text(
    sanitize(`Numéro de billet : ${data.numeroBillet ?? data.numeroBilletEntete}`),
    MARGIN + CONTENT_W,
    cur.y + 5.5,
    { align: 'right' },
  );

  cur.move(12);

  // ── Informations passager UNIQUEMENT (sans prix) ──────────────────
  const rows: Array<{ label: string; value: string }> = [
    {
      label: 'Nom',
      value: sanitize(`${data.prenom} ${data.nom}`.toUpperCase() + ` ${fmt.replace_(data.clientType)}`),
    },
    {
      label: 'Numéro de billet',
      value: sanitize(data.numeroBillet ?? data.numeroBilletEntete),
    },
    {
      label: 'Mode de paiement',
      value: sanitize(fmt.replace_(l.modePaiement ?? '-')),
    },
    {
      label: 'Statut',
      value: sanitize(data.statut ?? '-'),
    },
  ];

  rows.forEach(row => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [80, 80, 90], 'text');
    doc.text(`${row.label}`, MARGIN + 2, cur.y);

    doc.setFont('helvetica', 'normal');
    setColor(doc, [30, 30, 30], 'text');
    doc.text(row.value, MARGIN + 42, cur.y);

    cur.move(6);
  });

  cur.move(12);
  drawSeparator(doc, cur);
}

// ─── Vol + services inclus (sans prix) ────────────────────────────────
function drawBilletSegment(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
  avionImg?: string,
) {
  const l              = data.ligne;
  const accentColor    = (style.colors.accentLine ?? style.colors.accentBg) as [number, number, number];
  const headerBg       = style.colors.headerBg as [number, number, number];
  const servicesInclus = (l.services ?? []).filter(s => s.valeur !== 'false');
  const srvRows        = Math.ceil(servicesInclus.length / 3);

  // Calcul hauteur totale du bloc unique
  const volH    = 10;   // bandeau leg
  const iataH   = 30;   // zone codes IATA + horaires
  const metaH   = 14;   // zone métas
  const srvH    = servicesInclus.length > 0 ? 8 + srvRows * 6 + 2 : 0;
  const totalH  = volH + iataH + metaH + srvH;

  checkPage(doc, cur, totalH + 16, style as any);

  // ── Label section sobre ───────────────────────────────────────────
  setColor(doc, accentColor, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text('VOL', MARGIN + 5, cur.y + 6);
  cur.move(13);

  // ═══════════════════════════════════════════════════════════════════
  // BLOC UNIQUE — fond blanc, bordure fine sur tout le périmètre
  // ═══════════════════════════════════════════════════════════════════
  const blockY = cur.y;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN - 2, blockY, CONTENT_W + 4, totalH, 'FD');

  // ── ZONE 1 : Bandeau "Leg" gris ───────────────────────────────────
  const raw    = l.itineraire ?? '';
  const parts  = raw.includes('\u2192') ? raw.split('\u2192') : raw.split('-');
  const codeD  = sanitize(parts[0]?.trim() ?? '-');
  const codeA  = sanitize(parts[1]?.trim() ?? '-');
  const dest   = data.ligne.destinationVoyage;
  const ville  = sanitize(dest?.ville ?? '-');
  const pays   = sanitize(dest?.pays?.pays ?? '-');

  doc.setFillColor(232, 233, 236);
  doc.rect(MARGIN - 2, blockY, CONTENT_W + 4, volH, 'F');

  // Petit triangle flèche
  doc.setFillColor(80, 80, 90);
  doc.triangle(
    MARGIN + 2, blockY + 3,
    MARGIN + 2, blockY + 7,
    MARGIN + 5, blockY + 5,
    'F',
  );

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [80, 80, 90], 'text');
  doc.text('Départ  >>  De', MARGIN + 7, blockY + 6);

  doc.setFont('helvetica', 'bold');
  setColor(doc, [30, 30, 40], 'text');
  doc.text(`${ville}, ${pays}`, MARGIN + 36, blockY + 6);

  // Escale info à droite du bandeau
  if (l.dureeEscale && l.dureeEscale !== '0' && l.dureeEscale !== '') {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [120, 120, 130], 'text');
    doc.text(
      sanitize(`1 Escale (${l.dureeEscale})`),
      MARGIN + CONTENT_W,
      blockY + 6,
      { align: 'right' },
    );
  }

  cur.move(volH);

  // ── ZONE 2 : Corps vol (4 colonnes) ──────────────────────────────
  // Col 1 : Flight + Classe + Statut
  const c1x = MARGIN + 2;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('Vol', c1x, cur.y + 5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(sanitize(l.numeroVol ?? '-'), c1x, cur.y + 11);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [100, 100, 110], 'text');
  doc.text(sanitize(l.classe ?? '-'), c1x, cur.y + 16);

  // Séparateur vertical fin
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(MARGIN + 28, cur.y + 1, MARGIN + 28, cur.y + iataH - 2);

  // Col 2 : Check-in + Departure
  const c2x = MARGIN + 31;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('Enregistrement le', c2x, cur.y + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [40, 40, 50], 'text');
  doc.text(sanitize(fmt.date(l.dateHeureDepart)), c2x, cur.y + 10);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('Départ', c2x, cur.y + 16);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [40, 40, 50], 'text');
  doc.text(sanitize(fmt.date(l.dateHeureDepart)), c2x, cur.y + 21);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(fmt.time(l.dateHeureDepart), c2x, cur.y + 28);

  // Séparateur vertical fin
  doc.line(MARGIN + 64, cur.y + 1, MARGIN + 64, cur.y + iataH - 2);

  // Col 3 : Flèche + Arrival
  const c3x = MARGIN + 67;

  // ── Icône avion ───────────────────────────────────────────────────
  const arrY  = cur.y + 4;
  const iconW = 14;
  const iconH = 7;

  if (avionImg) {
    try {
      doc.addImage(avionImg, 'PNG', c3x, arrY, iconW, iconH);
    } catch (e) {
      // fallback flèche simple si l'image échoue
      doc.setDrawColor(180, 170, 140);
      doc.setLineWidth(0.5);
      doc.line(c3x, arrY + 3, c3x + iconW, arrY + 3);
      doc.line(c3x + iconW - 3, arrY + 1, c3x + iconW, arrY + 3);
      doc.line(c3x + iconW - 3, arrY + 5, c3x + iconW, arrY + 3);
    }
  }

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('Arrivée', c3x, cur.y + 16);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [40, 40, 50], 'text');
  doc.text(sanitize(fmt.date(l.dateHeureArrive)), c3x, cur.y + 21);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(fmt.time(l.dateHeureArrive), c3x, cur.y + 28);

  // Séparateur vertical fin
  doc.line(MARGIN + 92, cur.y + 1, MARGIN + 92, cur.y + iataH - 2);

  // Col 4 : Villes départ + arrivée en grand
  const c4x = MARGIN + 95;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(codeD, c4x, cur.y + 10);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [120, 120, 130], 'text');
  doc.text(`Départ ${codeD}`, c4x, cur.y + 15);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(codeA, c4x, cur.y + 24);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [120, 120, 130], 'text');
  doc.text(`Arrivée ${codeA}`, c4x, cur.y + 29);

  cur.move(iataH);

  // ── ZONE 3 : Métas sur fond gris très pâle ────────────────────────
  // Trait de séparation horizontal
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);

  doc.setFillColor(246, 247, 249);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, metaH, 'F');

  const metas = [
    { label: 'AVION',       value: sanitize(l.avion ?? '-') },
    { label: 'CLASSE',      value: sanitize(l.classe ?? '-') },
    { label: 'PASSAGERS',   value: sanitize(`${l.nombre ?? 1} ${fmt.replace_(l.typePassager ?? '')}`) },
    { label: 'RESERVATION', value: sanitize(l.reservation ?? '-') },
  ];
  const mw = CONTENT_W / metas.length;
  metas.forEach((m, i) => {
    const mx = MARGIN + i * mw;

    // Séparateurs verticaux entre colonnes
    if (i > 0) {
      doc.setDrawColor(218, 220, 226);
      doc.setLineWidth(0.2);
      doc.line(mx, cur.y + 2, mx, cur.y + metaH - 2);
    }

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [160, 160, 170], 'text');
    doc.text(m.label, mx + 3, cur.y + 4);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [26, 39, 68], 'text');
    doc.text(m.value, mx + 3, cur.y + 10);
  });

  cur.move(metaH);

  // ── ZONE 4 : Coupon validity + Baggage ────────────────────────────
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);

  doc.setFillColor(250, 250, 251);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, 9, 'F');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [130, 130, 140], 'text');
  doc.text('Validité du coupon : pas avant le', MARGIN + 2, cur.y + 5.5);

  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text(sanitize(fmt.date(l.dateHeureDepart)), MARGIN + 36, cur.y + 5.5);

  doc.setFont('helvetica', 'normal');
  setColor(doc, [130, 130, 140], 'text');
  doc.text('/ pas après le', MARGIN + 55, cur.y + 5.5);

  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text(sanitize(fmt.date(l.dateHeureArrive)), MARGIN + 68, cur.y + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [50, 50, 60], 'text');
  doc.text('Bagages 3 pièces', MARGIN + CONTENT_W, cur.y + 5.5, { align: 'right' });

  cur.move(9);

  // ── ZONE 5 : Services inclus ──────────────────────────────────────
  if (servicesInclus.length > 0) {
    doc.setDrawColor(218, 220, 226);
    doc.setLineWidth(0.2);
    doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);

    doc.setFillColor(255, 255, 255);
    doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, 9, 'F');

    const libellesJoints = servicesInclus
      .map(s => s.valeur === 'true'
        ? sanitize(s.libelle)
        : `${sanitize(s.libelle)} (${sanitize(s.valeur)})`
      )
      .join('  ,  ');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [100, 100, 115], 'text');
    doc.text('SERVICES INCLUS : ', MARGIN + 3, cur.y + 5.5);

    doc.setFont('helvetica', 'normal');
    setColor(doc, [45, 45, 55], 'text');
    doc.text(libellesJoints, MARGIN + 26, cur.y + 5.5);

    cur.move(9);
  }

  drawSeparator(doc, cur);
}

// ─── Franchise bagage avec icônes texte ───────────────────────────────
function drawBilletBagage(
  doc: jsPDF,
  cur: Cursor,
  style: BilletStyle,
) {
  checkPage(doc, cur, 32, style as any);

  const accentColor = (style.colors.accentLine ?? style.colors.accentBg) as [number, number, number];

  setColor(doc, accentColor, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text('EXIGENCE DE VOYAGE', MARGIN + 5, cur.y + 6);
  cur.move(13);

  const bagages = [
    {
      icon:   '[=]',          // soute
      symbol: '23kg x3',
      label:  'BAGAGE SOUTE',
      value:  '3 pieces incluses',
      detail: 'Max 23 kg . Max 150 cm total',
    },
    {
      icon:   '[^]',          // cabine
      symbol: '7kg x1',
      label:  'BAGAGE CABINE',
      value:  '1 piece incluse',
      detail: 'Max 7 kg . Max 115 cm total',
    },
    {
      icon:   '[o]',          // article personnel
      symbol: '1 art.',
      label:  'ARTICLE PERSONNEL',
      value:  '1 article personnel',
      detail: 'Sac a main ou porte-document',
    },
  ];

  const bColW = (CONTENT_W - 8) / 3;
  const bGap  = 4;
  const bH    = 22;

  bagages.forEach((b, i) => {
    const x = MARGIN + i * (bColW + bGap);

    // Fond gris sobre
    doc.setFillColor(246, 247, 249);
    doc.rect(x, cur.y, bColW, bH, 'F');

    // Trait top coloré (accent) à la place de la bordure gauche
    setColor(doc, accentColor, 'fill');
    doc.rect(x, cur.y, bColW, 2, 'F');

    // Symbole poids en grand — style "badge"
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(doc, (style.colors.headerBg as [number, number, number]), 'text');
    doc.text(b.symbol, x + bColW / 2, cur.y + 8, { align: 'center' });

    // Label petit
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [140, 140, 150], 'text');
    doc.text(b.label, x + bColW / 2, cur.y + 12, { align: 'center' });

    // Valeur
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [40, 40, 40], 'text');
    doc.text(b.value, x + bColW / 2, cur.y + 16, { align: 'center' });

    // Détail
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [120, 120, 130], 'text');
    doc.text(b.detail, x + bColW / 2, cur.y + 20, { align: 'center' });
  });

  cur.move(bH + 6);
  drawSeparator(doc, cur);
}

// ─── PAGE 3 : Reçu complet avec tous les prix ────────────────────────
function drawRecuComplet(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
) {
  const l = data.ligne;
  const accentColor = (style.colors.accentLine ?? style.colors.accentBg) as [number, number, number];

  // ── Titre section ─────────────────────────────────────────────────
  setColor(doc, accentColor, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentColor, 'text');
  doc.text('REÇU DE PAIEMENT', MARGIN + 5, cur.y + 6);
  cur.move(13);

  // ── En-tête du reçu ───────────────────────────────────────────────
  const headerH = 20;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, headerH, 'FD');

  doc.setFillColor(...(style.colors.headerBg as [number, number, number]));
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('REÇU OFFICIEL', MARGIN + 2, cur.y + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [200, 210, 230], 'text');
  doc.text(
    sanitize(`Dossier : ${data.numeroDossier}  |  Émis le : ${fmt.date(data.dateEmission)}`),
    MARGIN + CONTENT_W,
    cur.y + 5.5,
    { align: 'right' },
  );
  cur.move(10);

  // Infos passager en résumé
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [80, 80, 90], 'text');
  doc.text('Passager :', MARGIN + 2, cur.y);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [30, 30, 30], 'text');
  doc.text(
    sanitize(`${data.prenom} ${data.nom}`.toUpperCase()),
    MARGIN + 30, cur.y,
  );

  doc.setFont('helvetica', 'bold');
  setColor(doc, [80, 80, 90], 'text');
  doc.text('Billet :', MARGIN + 100, cur.y);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [30, 30, 30], 'text');
  doc.text(
    sanitize(data.numeroBillet ?? data.numeroBilletEntete),
    MARGIN + 118, cur.y,
  );
  cur.move(headerH - 10 + 6);

  // ── Tableau des prix ──────────────────────────────────────────────
  // Colonnes : Désignation | Devise | Montant Compagnie | Montant Client
  const tableH = 10;
  const col1 = MARGIN;
  const col2 = MARGIN + 60;
  const col3 = MARGIN + 90;
  const col4 = MARGIN + 130;
  const colEnd = MARGIN + CONTENT_W;

  // En-tête tableau
  doc.setFillColor(...(style.colors.headerBg as [number, number, number]));
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, tableH, 'F');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('DÉSIGNATION', col1 + 2, cur.y + 6.5);
  doc.text('DEVISE', col2, cur.y + 6.5);
  doc.text('MONTANT CIE', col3, cur.y + 6.5);
  doc.text('MONTANT CLIENT', col4, cur.y + 6.5);
  cur.move(tableH);

  // Lignes du tableau
  const lignesPrix = [
    {
      label:    'Billet (réservation)',
      devise:   sanitize(l.devise ?? '-'),
      montantCie: l.puResaBilletCompagnieDevise ?? l.puBilletCompagnieDevise ?? 0,
      montantClient: l.puResaBilletClientAriary ?? l.montantBilletClientAriary ?? 0,
    },
    {
      label:    'Services / Taxes (réservation)',
      devise:   sanitize(l.devise ?? '-'),
      montantCie: l.puResaServiceCompagnieDevise ?? l.puServiceCompagnieDevise ?? 0,
      montantClient: l.puResaServiceClientAriary ?? l.montantServiceClientAriary ?? 0,
    },
    {
      label:    'Pénalités (réservation)',
      devise:   sanitize(l.devise ?? '-'),
      montantCie: l.puResaPenaliteCompagnieDevise ?? l.puPenaliteCompagnieDevise ?? 0,
      montantClient: l.puResaPenaliteClientAriary ?? l.montantPenaliteClientAriary ?? 0,
    },
    {
      label:    'Billet (émission)',
      devise:   'MGA',
      montantCie: l.emissionMontantBilletCompagnieAriary ?? l.montantBilletCompagnieAriary ?? 0,
      montantClient: l.emissionMontantBilletClientAriary ?? l.montantBilletClientAriary ?? 0,
    },
    {
      label:    'Services / Taxes (émission)',
      devise:   'MGA',
      montantCie: l.emissionMontantServiceCompagnieAriary ?? l.montantServiceCompagnieAriary ?? 0,
      montantClient: l.emissionMontantServiceClientAriary ?? l.montantServiceClientAriary ?? 0,
    },
    {
      label:    'Pénalités (émission)',
      devise:   'MGA',
      montantCie: l.emissionMontantPenaliteCompagnieAriary ?? l.montantPenaliteCompagnieAriary ?? 0,
      montantClient: l.emissionMontantPenaliteClientAriary ?? l.montantPenaliteClientAriary ?? 0,
    },
  ];

  lignesPrix.forEach((lp, idx) => {
    const rowH = 8;
    // Alternance de fond
    if (idx % 2 === 0) {
      doc.setFillColor(248, 249, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, rowH, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [50, 50, 60], 'text');
    doc.text(lp.label, col1 + 2, cur.y + 5.5);

    setColor(doc, [100, 100, 110], 'text');
    doc.text(lp.devise, col2, cur.y + 5.5);

    setColor(doc, [50, 50, 60], 'text');
    doc.text(fmt.number(lp.montantCie, 2), col3, cur.y + 5.5);

    doc.setFont('helvetica', 'bold');
    setColor(doc, [26, 39, 68], 'text');
    doc.text(fmt.number(lp.montantClient, 2), col4, cur.y + 5.5);

    cur.move(rowH);
  });

  // ── Séparateur pointillé ──────────────────────────────────────────
  doc.setDrawColor(210, 210, 215);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(MARGIN, cur.y, MARGIN + CONTENT_W, cur.y);
  doc.setLineDashPattern([], 0);
  cur.move(4);

  // ── Bloc commissions ──────────────────────────────────────────────
  const commissions = [
    {
      label: 'Client Facturé',
      value: '---',
    },
    {
      label: 'Mode de payement',
      value: '---',
    },
    {
      label: 'Taux de change réservation',
      value: fmt.number(l.resaTauxEchange ?? l.tauxEchange ?? 0, 2),
    },
    {
      label: 'Taux ce change émission',
      value: fmt.number(l.emissionTauxChange ?? l.tauxEchange ?? 0, 2),
    }
  ];

  commissions.forEach((c, idx) => {
    const rowH = 7;
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, rowH, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [80, 80, 90], 'text');
    doc.text(c.label, col1 + 2, cur.y + 5);

    doc.setFont('helvetica', 'bold');
    setColor(doc, [26, 39, 68], 'text');
    doc.text(c.value, colEnd, cur.y + 5, { align: 'right' });

    cur.move(rowH);
  });

  cur.move(3);

  // ── Taux de change ────────────────────────────────────────────────
  // doc.setFontSize(6.5);
  // doc.setFont('helvetica', 'italic');
  // setColor(doc, [140, 140, 150], 'text');
  // doc.text(
  //   sanitize(
  //     `Taux de change réservation : ${fmt.number(l.resaTauxEchange ?? l.tauxEchange ?? 0, 2)}  |  ` +
  //     `Taux de change émission : ${fmt.number(l.emissionTauxChange ?? l.tauxEchange ?? 0, 2)}`
  //   ),
  //   MARGIN + 2, cur.y,
  // );
  // cur.move(7);

  // ── Ligne TOTAL ───────────────────────────────────────────────────
  doc.setFillColor(...(style.colors.headerBg as [number, number, number]));
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, 11, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('TOTAL COMPAGNIE (MGA)', MARGIN + 2, cur.y + 7.5);

  doc.setFontSize(9);
  setColor(doc, [255, 220, 100], 'text');
  doc.text(
    fmt.number(l.emissionMontantBilletClientAriary ?? l.montantBilletClientAriary ?? 0, 2) + ' MGA',
    colEnd,
    cur.y + 7.5,
    { align: 'right' },
  );

  cur.move(11 + 6);
  drawSeparator(doc, cur);
}

// ─── Footer billet avec cachet ────────────────────────────────────────
function drawBilletFooter(
  doc: jsPDF,
  cur: Cursor,
  data: BilletPassagerData,
  style: BilletStyle,
  stamp?: string,
) {
  const PAGE_H = 297;
  const PAGE_W = 210;

  checkPage(doc, cur, 30, style as any);

  // Cachet
  if (stamp) {
    const stampSize = 36;
    try {
      const format = stamp.startsWith('data:image/png') ? 'PNG'
        : stamp.startsWith('data:image/jpeg') || stamp.startsWith('data:image/jpg') ? 'JPEG'
        : 'PNG';
      doc.addImage(
        stamp, format,
        PAGE_W - MARGIN - stampSize,
        cur.y,
        stampSize, stampSize,
      );
    } catch (e) {
      console.warn('Cachet non charge :', e);
    }
    cur.move(stampSize + 4);
  }

  // Ligne rouge séparatrice
  doc.setDrawColor(215, 25, 33);
  doc.setLineWidth(0.8);
  doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);
  cur.move(5);

  // Note légale
  const legal = sanitize(
    `Billet ${data.numeroBillet ?? data.numeroBilletEntete} - ${data.numeroDossier} - Emis le ${fmt.date(data.dateEmission)}`
  );
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  setColor(doc, [130, 130, 130], 'text');
  const legalLines = doc.splitTextToSize(legal, CONTENT_W);
  doc.text(legalLines, MARGIN, cur.y);
  cur.move(legalLines.length * 4 + 3);

  // Contact agence
  if (data.agence) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [160, 160, 160], 'text');
    doc.text(
      sanitize(data.agence),
      MARGIN + CONTENT_W / 2,
      cur.y,
      { align: 'center' },
    );
    cur.move(6);
  }

  // Numéros de page sur toutes les pages
  const n = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [180, 180, 180], 'text');
    doc.text(
      `Page ${i} / ${n}`,
      PAGE_W - MARGIN,
      PAGE_H - 5,
      { align: 'right' },
    );
    doc.setFontSize(6.5);
    setColor(doc, [200, 200, 200], 'text');
    doc.text(
      sanitize(data.numeroBillet ?? data.numeroBilletEntete),
      MARGIN,
      PAGE_H - 5,
    );
  }
}

// ─── Header léger pour les pages suivantes ────────────────────────────
export function drawPageHeader(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  logo?: string,
  layout?: PageLayout
) {
  const { pageW, margin } = layout ?? makeLayout('portrait');

  // Bande de fond identique au header principal
  setColor(doc, design.colors.headerBg, 'fill');
  doc.rect(0, 0, pageW, 22, 'F');

  const textX = logo ? margin + 24 : margin;
  if (logo) {
    try { doc.addImage(logo, 'PNG', margin, 2, 18, 18); } catch {
      console.warn('Logo non chargé');
    }
  }

  // Nom agence + infos sur une seule ligne compacte
  setColor(doc, design.colors.headerText, 'text');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AL BOURAQ TRAVEL', textX, 10);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Notre reactivite a votre service!', textX, 15);
  doc.text('Bat. MATURA, RDC - Andranamahery Ankorondrano  |  +261 38 01 637 17  |  albouraqtravel@gmail.com', textX, 19);

  // Watermark si présent
  drawWatermark(doc, design, layout);

  // Curseur positionné juste sous le header
  cursor.y = 28;
}

// ─────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────

export function generateBilletPassagerPdf(
  data: BilletPassagerData,
  style: BilletStyle,
  logo?: string,
  stamp?: string,
  options?: { returnDoc?: boolean },
): jsPDF | void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cur = new Cursor();

  // ── PAGE 1 ────────────────────────────────────────────────────────
  drawWatermark(doc, style as any);
  drawHeader(doc, cur, 'BILLET DE VOYAGE', style as any, logo);
  drawBilletMeta(doc, cur, data, style);
  drawBilletCheckin(doc, cur, style);
  drawBilletConsignes(doc, cur, data, style);
  drawBilletBagage(doc, cur, style);
  drawBilletExigences(doc, cur, data, style);

  // ── PAGE 2 ────────────────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, cur, style as any, logo);
  drawBilletSegment(doc, cur, data, style, AVION_IMG);
  drawBilletPassager(doc, cur, data, style);   // ← sans les prix

  // ── PAGE 3 ────────────────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, cur, style as any, logo);
  drawRecuComplet(doc, cur, data, style);      // ← tous les prix ici
  drawBilletFooter(doc, cur, data, style, stamp);

  if (options?.returnDoc) return doc;

  const filename = data.numeroBillet
    ? `billet-${sanitize(data.numeroBillet)}.pdf`
    : `billet-${sanitize(data.nom)}-${sanitize(data.numeroBilletEntete)}.pdf`;

  doc.save(filename);
}