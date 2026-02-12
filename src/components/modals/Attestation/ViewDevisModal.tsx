// ViewDevisModal.tsx
import React from 'react';
import { API_URL } from '../../../service/env';

interface ViewDevisModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientBeneficiaireInfoId?: string | null;
  attestationEnteteId?: string | null;
  devisData: any | null;           // type exact à affiner selon ta structure réelle
  loading: boolean;
}

const ViewDevisModal: React.FC<ViewDevisModalProps> = ({
  isOpen,
  onClose,
  devisData,
  attestationEnteteId,
  loading,
}) => {
  if (!isOpen) return null;

  const handleOpenPdfPerson = () => {
    const pdfUrl = `${API_URL}/attestation/pdf/${devisData.clientBeneficiaire.id}/${devisData.attestationEntete.id}`;
    // Option 1 : Ouvrir dans un nouvel onglet (recommandé pour PDF)
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-800">
            Détails du Devis
          </h2>
          <div className="flex items-center gap-3">
            {/* BOUTON PDF ICI */}
            <button
              onClick={handleOpenPdfPerson}
              disabled={loading || !devisData.clientBeneficiaire.id || !devisData.attestationEntete.id}
              className={`
                px-4 py-2 rounded-lg text-white font-medium transition
                ${loading || !devisData.clientBeneficiaire.id || !devisData.attestationEntete.id
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
                }
              `}
            >
              {loading ? 'Chargement...' : 'Voir PDF Par personne'}
            </button>

            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des informations du devis...</p>
            </div>
          ) : !devisData ? (
            <div className="text-center py-12 text-red-600">
              <p>Impossible de charger les données du devis.</p>
              <p className="text-sm mt-2">Veuillez réessayer ou contacter le support.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Client Bénéficiaire */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Client Bénéficiaire
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Nom complet</dt>
                    <dd className="font-medium">
                      {devisData.clientBeneficiaire?.nom} {devisData.clientBeneficiaire?.prenom}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Nationalité</dt>
                    <dd>{devisData.clientBeneficiaire?.nationalite || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Type document</dt>
                    <dd>{devisData.clientBeneficiaire?.typeDoc || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Référence document</dt>
                    <dd>{devisData.clientBeneficiaire?.referenceDoc || '—'}</dd>
                  </div>
                </div>
              </section>

              {/* 2. Devis Module */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Informations Devis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Référence</dt>
                    <dd className="font-medium">{devisData.devisModule?.reference || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Total général</dt>
                    <dd className="font-bold text-indigo-700">
                      {devisData.devisModule?.totalGeneral?.toLocaleString('fr-FR') || '—'} Ar
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Statut</dt>
                    <dd>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {devisData.devisModule?.statut || '—'}
                      </span>
                    </dd>
                  </div>
                </div>
              </section>

              {/* 3. Lignes concernées */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Lignes associées
                </h3>
                {devisData.lignes?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vol</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itinéraire</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PU Ar</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {devisData.lignes.map((ligne: any) => (
                          <tr key={ligne.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{ligne.numeroVol}</td>
                            <td className="px-4 py-3 text-sm">{ligne.itineraire}</td>
                            <td className="px-4 py-3 text-sm text-center">{ligne.classe}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {ligne.puAriary?.toLocaleString('fr-FR') || '—'} Ar
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucune ligne détaillée disponible</p>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDevisModal;