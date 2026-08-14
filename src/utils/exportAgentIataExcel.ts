import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { EtatVenteLigne } from '../app/front_office/parametre_dashboard/dashboardSlice';

interface AgenceInfo {
  nom: string;
  adresse: string;
  codeAgent: string; // ex: "48210540"
}

interface AgentIataExportOptions {
  lignes: EtatVenteLigne[];
  fournisseurNom: string;   // filtre exact sur fournisseur.libelle
  codeCourt: string;        // ex: "AF" -> utilisé dans "Dû à AF"
  agence: AgenceInfo;
  periodeLabel: string;     // ex: "22 FEVRIER 2025 AU 01 MARS 2026"
  currency?: string;        // défaut "MGA"
  statutAnnule?: string;    // défaut "annuler"
}

const YELLOW: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
const THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' },
  bottom: { style: 'thin' }, right: { style: 'thin' },
};
const THICK: Partial<ExcelJS.Borders> = {
  top: { style: 'medium' }, left: { style: 'medium' },
  bottom: { style: 'medium' }, right: { style: 'medium' },
};

const formatDateShort = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
};

const setCell = (
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: any,
  opts?: { bold?: boolean; fill?: ExcelJS.Fill; align?: Partial<ExcelJS.Alignment>; numFmt?: string; border?: Partial<ExcelJS.Borders> }
) => {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  if (opts?.bold) cell.font = { bold: true };
  if (opts?.fill) cell.fill = opts.fill;
  if (opts?.align) cell.alignment = opts.align;
  if (opts?.numFmt) cell.numFmt = opts.numFmt;
  cell.border = opts?.border ?? THIN;
  return cell;
};

