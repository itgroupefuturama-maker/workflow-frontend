import { AlertTriangleIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AnnivClient } from '../types';
import type { AppDispatch } from '../../../../../app/store';
import { resetAllMiles, resetClientMiles } from '../../../../../app/front_office/paramatre_anniversaire/milesTransactionSlice';

type Mode = 'single' | 'all';

interface Props {
  mode: Mode;
  client?: AnnivClient;
  onClose: () => void;
  onSuccess?: () => void;
}

const ModalResetMiles = ({ mode, client, onClose, onSuccess }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [resetting, setResetting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);

  const info = client?.clientBeneficiaire?.clientbeneficiaireInfo?.[0];
  const nom  = info
    ? `${info.nom} ${info.prenom}`
    : client?.clientBeneficiaire?.libelle ?? '—';

  const handleReset = async () => {
    setResetting(true);
    setError(null);

    const result = mode === 'single' && client
      ? await dispatch(resetClientMiles(client.clientBeneficiaireId))
      : await dispatch(resetAllMiles());

    setResetting(false);

    const isRejected =
      mode === 'single'
        ? resetClientMiles.rejected.match(result)
        : resetAllMiles.rejected.match(result);

    if (isRejected) {
      setError((result as any).payload as string);
      return;
    }

    setDone(true);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-sm p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            {mode === 'single' ? 'Réinitialiser le solde' : 'Réinitialiser tous les soldes'}
          </h3>
          <button onClick={onClose} disabled={resetting}
            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-40">
            <XIcon size={15} strokeWidth={1.5} className="text-gray-400" />
          </button>
        </div>

        {/* Alerte */}
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-3">
          <AlertTriangleIcon size={16} strokeWidth={1.5} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-700">Action irréversible</p>
            {mode === 'single' ? (
              <p className="text-xs text-red-600">
                Le solde miles de <span className="font-medium">{nom}</span> sera remis à zéro.
                Cette action ne peut pas être annulée.
              </p>
            ) : (
              <p className="text-xs text-red-600">
                Le solde miles de <span className="font-medium">tous les clients</span> sera remis à zéro.
                Cette action ne peut pas être annulée.
              </p>
            )}
          </div>
        </div>

        {/* Récap client si mode single */}
        {mode === 'single' && client && (
          <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-900">{nom}</p>
              <p className="text-[11px] text-gray-400">{client.clientBeneficiaire.code}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Solde actuel</p>
              <p className="text-sm font-medium text-gray-900">
                {client.soldeMiles.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {done && (
          <p className="text-xs text-green-600 text-center font-medium">
            {mode === 'single' ? 'Solde réinitialisé avec succès !' : 'Tous les soldes ont été réinitialisés !'}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={resetting}
            className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
            Annuler
          </button>
          <button
            onClick={handleReset}
            disabled={resetting || done}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40"
          >
            <RotateCcwIcon size={13} strokeWidth={1.5} />
            {resetting ? 'Réinitialisation...' : 'Confirmer'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalResetMiles;