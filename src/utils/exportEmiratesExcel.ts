import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface EmiratesExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;   // filtre exact sur fournisseur.libelle, ex: "Emirates"
  periodeLabel: string;     // ex: "16.01.2026 AU 31.01.2026"
  agenceNom: string;        // ex: "AL BOURAQ TRAVEL"
  currency?: string;        // défaut "MGA"
  statutAnnule?: string;    // défaut "annuler"
  minEmptyRows?: number;    // défaut 5, lignes vides de remplissage sur remboursements
}

const RED_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8442B' } };
const CYAN_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFFF' } };
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
  opts?: { bold?: boolean; italic?: boolean; color?: string; fill?: ExcelJS.Fill; align?: Partial<ExcelJS.Alignment>; numFmt?: string; border?: Partial<ExcelJS.Borders> }
) => {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  cell.font = { bold: opts?.bold, italic: opts?.italic, color: opts?.color ? { argb: opts.color } : undefined };
  if (opts?.fill) cell.fill = opts.fill;
  if (opts?.align) cell.alignment = opts.align;
  if (opts?.numFmt) cell.numFmt = opts.numFmt;
  cell.border = opts?.border ?? THIN;
  return cell;
};

function getTicketNumbers(l: EtatVenteLigne): string {
  return (
    l.clientBeneficiaire
      ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((i) => i.billet.map((b) => b.numeroBillet)) ?? [])
      .filter(Boolean)
      .join(', ') || ''
  );
}

// ─── En-tête commun ──
function buildHeader(sheet: ExcelJS.Worksheet, fournisseurNom: string, periodeLabel: string, agenceNom: string): number {
  let row = 1;

  setCell(sheet, row, 1, 'Compagnie :', { bold: true, border: {} });
  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, fournisseurNom.toUpperCase(), { bold: true, align: { horizontal: 'center' }, fill: RED_FILL, color: 'FFFFFFFF', border: {} });
  row++;

  setCell(sheet, row, 1, 'Période :', { bold: true, border: {} });
  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, periodeLabel.toUpperCase(), { bold: true, align: { horizontal: 'center' }, fill: RED_FILL, color: 'FFFFFFFF', border: {} });
  row++;

  setCell(sheet, row, 1, 'Agence :', { bold: true, border: {} });
  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, `"${agenceNom.toUpperCase()}"`, { bold: true, align: { horizontal: 'center' }, fill: RED_FILL, color: 'FFFFFFFF', border: {} });
  row += 3;

  return row;
}

// ─── Onglet VENTES (une ligne par billet, pas annulé) ──
function buildVentesSheet(
  workbook: ExcelJS.Workbook,
  data: EtatVenteLigne[],
  fournisseurNom: string,
  periodeLabel: string,
  agenceNom: string
) {
  const sheet = workbook.addWorksheet('Ventes');
  sheet.columns = [{ width: 20 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 20 }];

  let row = buildHeader(sheet, fournisseurNom, periodeLabel, agenceNom);

  // ── En-tête tableau ──
  setCell(sheet, row, 1, 'Ticket No', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 2, 'FARE', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 3, 'TAX', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 4, 'TOTAL', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 5, 'Observations', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  row++;

  setCell(sheet, row, 4, 'TTC MGA', { bold: true, color: 'FFFF0000', fill: CYAN_FILL, align: { horizontal: 'center' }, border: THICK });
  for (const c of [1, 2, 3, 5]) sheet.getCell(row, c).fill = CYAN_FILL, sheet.getCell(row, c).border = THICK;
  row++;

  const firstDataRow = row;
  const fareCells: string[] = [];
  const taxCells: string[] = [];
  const totalCells: string[] = [];

  data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime())
    .forEach((l) => {
      setCell(sheet, row, 1, getTicketNumbers(l), { bold: true });
      setCell(sheet, row, 2, l.fcCAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 3, l.montantTaxeAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 4, { formula: `B${row}+C${row}` }, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 5, '');

      fareCells.push(`B${row}`);
      taxCells.push(`C${row}`);
      totalCells.push(`D${row}`);
      row++;
    });

  const lastDataRow = row - 1;

  setCell(sheet, row, 2, { formula: `SUM(B${firstDataRow}:B${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 3, { formula: `SUM(C${firstDataRow}:C${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 4, { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  sheet.getCell(row, 1).border = THICK;
  sheet.getCell(row, 5).border = THICK;
}

// ─── Onglet REMBOURSEMENTS (statutTransaction annulé, montants négatifs) ──
function buildRemboursementsSheet(
  workbook: ExcelJS.Workbook,
  data: EtatVenteLigne[],
  fournisseurNom: string,
  periodeLabel: string,
  agenceNom: string,
  minEmptyRows: number
) {
  const sheet = workbook.addWorksheet('Remboursements');
  sheet.columns = [{ width: 20 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 24 }];

  let row = buildHeader(sheet, fournisseurNom, periodeLabel, agenceNom);

  setCell(sheet, row, 1, 'Ticket No', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 2, 'FARE', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 3, 'TAX', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 4, 'PENALITES', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 5, 'TOTAL', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  setCell(sheet, row, 6, 'Observations', { bold: true, fill: CYAN_FILL, align: { horizontal: 'center', vertical: 'middle' }, border: THICK });
  row++;

  setCell(sheet, row, 5, 'TTC MGA', { bold: true, color: 'FFFF0000', fill: CYAN_FILL, align: { horizontal: 'center' }, border: THICK });
  for (const c of [1, 2, 3, 4, 6]) sheet.getCell(row, c).fill = CYAN_FILL, sheet.getCell(row, c).border = THICK;
  row++;

  const firstDataRow = row;
  const sorted = data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime());

  sorted.forEach((l) => {
    setCell(sheet, row, 1, getTicketNumbers(l));
    setCell(sheet, row, 2, -l.fcCAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
    setCell(sheet, row, 3, l.montantTaxeAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
    setCell(sheet, row, 4, 0, { numFmt: '#,##0.00', align: { horizontal: 'right' } }); // pas de donnée PENALITES
    setCell(sheet, row, 5, { formula: `B${row}+C${row}-D${row}` }, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
    setCell(sheet, row, 6, ''); // pas de donnée Observations
    row++;
  });

  // lignes vides de remplissage, comme sur le modèle
  for (let i = sorted.length; i < minEmptyRows; i++) {
    for (let c = 1; c <= 6; c++) sheet.getCell(row, c).border = THIN;
    row++;
  }

  const lastDataRow = row - 1;

  setCell(sheet, row, 2, { formula: `SUM(B${firstDataRow}:B${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 3, { formula: `SUM(C${firstDataRow}:C${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 4, { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 5, { formula: `SUM(E${firstDataRow}:E${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  sheet.getCell(row, 1).border = THICK;
  sheet.getCell(row, 6).border = THICK;
}

// ─── Export principal ──
export async function exportEmiratesExcel(opts: EmiratesExportOptions) {
  const {
    lignes,
    fournisseurNom,
    periodeLabel,
    agenceNom,
    statutAnnule = 'annuler',
    minEmptyRows = 5,
  } = opts;

  const dataFournisseur = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const ventesData = dataFournisseur.filter((l) => l.statutTransaction !== statutAnnule);
  const remboursementsData = dataFournisseur.filter((l) => l.statutTransaction === statutAnnule);

  const workbook = new ExcelJS.Workbook();

  buildVentesSheet(workbook, ventesData, fournisseurNom, periodeLabel, agenceNom);
  buildRemboursementsSheet(workbook, remboursementsData, fournisseurNom, periodeLabel, agenceNom, minEmptyRows);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Rapport_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}