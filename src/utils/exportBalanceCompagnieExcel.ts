import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface AgenceInfo {
  nom: string;
  codeMdEtIata: string;
  adresse: string;
  tel: string;
  mail: string;
}

interface BalanceExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;   // filtre exact sur fournisseur.libelle
  agence: AgenceInfo;
  periodeLabel: string;     // ex: "DU 01 AU 15 JANVIER 2026"
}

const BLUE = 'FF2563EB';
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' },
  bottom: { style: 'thin' }, right: { style: 'thin' },
};
const THICK_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium' }, left: { style: 'medium' },
  bottom: { style: 'medium' }, right: { style: 'medium' },
};

export async function exportBalanceCompagnieExcel(opts: BalanceExportOptions) {
  const { lignes, fournisseurNom, agence, periodeLabel } = opts;

  const data = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Etat des ventes');

  sheet.columns = [
    { width: 22 }, { width: 22 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 16 }, { width: 16 },
  ];

  let row = 1;

  // ── Bloc infos agence ──
  const infoRows: [string, string][] = [
    ['Nom Agence', agence.nom],
    ['Code MD et IATA', agence.codeMdEtIata],
    ['Adresse', agence.adresse],
    ['tel', agence.tel],
    ['Mail', agence.mail],
  ];
  infoRows.forEach(([label, value]) => {
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 2).value = value;
    for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THIN_BORDER;
    row++;
  });
  row += 2;

  // ── Titre ──
  sheet.mergeCells(row, 3, row, 6);
  sheet.getCell(row, 3).value = `ETAT DES VENTES ${fournisseurNom.toUpperCase()}`;
  sheet.getCell(row, 3).font = { bold: true, size: 14, color: { argb: BLUE } };
  sheet.getCell(row, 3).alignment = { horizontal: 'center' };
  for (let c = 3; c <= 6; c++) sheet.getCell(row, c).border = THICK_BORDER;
  row++;

  sheet.mergeCells(row, 3, row, 6);
  sheet.getCell(row, 3).value = `PERIODE : ${periodeLabel.toUpperCase()}`;
  sheet.getCell(row, 3).font = { bold: true, size: 12, color: { argb: BLUE } };
  sheet.getCell(row, 3).alignment = { horizontal: 'center' };
  for (let c = 3; c <= 6; c++) sheet.getCell(row, c).border = THICK_BORDER;
  row += 2;

  // ── En-têtes DEVISE / MGA ──
  sheet.getCell(row, 6).value = 'DEVISE';
  sheet.getCell(row, 7).value = 'MGA';
  [6, 7].forEach((c) => (sheet.getCell(row, c).font = { bold: true }));
  row++;

  sheet.mergeCells(row, 1, row, 5);
  sheet.getCell(row, 1).value = 'NATURE DES OPERATIONS';
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 1).alignment = { horizontal: 'center' };
  sheet.getCell(row, 6).value = 'DEBIT';
  sheet.getCell(row, 7).value = 'CREDIT';
  [6, 7].forEach((c) => (sheet.getCell(row, c).font = { bold: true }));
  for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THICK_BORDER;
  row++;

  const debitCells: string[] = [];
  const creditCells: string[] = [];

  const addSectionHeader = (label: string) => {
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 1).font = { bold: true };
    for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THIN_BORDER;
    row++;
  };

  const addOperationLine = (label: string, debit?: number | { formula: string }, credit?: number | { formula: string }) => {
    sheet.mergeCells(row, 2, row, 5);
    sheet.getCell(row, 2).value = label;
    if (debit !== undefined) {
      sheet.getCell(row, 6).value = debit;
      sheet.getCell(row, 6).numFmt = '#,##0.00';
      debitCells.push(`F${row}`);
    }
    if (credit !== undefined) {
      sheet.getCell(row, 7).value = credit;
      sheet.getCell(row, 7).numFmt = '#,##0.00';
      creditCells.push(`G${row}`);
    }
    for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THIN_BORDER;
    row++;
  };

  // ── EMISSIONS ──
  addSectionHeader('EMISSIONS');
  const totalFcAriary = data.reduce((s, l) => s + l.fcCAriary, 0);
  addOperationLine('- Ventes E-ticketing', totalFcAriary);

  // ── REMBOURSEMENT (aucune donnée de remboursement dans le modèle actuel) ──
  addSectionHeader('REMBOURSEMENT');
  addOperationLine('-Remboursement E-ticketing', undefined, 0); // à remplir manuellement

  // ── DIVERS : REGLEMENT LITIGES (aucun champ correspondant, saisie manuelle) ──
  addSectionHeader('DIVERS : REGLEMENT LITIGES');
  addOperationLine('- REJET MEMO N°');
  addOperationLine('- Facture n°');
  addOperationLine('- EMD', 0); // à remplir manuellement si besoin

  // ── Balance en faveur du fournisseur ──
  const balanceRow = row;
  sheet.mergeCells(row, 1, row, 5);
  sheet.getCell(row, 1).value = `BALANCE EN FAVEUR DE ${fournisseurNom.toUpperCase()} :`;
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 7).value = {
    formula: `SUM(${debitCells.join(',')})-SUM(${creditCells.filter((c) => c !== `G${row}`).join(',')})`,
  };
  sheet.getCell(row, 7).numFmt = '#,##0.00';
  sheet.getCell(row, 7).font = { bold: true };
  for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THICK_BORDER;
  creditCells.push(`G${balanceRow}`);
  row++;

  // ── Totaux égaux ──
  sheet.mergeCells(row, 1, row, 5);
  sheet.getCell(row, 1).value = 'TOTAUX EGAUX :';
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 6).value = { formula: `SUM(${debitCells.join(',')})` };
  sheet.getCell(row, 7).value = { formula: `SUM(${creditCells.join(',')})` };
  sheet.getCell(row, 6).numFmt = '#,##0.00';
  sheet.getCell(row, 7).numFmt = '#,##0.00';
  sheet.getCell(row, 6).font = { bold: true };
  sheet.getCell(row, 7).font = { bold: true };
  for (let c = 1; c <= 7; c++) sheet.getCell(row, c).border = THICK_BORDER;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Etat_Vente_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}