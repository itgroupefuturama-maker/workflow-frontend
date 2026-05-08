// ─── Les 3 designs disponibles ───────────────────────────────────────
export type PdfDesignId = 'classique' | 'moderne' | 'minimaliste';

export interface PdfDesign {
  id: PdfDesignId;
  label: string;
  description: string;
  preview: string;   // couleur hex pour l'aperçu UI
  colors: {
    headerBg:      [number, number, number];
    headerText:    [number, number, number];
    accentBg:      [number, number, number];
    accentText:    [number, number, number];
    tableHeadBg:   [number, number, number];
    tableHeadText: [number, number, number];
    accentLine:    [number, number, number];
  };
  watermark?: string;
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
    headerBg:    [number, number, number];
    headerText:  [number, number, number];
    accentBg:    [number, number, number];
    accentText:  [number, number, number];
    stripeBg:    [number, number, number]; // couleur de la bande décorative
    labelColor:  [number, number, number]; // couleur des labels
    valueColor:  [number, number, number]; // couleur des valeurs
    borderColor: [number, number, number];
  };
}