import jsPDF from 'jspdf';
import type { PdfDesign, PdfAudience } from '../types/pdf-design.types';
import type { VisaDevisDetail, VisaProspectionLigne } from '../types/visa.types';
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

export const generateVisaPdf = (
  data: VisaDevisDetail,
  audience: PdfAudience,
  design: PdfDesign,
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cursor = new Cursor();
  const isDirection = audience === 'direction';

  drawWatermark(doc, design);

  // ── Header ───────────────────────────────────────────────────────
  drawHeader(
    doc, cursor,
    isDirection ? 'DEVIS VISA — DIRECTION' : 'DEVIS VISA',
    design,
    logo
  );

  // ── Infos générales ──────────────────────────────────────────────
  const { devis, prospectionVisa, visaProspectionLignes, suivi } = data;

  drawKeyValues(doc, cursor, [
    { label: 'Référence',     value: devis.reference },
    { label: 'Dossier',       value: prospectionVisa.prestation.numeroDos },
    { label: 'Client facturé',value: prospectionVisa.clientFacture },
    { label: 'Consulat',      value: prospectionVisa.consulat.nom },
    { label: 'Statut devis',  value: fmt.replace_(devis.statut) },
    { label: 'Date création', value: fmt.date(devis.createdAt) },
    // Direction uniquement
    ...(isDirection ? [
      { label: 'Évolution',        value: fmt.replace_(suivi.evolution) },
      { label: 'Date envoi',       value: suivi.dateEnvoieDevis  ? fmt.date(suivi.dateEnvoieDevis)  : '—' },
      { label: 'Date approbation', value: suivi.dateApprobation  ? fmt.date(suivi.dateApprobation)  : '—' },
    ] : []),
  ]);

  drawSeparator(doc, cursor);

  // ── Lignes ───────────────────────────────────────────────────────
  drawSectionTitle(doc, cursor, 'DÉTAIL DES LIGNES', design);

  if (isDirection) {
    _drawTableDirection(doc, cursor, design, visaProspectionLignes);
  } else {
    _drawTableClient(doc, cursor, design, visaProspectionLignes);
  }

  // ── Synthèse direction ───────────────────────────────────────────
  if (isDirection) {
    drawSeparator(doc, cursor);
    drawSectionTitle(doc, cursor, 'SYNTHÈSE FINANCIÈRE', design);

    const totalConsulatAr  = visaProspectionLignes.reduce((s, l) => s + l.montantTotalConsulatAriary, 0);
    const totalCommissionAr = visaProspectionLignes.reduce((s, l) => s + l.commissionAriary, 0);
    const totalClientAr    = visaProspectionLignes.reduce((s, l) => s + l.montantTotalClientAriary, 0);
    const totalConsulatDev  = visaProspectionLignes.reduce((s, l) => s + l.montantTotalConsulatDevise, 0);
    const totalClientDev   = visaProspectionLignes.reduce((s, l) => s + l.montantTotalClientDevise, 0);
    const devise           = visaProspectionLignes[0]?.devise ?? '';

    drawKeyValues(doc, cursor, [
      { label: 'Total consulat',   value: `${fmt.number(totalConsulatDev)} ${devise}  =  ${fmt.ariary(totalConsulatAr)}` },
      { label: 'Total commission', value: fmt.ariary(totalCommissionAr) },
      { label: 'Total client',     value: `${fmt.number(totalClientDev)} ${devise}  =  ${fmt.ariary(totalClientAr)}` },
    ]);
  }

  // ── Footer ───────────────────────────────────────────────────────
  drawFooter(
    doc, cursor,
    isDirection ? 'TOTAL FACTURATION :' : 'TOTAL GÉNÉRAL :',
    fmt.ariary(devis.totalGeneral),
    isDirection
      ? `Document confidentiel — Usage interne — ${fmt.date(new Date().toISOString())}`
      : `Réf. ${devis.reference} — Généré le ${fmt.date(new Date().toISOString())}`,
    design,
    stamp
  );

  if (options?.returnDoc) return doc;
  doc.save(
    filename ??
    `visa-${devis.reference}${isDirection ? '-direction' : '-client'}.pdf`
  );
};

// ─── Tableau direction — tout affiché ────────────────────────────────

// ─── Tableau direction ────────────────────────────────────────────────

function _drawTableDirection(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  lignes: VisaProspectionLigne[]
): void {
  drawTable(doc, cursor, design,
    [
      { label: 'Pays / Type',      width: 30 },
      { label: 'Période',          width: 30 },
      { label: 'Nb',               width: 8  },
      { label: 'Consulat',         width: 22 },
      { label: 'PU Consulat',      width: 22 },
      { label: 'Commission',       width: 22 },
      { label: 'PU Client',        width: 18 },
      { label: 'Total Client Ar',  width: 18, align: 'right' },
    ],
    lignes.map((l) => [
      `${l.visaParams?.pays?.pays ?? '—'} — ${l.visaParams?.visaType?.nom ?? '—'}`,
      `${fmt.date(l.dateDepart)} → ${fmt.date(l.dateRetour)}`,
      String(l.nombre),
      l.consulat?.nom ?? '—',                          // ← fix
      `${fmt.number(l.puConsulatDevise)} ${l.devise}`,
      fmt.ariary(l.commissionAriary),
      `${fmt.number(l.puClientDevise)} ${l.devise}`,
      fmt.ariary(l.montantTotalClientAriary),
    ])
  );
}

// ─── Tableau client ───────────────────────────────────────────────────

function _drawTableClient(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  lignes: VisaProspectionLigne[]
): void {
  drawTable(doc, cursor, design,
    [
      { label: 'Pays / Type',     width: 36 },
      { label: 'Période',         width: 36 },
      { label: 'Nb pers.',        width: 14 },
      { label: 'Consulat',        width: 26 },
      { label: 'PU Client',       width: 24 },
      { label: 'Total (Ar)',      width: 34, align: 'right' },
    ],
    lignes.map((l) => [
      `${l.visaParams?.pays?.pays ?? '—'} — ${l.visaParams?.visaType?.nom ?? '—'}`,
      `${fmt.date(l.dateDepart)} → ${fmt.date(l.dateRetour)}`,
      String(l.nombre),
      l.consulat?.nom ?? '—',                          // ← fix
      `${fmt.number(l.puClientDevise)} ${l.devise}`,
      fmt.ariary(l.montantTotalClientAriary),
    ])
  );
}