import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface EthiopianExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;   // filtre exact sur fournisseur.libelle, ex: "Ethiopian"
  periodeLabel: string;     // ex: "DU 08 AU 14 JANVIER 2025"
  agencyName?: string;      // défaut "AL BOURAQ"
  currency?: string;        // défaut "MGA"
}

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
  opts?: { bold?: boolean; align?: Partial<ExcelJS.Alignment>; numFmt?: string; border?: Partial<ExcelJS.Borders> }
) => {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  if (opts?.bold) cell.font = { bold: true };
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

export async function exportEthiopianExcel(opts: EthiopianExportOptions) {
  const {
    lignes,
    fournisseurNom,
    periodeLabel,
    agencyName = 'AL BOURAQ',
    currency = 'MGA',
  } = opts;

  const data = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Etat de vente');

  sheet.columns = [
    { width: 12 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 18 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 10 }, { width: 28 },
  ];

  let row = 1;

  // ── Titre ──
  sheet.mergeCells(row, 1, row, 11);
  setCell(sheet, row, 1, `ETAT DE VENTE ${periodeLabel.toUpperCase()}`, {
    bold: true, align: { horizontal: 'center' }, border: {},
  });
  row += 2;

  // ── En-tête colonnes ──
  const headers = [
    'PNR', 'TransactionID', 'Agency Name', 'Ticket Status', 'Transaction Currency',
    'Total Transaction Amount', 'BaseFare', 'Tax Detail', 'Commision', 'Fees', 'Passenger Name',
  ];
  headers.forEach((h, i) => {
    setCell(sheet, row, i + 1, h, { bold: true, border: THICK });
  });
  row++;

  const firstDataRow = row;
  const totalCells: string[] = [];
  const fareCells: string[] = [];
  const taxCells: string[] = [];
  const commCells: string[] = [];

  data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime())
    .forEach((l) => {
      setCell(sheet, row, 1, l.numDosCommun);
      setCell(sheet, row, 2, l.numDosPrestation);
      setCell(sheet, row, 3, agencyName);
      setCell(sheet, row, 4, l.statutTransaction || '');
      setCell(sheet, row, 5, currency);
      setCell(sheet, row, 6, { formula: `G${row}+H${row}` }, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 7, l.fcCAriary - l.montantTaxeAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 8, l.montantTaxeAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 9, -l.commission, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 10, '');
      setCell(sheet, row, 11, getPassengerName(l));

      totalCells.push(`F${row}`);
      fareCells.push(`G${row}`);
      taxCells.push(`H${row}`);
      commCells.push(`I${row}`);
      row++;
    });

  const lastDataRow = row - 1;

  // ── Ligne de totaux ──
  setCell(sheet, row, 6, { formula: `SUM(F${firstDataRow}:F${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 7, { formula: `SUM(G${firstDataRow}:G${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 8, { formula: `SUM(H${firstDataRow}:H${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  setCell(sheet, row, 9, { formula: `SUM(I${firstDataRow}:I${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  for (const c of [1, 2, 3, 4, 5, 10, 11]) sheet.getCell(row, c).border = THICK;
  const totalTableRow = row;
  row += 3;

  // ── Récapitulatif bas de page ──
  setCell(sheet, row, 1, 'TOTAL VENTE', { bold: true, border: THICK });
  sheet.mergeCells(row, 1, row, 2);
  setCell(sheet, row, 3, { formula: `F${totalTableRow}` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  row++;

  setCell(sheet, row, 1, 'COMMISSIONS', { bold: true, border: THICK });
  sheet.mergeCells(row, 1, row, 2);
  setCell(sheet, row, 3, { formula: `I${totalTableRow}` }, { bold: true, numFmt: '#,##0.00', border: THICK });
  row++;

  setCell(sheet, row, 1, 'TOTAL A PAYER', { bold: true, border: THICK });
  sheet.mergeCells(row, 1, row, 2);
  setCell(sheet, row, 3, { formula: `C${row - 2}+C${row - 1}` }, { bold: true, numFmt: '#,##0.00', border: THICK });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Etat_Vente_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}