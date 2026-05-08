import { GiftIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AnnivClient } from '../types';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { sendAnnivCadeau } from '../../../../../app/front_office/paramatre_anniversaire/annivClientsSlice';
import { createMilesTransaction } from '../../../../../app/front_office/paramatre_anniversaire/milesTransactionSlice';
import { FiArrowRight } from 'react-icons/fi';

interface Props {
  client: AnnivClient;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'cadeau' | 'transaction' | 'success';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400';

const ModalSendCadeau = ({ client, onClose, onSuccess }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const { cadeauParams } = useSelector((s: RootState) => s.annivParams);

  const [step,          setStep]          = useState<Step>('cadeau');
  const [selectedCadeau, setSelectedCadeau] = useState(client.cadeauId ?? '');
  const [description,   setDescription]   = useState('');
  const [montantCadeaux, setMontantCadeaux] = useState<number | ''>('');
//   const [moduleId,      setModuleId]      = useState('');
  const [sending,       setSending]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const info = client.clientBeneficiaire.clientbeneficiaireInfo?.[0];
  const nom  = info ? `${info.nom} ${info.prenom}` : client.clientBeneficiaire.libelle;

  const cadeauSelectionne = cadeauParams.find(c => c.id === selectedCadeau);

  /* ── Étape 1 : envoyer le cadeau ── */
  const handleNextStep = () => {
    if (!selectedCadeau) return;
    setStep('transaction');
  };

  /* ── Étape 2 : envoyer cadeau + créer transaction ── */
  const handleSubmit = async () => {
    if (!description || montantCadeaux === '' || montantCadeaux <= 0) return;

    setSending(true);
    setError(null);

    // Appel 1 — envoi cadeau
    const cadeauResult = await dispatch(sendAnnivCadeau({ id: client.id, cadeauId: selectedCadeau }));
    if (sendAnnivCadeau.rejected.match(cadeauResult)) {
      setError(cadeauResult.payload as string);
      setSending(false);
      return;
    }

    // Appel 2 — création transaction miles
    const txResult = await dispatch(createMilesTransaction({
      description,
      montantCadeaux: Number(montantCadeaux),
    //   moduleId,
      clientBeneficiaireId: client.clientBeneficiaireId,
    }));
    if (createMilesTransaction.rejected.match(txResult)) {
      setError(txResult.payload as string);
      setSending(false);
      return;
    }

    setSending(false);
    setStep('success');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">Envoyer un cadeau</h3>
            {/* Indicateur étapes */}
            <div className="flex items-center gap-1 ml-2">
              <span className={`w-5 h-1.5 rounded-full transition-colors ${
                step !== 'success' ? 'bg-yellow-400' : 'bg-yellow-400'
              }`} />
              <span className={`w-5 h-1.5 rounded-full transition-colors ${
                step === 'transaction' || step === 'success' ? 'bg-yellow-400' : 'bg-gray-200'
              }`} />
            </div>
          </div>
          <button onClick={onClose} disabled={sending}
            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-40">
            <XIcon size={15} strokeWidth={1.5} className="text-gray-400" />
          </button>
        </div>

        {/* Destinataire — toujours visible */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">Destinataire</p>
            <p className="text-sm font-medium text-gray-900">{nom}</p>
            <p className="text-[11px] text-gray-400">{client.clientBeneficiaire.code}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            client.clientBeneficiaire.typeClient === 'GOLD'   ? 'bg-yellow-100 text-yellow-700' :
            client.clientBeneficiaire.typeClient === 'SILVER' ? 'bg-gray-100 text-gray-600'     :
            'bg-orange-100 text-orange-700'
          }`}>
            {client.clientBeneficiaire.typeClient}
          </span>
        </div>

        {/* ── Étape 1 : choix du cadeau ── */}
        {step === 'cadeau' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2">Sélectionner un cadeau</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {cadeauParams.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCadeau(c.id)}
                    className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                      selectedCadeau === c.id
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GiftIcon size={14} strokeWidth={1.5} className={
                          selectedCadeau === c.id ? 'text-yellow-500' : 'text-gray-400'
                        } />
                        <span className="text-sm font-medium text-gray-900">{c.cadeau}</span>
                      </div>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedCadeau === c.id
                          ? 'border-yellow-400 bg-yellow-400'
                          : 'border-gray-300'
                      }`}>
                        {selectedCadeau === c.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 ml-5 flex gap-3">
                      <span className="text-[11px] text-gray-400">
                        Miles : {c.milesInf.toLocaleString('fr-FR')} – {c.milesSup.toLocaleString('fr-FR')}
                      </span>
                      <span className={`text-[11px] font-medium ${
                        c.status === 'ACTIF' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 ml-5 text-[11px] text-gray-400">{c.proposition}</p>
                  </button>
                ))}

                {cadeauParams.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Aucun cadeau disponible</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedCadeau}
                className="px-4 py-1.5 text-sm bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 disabled:opacity-40 flex items-center gap-2"
              >
                Suivant
                <FiArrowRight size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 2 : description + montant ── */}
        {step === 'transaction' && (
          <div className="space-y-3">

            {/* Récap cadeau sélectionné */}
            {cadeauSelectionne && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-100 px-4 py-2.5 flex items-center gap-2">
                <GiftIcon size={13} strokeWidth={1.5} className="text-yellow-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-800">{cadeauSelectionne.cadeau}</p>
                  <p className="text-[11px] text-yellow-600">{cadeauSelectionne.proposition}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Description de la transaction</label>
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Ex : Cadeau anniversaire — Bon de réduction"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Montant cadeau</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                placeholder="Ex : 50000"
                value={montantCadeaux}
                onChange={e => setMontantCadeaux(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            {/* <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Module ID <span className="text-gray-300">(optionnel)</span></label>
              <input
                className={inputCls}
                placeholder="Ex : cml7u364w0006ootsx28zyjhy"
                value={moduleId}
                onChange={e => setModuleId(e.target.value)}
              />
            </div> */}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex justify-between gap-2 pt-1">
              <button
                onClick={() => { setStep('cadeau'); setError(null); }}
                disabled={sending}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Retour
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} disabled={sending}
                  className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={sending || !description || montantCadeaux === '' || Number(montantCadeaux) <= 0}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-40"
                >
                  <GiftIcon size={13} strokeWidth={1.5} />
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Succès ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <GiftIcon size={22} strokeWidth={1.5} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Cadeau envoyé avec succès !</p>
            <p className="text-xs text-gray-400 text-center">
              Le cadeau et la transaction miles ont bien été enregistrés.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ModalSendCadeau;