// SuiviActions.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store';

import {
  patchDevisAMettreAApprouver,
  patchDevisApprouve,
  patchBcClientAMettreAApprouver,
  patchBilletEmis,
  patchFactureEmise,
  patchFactureReglee,
  fetchAttestationSuivi,
  fetchAttestationEnteteDetail,
} from '../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';

interface SuiviActionsProps {
  devisModuleId: string;
  suiviId: string;
  evolution: string;
  statut: string;
  referenceBcClient: string | null;
  referenceFacClient: string | null;
  dateReglement: string | null;
  selectedId: string; // pour recharger après action
}

const SuiviActions: React.FC<SuiviActionsProps> = ({
  devisModuleId,
  suiviId,
  evolution,
  statut,
  referenceBcClient,
  referenceFacClient,
  dateReglement,
  selectedId,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleAction = async (actionFn: any, payload: any) => {
    try {
      await dispatch(actionFn(payload)).unwrap();
      dispatch(fetchAttestationSuivi(selectedId));
      dispatch(fetchAttestationEnteteDetail(selectedId));
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-5">Actions disponibles</h3>

        <div className="flex flex-wrap gap-4">
            {/* 1. Mettre le devis à approuver */}
            <button
            disabled={!(evolution === 'DEVIS' && statut === 'CREER')}
            onClick={() => handleAction(patchDevisAMettreAApprouver, { devisModuleId, suiviId })}
            className={`px-5 py-2.5 rounded transition ${
                evolution === 'DEVIS' && statut === 'CREER'
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            >
            Mettre le devis à approuver
            </button>

            {/* 2. Approuver le devis */}
            <button
            disabled={!(evolution === 'DEVIS' && statut === 'DEVIS_A_APPROUVER')}
            onClick={() => handleAction(patchDevisApprouve, { devisModuleId, suiviId })}
            className={`px-5 py-2.5 rounded transition ${
                evolution === 'DEVIS' && statut === 'DEVIS_A_APPROUVER'
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            >
            Approuver le devis
            </button>

            {/* 3. Mettre BC à approuver */}
            <button
            disabled={statut !== 'DEVIS_APPROUVE'}
            onClick={() => handleAction(patchBcClientAMettreAApprouver, { devisModuleId, suiviId })}
            className={`px-5 py-2.5 rounded transition ${
                statut === 'DEVIS_APPROUVE'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            >
            Mettre BC à approuver
            </button>

            {/* 4. Billet émis */}
            <div className="flex items-end gap-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence BC Client</label>
                <input
                disabled={statut !== 'BC_CLIENT_A_APPROUVER' || !!referenceBcClient}
                type="text"
                placeholder="BC-2026-001"
                className="border border-gray-300 rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                id="ref-bc-suivi"
                />
            </div>
            <button
                disabled={statut !== 'BC_CLIENT_A_APPROUVER' || !!referenceBcClient}
                onClick={async () => {
                const input = document.getElementById('ref-bc-suivi');
                const ref = input?.value.trim();
                if (!ref) return alert('Veuillez saisir la référence BC');
                if (confirm(`Confirmer l'émission du billet avec BC ${ref} ?`)) {
                    await handleAction(patchBilletEmis, { devisModuleId, suiviId, referenceBcClient: ref });
                    input.value = '';
                }
                }}
                className={`px-5 py-2.5 rounded transition ${
                statut === 'BC_CLIENT_A_APPROUVER' && !referenceBcClient
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
            >
                Billet émis
            </button>
            </div>

            {/* 5. Facture émise */}
            <div className="flex items-end gap-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence Facture Client</label>
                <input
                disabled={statut !== 'BILLET_EMIS'}
                type="text"
                placeholder="FAC-2026-045"
                className="border border-gray-300 rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                id="ref-fac-suivi"
                />
            </div>
            <button
                disabled={statut !== 'BILLET_EMIS'}
                onClick={async () => {
                const input = document.getElementById('ref-fac-suivi');
                const ref = input?.value.trim();
                if (!ref) return alert('Veuillez saisir la référence facture');
                if (confirm(`Confirmer l'émission de la facture ${ref} ?`)) {
                    await handleAction(patchFactureEmise, { devisModuleId, suiviId, referenceFacClient: ref });
                    input.value = '';
                }
                }}
                className={`px-5 py-2.5 rounded transition ${
                statut === 'BILLET_EMIS'
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
            >
                Facture émise
            </button>
            </div>

            {/* 6. Facture réglée */}
            <button
            disabled={!(statut === 'FACTURE_EMISE' && referenceFacClient && dateReglement === null)}
            onClick={() => handleAction(patchFactureReglee, { devisModuleId, suiviId })}
            className={`px-5 py-2.5 rounded transition ${
                statut === 'FACTURE_EMISE' && referenceFacClient && dateReglement === null
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            >
            Facture réglée
            </button>
        </div>
        </div>
  );
};

export default SuiviActions;