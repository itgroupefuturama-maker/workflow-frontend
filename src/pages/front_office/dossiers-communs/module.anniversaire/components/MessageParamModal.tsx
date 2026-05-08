import { XIcon } from 'lucide-react';
import React, { useState } from 'react';
import type { MessageParamPayload } from '../types';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400';

interface Props {
  initial?: MessageParamPayload & { id?: string };
  onClose: () => void;
  onSave:  (id: string | undefined, data: MessageParamPayload) => void;
}

const MessageParamModal = ({ initial, onClose, onSave }: Props) => {
  const [form, setForm] = useState<MessageParamPayload>({
    messageAnnif:  initial?.messageAnnif  ?? '',
    messageCadeau: initial?.messageCadeau ?? '',
  });

  const set = (k: keyof MessageParamPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {initial?.id ? 'Modifier message param' : 'Nouveau message param'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XIcon size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Message anniversaire</label>
          <input className={inputCls} value={form.messageAnnif} onChange={set('messageAnnif')}
            placeholder="Joyeux anniversaire {nom_client} !" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Message cadeau</label>
          <textarea className={inputCls} rows={2} value={form.messageCadeau} onChange={set('messageCadeau')}
            placeholder="Voici votre cadeau {nom_client} {cadeau}!" />
        </div>

        <p className="text-xs text-gray-400">Variables : {'{nom_client}'}, {'{cadeau}'}</p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            disabled={!form.messageAnnif || !form.messageCadeau}
            onClick={() => onSave(initial?.id, form)}
            className="px-4 py-1.5 text-sm bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageParamModal;