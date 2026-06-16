import type { PdfDesign } from '../types/pdf-design.types';

export const PDF_DESIGNS: Record<string, PdfDesign> = {

  classique: {
    id: 'classique',
    label: 'Classique',
    description: 'Bleu marine élégant, adapté aux documents officiels',
    preview: '#0F1729',
    colors: {
      headerBg:      [15,  23,  42],
      headerText:    [255, 255, 255],
      accentBg:      [15,  23,  42],
      accentText:    [255, 255, 255],
      tableHeadBg:   [240, 242, 246],
      tableHeadText: [30,  30,  30],
      accentLine:    [15,  23,  42],
    },
  },

  emirates: {
    id: 'emirates',
    label: 'AL Bouraq Travel - Design',
    description: 'Style document compagnie aérienne, formel et paginé',
    preview: '#1A2744',
    colors: {
      headerBg:      [26,  39,  68],
      headerText:    [255, 255, 255],
      accentBg:      [26,  39,  68],
      accentText:    [255, 255, 255],
      tableHeadBg:   [244, 246, 250],
      tableHeadText: [26,  39,  68],
      accentLine:    [215, 25,  33],
    },
    staticTexts: {
      headerSubtitle: 'Agence de voyages agréée IATA · Madagascar',
      footerContact:  'albouraqtravel@gmail.com  ·  +261 34 01 637 17',
      footerLegal:    "Devis établi sous réserve de disponibilité. Tarifs susceptibles de modification jusqu'à émission du billet.",
      validityLabel:  'Validité du devis',
      validityValue:  "30 jours à compter de la date d'émission",
    },
  },
};