// ─── En-tête commun (NOM / ADRESSE / code / période / monnaie / page) ──
function buildHeaderBlock(
  sheet: ExcelJS.Worksheet,
  title: string,
  agence: AgenceInfo,
  periodeLabel: string,
  currency: string
): number {
  let row = 2;

  sheet.mergeCells(row, 1, row, 7);
  setCell(sheet, row, 1, title, {
    bold: true, align: { horizontal: 'center' },
    border: {},
  });
  sheet.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;

  sheet.mergeCells(row, 1, row, 1);
  setCell(sheet, row, 1, 'NOM', { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  sheet.mergeCells(row, 2, row, 4);
  setCell(sheet, row, 2, agence.nom, { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  sheet.mergeCells(row, 5, row, 5);
  setCell(sheet, row, 5, agence.codeAgent, { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  setCell(sheet, row, 6, 'Monnaie', { bold: true, fill: YELLOW, border: THICK });
  setCell(sheet, row, 7, currency, { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  row++;

  sheet.mergeCells(row, 1, row, 1);
  setCell(sheet, row, 1, 'ADRESSE', { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  sheet.mergeCells(row, 2, row, 4);
  setCell(sheet, row, 2, agence.adresse, { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  sheet.mergeCells(row, 5, row, 5);
  setCell(sheet, row, 5, `Période : ${periodeLabel}`, { bold: true, fill: YELLOW, align: { horizontal: 'left' }, border: THICK });
  setCell(sheet, row, 6, 'Page:', { bold: true, fill: YELLOW, border: THICK });
  setCell(sheet, row, 7, 1, { bold: true, fill: YELLOW, align: { horizontal: 'center' }, border: THICK });
  row += 2;

  return row; // ligne suivante disponible
}

// ─── Onglet VENTES (regroupé par jour) ──────────────────────
function buildVentesSheet(
  workbook: ExcelJS.Workbook,
  data: EtatVenteLigne[],
  agence: AgenceInfo,
  periodeLabel: string,
  currency: string,
  codeCourt: string
) {
  const sheet = workbook.addWorksheet('Ventes');
  sheet.columns = [
    { width: 18 }, { width: 26 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 14 }, { width: 12 },
  ];

  let row = buildHeaderBlock(sheet, 'RAPPORT de VENTES des AGENTS I.A.T.A', agence, periodeLabel, currency);

  // ── En-têtes tableau ──
  sheet.mergeCells(row, 1, row, 2);
  setCell(sheet, row, 1, 'Documents', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  for (let c = 2; c <= 2; c++) sheet.getCell(row, c).fill = YELLOW;
  setCell(sheet, row, 3, 'VENTES', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 4, 'TAXES', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 5, 'TOTAL VENTES', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  row++;

  setCell(sheet, row, 1, 'Date JOUR émission', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 2, 'Nombre de billets émis / jour', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 3, 'HORS TAXES', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 4, '', { fill: YELLOW });
  setCell(sheet, row, 5, 'TTC', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  row++;

  setCell(sheet, row, 1, '', { fill: YELLOW });
  setCell(sheet, row, 2, '', { fill: YELLOW });
  setCell(sheet, row, 3, '1', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 4, '2', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 5, '', { fill: YELLOW });
  row++;

  // ── Regroupement par jour ──
  const parJour = data.reduce<Record<string, EtatVenteLigne[]>>((acc, l) => {
    const key = formatDateShort(l.dateTransaction);
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  const firstDataRow = row;
  const htCells: string[] = [];
  const taxCells: string[] = [];
  const ttcCells: string[] = [];

  Object.entries(parJour)
    .sort(([, a], [, b]) => new Date(a[0].dateTransaction).getTime() - new Date(b[0].dateTransaction).getTime())
    .forEach(([dateKey, itemsJour]) => {
      const nbBillets = itemsJour.reduce(
        (s, l) =>
          s +
          (l.clientBeneficiaire
            ?.flatMap((cb) => cb.clientbeneficiaireInfo?.flatMap((i) => i.billet.filter((b) => b.numeroBillet)) ?? [])
            .length || 0),
        0
      );
      const totalTTC = itemsJour.reduce((s, l) => s + l.fcCAriary, 0);
      const totalTaxes = itemsJour.reduce((s, l) => s + l.montantTaxeAriary, 0);
      const totalHT = totalTTC - totalTaxes;

      setCell(sheet, row, 1, dateKey, { align: { horizontal: 'center' } });
      setCell(sheet, row, 2, String(nbBillets).padStart(2, '0'), { align: { horizontal: 'center' } });
      setCell(sheet, row, 3, totalHT, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 4, totalTaxes, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
      setCell(sheet, row, 5, totalTTC, { numFmt: '#,##0.00', align: { horizontal: 'right' } });

      htCells.push(`C${row}`);
      taxCells.push(`D${row}`);
      ttcCells.push(`E${row}`);
      row++;
    });

  const lastDataRow = row - 1;

  // ── Total tableau ──
  setCell(sheet, row, 3, { formula: `SUM(${htCells.join(',') || `C${firstDataRow}:C${lastDataRow}`})` }, { bold: true, numFmt: '#,##0.00', fill: YELLOW, border: THICK });
  setCell(sheet, row, 4, { formula: `SUM(${taxCells.join(',') || `D${firstDataRow}:D${lastDataRow}`})` }, { bold: true, numFmt: '#,##0.00', fill: YELLOW, border: THICK });
  setCell(sheet, row, 5, { formula: `SUM(${ttcCells.join(',') || `E${firstDataRow}:E${lastDataRow}`})` }, { bold: true, numFmt: '#,##0.00', fill: YELLOW, border: THICK });
  sheet.getCell(row, 1).border = THICK;
  sheet.getCell(row, 2).border = THICK;
  const totalTableRow = row;
  row += 2;

  // ── Dû à [codeCourt] ──
  sheet.mergeCells(row, 1, row, 2);
  setCell(sheet, row, 1, `Dû à ${codeCourt}`, { bold: true, border: THICK });
  sheet.mergeCells(row, 3, row, 5);
  setCell(sheet, row, 3, '', { border: THICK });
  row++;

  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, 'Total VENTES hors taxes (Col 1)');
  setCell(sheet, row, 4, { formula: `C${totalTableRow}` }, { numFmt: '#,##0.00' });
  row++;
  row++;

  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, 'Total taxes (Col.2)');
  setCell(sheet, row, 4, { formula: `D${totalTableRow}` }, { numFmt: '#,##0.00' });
  row++;
  row++;

  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, `Total dû à ${codeCourt}`, { bold: true });
  setCell(sheet, row, 4, { formula: `E${totalTableRow}` }, { bold: true, numFmt: '#,##0.00' });
}

// ─── Onglet REMBOURSEMENTS (une ligne par billet annulé) ────
function buildRemboursementsSheet(
  workbook: ExcelJS.Workbook,
  data: EtatVenteLigne[],
  agence: AgenceInfo,
  periodeLabel: string,
  currency: string
) {
  const sheet = workbook.addWorksheet('Remboursements');
  sheet.columns = [
    { width: 14 }, { width: 16 }, { width: 30 }, { width: 18 }, { width: 14 }, { width: 16 }, { width: 12 },
  ];

  let row = buildHeaderBlock(sheet, 'RAPPORT de REMBOURSEMENTS des AGENTS I.A.T.A', agence, periodeLabel, currency);

  setCell(sheet, row, 1, 'Documents', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  sheet.mergeCells(row, 4, row, 4);
  setCell(sheet, row, 4, 'REMBOURSEMENTS', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 5, 'TAXES', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 6, 'TOTAL', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  for (const c of [2, 3]) sheet.getCell(row, c).fill = YELLOW;
  row++;

  setCell(sheet, row, 1, 'Date refund', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 2, 'Numero', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 3, 'Routing', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 4, 'HORS TAXES', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 5, '', { fill: YELLOW });
  setCell(sheet, row, 6, 'TTC', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  row++;

  setCell(sheet, row, 1, '', { fill: YELLOW });
  setCell(sheet, row, 2, '', { fill: YELLOW });
  setCell(sheet, row, 3, '', { fill: YELLOW });
  setCell(sheet, row, 4, '1', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 5, '2', { bold: true, fill: YELLOW, align: { horizontal: 'center' } });
  setCell(sheet, row, 6, '', { fill: YELLOW });
  row++;

  const firstDataRow = row;
  const htCells: string[] = [];
  const taxCells: string[] = [];
  const ttcCells: string[] = [];

  const sorted = data
    .slice()
    .sort((a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime());

  sorted.forEach((l) => {
    const ttc = l.fcCAriary;
    const taxes = l.montantTaxeAriary;
    const ht = ttc - taxes;

    setCell(sheet, row, 1, formatDateShort(l.dateTransaction), { align: { horizontal: 'center' } });
    setCell(sheet, row, 2, l.numDosPrestation, { align: { horizontal: 'center' } });
    setCell(sheet, row, 3, l.prestation, { align: { horizontal: 'left' } });
    setCell(sheet, row, 4, ht, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
    setCell(sheet, row, 5, taxes, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
    setCell(sheet, row, 6, ttc, { numFmt: '#,##0.00', align: { horizontal: 'right' } });

    htCells.push(`D${row}`);
    taxCells.push(`E${row}`);
    ttcCells.push(`F${row}`);
    row++;
  });

  // lignes vides de remplissage, comme dans le modèle
  const minEmptyRows = 20;
  for (let i = sorted.length; i < minEmptyRows; i++) {
    for (let c = 1; c <= 6; c++) sheet.getCell(row, c).border = THIN;
    setCell(sheet, row, 6, 0, { numFmt: '#,##0.00', align: { horizontal: 'right' } });
    row++;
  }

  const lastDataRow = row - 1;

  setCell(sheet, row, 4, { formula: `SUM(${htCells.join(',') || `D${firstDataRow}:D${lastDataRow}`})` }, { bold: true, numFmt: '#,##0.00', fill: YELLOW, border: THICK });
  setCell(sheet, row, 5, { formula: `SUM(${taxCells.join(',') || `E${firstDataRow}:E${lastDataRow}`})` }, { bold: true, numFmt: '#,##0.00', fill: YELLOW, border: THICK });
  setCell(sheet, row, 6, { formula: `SUM(${ttcCells.join(',') || `F${firstDataRow}:F${lastDataRow}`})` }, { bold: true, numFmt: '#,##0.00', fill: YELLOW, border: THICK });
  sheet.getCell(row, 1).border = THICK;
  sheet.getCell(row, 2).border = THICK;
  sheet.getCell(row, 3).border = THICK;
  const totalTableRow = row;
  row += 2;

  sheet.mergeCells(row, 1, row, 1);
  setCell(sheet, row, 1, "Dû à l' Agent", { bold: true, border: THICK });
  row++;

  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, 'Total rembst hors taxes (Col 1)');
  setCell(sheet, row, 4, { formula: `D${totalTableRow}` }, { numFmt: '#,##0.00' });
  row++;
  row++;

  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, 'Total taxes (Col.2)');
  setCell(sheet, row, 4, { formula: `E${totalTableRow}` }, { numFmt: '#,##0.00' });
  row++;
  row++;

  sheet.mergeCells(row, 2, row, 3);
  setCell(sheet, row, 2, "Total dû à l'Agent", { bold: true });
  setCell(sheet, row, 4, { formula: `F${totalTableRow}` }, { bold: true, numFmt: '#,##0.00' });
}

// ─── Export principal ─────────────────────────────────────────
export async function exportAgentIataExcel(opts: AgentIataExportOptions) {
  const {
    lignes,
    fournisseurNom,
    codeCourt,
    agence,
    periodeLabel,
    currency = 'MGA',
    statutAnnule = 'annuler',
  } = opts;

  const dataFournisseur = lignes.filter(
    (l) => l.fournisseur?.libelle?.toLowerCase() === fournisseurNom.toLowerCase()
  );

  const ventesData = dataFournisseur.filter((l) => l.statutTransaction !== statutAnnule);
  const remboursementsData = dataFournisseur.filter((l) => l.statutTransaction === statutAnnule);

  const workbook = new ExcelJS.Workbook();

  buildVentesSheet(workbook, ventesData, agence, periodeLabel, currency, codeCourt);
  buildRemboursementsSheet(workbook, remboursementsData, agence, periodeLabel, currency);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Rapport_IATA_${fournisseurNom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}