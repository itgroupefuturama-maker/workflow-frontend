import React, { useRef, useState } from 'react';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { PDF_DESIGNS } from '../config/pdf-designs';
import type { PdfDesignId } from '../types/pdf-design.types';
import { usePdfConfig } from '../hooks/usePdfGenerator';

const General: React.FC = () => {
  const config = usePdfConfig();
  const [logo,   setLogoState]   = useState(config.getLogo());
  const [stamp,  setStampState]  = useState(config.getStamp());
  const [design, setDesignState] = useState<PdfDesignId>(config.getDefaultDesign());
  const logoRef  = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);

  // const toBase64 = (file: File): Promise<string> =>
  //   new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
    configSetter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez importer une image PNG ou JPG');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      // Vérifier que le base64 est complet
      if (!b64 || !b64.startsWith('data:image')) {
        alert('Erreur lors de la lecture du fichier');
        return;
      }
      setter(b64);
      configSetter(b64);
      console.log('Image chargée :', file.name, '— taille base64 :', b64.length);
    };
    reader.onerror = () => alert('Erreur lecture fichier');
    reader.readAsDataURL(file);
  };

  const handleDesign = (id: PdfDesignId) => {
    setDesignState(id); config.setDefaultDesign(id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-8">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paramètres</p>
        <h2 className="text-base font-semibold text-gray-800 mt-0.5">Général</h2>
        <p className="text-xs text-gray-400 mt-1">
          Ces paramètres s'appliquent à tous les PDF générés depuis l'application.
        </p>
      </div>

      {/* ── Design ── */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-3">Design des PDFs</p>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(PDF_DESIGNS).map(d => (
            <button
              key={d.id}
              onClick={() => handleDesign(d.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                ${design === d.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              {/* Aperçu couleur */}
              <div className="w-full h-10 rounded-lg flex flex-col overflow-hidden">
                <div className="h-4 w-full" style={{ background: d.preview }} />
                <div className="flex-1 bg-gray-50 border-b border-gray-100" />
                <div className="h-2 w-full" style={{ background: d.preview }} />
              </div>
              <span className="text-xs font-medium text-gray-800">{d.label}</span>
              <span className="text-xs text-gray-400 text-center leading-tight">{d.description}</span>
              {design === d.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                  <FiCheck size={11} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Logo + Cachet ── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Logo (en-tête)', value: logo, ref: logoRef,
            onUpload: (b64: string) => { setLogoState(b64); config.setLogo(b64); },
            onClear: () => { setLogoState(undefined); config.clearLogo(); } },
          { label: 'Cachet (bas de page)', value: stamp, ref: stampRef,
            onUpload: (b64: string) => { setStampState(b64); config.setStamp(b64); },
            onClear: () => { setStampState(undefined); config.clearStamp(); } },
        ].map(slot => (
          <div key={slot.label}>
            <p className="text-xs font-medium text-gray-500 mb-2">{slot.label}</p>
            {slot.value ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                <img src={slot.value} alt="" className="w-10 h-10 object-contain rounded" />
                <span className="text-xs text-green-700 flex-1 font-medium">Chargé</span>
                <button onClick={slot.onClear} className="text-gray-300 hover:text-red-400 transition-colors">
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => slot.ref.current?.click()}
                  className="w-full flex flex-col items-center gap-2 p-5 border-2 border-dashed
                    border-gray-200 rounded-xl text-gray-400 hover:border-gray-400 hover:text-gray-500
                    transition-colors"
                >
                  <FiUpload size={18} />
                  <span className="text-xs">Importer PNG / JPG</span>
                </button>
                <input
                  ref={slot.ref} type="file" accept="image/*" className="hidden"
                  onChange={e => handleFile(e, slot.onUpload, slot.onUpload)}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default General;