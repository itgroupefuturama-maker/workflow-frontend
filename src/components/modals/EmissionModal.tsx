// src/components/modals/EmissionModal.tsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiCheck, FiTrash2, FiCheckCircle } from 'react-icons/fi';

interface PassagerEmission {
  billetId: string;           // ID du billet (de la table billet)
  infoId: string;             // clientbeneficiaireInfoId
  nomComplet: string;
  numeroBillet: string;
  pjBillet: File | null;
}

interface EmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
  numeroBillet?: string;      // plus vraiment utilisé car multi
}

const EmissionModal: React.FC<EmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
}) => {
  const [tauxChange, setTauxChange] = useState(ligne?.resaTauxEchange || 4850);

  // Liste des passagers à émettre (pré-remplis depuis ligne.billet)
  const [passagers, setPassagers] = useState<PassagerEmission[]>([]);

  useEffect(() => {
    if (isOpen && ligne?.billet && ligne.billet.length > 0) {
      const prefilled = ligne.billet.map((b: any) => {
        const info = b.clientbeneficiaireInfo;
        const nom = `${info.prenom || ''} ${info.nom || ''}`.trim() || 'Passager inconnu';
        return {
          billetId: b.id,
          infoId: info.id,
          nomComplet: nom,
          numeroBillet: '',           // à remplir par l'utilisateur
          pjBillet: null,
        };
      });
      setPassagers(prefilled);
    }
  }, [isOpen, ligne]);

  const handleNumeroChange = (index: number, value: string) => {
    const newPassagers = [...passagers];
    newPassagers[index].numeroBillet = value;
    setPassagers(newPassagers);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newPassagers = [...passagers];
    newPassagers[index].pjBillet = file;
    setPassagers(newPassagers);
  };

  const removePassager = (index: number) => {
    const newPassagers = passagers.filter((_, i) => i !== index);
    setPassagers(newPassagers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (passagers.length === 0) {
      alert('Aucun passager à émettre');
      return;
    }

    const hasMissing = passagers.some(p => !p.numeroBillet.trim() || !p.pjBillet);
    if (hasMissing) {
      alert('Chaque passager doit avoir un numéro de billet ET un fichier PDF');
      return;
    }

    // Préparation des données pour onSubmit (qui ira dans le thunk)
    const data = {
      emissionTauxChange: Number(tauxChange),
      billets: passagers.map(p => ({
        billetId: p.billetId,
        numeroBillet: p.numeroBillet.trim(),
      })),
      pjBillets: passagers.map(p => p.pjBillet), // tableau de Files
    };

    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-5 flex justify-between items-center">
          <div className="text-slate-800">
            <h2 className="text-2xl font-bold">Émission des billets</h2>
            <p className="text-slate-800 mt-1 flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                Destination
              </span>
              <span>•</span>
              <span>{ligne?.prospectionLigne?.itineraire || '—'}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-800/80 hover:text-slate-800 hover:bg-slate-800/10 p-2 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Section Informations Tarifaires */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              Informations tarifaires
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tarifs Compagnie en Devise */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Compagnie (Devise)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Billet</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantBilletCompagnieDevise || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Service</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantServiceCompagnieDevise || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-600">Pénalité</span>
                    <span className="font-semibold text-red-600">
                      {ligne?.prospectionLigne?.montantPenaliteCompagnieDevise || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarifs Compagnie en Ariary */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Compagnie (Ariary)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Billet</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantBilletCompagnieAriary || '—'} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Service</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantServiceCompagnieAriary || '—'} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-600">Pénalité</span>
                    <span className="font-semibold text-red-600">
                      {ligne?.prospectionLigne?.montantPenaliteCompagnieAriary || '—'} Ar
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarifs Client en Devise */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Client (Devise)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Billet</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantBilletClientDevise || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Service</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantServiceClientDevise || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-600">Pénalité</span>
                    <span className="font-semibold text-red-600">
                      {ligne?.prospectionLigne?.montantPenaliteClientDevise || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarifs Client en Ariary */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Client (Ariary)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Billet</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantBilletClientAriary || '—'} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Service</span>
                    <span className="font-semibold text-gray-900">
                      {ligne?.prospectionLigne?.montantServiceClientAriary || '—'} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-600">Pénalité</span>
                    <span className="font-semibold text-red-600">
                      {ligne?.prospectionLigne?.montantPenaliteClientAriary || '—'} Ar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Taux de change */}
          <div className="p-6 bg-white border-b border-gray-100">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-blue-600">💱</span>
                Taux de change Ariary <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={tauxChange}
                  onChange={e => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-medium"
                  placeholder="Ex: 4500"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  Ar
                </span>
              </div>
            </div>
          </div>

          {/* Section Liste des passagers */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="text-blue-600" size={20} />
                </div>
                Émission par passager
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {passagers.length}
                </span>
              </h3>
            </div>

            {passagers.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 font-medium">Aucun passager associé à cette ligne</p>
              </div>
            ) : (
              <div className="space-y-5">
                {passagers.map((p, index) => (
                  <div key={p.billetId} className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{p.nomComplet}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">
                              {p.billetId.slice(-8)}
                            </span>
                          </p>
                        </div>
                      </div>
                      {passagers.length > 1 && (
                        <button
                          onClick={() => removePassager(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Retirer ce passager"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Numéro de billet */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Numéro de billet <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={p.numeroBillet}
                          onChange={e => handleNumeroChange(index, e.target.value)}
                          placeholder="ex: TKT-2026-001"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                          required
                        />
                      </div>

                      {/* Upload PDF */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Document PDF du billet <span className="text-red-600">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={e => {
                                if (e.target.files?.[0]) {
                                  handleFileChange(index, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                              p.pjBillet 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}>
                              {p.pjBillet ? (
                                <div className="text-sm">
                                  <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-1">
                                    <FiCheck size={20} />
                                    <span>Fichier sélectionné</span>
                                  </div>
                                  <p className="text-gray-600 text-xs">
                                    {p.pjBillet.name} • {(p.pjBillet.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  <FiUpload className="mx-auto mb-2 text-gray-400" size={28} />
                                  <p className="font-medium text-sm">Cliquez pour sélectionner</p>
                                  <p className="text-xs mt-1">Format PDF uniquement</p>
                                </div>
                              )}
                            </div>
                          </label>

                          {p.pjBillet && (
                            <button
                              type="button"
                              onClick={() => handleFileChange(index, null)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg transition-colors"
                              title="Supprimer le fichier"
                            >
                              <FiTrash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 bg-gradient-to-r border-gray-100 from-gray-50 to-gray-100 px-6 py-5 flex justify-between items-center">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg">*</span>
            <span className="font-medium">Champs obligatoires</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 font-medium transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              disabled={passagers.length === 0}
            >
              <FiCheckCircle size={20} />
              Confirmer l'émission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmissionModal;