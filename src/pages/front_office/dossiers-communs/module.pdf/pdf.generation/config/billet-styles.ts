import type { BilletStyle } from "../types/pdf-design.types";

export const BILLET_STYLES: Record<string, BilletStyle> = {

  // Miroir du design "classique" du devis — bleu marine
  elegant: {
    id: 'elegant',
    label: 'Classique',
    description: 'Bleu marine élégant, style documents officiels',
    preview: '#0F1729',
    colors: {
      headerBg:      [15,  23,  42],
      headerText:    [255, 255, 255],
      accentBg:      [15,  23,  42],
      accentText:    [255, 255, 255],
      accentLine:    [59,  130, 246],
      tableHeadBg:   [15,  23,  42],
      tableHeadText: [255, 255, 255],
      stripeBg:      [59,  130, 246],
      labelColor:    [100, 116, 139],
      valueColor:    [15,  23,  42],
      borderColor:   [203, 213, 225],
    },
  },

  // Miroir du design "moderne" du devis — vert
  compact: {
    id: 'compact',
    label: 'Moderne',
    description: 'Vert sobre, look contemporain',
    preview: '#0A5A3C',
    colors: {
      headerBg:      [26,  26,  26],
      headerText:    [255, 255, 255],
      accentBg:      [10,  90,  60],
      accentText:    [255, 255, 255],
      accentLine:    [16,  185, 129],
      tableHeadBg:   [10,  90,  60],
      tableHeadText: [255, 255, 255],
      stripeBg:      [16,  185, 129],
      labelColor:    [107, 114, 128],
      valueColor:    [17,  24,  39],
      borderColor:   [209, 250, 229],
    },
  },

  // Miroir du design "minimaliste" du devis — noir
  boarding: {
    id: 'boarding',
    label: 'Minimaliste',
    description: 'Noir et blanc, sobre et professionnel',
    preview: '#1A1A1A',
    colors: {
      headerBg:      [26,  26,  26],
      headerText:    [255, 255, 255],
      accentBg:      [26,  26,  26],
      accentText:    [255, 255, 255],
      accentLine:    [202, 138, 4],
      tableHeadBg:   [26,  26,  26],
      tableHeadText: [255, 255, 255],
      stripeBg:      [202, 138, 4],
      labelColor:    [107, 114, 128],
      valueColor:    [17,  24,  39],
      borderColor:   [229, 231, 235],
    },
  },
};