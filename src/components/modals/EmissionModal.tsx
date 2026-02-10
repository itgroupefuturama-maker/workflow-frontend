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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Émission des billets</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ligne {ligne?.id?.slice(-8) || '—'} • {ligne?.prospectionLigne?.itineraire || '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FiX size={24} />
          </button>
        </div>

        <div className='p-8'>
          <p>Montant Billet Companie Devise : {ligne?.prospectionLigne?.montantBilletCompagnieDevise || '—'}</p>
          <p>Montant Service Companie Devise : {ligne?.prospectionLigne?.montantServiceCompagnieDevise || '—'}</p>
          <p>Montant penalite Companie Devise : {ligne?.prospectionLigne?.montantPenaliteCompagnieDevise || '—'}</p>
          <p>Montant Billet Companie Ariary : {ligne?.prospectionLigne?.montantBilletCompagnieAriary || '—'}</p>
          <p>Montant Service Companie Ariary : {ligne?.prospectionLigne?.montantServiceCompagnieAriary || '—'}</p>
          <p>Montant penalite Companie Ariary : {ligne?.prospectionLigne?.montantPenaliteCompagnieAriary || '—'}</p>
          <p>Montant Billet client Devise : {ligne?.prospectionLigne?.montantBilletClientDevise || '—'}</p>
          <p>Montant Service client Devise : {ligne?.prospectionLigne?.montantServiceClientDevise || '—'}</p>
          <p>Montant penalite client Devise : {ligne?.prospectionLigne?.montantPenaliteClientDevise || '—'}</p>
          <p>Montant Billet client Ariary : {ligne?.prospectionLigne?.montantBilletClientAriary || '—'}</p>
          <p>Montant Service client Ariary : {ligne?.prospectionLigne?.montantServiceClientAriary || '—'}</p>
          <p>Montant penalite client Ariary : {ligne?.prospectionLigne?.montantPenaliteClientAriary || '—'}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Taux commun */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de change Ariary <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="1"
              value={tauxChange}
              onChange={e => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Liste des passagers à émettre */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-blue-600" />
              Émission par passager ({passagers.length})
            </h3>

            {passagers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Aucun passager associé à cette ligne
              </div>
            ) : (
              <div className="space-y-6">
                {passagers.map((p, index) => (
                  <div key={p.billetId} className="border rounded-lg p-5 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium text-lg">{p.nomComplet}</p>
                        <p className="text-sm text-gray-600">
                          Billet ID: {p.billetId.slice(-8)}...
                        </p>
                      </div>
                      {passagers.length > 1 && (
                        <button
                          onClick={() => removePassager(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Numéro de billet */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Numéro de billet <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={p.numeroBillet}
                          onChange={e => handleNumeroChange(index, e.target.value)}
                          placeholder="ex: TKT-2026-001"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Upload PDF */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Document PDF du billet <span className="text-red-600">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1">
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
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400">
                              {p.pjBillet ? (
                                <div className="text-sm">
                                  <FiCheck className="inline text-green-600 mr-2" />
                                  {p.pjBillet.name} ({(p.pjBillet.size / 1024).toFixed(1)} KB)
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  <FiUpload className="mx-auto mb-2" size={24} />
                                  Cliquez pour sélectionner (PDF)
                                </div>
                              )}
                            </div>
                          </label>

                          {p.pjBillet && (
                            <button
                              type="button"
                              onClick={() => handleFileChange(index, null)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 size={18} />
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
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            <span className="text-red-600">*</span> champs obligatoires
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={passagers.length === 0}
            >
              Confirmer l'émission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmissionModal;