import { useState } from 'react';
import { PDF_DESIGNS } from '../config/pdf-designs';
import { generateDevisPdf } from '../generators/devis.generator';
import { generateAttestationPdf } from '../generators/attestation.generator';
import type { BilletStyleId, PdfAudience, PdfDesignId } from '../types/pdf-design.types';
import type {DevisListItem } from '../types/devis.types';
import type { AttestationEnteteItem, AttestationPdfMode, AttestationPdfSelection } from '../types/attestation.types';
import type { HotelPdfSelection, HotelProspectionEnteteItem } from '../types/hotel.types';
import { generateHotelPdf } from '../generators/hotel.generator';
import type { AssuranceDevisDetail } from '../types/assurance.types';
import { generateAssurancePdf } from '../generators/assurance.generator';
import type { VisaDevisDetail } from '../types/visa.types';
import { generateVisaPdf } from '../generators/visa.generator';
import type { Passager } from '../../../../../../app/front_office/parametre_liste_passager/passagerListeSlice';
import { generatePassagerPdf, type PassagerPdfFilters } from '../generators/passager.generator';
import { generateBilletPassagerPdf, type BilletPassagerData } from '../generators/billet-passager.generator';
import { BILLET_STYLES } from '../config/billet-styles';

// ─── Config globale ──────────────────────────────────────────────────
export function usePdfConfig() {
  const get   = (k: string) => localStorage.getItem(k) ?? undefined;
  const set   = (k: string, v: string) => localStorage.setItem(k, v);
  const clear = (k: string) => localStorage.removeItem(k);
  return {
    getLogo:          () => get('pdf_logo'),
    setLogo:          (v: string) => set('pdf_logo', v),
    clearLogo:        () => clear('pdf_logo'),
    getStamp:         () => get('pdf_stamp'),
    setStamp:         (v: string) => set('pdf_stamp', v),
    clearStamp:       () => clear('pdf_stamp'),
    getDefaultDesign: () => (get('pdf_design') ?? 'classique') as PdfDesignId,
    setDefaultDesign: (v: PdfDesignId) => set('pdf_design', v),
  };
}

// ─── Hooks spécialisés ───────────────────────────────────────────────
export const useDevisPdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    data: DevisListItem,
    designId?: PdfDesignId,
    audience: PdfAudience = 'client',
    filename?: string
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      generateDevisPdf(data, d, audience, config.getLogo(), config.getStamp(), filename);
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    data: DevisListItem,
    designId?: PdfDesignId,
    audience: PdfAudience = 'client'
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      const doc = generateDevisPdf(data, d, audience, config.getLogo(), config.getStamp(), undefined, { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};

// Dans hooks/usePdfGenerator.ts — remplacer useAttestationPdf

export const useAttestationPdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    data: AttestationEnteteItem[],
    selection: AttestationPdfSelection[],
    mode: AttestationPdfMode,          // ← nouveau
    designId?: PdfDesignId,
    filename?: string
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      generateAttestationPdf(data, selection, mode, d, config.getLogo(), config.getStamp(), filename);
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    data: AttestationEnteteItem[],
    selection: AttestationPdfSelection[],
    mode: AttestationPdfMode,          // ← nouveau
    designId?: PdfDesignId
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      const doc = generateAttestationPdf(data, selection, mode, d, config.getLogo(), config.getStamp(), undefined, { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};

export const useAssurancePdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    data: AssuranceDevisDetail,
    audience: PdfAudience,
    designId?: PdfDesignId,
    filename?: string
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      generateAssurancePdf(data, audience, d, config.getLogo(), config.getStamp(), filename);
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    data: AssuranceDevisDetail,
    audience: PdfAudience,
    designId?: PdfDesignId
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      const doc = generateAssurancePdf(data, audience, d, config.getLogo(), config.getStamp(), undefined, { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};

export const useHotelPdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    data: HotelProspectionEnteteItem,
    selection: HotelPdfSelection[],
    audience: PdfAudience = 'client',
    designId?: PdfDesignId,
    filename?: string
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      generateHotelPdf(data, selection, d, audience, config.getLogo(), config.getStamp(), filename);
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    data: HotelProspectionEnteteItem,
    selection: HotelPdfSelection[],
    audience: PdfAudience = 'client',
    designId?: PdfDesignId
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      const doc = generateHotelPdf(data, selection, d, audience, config.getLogo(), config.getStamp(), undefined, { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};

export const useVisaPdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    data: VisaDevisDetail,
    audience: PdfAudience,
    designId?: PdfDesignId,
    filename?: string
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      generateVisaPdf(data, audience, d, config.getLogo(), config.getStamp(), filename);
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    data: VisaDevisDetail,
    audience: PdfAudience,
    designId?: PdfDesignId
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      const doc = generateVisaPdf(data, audience, d, config.getLogo(), config.getStamp(), undefined, { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url  = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};

export const usePassagerPdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    passagers: Passager[],
    filters: PassagerPdfFilters,
    designId?: PdfDesignId,
    filename?: string
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      generatePassagerPdf(passagers, filters, d, config.getLogo(), config.getStamp(), filename);
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    passagers: Passager[],
    filters: PassagerPdfFilters,
    designId?: PdfDesignId
  ) => {
    setLoading(true);
    try {
      const d = PDF_DESIGNS[designId ?? config.getDefaultDesign()];
      const doc = generatePassagerPdf(passagers, filters, d, config.getLogo(), config.getStamp(), undefined, { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url  = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};

export const useBilletPassagerPdf = () => {
  const [loading, setLoading] = useState(false);
  const config = usePdfConfig();

  const generate = (
    data: BilletPassagerData,
    styleId: BilletStyleId = 'elegant'
  ) => {
    setLoading(true);
    try {
      const style = BILLET_STYLES[styleId];
      generateBilletPassagerPdf(data, style, config.getLogo());
    } finally {
      setLoading(false);
    }
  };

  const preview = (
    data: BilletPassagerData,
    styleId: BilletStyleId = 'elegant'
  ) => {
    setLoading(true);
    try {
      const style = BILLET_STYLES[styleId];
      const doc = generateBilletPassagerPdf(data, style, config.getLogo(), { returnDoc: true });
      if (doc) {
        const blob = doc.output('blob');
        const url  = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } finally {
      setLoading(false);
    }
  };

  return { generate, preview, loading };
};