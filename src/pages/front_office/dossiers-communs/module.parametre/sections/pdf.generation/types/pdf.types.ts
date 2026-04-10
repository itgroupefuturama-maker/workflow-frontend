// ─── Couleur & style ─────────────────────────────────────────────────
export interface PdfColorScheme {
  headerBg: [number, number, number];      // RGB
  headerText: [number, number, number];
  totalBg: [number, number, number];
  totalText: [number, number, number];
  tableHeadBg: [number, number, number];
  tableHeadText: [number, number, number];
  accentLine: [number, number, number];
}

// ─── Colonne de tableau ──────────────────────────────────────────────
export interface PdfTableColumn {
  key: string;          // clé dans la donnée
  label: string;        // en-tête affiché
  width: number;        // largeur en mm
  align?: 'left' | 'right' | 'center';
}

// ─── Section générique ───────────────────────────────────────────────
export type PdfSectionType =
  | 'header'
  | 'references'
  | 'table'
  | 'keyvalue'
  | 'services'
  | 'requirements'
  | 'footer';

export interface PdfSection {
  type: PdfSectionType;
  title?: string;
  columns?: PdfTableColumn[];   // pour type === 'table'
  dataKey: string;              // clé dans PdfDocumentData
}

// ─── Template (stocké serveur) ───────────────────────────────────────
export type PdfDocumentType = 'devis' | 'attestation' | 'facture' | 'billet';

export interface PdfTemplate {
  docType: PdfDocumentType;
  docTitle: string;             // ex: "DEVIS DE VOYAGE"
  colorScheme: PdfColorScheme;
  sections: PdfSection[];
  logo?: string;                // base64 ou URL
  stamp?: string;               // cachet bas de page base64
  watermarkText?: string;       // ex: "ORIGINAL" en filigrane
}

// ─── Données dynamiques ──────────────────────────────────────────────
export interface PdfHeaderData {
  companyName: string;
  tagline: string;
  address: string;
  contact: string;
}

export interface PdfReferencesData {
  fields: { label: string; value: string }[];
}

export interface PdfTableData {
  rows: Record<string, string>[];
}

export interface PdfKeyValueData {
  pairs: { label: string; value: string }[];
}

export interface PdfServicesData {
  items: { label: string; value: string }[];
}

export interface PdfRequirementsData {
  rows: { type: string; description: string; perimetre: string }[];
}

export interface PdfFooterData {
  totalLabel: string;
  totalValue: string;
  note?: string;
}

export interface PdfDocumentData {
  header: PdfHeaderData;
  references: PdfReferencesData;
  [tableKey: string]: PdfTableData | PdfKeyValueData | PdfServicesData
    | PdfRequirementsData | PdfHeaderData | PdfReferencesData | PdfFooterData;
  footer: PdfFooterData;
}