import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface ExportOptions {
  lignes: EtatVenteLigne[];
  periodeLabel: string;      // ex: "01 JANVIER - 15 JANVIER 2026"
  salesStation?: string;     // ex: "AL BOURAQ TRAVEL"
  iataCode?: string;         // ex: "48210540"
  currency?: string;         // ex: "MGA"
  fournisseurNom?: string;   // filtre + nom de fichier
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const fill = (argb: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

export async function exportAirAustralExcel(opts: ExportOptions) {
  const {
    lignes,
    periodeLabel,
    salesStation = '',
    iataCode = '',
    currency = 'MGA',
    fournisseurNom = 'Air Austral',
  } = opts;

  // ── Filtre sur le fournisseur ──
  const data = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ticket Sales Report');

  sheet.columns = [
    { width: 20 }, { width: 13 }, { width: 13 }, { width: 20 },
    { width: 15 }, { width: 15 }, { width: 9 }, { width: 15 },
    { width: 15 }, { width: 18 }, { width: 14 },
  ];

  let row = 1;

  // Titre
  sheet.mergeCells(row, 1, row, 4);
  sheet.getCell(row, 1).value = 'TICKET SALES REPORT';
  sheet.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;

  sheet.mergeCells(row, 1, row, 4);
  sheet.getCell(row, 1).value = periodeLabel;
  sheet.getCell(row, 1).font = { bold: true, size: 11 };

  // Bloc infos station, aligné en haut à droite
  const infoRow = row - 1;
  sheet.getCell(infoRow, 9).value = 'SALES STATION :';
  sheet.getCell(infoRow, 10).value = salesStation.toUpperCase();
  sheet.getCell(infoRow + 1, 9).value = 'IATA CODE :';
  sheet.getCell(infoRow + 1, 10).value = iataCode;
  sheet.getCell(infoRow + 2, 9).value = 'Currency :';
  sheet.getCell(infoRow + 2, 10).value = currency;
  [infoRow, infoRow + 1, infoRow + 2].forEach((r) => {
    sheet.getCell(r, 9).font = { bold: true };
    sheet.getCell(r, 10).font = { bold: true };
  });

  row += 2;

  // En-tête colonnes
  const headerRow = row;
  const headers = [
    'TICKET NUMBER', "DATE D'EMISSION", 'ITEM REPORT', 'FARE CODE',
    'GROSS FARE', 'TAXES', 'AGENT COMMISSION', '', 'NET FARE',
    'AMOUNT DUE TO UU\nincluding taxes', 'notes/\nremarks',
  ];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = fill('FFD9D9D9');
    cell.border = THIN_BORDER;
  });
  sheet.mergeCells(headerRow, 7, headerRow, 8);
  sheet.getRow(headerRow).height = 30;
  row++;

  sheet.getCell(row, 7).value = '%';
  sheet.getCell(row, 8).value = 'amount';
  [7, 8].forEach((c) => {
    const cell = sheet.getCell(row, c);
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center' };
    cell.fill = fill('FFFCE4D6');
    cell.border = THIN_BORDER;
  });
  row++;

  // Bandeau DOCUMENTS
  sheet.mergeCells(row, 1, row, 11);
  sheet.getCell(row, 1).value = 'DOCUMENTS';
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 1).alignment = { horizontal: 'center' };
  for (let c = 1; c <= 11; c++) {
    sheet.getCell(row, c).fill = fill('FFFCE4D6');
    sheet.getCell(row, c).border = THIN_BORDER;
  }
  row++;

  const firstDataRow = row;

  // Lignes de données
  data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime())
    .forEach((l) => {
      const ticketNumbers =
        l.clientBeneficiaire
          ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((i) => i.billet.map((b) => b.numeroBillet)) ?? [])
          .filter(Boolean)
          .join(', ') || '';

      sheet.getCell(row, 1).value = ticketNumbers;
      sheet.getCell(row, 2).value = new Date(l.dateTransaction);
      sheet.getCell(row, 2).numFmt = 'd/m/yy';
      sheet.getCell(row, 3).value = l.numDosPrestation;   // approximation "Item Report"
      sheet.getCell(row, 4).value = l.prestation;         // approximation "Fare Code"
      sheet.getCell(row, 5).value = l.cmCAriary;          // Gross Fare
      sheet.getCell(row, 6).value = l.montantTaxeAriary;  // Taxes
      sheet.getCell(row, 7).value = l.commissionAppliquer / 100;
      sheet.getCell(row, 8).value = l.commission;
      sheet.getCell(row, 9).value = l.fcCAriary;          // Net Fare
      sheet.getCell(row, 10).value = { formula: `I${row}+F${row}` }; // Net Fare + Taxes
      sheet.getCell(row, 11).value = '';                  // pas de statut VOID disponible

      [5, 6, 9, 10].forEach((c) => (sheet.getCell(row, c).numFmt = '#,##0.00'));
      sheet.getCell(row, 7).numFmt = '0.00%';
      sheet.getCell(row, 8).numFmt = '#,##0.00';

      for (let c = 1; c <= 11; c++) sheet.getCell(row, c).border = THIN_BORDER;
      row++;
    });

  const lastDataRow = row - 1;

  // Total Sales
  const totalRow = row;
  sheet.mergeCells(row, 1, row, 4);
  sheet.getCell(row, 1).value = 'TOTAL SALES';
  sheet.getCell(row, 1).font = { bold: true };
  [5, 6, 8, 9, 10].forEach((c) => {
    const letter = sheet.getColumn(c).letter;
    sheet.getCell(row, c).value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
    sheet.getCell(row, c).numFmt = '#,##0.00';
  });
  for (let c = 1; c <= 11; c++) {
    sheet.getCell(row, c).font = { bold: true };
    sheet.getCell(row, c).fill = fill('FFFFF2CC');
    sheet.getCell(row, c).border = THIN_BORDER;
  }
  row += 2;

  // Bandeau REFUND (aucune donnée de remboursement actuellement → lignes vides à remplir manuellement)
  sheet.mergeCells(row, 1, row, 11);
  sheet.getCell(row, 1).value = 'REFUND';
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 1).alignment = { horizontal: 'center' };
  for (let c = 1; c <= 11; c++) {
    sheet.getCell(row, c).fill = fill('FFFCE4D6');
    sheet.getCell(row, c).border = THIN_BORDER;
  }
  row++;
  const refundStart = row;
  row += 2;
  const refundEnd = row - 1;

  const totalRefundRow = row;
  sheet.mergeCells(row, 1, row, 4);
  sheet.getCell(row, 1).value = 'TOTAL REFUNDS';
  sheet.getCell(row, 1).font = { bold: true };
  [5, 6, 10].forEach((c) => {
    const letter = sheet.getColumn(c).letter;
    sheet.getCell(row, c).value = { formula: `SUM(${letter}${refundStart}:${letter}${refundEnd})` };
    sheet.getCell(row, c).numFmt = '#,##0.00';
  });
  for (let c = 1; c <= 11; c++) {
    sheet.getCell(row, c).font = { bold: true };
    sheet.getCell(row, c).fill = fill('FFFFF2CC');
    sheet.getCell(row, c).border = THIN_BORDER;
  }
  row++;

  // Grand Total
  [5, 6, 10].forEach((c) => {
    const letter = sheet.getColumn(c).letter;
    sheet.getCell(row, c).value = { formula: `${letter}${totalRow}+${letter}${totalRefundRow}` };
    sheet.getCell(row, c).numFmt = '#,##0.00';
  });
  sheet.mergeCells(row, 1, row, 4);
  sheet.getCell(row, 1).value = 'GRAND TOTAL';
  for (let c = 1; c <= 11; c++) {
    sheet.getCell(row, c).font = { bold: true };
    sheet.getCell(row, c).fill = fill('FFD9D9D9');
    sheet.getCell(row, c).border = THIN_BORDER;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Etat_Vente_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}