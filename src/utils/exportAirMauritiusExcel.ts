import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface AirMauritiusExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;
  gsaOffice: string;
  periodeLabelVente: string;
  periodeLabelRefund: string;
  currency?: string;
  statutAnnule?: string;
}

const GREY_HEADER: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
const THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' },
  bottom: { style: 'thin' }, right: { style: 'thin' },
};
const THICK: Partial<ExcelJS.Borders> = {
  top: { style: 'medium' }, left: { style: 'medium' },
  bottom: { style: 'medium' }, right: { style: 'medium' },
};

const setCell = (
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: any,
  opts?: { bold?: boolean; align?: Partial<ExcelJS.Alignment>; numFmt?: string; fill?: ExcelJS.Fill; border?: Partial<ExcelJS.Borders>; underline?: boolean }
) => {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  cell.font = { bold: opts?.bold, underline: opts?.underline };
  if (opts?.fill) cell.fill = opts.fill;
  if (opts?.align) cell.alignment = opts.align;
  if (opts?.numFmt) cell.numFmt = opts.numFmt;
  cell.border = opts?.border ?? THIN;
  return cell;
};

function getPassengerName(l: EtatVenteLigne): string {
  return (
    l.clientBeneficiaire
      ?.flatMap((cb) => cb.clientbeneficiaireInfo?.map((info) => `${info.prenom} ${info.nom}`.trim().toUpperCase()) ?? [])
      .filter(Boolean)
      .join(', ') || ''
  );
}

function getTicketNumbers(l: EtatVenteLigne): string {
  return (
    l.clientBeneficiaire
      ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((i) => i.billet.map((b) => b.numeroBillet)) ?? [])
      .filter(Boolean)
      .join(', ') || ''
  );
}

// ─── En-tête commun ──
function buildHeader(sheet: ExcelJS.Worksheet, annexe: string, titre: string, gsaOffice: string, periodeLabel: string, currency: string, lastCol: number): number {
  let row = 1;

  sheet.mergeCells(row, lastCol - 1, row, lastCol);
  setCell(sheet, row, lastCol - 1, annexe, { bold: true, align: { horizontal: 'right' }, border: {} });
  row++;

  sheet.mergeCells(row, 1, row, lastCol - 2);
  setCell(sheet, row, 1, titre, { bold: true, align: { horizontal: 'center' }, border: {} });
  row += 2;

  setCell(sheet, row, 1, 'GSA OFFICE :', { border: {} });
  sheet.mergeCells(row, 2, row, 4);
  setCell(sheet, row, 2, gsaOffice.toUpperCase(), { bold: true, underline: true, border: {} });
  sheet.mergeCells(row, lastCol - 1, row, lastCol);
  setCell(sheet, row, lastCol - 1, 'PAGE : 1 of 1', { border: {} });
  row += 2;

  setCell(sheet, row, 1, 'PERIOD :', { border: {} });
  sheet.mergeCells(row, 2, row, 4);
  setCell(sheet, row, 2, periodeLabel.toUpperCase(), { bold: true, underline: true, border: {} });
  sheet.mergeCells(row, lastCol - 1, row, lastCol);
  setCell(sheet, row, lastCol - 1, `CURRENCY: ${currency}`, { border: {} });
  row += 2;

  return row;
}

