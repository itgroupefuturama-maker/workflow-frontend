import React from 'react';

type ConfirmDevisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: {
    detail: any;
    benchmarkLine: any;
    bookingData: any;
    clientData: any;
    commissionData: any;
    bookingPlateforme: any;
    clientPlateforme: any;
    nbChambreClient: number;
  };
  loading: boolean;
};

const ModalConfirmDevis: React.FC<ConfirmDevisModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  loading,
}) => {
  if (!isOpen) return null;

  const {
    detail,
    benchmarkLine,
    bookingData,
    clientData,
    commissionData,
    bookingPlateforme,
    clientPlateforme,
    nbChambreClient,
  } = data;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Confirmation d'envoi du devis
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Veuillez vérifier les données avant l'envoi
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Informations générales */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 pb-2 border-b border-neutral-200">
                Informations générales
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Benchmarking :</span>
                  <span className="ml-2 font-medium text-neutral-900">#{detail.numero}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Hôtel :</span>
                  <span className="ml-2 font-medium text-neutral-900">{benchmarkLine.hotel}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Type chambre :</span>
                  <span className="ml-2 font-medium text-neutral-900">{benchmarkLine.typeChambre?.type}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Nombre de nuits :</span>
                  <span className="ml-2 font-medium text-neutral-900">{detail.nuite}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Nombre de chambres :</span>
                  <span className="ml-2 font-medium text-neutral-900">{nbChambreClient}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Devise :</span>
                  <span className="ml-2 font-medium text-neutral-900">{benchmarkLine.devise}</span>
                </div>
              </div>
            </div>

            {/* Données Booking */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 pb-2 border-b border-neutral-200 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-neutral-500"></span>
                Plateforme Booking
              </h4>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Plateforme</div>
                    <div className="font-medium text-neutral-900">{bookingPlateforme.nom}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Nuitée (Devise)</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {bookingData.nuiteDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {benchmarkLine.devise}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Taux de change</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {bookingData.tauxChange.toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Nuitée (Ariary)</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {bookingData.nuiteAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Montant (Devise)</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {bookingData.montantDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {benchmarkLine.devise}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Montant Total (Ariary)</div>
                    <div className="font-mono font-semibold text-blue-700 text-base">
                      {bookingData.montantAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Données Client */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 pb-2 border-b border-neutral-200 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                Plateforme Client
              </h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Plateforme</div>
                    <div className="font-medium text-neutral-900">{clientPlateforme.nom}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Nuitée (Devise)</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {clientData.nuiteDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {benchmarkLine.devise}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Taux de change</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {clientData.tauxChange.toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Nuitée (Ariary)</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {clientData.nuiteAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Montant (Devise)</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {clientData.montantDevise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {benchmarkLine.devise}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Montant Total (Ariary)</div>
                    <div className="font-mono font-semibold text-blue-700 text-base">
                      {clientData.montantAriary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 pb-2 border-b border-neutral-200 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
                Commission
              </h4>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">% sur Prix Unitaire</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {commissionData.tauxPrixUnitaire.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} %
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Forfaitaire Unitaire</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {commissionData.forfaitaireUnitaire.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Forfaitaire Global</div>
                    <div className="font-mono font-medium text-neutral-900">
                      {commissionData.forfaitaireGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Montant Commission</div>
                    <div className="font-mono font-semibold text-emerald-700 text-base">
                      {commissionData.montantCommission.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmer et envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmDevis;