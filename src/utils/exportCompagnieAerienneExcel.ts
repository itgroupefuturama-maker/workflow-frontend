import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface CompagnieExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;        // filtre exact sur fournisseur.libelle, ex: "Kenya Airways"
  agenceDenomination: string;    // ex: "ARIO MADAGASCAR"
  periodeLabel: string;          // ex: "1-15 AVRIL 2026"
  codeAirlineNumeric: string;    // ex: "706"
  codeAirlineAlpha: string;      // ex: "KQ" (utilisé pour "NET DU A KQ")
  commissionLabel?: string;      // ex: "MK" — défaut "MK"
  minEmptyRows?: number;         // défaut 25
}

const RED = 'FFFF0000';
const CYAN_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFFF' } };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' },
  bottom: { style: 'thin' }, right: { style: 'thin' },
};
const THICK_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium' }, left: { style: 'medium' },
  bottom: { style: 'medium' }, right: { style: 'medium' },
};

export async function exportCompagnieAerienneExcel(opts: CompagnieExportOptions) {
  const {
    lignes,
    fournisseurNom,
    agenceDenomination,
    periodeLabel,
    codeAirlineNumeric,
    codeAirlineAlpha,
    commissionLabel = 'MK',
    minEmptyRows = 25,
  } = opts;

  const data = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Rapport Ventes');

  sheet.columns = [
    { width: 20 }, { width: 16 }, { width: 16 }, { width: 8 },
    { width: 14 }, { width: 16 }, { width: 25 },
  ];

  let row = 1;

  // ── En-tête agence / fournisseur / période ──
  sheet.getCell(row, 1).value = 'AGENCE DE VOYAGE :';
  sheet.getCell(row, 1).font = { bold: true, color: { argb: RED } };
  sheet.getCell(row, 2).value = 'dénomination AGV';
  sheet.getCell(row, 2).font = { bold: true };
  row++;

  sheet.getCell(row, 1).value = fournisseurNom.toUpperCase();
  sheet.getCell(row, 1).font = { bold: true, color: { argb: RED } };
  row++;

  sheet.getCell(row, 1).value = agenceDenomination.toUpperCase();
  sheet.getCell(row, 1).font = { bold: true, color: { argb: RED } };
  row++;

  sheet.getCell(row, 1).value = 'PERIOD :';
  sheet.getCell(row, 1).font = { bold: true, color: { argb: RED } };
  sheet.getCell(row, 2).value = periodeLabel.toUpperCase();
  sheet.getCell(row, 2).font = { bold: true };
  row += 2;

  // ── En-tête tableau ──
  const headerTopRow = row;
  sheet.mergeCells(row, 1, row + 1, 1);
  sheet.getCell(row, 1).value = codeAirlineNumeric;
  sheet.mergeCells(row, 2, row + 1, 2);
  sheet.getCell(row, 2).value = 'FARE';
  sheet.mergeCells(row, 3, row + 1, 3);
  sheet.getCell(row, 3).value = 'TAX';
  sheet.mergeCells(row, 4, row, 5);
  sheet.getCell(row, 4).value = 'COMMISSIONS';
  sheet.mergeCells(row, 6, row + 1, 6);
  sheet.getCell(row, 6).value = 'TOTAL';
  sheet.mergeCells(row, 7, row + 1, 7);
  sheet.getCell(row, 7).value = 'Observations';

  [1, 2, 3, 4, 6, 7].forEach((c) => {
    const cell = sheet.getCell(row, c);
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = CYAN_FILL;
    cell.border = THIN_BORDER;
  });
  sheet.getCell(row, 5).fill = CYAN_FILL;
  sheet.getCell(row, 5).border = THIN_BORDER;
  row++;

  sheet.getCell(row, 4).value = commissionLabel;
  sheet.getCell(row, 4).font = { bold: true };
  sheet.getCell(row, 4).fill = CYAN_FILL;
  sheet.getCell(row, 4).border = THIN_BORDER;
  sheet.getCell(row, 5).fill = CYAN_FILL;
  sheet.getCell(row, 5).border = THIN_BORDER;
  row++;

  sheet.getCell(row, 4).value = '%';
  sheet.getCell(row, 5).value = 'Montant';
  [4, 5].forEach((c) => {
    sheet.getCell(row, c).font = { bold: true };
    sheet.getCell(row, c).fill = CYAN_FILL;
    sheet.getCell(row, c).border = THIN_BORDER;
  });
  sheet.getCell(row, 6).value = 'TTC MGA';
  sheet.getCell(row, 6).font = { bold: true, color: { argb: RED } };
  sheet.getCell(row, 6).fill = CYAN_FILL;
  sheet.getCell(row, 6).border = THIN_BORDER;
  sheet.getCell(row, 1).border = THIN_BORDER;
  sheet.getCell(row, 2).border = THIN_BORDER;
  sheet.getCell(row, 3).border = THIN_BORDER;
  sheet.getCell(row, 7).border = THIN_BORDER;
  row++;

  const firstDataRow = row;

  const sorted = data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime());

  const nbRows = Math.max(sorted.length, minEmptyRows);

  for (let i = 0; i < nbRows; i++) {
    const l = sorted[i];

    if (l) {
      const ticketNumbers =
        l.clientBeneficiaire
          ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((info) => info.billet.map((b) => b.numeroBillet)) ?? [])
          .filter(Boolean)
          .join(', ') || '';

      sheet.getCell(row, 1).value = ticketNumbers;
      sheet.getCell(row, 1).font = { bold: true };
      sheet.getCell(row, 2).value = l.cmCAriary;             // FARE
      sheet.getCell(row, 3).value = l.montantTaxeAriary;     // TAX
      sheet.getCell(row, 4).value = l.commissionAppliquer / 100;
      sheet.getCell(row, 5).value = l.commission || undefined;
      sheet.getCell(row, 6).value = { formula: `B${row}+C${row}` }; // TOTAL TTC
      sheet.getCell(row, 7).value = '';                      // pas de statut CANX/VOID dispo

      sheet.getCell(row, 2).numFmt = '#,##0.00';
      sheet.getCell(row, 3).numFmt = '#,##0.00';
      sheet.getCell(row, 4).numFmt = '0%';
      sheet.getCell(row, 5).numFmt = '#,##0.00';
      sheet.getCell(row, 6).numFmt = '#,##0';
      sheet.getCell(row, 2).font = { bold: true };
      sheet.getCell(row, 3).font = { bold: true };
      sheet.getCell(row, 6).font = { bold: true };
    } else {
      // ligne vide de remplissage, comme sur le modèle
      sheet.getCell(row, 4).value = 0;
      sheet.getCell(row, 6).value = 0;
      sheet.getCell(row, 4).font = { bold: true };
      sheet.getCell(row, 6).font = { bold: true };
    }

    for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THIN_BORDER;
    row++;
  }

  const lastDataRow = row - 1;

  // ── Ligne de totaux du tableau ──
  const totalRow = row;
  ['B', 'C', 'E', 'F'].forEach((letter) => {
    sheet.getCell(`${letter}${totalRow}`).value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
    sheet.getCell(`${letter}${totalRow}`).numFmt = '#,##0';
    sheet.getCell(`${letter}${totalRow}`).font = { bold: true };
  });
  for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THICK_BORDER;
  row += 2;

  // ── Récapitulatif bas de page ──
  const recap: [string, string][] = [
    ['TOTAL FARE', `B${totalRow}`],
    ['TAX', `C${totalRow}`],
    ['TOTAL T.T.C.', `F${totalRow}`],
    ['MOINS COMMS', `E${totalRow}`],
  ];

  recap.forEach(([label, ref]) => {
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 1).font = { bold: true };
    sheet.getCell(row, 2).value = { formula: ref };
    sheet.getCell(row, 2).numFmt = '#,##0';
    sheet.getCell(row, 2).font = { bold: true };
    row++;
  });

  sheet.getCell(row, 1).value = `NET DU A ${codeAirlineAlpha.toUpperCase()}`;
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 2).value = { formula: `F${totalRow}-E${totalRow}` };
  sheet.getCell(row, 2).numFmt = '#,##0';
  sheet.getCell(row, 2).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Etat_Vente_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}