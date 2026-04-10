import { useState } from "react";
import { FiCheck, FiDollarSign, FiHome, FiInfo, FiX } from "react-icons/fi";

// --- Tes Types (exportés pour être réutilisables) ---
export type DeviseHotel = {
  id: string;
  nuiteDevise: string;
  nuiteAriary: string;
  montantDevise: number;
  montantAriary: number;
  tauxChange: number;
  createdAt: number;
  updatedAt: number;
  devise: {
    id: string;
    devise: string;
    status: string;
  }
};

type BenchmarkingLigneOption = {
  id: string;
  hotel: string;
  plateforme: { id: string; code: string; nom: string; status: string };
  typeChambre: { id: string; type: string; capacite: number };
  deviseHotel: DeviseHotel[];
  nuiteDevise: number;
  nombreChambre: number;
  devise: string;
  tauxChange: number;
  nuiteAriary: number;
  montantDevise: number;
  montantAriary: number;
  isRefundable: boolean;
  isBenchMark: boolean;
};

interface ConfirmBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isRefundable: boolean, benchmarkingLigneId: string) => void;
  isLoading: boolean;
  lignes: BenchmarkingLigneOption[];
}

// --- Ton Composant ---
const ConfirmBenchmarkModal: React.FC<ConfirmBenchmarkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  lignes,
}) => {
  const [isRefundable, setIsRefundable] = useState(false);
  const [selectedLigneId, setSelectedLigneId] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedLigneId) return;
    onConfirm(isRefundable, selectedLigneId);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-6 py-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <FiCheck className="text-green-600" size={20} />
              </div>
              Définir comme Référence
            </h3>
            <p className="text-xs text-slate-500 mt-1">Sélectionnez la meilleure offre pour le benchmark</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Section Sélection de la Ligne */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FiHome size={12} /> Options de Benchmarking
            </label>
            
            <div className="grid gap-3">
              {lignes.map((ligne) => (
                <div
                  key={ligne.id}
                  onClick={() => setSelectedLigneId(ligne.id)}
                  className={`relative group p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedLigneId === ligne.id
                      ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-50'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  {/* En-tête hotel + type */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${selectedLigneId === ligne.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {ligne.hotel}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {ligne.plateforme?.nom}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-medium">
                          {ligne.typeChambre?.type}
                        </span>
                      </div>
                    </div>
                    {selectedLigneId === ligne.id && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <FiCheck size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* ✅ Itération sur deviseHotel au lieu des champs plats */}
                  {ligne.deviseHotel && ligne.deviseHotel.length > 0 ? (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {ligne.deviseHotel.map((dv) => (
                        <div key={dv.id} className="flex items-center justify-between">
                          {/* Prix nuit */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <FiDollarSign size={10} />
                            1 {dv.devise?.devise} = {dv.tauxChange?.toLocaleString('fr-FR')} Ar
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">
                              {Number(dv.nuiteDevise)?.toLocaleString('fr-FR')} {dv.devise?.devise}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                              ≈ {Number(dv.nuiteAriary)?.toLocaleString('fr-FR')} Ar
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      Aucune devise renseignée
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section Politique de Remboursement */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Conditions de l'Offre
            </label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setIsRefundable(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  isRefundable ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Remboursable
              </button>
              <button
                onClick={() => setIsRefundable(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  !isRefundable ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Non Remboursable
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex gap-3 items-start border border-blue-100">
            <FiInfo className="text-blue-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-800 leading-relaxed">
              En confirmant, cette ligne deviendra la <strong>référence de prix</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedLigneId}
            className="flex-[2] py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Traitement..." : "Valider le Benchmark"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LE FIX EST ICI : IL FAUT EXPORTER LE COMPOSANT ---
export default ConfirmBenchmarkModal;