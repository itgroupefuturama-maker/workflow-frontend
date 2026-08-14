import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface TurkishExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;   // filtre exact sur fournisseur.libelle, ex: "Turkish Airlines"
  periodeLabel: string;     // ex: "16/02/2024 AU 29/02/2024"
  agenceNom: string;        // ex: "AL BOURAQ TRAVEL"
  agenceContact: string;    // ex: "albouraqtravel@gmail.com +261 20 22 637 17 Appt A5 bat F5 village des Jeux Ankorondrano Antananarivo"
  iataCode: string;         // ex: "48210540"
  statutAnnule?: string;    // défaut "annuler" — exclu du rapport (pas d'onglet remboursement ici)
}

const GREY_HEADER: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
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
  opts?: { bold?: boolean; align?: Partial<ExcelJS.Alignment>; numFmt?: string; fill?: ExcelJS.Fill; border?: Partial<ExcelJS.Borders>; underline?: boolean; color?: string }
) => {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  cell.font = { bold: opts?.bold, underline: opts?.underline, color: opts?.color ? { argb: opts.color } : undefined };
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

export async function exportTurkishExcel(opts: TurkishExportOptions) {
  const {
    lignes,
    fournisseurNom,
    periodeLabel,
    agenceNom,
    agenceContact,
    iataCode,
    statutAnnule = 'annuler',
  } = opts;

  const data = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
      && l.statutTransaction !== statutAnnule
  );

  // ── Taux de commission moyen, calculé depuis les données ──
  const commissionRateMoyen =
    data.length > 0
      ? data.reduce((s, l) => s + l.commissionAppliquer, 0) / data.length
      : 0;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Etat de vente');

  sheet.columns = [
    { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 },
  ];

  let row = 3;

  // ── Bandeau PERIOD / Agence / IATA / Commission Rate ──
  setCell(sheet, row, 1, 'PERIOD', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  setCell(sheet, row, 2, periodeLabel, { border: THICK });
  sheet.mergeCells(row, 3, row, 8);
  setCell(sheet, row, 3, agenceNom.toUpperCase(), { bold: true, align: { horizontal: 'center' }, border: THICK });
  row++;

  sheet.mergeCells(row, 3, row, 8);
  setCell(sheet, row, 3, agenceContact, { align: { horizontal: 'center' }, underline: true, color: 'FF0563C1', border: THICK });
  row++;

  setCell(sheet, row, 3, 'IATA Code :', { bold: true, border: THICK });
  setCell(sheet, row, 4, iataCode, { align: { horizontal: 'center' }, border: THICK });
  setCell(sheet, row, 5, 'Commission Rate :', { bold: true, border: THICK });
  sheet.mergeCells(row, 6, row, 8);
  setCell(sheet, row, 6, commissionRateMoyen / 100, { numFmt: '0.0%', align: { horizontal: 'center' }, border: THICK });
  row += 2;

  // ── En-tête colonnes ──
  const headers = ['TICKET NUMBER', 'DATE OF ISSUE', 'TOTAL TICKET FARE', 'BASE FARE', 'YR + TAXES', 'COMMISSION', 'NET TO PAY', 'REMARKS'];
  headers.forEach((h, i) => {
    setCell(sheet, row, i + 1, h, { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  });
  row++;

  const firstDataRow = row;

  data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime())
    .forEach((l) => {
      const baseFare = l.fcCAriary - l.montantTaxeAriary;

      setCell(sheet, row, 1, getTicketNumbers(l), { align: { horizontal: 'center' } });
      setCell(sheet, row, 2, new Date(l.dateTransaction), { numFmt: 'd/m/yy', align: { horizontal: 'center' } });
      setCell(sheet, row, 3, { formula: `D${row}+E${row}` }, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 4, baseFare, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 5, l.montantTaxeAriary, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 6, l.commission, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 7, { formula: `C${row}-F${row}` }, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 8, '');
      row++;
    });

  const lastDataRow = Math.max(row - 1, firstDataRow);
  row++;

  // ── Total à payer ──
  sheet.mergeCells(row, 1, row, 6);
  setCell(sheet, row, 1, 'TOTAL TO PAY', { bold: true, fill: GREY_HEADER, align: { horizontal: 'center' }, border: THICK });
  setCell(sheet, row, 7, { formula: `SUM(G${firstDataRow}:G${lastDataRow})` }, { bold: true, numFmt: '#,##0.00', align: { horizontal: 'right' }, border: THICK });
  setCell(sheet, row, 8, '', { border: THICK });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Etat_Vente_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}