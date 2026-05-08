import type { DevisListItem } from '../types/devis.types';
import type { PdfDesignId, PdfAudience } from '../types/pdf-design.types';
import { PDF_DESIGNS } from '../config/pdf-designs';
import { useDevisPdf } from '../hooks/usePdfGenerator';
import { FiDownload, FiChevronDown, FiUsers, FiBarChart2, FiEye } from 'react-icons/fi';
import { useState } from 'react';

interface Props {
  data: DevisListItem;
  filename?: string;
}

export const PdfDownloadButton: React.FC<Props> = ({ data, filename }) => {
  const { generate, preview, loading } = useDevisPdf();
  const [open, setOpen] = useState(false);

  const handleGenerate = (audience: PdfAudience, designId?: PdfDesignId) => {
    generate(data, designId, audience, filename);
    setOpen(false);
  };

  const handlePreview = (audience: PdfAudience, designId?: PdfDesignId) => {
    preview(data, designId, audience);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-stretch rounded-lg overflow-hidden border border-slate-200 shadow-sm">

        {/* Action principale : client, design par défaut */}
        <button
          onClick={() => handleGenerate('client')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700
            text-xs font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <FiDownload size={13} />
          {loading ? 'Génération…' : 'PDF Client'}
        </button>

        <div className="w-px bg-slate-200" />

        {/* Bouton direction rapide */}
        <button
          onClick={() => handleGenerate('direction')}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-500
            text-xs font-medium hover:bg-slate-100 disabled:opacity-50 transition-colors"
          title="PDF Direction (usage interne)"
        >
          <FiBarChart2 size={12} />
          Direction
        </button>

        <div className="w-px bg-slate-200" />

        {/* Dropdown */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center px-2 bg-white text-slate-400
            hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <FiChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-slate-200
            rounded-xl shadow-lg overflow-hidden w-64">

            {/* Section Client */}
            <div className="px-3 pt-3 pb-1 flex items-center gap-2">
              <FiUsers size={11} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Version client
              </span>
            </div>
            {Object.values(PDF_DESIGNS).map(d => (
              <div
                key={`client-${d.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: d.preview }} />
                <span className="text-xs text-slate-700 flex-1">{d.label}</span>

                {/* Voir */}
                <button
                  onClick={() => handlePreview('client', d.id as PdfDesignId)}
                  disabled={loading}
                  title="Aperçu dans un nouvel onglet"
                  className="p-1 rounded hover:bg-slate-200 text-slate-400
                    hover:text-slate-600 disabled:opacity-50 transition-colors"
                >
                  <FiEye size={13} />
                </button>

                {/* Télécharger */}
                <button
                  onClick={() => handleGenerate('client', d.id as PdfDesignId)}
                  disabled={loading}
                  title="Télécharger"
                  className="p-1 rounded hover:bg-slate-200 text-slate-400
                    hover:text-slate-600 disabled:opacity-50 transition-colors"
                >
                  <FiDownload size={13} />
                </button>
              </div>
            ))}

            <div className="mx-3 my-1 border-t border-slate-100" />

            {/* Section Direction */}
            <div className="px-3 pt-1 pb-1 flex items-center gap-2">
              <FiBarChart2 size={11} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Version direction
              </span>
            </div>
            {Object.values(PDF_DESIGNS).map(d => (
              <div
                key={`dir-${d.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: d.preview }} />
                <span className="text-xs text-slate-700 flex-1">{d.label}</span>

                {/* Voir */}
                <button
                  onClick={() => handlePreview('direction', d.id as PdfDesignId)}
                  disabled={loading}
                  title="Aperçu dans un nouvel onglet"
                  className="p-1 rounded hover:bg-slate-200 text-slate-400
                    hover:text-slate-600 disabled:opacity-50 transition-colors"
                >
                  <FiEye size={13} />
                </button>

                {/* Télécharger */}
                <button
                  onClick={() => handleGenerate('direction', d.id as PdfDesignId)}
                  disabled={loading}
                  title="Télécharger"
                  className="p-1 rounded hover:bg-slate-200 text-slate-400
                    hover:text-slate-600 disabled:opacity-50 transition-colors"
                >
                  <FiDownload size={13} />
                </button>
              </div>
            ))}

            <div className="px-3 py-2 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700">
                La version direction inclut les commissions et marges.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};