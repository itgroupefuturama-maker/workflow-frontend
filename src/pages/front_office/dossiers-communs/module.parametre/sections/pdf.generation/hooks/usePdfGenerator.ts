import { useState } from 'react';
import { PDF_DESIGNS } from '../config/pdf-designs';
import { generateDevisPdf } from '../generators/devis.generator';
import { generateAttestationPdf } from '../generators/attestation.generator';
import type { PdfAudience, PdfDesignId } from '../types/pdf-design.types';
import type {DevisListItem } from '../types/devis.types';
import type { AttestationEnteteItem, AttestationPdfMode, AttestationPdfSelection } from '../types/attestation.types';
import type { HotelPdfSelection, HotelProspectionEnteteItem } from '../types/hotel.types';
import { generateHotelPdf } from '../generators/hotel.generator';

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