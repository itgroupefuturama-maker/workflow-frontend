import jsPDF from 'jspdf';
import type { PdfDesign, PdfAudience } from '../types/pdf-design.types';
import type {
  AssuranceDevisDetail,
  AssuranceProspectionLigne,
} from '../types/assurance.types';
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

export const generateAssurancePdf = (
  data: AssuranceDevisDetail,
  audience: PdfAudience,
  design: PdfDesign,
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cursor = new Cursor();

  drawWatermark(doc, design);

  const isDirection = audience === 'direction';

  // ── Header ───────────────────────────────────────────────────────
  const docTitle = isDirection
    ? 'DEVIS ASSURANCE — DIRECTION'
    : 'DEVIS ASSURANCE';
  drawHeader(doc, cursor, docTitle, design, logo);

  // ── Infos générales ──────────────────────────────────────────────
  const { devis, prospectionAssurance, assuranceProspectionLignes, suivi } = data;

  drawKeyValues(doc, cursor, [
    { label: 'Référence',       value: devis.reference },
    { label: 'Dossier',         value: prospectionAssurance.prestation.numeroDos },
    { label: 'Client facturé',  value: prospectionAssurance.clientFacture },
    { label: 'Fournisseur',     value: `${prospectionAssurance.fournisseur.libelle} (${prospectionAssurance.fournisseur.code})` },
    { label: 'Statut devis',    value: fmt.replace_(devis.statut) },
    { label: 'Date création',   value: fmt.date(devis.createdAt) },
    // Direction uniquement — suivi
    ...(isDirection ? [
      { label: 'Évolution',       value: fmt.replace_(suivi.evolution) },
      { label: 'Date envoi',      value: suivi.dateEnvoieDevis ? fmt.date(suivi.dateEnvoieDevis) : '—' },
      { label: 'Date approbation',value: suivi.dateApprobation ? fmt.date(suivi.dateApprobation) : '—' },
    ] : []),
  ]);

  drawSeparator(doc, cursor);

  // ── Lignes ───────────────────────────────────────────────────────
  drawSectionTitle(doc, cursor, 'DÉTAIL DES LIGNES', design);

  if (isDirection) {
    _drawTableDirection(doc, cursor, design, assuranceProspectionLignes);
  } else {
    _drawTableClient(doc, cursor, design, assuranceProspectionLignes);
  }

  // ── Synthèse direction ───────────────────────────────────────────
  if (isDirection) {
    drawSeparator(doc, cursor);
    drawSectionTitle(doc, cursor, 'SYNTHÈSE FINANCIÈRE', design);

    const totalAssureurAr  = assuranceProspectionLignes.reduce((s, l) => s + l.assuranceTarifPlein.prixAssureurAriary, 0);
    const totalCommissionAr = assuranceProspectionLignes.reduce((s, l) => s + l.assuranceTarifPlein.commissionAriary, 0);
    const totalClientAr    = assuranceProspectionLignes.reduce((s, l) => s + l.assuranceTarifPlein.prixClientAriary, 0);

    const totalAssureurDev  = assuranceProspectionLignes.reduce((s, l) => s + l.assuranceTarifPlein.prixAssureurDevise, 0);
    const totalCommissionDev = assuranceProspectionLignes.reduce((s, l) => s + l.assuranceTarifPlein.commissionDevise, 0);
    const totalClientDev    = assuranceProspectionLignes.reduce((s, l) => s + l.assuranceTarifPlein.prixClientDevise, 0);

    // Devise de référence — on prend la 1ère ligne
    const devise = assuranceProspectionLignes[0]?.assuranceTarifPlein.devise ?? '';

    drawKeyValues(doc, cursor, [
      { label: 'Total prix assureur', value: `${fmt.number(totalAssureurDev)} ${devise}  =  ${fmt.ariary(totalAssureurAr)}` },
      { label: 'Total commission',    value: `${fmt.number(totalCommissionDev)} ${devise}  =  ${fmt.ariary(totalCommissionAr)}` },
      { label: 'Total client',        value: `${fmt.number(totalClientDev)} ${devise}  =  ${fmt.ariary(totalClientAr)}` },
    ]);
  }

  // ── Footer ───────────────────────────────────────────────────────
  const note = isDirection
    ? `Document confidentiel — Usage interne — ${fmt.date(new Date().toISOString())}`
    : `Réf. ${devis.reference} — Généré le ${fmt.date(new Date().toISOString())}`;

  drawFooter(
    doc, cursor,
    isDirection ? 'TOTAL FACTURATION :' : 'TOTAL GÉNÉRAL :',
    fmt.ariary(devis.totalGeneral),
    note,
    design,
    stamp
  );

  if (options?.returnDoc) return doc;
  doc.save(
    filename ??
    `assurance-${devis.reference}${isDirection ? '-direction' : '-client'}.pdf`
  );
};

// ─── Tableau direction — tout affiché ────────────────────────────────

function _drawTableDirection(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  lignes: AssuranceProspectionLigne[]
): void {
  drawTable(doc, cursor, design,
    [
      { label: 'Période',         width: 32 },
      { label: 'Durée',           width: 12 },
      { label: 'Zone',            width: 18 },
      { label: 'Devise',          width: 12 },
      { label: 'Taux',            width: 16 },
      { label: 'PU Assureur',     width: 20 },
      { label: 'Commission',      width: 20 },
      { label: 'PU Client Dev.',  width: 20 },
      { label: 'PU Client Ar',    width: 20, align: 'right' },
    ],
    lignes.map((l) => {
      const t = l.assuranceTarifPlein;
      return [
        `${fmt.date(l.dateDepart)} → ${fmt.date(l.dateRetour)}`,
        `${l.duree} j`,
        l.assuranceParams.zoneDestination,
        t.devise,
        fmt.number(l.tauxChange, 0),
        `${fmt.number(t.prixAssureurDevise)} ${t.devise}`,
        `${fmt.number(t.commissionDevise)} ${t.devise}`,
        `${fmt.number(t.prixClientDevise)} ${t.devise}`,
        fmt.ariary(t.prixClientAriary),
      ];
    })
  );
}

// ─── Tableau client — prix client uniquement ─────────────────────────

function _drawTableClient(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  lignes: AssuranceProspectionLigne[]
): void {
  drawTable(doc, cursor, design,
    [
      { label: 'Période',       width: 42 },
      { label: 'Durée',         width: 16 },
      { label: 'Zone',          width: 26 },
      { label: 'Devise',        width: 16 },
      { label: 'Prix Client',   width: 36 },
      { label: 'Total (Ar)',    width: 34, align: 'right' },
    ],
    lignes.map((l) => {
      const t = l.assuranceTarifPlein;
      return [
        `${fmt.date(l.dateDepart)} → ${fmt.date(l.dateRetour)}`,
        `${l.duree} j`,
        l.assuranceParams.zoneDestination,
        t.devise,
        `${fmt.number(t.prixClientDevise)} ${t.devise}`,
        fmt.ariary(t.prixClientAriary),
      ];
    })
  );
}