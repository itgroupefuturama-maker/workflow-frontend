import jsPDF from 'jspdf';
import type { DevisListItem, DevisLigne, DevisExigence } from '../types/devis.types';
import type { PdfDesign, PdfAudience } from '../types/pdf-design.types';
import {
  Cursor, checkPage, drawWatermark, drawSeparator, drawSectionTitle,
  drawHeader, drawTable, drawKeyValues, drawFooter, fmt,
  MARGIN, CONTENT_W, setColor,
} from '../lib/pdf-base';

// ─── Sanitize pour jsPDF (helvetica = Latin-1 uniquement) ────────────
function sanitize(s: string): string {
  return s
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
// FONCTIONS PRIVÉES — STYLE EMIRATES
// ─────────────────────────────────────────────────────────────────────

function drawEmiMeta(
  doc: jsPDF,
  cur: Cursor,
  devis: DevisListItem,
  design: PdfDesign,
) {
  const ent = devis.prospectionEntete;
  const items = [
    { label: 'Ref. Devis',  value: sanitize(devis.reference) },
    { label: 'Fournisseur', value: sanitize(ent?.fournisseur?.libelle ?? '-') },
    { label: 'Type de vol', value: sanitize(fmt.replace_(ent?.typeVol ?? '-')) },
  ];

  const bandH = 18;
  doc.setFillColor(...design.colors.headerBg);
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

// ─── Exigences de voyage — placées EN HAUT, juste après les métas ────
function drawEmiExigences(
  doc: jsPDF,
  cur: Cursor,
  lignes: DevisLigne[],
  design: PdfDesign,
) {
  const seen = new Set<string>();
  const exigences: Array<{ type: string; description: string; perimetre: string }> = [];

  lignes.forEach(l => {
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
  });

  if (exigences.length === 0) return;

  checkPage(doc, cur, 14 + exigences.length * 7, design);

  // ── Titre sobre ───────────────────────────────────────────────────
  setColor(doc, design.colors.accentLine, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.accentLine, 'text');
  doc.text('EXIGENCES DE VOYAGE', MARGIN + 5, cur.y + 6);

  // Badge IMPORTANT inline
  doc.setFillColor(0, 140, 210);
  doc.rect(MARGIN + 58, cur.y + 1, 20, 6, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text('IMPORTANT', MARGIN + 59, cur.y + 5.5);

  cur.move(13);

  // ── Liste simple une ligne par exigence ───────────────────────────
  exigences.forEach(e => {
    checkPage(doc, cur, 7, design);

    // Blue dot before type
    doc.setFillColor(0, 140, 210);
    doc.circle(MARGIN + 1.5, cur.y - 0.5, 1.2, 'F');

    // Type en gras
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, [50, 50, 60], 'text');
    doc.text(e.type, MARGIN + 5, cur.y);

    // Description à la suite
    doc.setFont('helvetica', 'normal');
    setColor(doc, [80, 80, 90], 'text');
    doc.text(e.description, MARGIN + 42, cur.y);

    // Périmètre aligné à droite
    doc.setFontSize(6.5);
    setColor(doc, [160, 160, 170], 'text');
    doc.text(e.perimetre, MARGIN + CONTENT_W, cur.y, { align: 'right' });

    cur.move(7);
  });

  cur.move(4);
  drawSeparator(doc, cur);
}

// ─── Services disponibles ─────────────────────────────────────────────
function drawEmiServices(
  doc: jsPDF,
  cur: Cursor,
  lignes: DevisLigne[],
  design: PdfDesign,
) {
  const seen = new Set<string>();
  const services: Array<{ libelle: string; valeur: string }> = [];

  lignes.forEach(l => {
    (l.serviceProspectionLigne ?? []).forEach(s => {
      if (s.valeur === 'false') return;
      const key = s.serviceSpecifique?.code ?? s.serviceSpecifique?.libelle ?? '';
      if (!seen.has(key)) {
        seen.add(key);
        services.push({
          libelle: sanitize(s.serviceSpecifique?.libelle ?? '-'),
          valeur:  s.valeur === 'true' ? 'Inclus' : sanitize(s.valeur),
        });
      }
    });
  });

  if (services.length === 0) return;

  checkPage(doc, cur, 14 + 8, design);

  // ── Titre sobre ───────────────────────────────────────────────────
  setColor(doc, design.colors.accentLine, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, design.colors.accentLine, 'text');
  doc.text('SERVICES INCLUS', MARGIN + 5, cur.y + 6);
  cur.move(13);

  // ── Tous les services sur une seule ligne séparés par des virgules ─
  const libellesJoints = services
    .map(s => s.valeur === 'Inclus'
      ? s.libelle
      : `${s.libelle} (${s.valeur})`
    )
    .join('  .  ');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [80, 80, 90], 'text');
  doc.text('Inclus : ', MARGIN + 2, cur.y);

  doc.setFont('helvetica', 'normal');
  setColor(doc, [50, 50, 60], 'text');
  const lines = doc.splitTextToSize(libellesJoints, CONTENT_W - 18);
  doc.text(lines, MARGIN + 16, cur.y);

  cur.move(lines.length * 5 + 4);
  drawSeparator(doc, cur);
}

// ─── Un segment de vol + son tarif associé ───────────────────────────
function drawEmiSegmentWithFare(
  doc: jsPDF,
  cur: Cursor,
  l: DevisLigne,
  idx: number,
  total: number,
  design: PdfDesign,
) {
  checkPage(doc, cur, 70, design);

  const accentLine = design.colors.accentLine as [number, number, number];
  const headerBg   = design.colors.headerBg   as [number, number, number];

  // ── Label section ─────────────────────────────────────────────────
  setColor(doc, accentLine, 'fill');
  doc.rect(MARGIN, cur.y - 1, 2, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, accentLine, 'text');
  doc.text(`DEVIS DU VOL ${idx + 1} / ${total}`, MARGIN + 5, cur.y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [160, 160, 160], 'text');
  doc.text(sanitize(l.itineraire ?? ''), MARGIN + 35, cur.y + 6);
  cur.move(13);

  // ── Split itinéraire ─────────────────────────────────────────────
  const raw    = l.itineraire ?? '';
  const parts  = raw.includes('\u2192') ? raw.split('\u2192') : raw.split('-');
  const codeD  = sanitize(parts[0]?.trim() ?? '-');
  const codeA  = sanitize(parts[1]?.trim() ?? '-');

  // ── Calcul hauteur totale du bloc ────────────────────────────────
  const iataH  = 26;
  const metaH  = 13;
  const fareH  = 16;
  const totalH = iataH + metaH + fareH;

  // ═══════════════════════════════════════════════════════════════
  // BORDURE UNIQUE autour de tout le bloc
  // ═══════════════════════════════════════════════════════════════
  const blockY = cur.y;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN - 2, blockY, CONTENT_W + 4, totalH, 'FD');

  // ── ZONE 1 : IATA + horaires ──────────────────────────────────
  // Départ gauche
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(codeD, MARGIN + 2, cur.y + 10);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [120, 120, 130], 'text');
  doc.text(fmt.time(l.dateHeureDepart), MARGIN + 2, cur.y + 16);
  doc.text(fmt.date(l.dateHeureDepart), MARGIN + 2, cur.y + 21);

  // Arrivée droite
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(codeA, MARGIN + CONTENT_W, cur.y + 10, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [120, 120, 130], 'text');
  doc.text(fmt.time(l.dateHeureArrive), MARGIN + CONTENT_W, cur.y + 16, { align: 'right' });
  doc.text(fmt.date(l.dateHeureArrive), MARGIN + CONTENT_W, cur.y + 21, { align: 'right' });

  // Ligne pointillée centrale
  const midX  = MARGIN + CONTENT_W / 2;
  const lineY = cur.y + 11;
  const x1    = MARGIN + 26;
  const x2    = MARGIN + CONTENT_W - 26;

  doc.setDrawColor(205, 207, 215);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(x1, lineY, x2, lineY);
  doc.setLineDashPattern([], 0);

  // Numéro vol + durée au centre
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(sanitize(l.numeroVol ?? '-'), midX, cur.y + 8, { align: 'center' });

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [150, 150, 160], 'text');
  doc.text(sanitize(l.dureeVol ?? '-'), midX, cur.y + 14, { align: 'center' });

  if (l.dureeEscale && l.dureeEscale !== '0' && l.dureeEscale !== '') {
    doc.setFontSize(5.5);
    setColor(doc, [0, 140, 210], 'text');
    doc.text(sanitize(`Escale : ${l.dureeEscale}`), midX, cur.y + 19, { align: 'center' });
  }

  cur.move(iataH);

  // ── Séparateur horizontal entre zones ────────────────────────────
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);

  // ── ZONE 2 : Métas sur fond gris très pâle ───────────────────────
  doc.setFillColor(246, 247, 249);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, metaH, 'F');

  const metas = [
    { label: 'AVION',          value: sanitize(l.avion ?? '-') },
    { label: 'CLASSE',         value: sanitize(l.classe ?? '-') },
    { label: 'PASSAGERS',      value: sanitize(`${l.nombre ?? 1} ${fmt.replace_(l.typePassager ?? '')}`) },
    { label: 'DESTINATION',    value: sanitize(l.destinationVoyage?.pays?.pays ?? l.destinationVoyage?.ville ?? '-') },
    { label: 'AEROPORT DEP.',  value: sanitize(l.aeroportDepart ?? '-') },
    { label: 'AEROPORT ARR.',  value: sanitize(l.aeroportArrivee ?? '-') },
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

  // ── Séparateur horizontal ─────────────────────────────────────────
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);

  // ── ZONE 3 : Tarif sur fond gris très pâle ───────────────────────
  doc.setFillColor(244, 246, 250);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, fareH, 'F');

  const totalLigne = (l.montantBilletClientAriary ?? 0) + (l.montantServiceClientAriary ?? 0);

  // Billet gauche
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('Billet', MARGIN + 3, cur.y + 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(fmt.ariary(l.montantBilletClientAriary ?? 0), MARGIN + 3, cur.y + 11);

  // Séparateur vertical
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(midX - 10, cur.y + 2, midX - 10, cur.y + fareH - 2);

  // Taxes centre
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('Taxes et services', midX, cur.y + 5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(fmt.ariary(l.montantServiceClientAriary ?? 0), midX, cur.y + 11, { align: 'center' });

  // Séparateur vertical
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.2);
  doc.line(midX + 30, cur.y + 2, midX + 30, cur.y + fareH - 2);

  // Sous-total droite
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [140, 140, 150], 'text');
  doc.text('SOUS-TOTAL', MARGIN + CONTENT_W - 2, cur.y + 5, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [26, 39, 68], 'text');
  doc.text(fmt.ariary(totalLigne), MARGIN + CONTENT_W - 2, cur.y + 12, { align: 'right' });

  cur.move(fareH);

  // ── Re-dessine la bordure extérieure par-dessus pour la netteté ──
  doc.setFillColor(0, 0, 0, 0);
  doc.setDrawColor(218, 220, 226);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN - 2, blockY, CONTENT_W + 4, totalH, 'D');

  drawSeparator(doc, cur);
}

