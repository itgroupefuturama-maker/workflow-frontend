// ─── Les 3 designs disponibles ───────────────────────────────────────
export type PdfDesignId = 'classique' | 'moderne' | 'minimaliste' | 'emirates';

export interface PdfStaticTexts {
  headerSubtitle?: string;
  footerContact?:  string;
  footerLegal?:    string;
  validityLabel?:  string;
  validityValue?:  string;
}

export interface PdfDesign {
  id:          PdfDesignId;
  label:       string;
  description: string;
  preview:     string;
  watermark?:  string;
  staticTexts?: PdfStaticTexts;
  colors: {
    headerBg:      [number, number, number];
    headerText:    [number, number, number];
    accentBg:      [number, number, number];
    accentText:    [number, number, number];
    tableHeadBg:   [number, number, number];
    tableHeadText: [number, number, number];
    accentLine:    [number, number, number];
  };
}

export type PdfAudience = 'client' | 'direction';

// ─── Config globale (logo, cachet, design par défaut) ────────────────
export interface PdfGlobalConfig {
  defaultDesign: PdfDesignId;
  logo?: string;    // base64
  stamp?: string;   // base64
}

export type BilletStyleId = 'elegant' | 'compact' | 'boarding';

export interface BilletStyle {
  id: BilletStyleId;
  label: string;
  description: string;
  preview: string; // hex pour aperçu couleur
  colors: {
    headerBg:      [number, number, number];
    headerText:    [number, number, number];
    accentBg:      [number, number, number];
    accentText:    [number, number, number];
    accentLine:    [number, number, number]; // requis par drawSectionTitle
    tableHeadBg:   [number, number, number]; // requis par drawTable
    tableHeadText: [number, number, number]; // requis par drawTable
    stripeBg:      [number, number, number]; // couleur de la bande décorative
    labelColor:    [number, number, number]; // couleur des labels
    valueColor:    [number, number, number]; // couleur des valeurs
    borderColor:   [number, number, number];
  };
}