import { useState } from 'react';
import { FiCheck, FiImage, FiX } from 'react-icons/fi';

export interface DeviseOption {
  id: string;
  devise: string;
}

interface ApprouverDevisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preuveApprobation: File, deviseId?: string) => void;
  isLoading: boolean;
  deviseOptions: DeviseOption[];
}

const ApprouverDevisModal: React.FC<ApprouverDevisModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  deviseOptions,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deviseId, setDeviseId] = useState('');

  if (!isOpen) return null;

  const needsDeviseChoice = deviseOptions.length > 1;
  const canConfirm = !!file && (!needsDeviseChoice || !!deviseId);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleConfirm = () => {
    if (!file || (needsDeviseChoice && !deviseId)) return;
    onConfirm(file, deviseId || deviseOptions[0]?.id);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setDeviseId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-6 py-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <FiCheck className="text-emerald-600" size={20} />
              </div>
              Approuver le devis
            </h3>
            <p className="text-xs text-slate-500 mt-1">Preuve de validation client requise</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Preuve d'approbation */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Capture d'écran de la validation client <span className="text-red-500">*</span>
            </label>
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400">
                  <img src={previewUrl} alt="Aperçu" className="w-full max-h-48 object-contain bg-slate-50" />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 text-white text-xs px-3 py-1.5 truncate">
                    {file?.name}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                  <FiImage className="mx-auto text-slate-300 mb-2" size={28} />
                  <p className="text-xs text-slate-400">Cliquer pour choisir une image</p>
                </div>
              )}
            </label>
          </div>

          {/* Devise à retenir — uniquement si plusieurs devises distinctes */}
          {needsDeviseChoice && (
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Devise à retenir pour ce devis <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {deviseOptions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDeviseId(d.id)}
                    className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                      deviseId === d.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {d.devise}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Ce devis référence plusieurs devises — choisissez celle qui fera foi pour la suite (transformation, facturation).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm}
            className="flex-[2] py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Approbation...' : 'Approuver le devis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprouverDevisModal;
