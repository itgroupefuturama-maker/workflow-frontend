import { AlertCircle, CakeIcon, CheckIcon, Loader2Icon, SendIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AnnivClient } from '../types';
import type { AppDispatch } from '../../../../../app/store';
import { sendAnnivMessage } from '../../../../../app/front_office/paramatre_anniversaire/annivClientsSlice';

interface Props {
  client: AnnivClient;
  onClose: () => void;
  onSuccess?: () => void;
}

const ModalSendMessage = ({ client, onClose, onSuccess }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [sending, setSending]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [sent,    setSent]      = useState(false);

  const info = client.clientBeneficiaire.clientbeneficiaireInfo?.[0];
  const nom  = info ? `${info.nom} ${info.prenom}` : client.clientBeneficiaire.libelle;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    const result = await dispatch(sendAnnivMessage(client.id));
    setSending(false);
    if (sendAnnivMessage.fulfilled.match(result)) {
      setSent(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } else {
      setError(result.payload as string);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden transform transition-all">
        
        {/* Barre de progression discrète si envoi en cours */}
        {sending && (
          <div className="h-1 w-full bg-yellow-100 overflow-hidden">
            <div className="h-full bg-yellow-500 animate-progress"></div>
          </div>
        )}

        <div className="p-6">
          {sent ? (
            /* Vue de Succès */
            <div className="py-4 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckIcon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Message envoyé !</h3>
                <p className="text-sm text-gray-500">Le souhait d'anniversaire est en route pour {nom}.</p>
              </div>
              <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Fermer
              </button>
            </div>
          ) : (
            /* Vue Formulaire / Confirmation */
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                    <CakeIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Anniversaire</h3>
                    <p className="text-xs text-gray-500">Confirmer l'envoi du message</p>
                  </div>
                </div>
                <button onClick={onClose} disabled={sending} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                  <XIcon size={18} />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Destinataire</span>
                  <span className="text-sm font-semibold text-gray-800">{nom}</span>
                  <span className="text-xs text-gray-500 font-mono mt-0.5">{client.clientBeneficiaire.code}</span>
                </div>
                {/* Filigrane décoratif */}
                <SendIcon size={40} className="absolute -right-2 -bottom-2 text-gray-200/50 -rotate-12" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600">
                  <AlertCircle size={14} />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={onClose} 
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-yellow-400 text-yellow-950 rounded-xl hover:bg-yellow-500 shadow-sm shadow-yellow-200 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2Icon size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Envoyer</span>
                      <SendIcon size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalSendMessage;