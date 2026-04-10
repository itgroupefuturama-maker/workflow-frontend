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

  moderne: {
    id: 'moderne',
    label: 'Moderne',
    description: 'Vert sobre, look contemporain et aéré',
    preview: '#0A5A3C',
    colors: {
      headerBg:      [10,  90,  60],
      headerText:    [255, 255, 255],
      accentBg:      [10,  90,  60],
      accentText:    [255, 255, 255],
      tableHeadBg:   [232, 245, 238],
      tableHeadText: [10,  90,  60],
      accentLine:    [10,  90,  60],
    },
  },

  minimaliste: {
    id: 'minimaliste',
    label: 'Minimaliste',
    description: 'Noir et blanc, sobre et professionnel',
    preview: '#1A1A1A',
    colors: {
      headerBg:      [26,  26,  26],
      headerText:    [255, 255, 255],
      accentBg:      [26,  26,  26],
      accentText:    [255, 255, 255],
      tableHeadBg:   [245, 245, 245],
      tableHeadText: [26,  26,  26],
      accentLine:    [26,  26,  26],
    },
    watermark: 'ORIGINAL',
  },
};