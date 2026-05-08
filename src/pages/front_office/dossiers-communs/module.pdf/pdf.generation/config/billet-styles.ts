import type { BilletStyle } from "../types/pdf-design.types";


export const BILLET_STYLES: Record<string, BilletStyle> = {

  elegant: {
    id: 'elegant',
    label: 'Élégant',
    description: 'Bleu marine, style boarding pass premium',
    preview: '#0F1729',
    colors: {
      headerBg:    [15,  23,  42],
      headerText:  [255, 255, 255],
      accentBg:    [15,  23,  42],
      accentText:  [255, 255, 255],
      stripeBg:    [59,  130, 246],  // bleu vif
      labelColor:  [100, 116, 139],  // slate-500
      valueColor:  [15,  23,  42],   // slate-900
      borderColor: [203, 213, 225],  // slate-300
    },
  },

  compact: {
    id: 'compact',
    label: 'Compact',
    description: 'Vert, minimaliste et lisible',
    preview: '#0A5A3C',
    colors: {
      headerBg:    [10,  90,  60],
      headerText:  [255, 255, 255],
      accentBg:    [10,  90,  60],
      accentText:  [255, 255, 255],
      stripeBg:    [16,  185, 129],  // emerald vif
      labelColor:  [107, 114, 128],
      valueColor:  [17,  24,  39],
      borderColor: [209, 250, 229],
    },
  },

  boarding: {
    id: 'boarding',
    label: 'Boarding Pass',
    description: 'Style carte d\'embarquement classique',
    preview: '#1A1A1A',
    colors: {
      headerBg:    [26,  26,  26],
      headerText:  [255, 255, 255],
      accentBg:    [26,  26,  26],
      accentText:  [255, 255, 255],
      stripeBg:    [234, 179, 8],    // jaune doré
      labelColor:  [107, 114, 128],
      valueColor:  [17,  24,  39],
      borderColor: [229, 231, 235],
    },
  },
};