// ─── Total général final ──────────────────────────────────────────────
function drawEmiTotal(
  doc: jsPDF,
  cur: Cursor,
  devis: DevisListItem,
  design: PdfDesign,
) {
  checkPage(doc, cur, 16, design);

  doc.setFillColor(...design.colors.headerBg);
  doc.rect(MARGIN - 2, cur.y, CONTENT_W + 4, 14, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, [160, 170, 200], 'text');
  doc.text('TOTAL GENERAL TTC', MARGIN + 3, cur.y + 9);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(doc, [255, 255, 255], 'text');
  doc.text(fmt.ariary(devis.totalGeneral), MARGIN + CONTENT_W, cur.y + 9, { align: 'right' });
  cur.move(20);
}

// ─── Footer Emirates ─────────────────────────────────────────────────
function drawEmiFooter(
  doc: jsPDF,
  cur: Cursor,
  devis: DevisListItem,
  design: PdfDesign,
  stamp?: string,
) {
  const PAGE_H = 297;
  const PAGE_W = 210;

  checkPage(doc, cur, 30, design);

  if (stamp) {
    const stampSize = 36;
    try {
      const format = stamp.startsWith('data:image/png') ? 'PNG'
        : stamp.startsWith('data:image/jpeg') || stamp.startsWith('data:image/jpg') ? 'JPEG'
        : 'PNG';
      doc.addImage(stamp, format, PAGE_W - MARGIN - stampSize, cur.y, stampSize, stampSize);
    } catch (e) {
      console.warn('Cachet non charge :', e);
    }
    cur.move(stampSize + 4);
  }

  doc.setDrawColor(0, 140, 210);
  doc.setLineWidth(0.8);
  doc.line(MARGIN - 2, cur.y, MARGIN + CONTENT_W + 2, cur.y);
  cur.move(5);

  const legal = sanitize(
    design.staticTexts?.footerLegal
      ?? `Ref. ${devis.reference} - ${fmt.replace_(devis.statut)} - Genere le ${fmt.date(new Date().toISOString())}`
  );

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  setColor(doc, [130, 130, 130], 'text');
  const legalLines = doc.splitTextToSize(legal, CONTENT_W);
  doc.text(legalLines, MARGIN, cur.y);
  cur.move(legalLines.length * 4 + 3);

  if (design.staticTexts?.footerContact) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [160, 160, 160], 'text');
    doc.text(
      sanitize(design.staticTexts.footerContact),
      MARGIN + CONTENT_W / 2,
      cur.y,
      { align: 'center' },
    );
    cur.move(6);
  }

  const n = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(doc, [180, 180, 180], 'text');
    doc.text(`Page ${i} / ${n}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
    doc.setFontSize(6.5);
    setColor(doc, [200, 200, 200], 'text');
    doc.text(sanitize(devis.reference), MARGIN, PAGE_H - 5);
  }
}

// ─────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────

export function generateDevisPdf(
  devis: DevisListItem,
  design: PdfDesign,
  audience: PdfAudience = 'client',
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean },
) {
  const doc       = new jsPDF({ unit: 'mm', format: 'a4' });
  const cur       = new Cursor();
  const ent       = devis.prospectionEntete;
  const lignes    = devis.prospectionLigne?.length
    ? devis.prospectionLigne
    : devis.data?.lignes ?? [];
  const exigences  = devis.data?.exigencesVoyage ?? [];
  const isDirection = audience === 'direction';
  const isEmirates  = design.id === 'emirates';

  drawWatermark(doc, design);

  // ── Header commun ─────────────────────────────────────────────────
  const docTitle = isDirection ? 'DEVIS - USAGE INTERNE' : 'DEVIS DE VOYAGE';
  drawHeader(doc, cur, docTitle, design, logo);

  // ── Métas / Références ────────────────────────────────────────────
  if (isEmirates) {
    drawEmiMeta(doc, cur, devis, design);

    // ── EXIGENCES EN HAUT — importantes, visibles dès la 1ère page ──
    drawEmiExigences(doc, cur, lignes, design);

    // ── SERVICES INCLUS — juste après les exigences ──────────────────
    drawEmiServices(doc, cur, lignes, design);

  } else {
    const baseRefs = [
      { label: 'N° Dossier',  value: sanitize(ent?.numeroEntete ?? devis.data?.entete?.numeroEntete ?? '-') },
      { label: 'N° Devis',    value: sanitize(devis.reference) },
      { label: 'Date',        value: fmt.date(devis.createdAt) },
      { label: 'Fournisseur', value: sanitize(ent?.fournisseur?.libelle ?? '-') },
      { label: 'Type vol',    value: sanitize(fmt.replace_(ent?.typeVol ?? '-')) },
      { label: 'Statut',      value: sanitize(fmt.replace_(devis.statut)) },
    ];
    const directionRefs = [
      { label: 'Commission proposee',  value: `${ent?.commissionPropose ?? '-'} %` },
      { label: 'Commission appliquee', value: `${ent?.commissionAppliquer ?? '-'} %` },
      { label: 'Mode paiement',        value: sanitize(lignes[0] ? fmt.replace_(lignes[0].modePaiement ?? '-') : '-') },
    ];
    drawKeyValues(doc, cur, isDirection ? [...baseRefs, ...directionRefs] : baseRefs);
    drawSeparator(doc, cur);
  }

  // ── Itinéraire + Tarif par vol (Emirates) ────────────────────────
  if (lignes.length > 0) {
    if (isEmirates) {
      // Chaque vol a son tarif juste en dessous
      lignes.forEach((l, i) =>
        drawEmiSegmentWithFare(doc, cur, l, i, lignes.length, design)
      );

      // Total général après tous les vols
      drawEmiTotal(doc, cur, devis, design);

    } else {
      // ── Thèmes classiques : itinéraire en tableau ─────────────────
      drawSectionTitle(doc, cur, 'ITINERAIRE', design);
      drawTable(doc, cur, design,
        [
          { label: 'Ref.',       width: 22 },
          { label: 'Vol',        width: 18 },
          { label: 'Itineraire', width: 38 },
          { label: 'Avion',      width: 18 },
          { label: 'Passager',   width: 16 },
          { label: 'Date',       width: 20 },
          { label: 'Depart',     width: 12 },
          { label: 'Arrivee',    width: 12 },
          { label: 'Duree',      width: 12 },
          { label: 'Dest.',      width: 16 },
        ],
        lignes.map(l => [
          sanitize(l.numeroDosRef ?? '-'),
          sanitize(l.numeroVol ?? '-'),
          sanitize(l.itineraire ?? '-'),
          sanitize(l.avion ?? '-'),
          sanitize(`${l.nombre ?? 1} ${l.typePassager ?? '-'}`),
          fmt.date(l.dateHeureDepart),
          fmt.time(l.dateHeureDepart),
          fmt.time(l.dateHeureArrive),
          sanitize(l.dureeVol ?? '-'),
          sanitize(l.destinationVoyage?.pays?.pays ?? l.destinationVoyage?.ville ?? '-'),
        ]),
      );

      // ── Tarification ─────────────────────────────────────────────
      if (isDirection) {
        drawSectionTitle(doc, cur, 'TARIFICATION DETAILLEE', design);
        drawTable(doc, cur, design,
          [
            { label: 'Classe',        width: 16 },
            { label: 'Devise',        width: 12 },
            { label: 'Taux',          width: 14 },
            { label: 'PU Cie Billet', width: 22 },
            { label: 'PU Cie Serv.',  width: 22 },
            { label: 'PU Cli Billet', width: 22 },
            { label: 'PU Cli Serv.',  width: 22 },
            { label: 'Commission',    width: 22 },
            { label: 'Total Cli Ar',  width: 22, align: 'right' },
          ],
          lignes.map(l => [
            sanitize(l.classe ?? '-'),
            sanitize(l.devise ?? '-'),
            fmt.number(l.tauxEchange ?? 0, 0),
            fmt.number(l.puBilletCompagnieDevise ?? 0),
            fmt.number(l.puServiceCompagnieDevise ?? 0),
            fmt.number(l.montantBilletClientDevise ?? 0),
            fmt.number(l.montantServiceClientDevise ?? 0),
            `${fmt.number(l.commissionEnDevise ?? 0)} ${sanitize(l.devise ?? '')}`,
            fmt.ariary(l.montantBilletClientAriary + l.montantServiceClientAriary),
          ]),
        );

        drawSectionTitle(doc, cur, 'RECAPITULATIF COMPAGNIE vs CLIENT', design);
        drawTable(doc, cur, design,
          [
            { label: 'Ligne',         width: 28 },
            { label: 'Mt Cie Billet', width: 30 },
            { label: 'Mt Cie Serv.',  width: 30 },
            { label: 'Mt Cli Billet', width: 30 },
            { label: 'Mt Cli Serv.',  width: 30 },
            { label: 'Marge Ar',      width: 26, align: 'right' },
          ],
          lignes.map(l => {
            const margeBillet  = (l.montantBilletClientAriary  ?? 0) - (l.montantBilletCompagnieAriary  ?? 0);
            const margeService = (l.montantServiceClientAriary ?? 0) - (l.montantServiceCompagnieAriary ?? 0);
            return [
              sanitize(l.numeroDosRef ?? '-'),
              fmt.ariary(l.montantBilletCompagnieAriary ?? 0),
              fmt.ariary(l.montantServiceCompagnieAriary ?? 0),
              fmt.ariary(l.montantBilletClientAriary ?? 0),
              fmt.ariary(l.montantServiceClientAriary ?? 0),
              fmt.ariary(margeBillet + margeService),
            ];
          }),
        );

        const totalCommission = lignes.reduce((sum, l) => sum + (l.commissionEnAriary ?? 0), 0);
        const totalMarge = lignes.reduce((sum, l) => {
          const margeBillet  = (l.montantBilletClientAriary  ?? 0) - (l.montantBilletCompagnieAriary  ?? 0);
          const margeService = (l.montantServiceClientAriary ?? 0) - (l.montantServiceCompagnieAriary ?? 0);
          return sum + margeBillet + margeService;
        }, 0);

        drawSectionTitle(doc, cur, 'SYNTHESE FINANCIERE', design);
        drawKeyValues(doc, cur, [
          { label: 'Total commission',  value: fmt.ariary(totalCommission) },
          { label: 'Marge totale',      value: fmt.ariary(totalMarge) },
          { label: 'Total facturation', value: fmt.ariary(devis.totalGeneral) },
        ]);
        drawSeparator(doc, cur);

      } else {
        drawSectionTitle(doc, cur, 'CONDITIONS TARIFAIRES', design);
        drawTable(doc, cur, design,
          [
            { label: 'Classe',       width: 20 },
            { label: 'Type',         width: 16 },
            { label: 'Nb',           width: 10 },
            { label: 'Devise',       width: 14 },
            { label: 'Taux',         width: 16 },
            { label: 'PU Billet',    width: 22 },
            { label: 'PU Service',   width: 22 },
            { label: 'Mt Billet Ar', width: 28, align: 'right' },
            { label: 'Mt Serv. Ar',  width: 26, align: 'right' },
          ],
          lignes.map(l => [
            sanitize(l.classe ?? '-'),
            sanitize(l.typePassager ?? '-'),
            String(l.nombre ?? 1),
            sanitize(l.devise ?? '-'),
            fmt.number(l.tauxEchange ?? 0, 0),
            fmt.number(l.puBilletCompagnieDevise ?? 0),
            fmt.number(l.puServiceCompagnieDevise ?? 0),
            fmt.ariary(l.montantBilletClientAriary ?? 0),
            fmt.ariary(l.montantServiceClientAriary ?? 0),
          ]),
        );
      }
    }
  }

  // ── Services (thèmes classiques, client uniquement) ───────────────
  if (!isEmirates && !isDirection) {
    const services = lignes[0]?.serviceProspectionLigne ?? [];
    if (services.length > 0) {
      drawSectionTitle(doc, cur, 'SERVICES', design);
      checkPage(doc, cur, 24, design);
      const colW = CONTENT_W / Math.min(services.length, 9);
      doc.setFontSize(7.5);
      services.forEach((s, i) => {
        const cx         = MARGIN + i * colW;
        const isOui      = s.valeur === 'true';
        const valDisplay = s.valeur === 'true' ? 'Oui'
          : s.valeur === 'false' ? 'Non'
          : sanitize(s.valeur);
        doc.setFont('helvetica', 'normal');
        setColor(doc, [90, 90, 90], 'text');
        doc.text(sanitize(s.serviceSpecifique?.libelle ?? '-'), cx, cur.y);
        setColor(
          doc,
          isOui ? [34, 130, 84] : s.valeur === 'false' ? [180, 30, 30] : [80, 80, 180],
          'text',
        );
        doc.setFont('helvetica', 'bold');
        doc.text(valDisplay, cx, cur.y + 7);
      });
      cur.move(18);
      drawSeparator(doc, cur);
    }
  }

  // ── Services direction (thèmes classiques uniquement) ─────────────
  if (!isEmirates && isDirection) {
    const allServices = lignes.flatMap(l =>
      (l.serviceProspectionLigne ?? []).map(s => ({
        ligne:   sanitize(l.numeroDosRef ?? '-'),
        libelle: sanitize(s.serviceSpecifique?.libelle ?? '-'),
        type:    sanitize(s.serviceSpecifique?.type ?? '-'),
        valeur:  s.valeur === 'true' ? 'Oui' : s.valeur === 'false' ? 'Non' : sanitize(s.valeur),
      })),
    );
    if (allServices.length > 0) {
      drawSectionTitle(doc, cur, 'DETAIL DES SERVICES', design);
      drawTable(doc, cur, design,
        [
          { label: 'Ligne',   width: 30 },
          { label: 'Service', width: 60 },
          { label: 'Type',    width: 40 },
          { label: 'Valeur',  width: 44 },
        ],
        allServices.map(s => [s.ligne, s.libelle, s.type, s.valeur]),
      );
    }
  }

  // ── Exigences (thèmes classiques, client uniquement) ──────────────
  if (!isEmirates && !isDirection && exigences.length > 0) {
    drawSectionTitle(doc, cur, 'EXIGENCES DE VOYAGEssss', design);
    doc.setFontSize(7.5);
    exigences.forEach(e => {
      checkPage(doc, cur, 7, design);
      doc.setFont('helvetica', 'bold');
      setColor(doc, [30, 30, 30], 'text');
      doc.text(sanitize(e.type), MARGIN, cur.y);
      doc.setFont('helvetica', 'normal');
      setColor(doc, [60, 60, 60], 'text');
      doc.text(sanitize(e.description), MARGIN + 42, cur.y);
      doc.text(sanitize(e.perimetre), MARGIN + 120, cur.y);
      cur.move(7);
    });
    cur.move(6);
  }

  // ── Footer ────────────────────────────────────────────────────────
  if (isEmirates) {
    drawEmiFooter(doc, cur, devis, design, stamp);
  } else {
    const totalLabel = isDirection ? 'TOTAL FACTURATION :' : 'TOTAL GENERAL :';
    const note = isDirection
      ? `Document confidentiel - Usage interne uniquement - ${fmt.date(new Date().toISOString())}`
      : `Ref. ${sanitize(devis.reference)} - ${sanitize(fmt.replace_(devis.statut))} - Genere le ${fmt.date(new Date().toISOString())}`;
    drawFooter(doc, cur, totalLabel, fmt.ariary(devis.totalGeneral), note, design, stamp);
  }

  if (options?.returnDoc) return doc;
  doc.save(filename ?? `${devis.reference}${isDirection ? '_direction' : ''}.pdf`);
}