// ─── Onglet VENTES (Passenger Sales Report) — 8 colonnes ──
function buildVentesSheet(
  workbook: ExcelJS.Workbook,
  data: EtatVenteLigne[],
  gsaOffice: string,
  periodeLabel: string,
  currency: string
) {
  const sheet = workbook.addWorksheet('Ventes');
  sheet.columns = [
    { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 },
  ];

  let row = buildHeader(sheet, 'ANNEX 1', 'PASSENGER SALES REPORT', gsaOffice, periodeLabel, currency, 8);

  const headers = ['TICKET / MCO No.', 'ISSUE DATE', 'FARE', 'TAX', 'COMM.', 'VAT', 'TOTAL', 'REMARKS'];
  headers.forEach((h, i) => {
    setCell(sheet, row, i + 1, h, { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  });
  row++;

  const firstDataRow = row;

  data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime())
    .forEach((l) => {
      const fare = l.fcCAriary - l.montantTaxeAriary;
      setCell(sheet, row, 1, getTicketNumbers(l), { align: { horizontal: 'center' } });
      setCell(sheet, row, 2, new Date(l.dateTransaction), { numFmt: 'd/m/yy', align: { horizontal: 'center' } });
      setCell(sheet, row, 3, fare, { numFmt: '#,##0', align: { horizontal: 'right' } });
      setCell(sheet, row, 4, l.montantTaxeAriary, { numFmt: '#,##0', align: { horizontal: 'right' } });
      setCell(sheet, row, 5, l.commission, { numFmt: '#,##0', align: { horizontal: 'right' } });
      setCell(sheet, row, 6, '', { align: { horizontal: 'right' } });
      setCell(sheet, row, 7, { formula: `C${row}+D${row}` }, { numFmt: '#,##0', align: { horizontal: 'right' } });
      setCell(sheet, row, 8, '');
      row++;
    });

  const lastDataRow = Math.max(row - 1, firstDataRow);

  setCell(sheet, row, 1, 'TOTAL', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  sheet.mergeCells(row, 1, row, 2);
  setCell(sheet, row, 3, { formula: `SUM(C${firstDataRow}:C${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 4, { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 5, { formula: `SUM(E${firstDataRow}:E${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 6, '', { fill: GREY_HEADER, border: THICK });
  setCell(sheet, row, 7, { formula: `SUM(G${firstDataRow}:G${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 8, '', { fill: GREY_HEADER, border: THICK });
}

// ─── Onglet REMBOURSEMENT (Refund Report) — 8 colonnes propres ──
// 1 Ticket/MCO No | 2 Cpn No | 3 Gross Refund | 4 Commission | 5 Tax | 6 Cancellation Fee | 7 Net Refund | 8 Remarks
function buildRefundSheet(
  workbook: ExcelJS.Workbook,
  data: EtatVenteLigne[],
  gsaOffice: string,
  periodeLabel: string,
  currency: string
) {
  const sheet = workbook.addWorksheet('Remboursement');
  sheet.columns = [
    { width: 18 }, { width: 8 }, { width: 14 }, { width: 14 },
    { width: 12 }, { width: 16 }, { width: 14 }, { width: 24 },
  ];

  let row = buildHeader(sheet, 'ANNEX 2', 'REFUND REPORT', gsaOffice, periodeLabel, currency, 8);

  // ── Bandeau groupes (ligne du haut) ──
  sheet.mergeCells(row, 1, row + 1, 1);
  setCell(sheet, row, 1, 'DOCUMENTS REF.', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  sheet.mergeCells(row, 2, row + 1, 2);
  setCell(sheet, row, 2, 'Cpn No.', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  sheet.mergeCells(row, 3, row, 7);
  setCell(sheet, row, 3, 'REFUND DETAILS', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  sheet.mergeCells(row, 8, row + 1, 8);
  setCell(sheet, row, 8, 'REMARKS', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  row++;

  // ── Sous-en-têtes (ligne du bas) ──
  const subHeaders = ['Gross Refund', 'Commission Amount', 'Tax Amount', 'Cancellation Fee', 'Net Refund Amount'];
  subHeaders.forEach((h, i) => {
    setCell(sheet, row, 3 + i, h, { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  });
  row++;

  const firstDataRow = row;

  data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime())
    .forEach((l) => {
      const gross = l.fcCAriary - l.montantTaxeAriary;
      setCell(sheet, row, 1, getTicketNumbers(l), { align: { horizontal: 'center' } });
      setCell(sheet, row, 2, '', { align: { horizontal: 'center' } });
      setCell(sheet, row, 3, gross, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 4, l.commission, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 5, 0, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 6, 0, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 7, { formula: `C${row}-D${row}` }, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 8, getPassengerName(l));
      row++;
    });

  const lastDataRow = Math.max(row - 1, firstDataRow);

  setCell(sheet, row, 1, 'Total', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  setCell(sheet, row, 2, '', { fill: GREY_HEADER, border: THICK });
  setCell(sheet, row, 3, { formula: `SUM(C${firstDataRow}:C${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0.00', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 4, { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0.00', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 5, { formula: `SUM(E${firstDataRow}:E${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0.00', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 6, { formula: `SUM(F${firstDataRow}:F${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0.00', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 7, { formula: `SUM(G${firstDataRow}:G${lastDataRow})` }, { bold: true, fill: GREY_HEADER, numFmt: '#,##0.00', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 8, '', { fill: GREY_HEADER, border: THICK });
}

// ─── Export principal ──
export async function exportAirMauritiusExcel(opts: AirMauritiusExportOptions) {
  const {
    lignes,
    fournisseurNom,
    gsaOffice,
    periodeLabelVente,
    periodeLabelRefund,
    currency = 'MGA',
    statutAnnule = 'annuler',
  } = opts;

  const dataFournisseur = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const ventesData = dataFournisseur.filter((l) => l.statutTransaction !== statutAnnule);
  const refundData = dataFournisseur.filter((l) => l.statutTransaction === statutAnnule);

  const workbook = new ExcelJS.Workbook();

  buildVentesSheet(workbook, ventesData, gsaOffice, periodeLabelVente, currency);
  buildRefundSheet(workbook, refundData, gsaOffice, periodeLabelRefund, currency);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Rapport_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}