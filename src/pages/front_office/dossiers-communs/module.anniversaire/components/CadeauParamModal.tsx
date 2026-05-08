import { XIcon } from 'lucide-react';
import React, { useState } from 'react';
import type { CadeauParamPayload } from '../types';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400';

interface Props {
  initial?: CadeauParamPayload & { id?: string };
  onClose: () => void;
  onSave:  (id: string | undefined, data: CadeauParamPayload) => void;
}

const CadeauParamModal = ({ initial, onClose, onSave }: Props) => {
  const [form, setForm] = useState<CadeauParamPayload>({
    milesSup:    initial?.milesSup    ?? 0,
    milesInf:    initial?.milesInf    ?? 0,
    cadeau:      initial?.cadeau      ?? '',
    proposition: initial?.proposition ?? '',
  });

  const setStr = (k: 'cadeau' | 'proposition') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const setNum = (k: 'milesSup' | 'milesInf') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: Number(e.target.value) }));

  const valid = form.cadeau && form.proposition && form.milesSup > 0 && form.milesInf >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {initial?.id ? 'Modifier cadeau param' : 'Nouveau cadeau param'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XIcon size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Miles inférieur</label>
            <input type="number" className={inputCls} value={form.milesInf} onChange={setNum('milesInf')} min={0} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Miles supérieur</label>
            <input type="number" className={inputCls} value={form.milesSup} onChange={setNum('milesSup')} min={0} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Cadeau</label>
          <input className={inputCls} value={form.cadeau} onChange={setStr('cadeau')}
            placeholder="Bon de réduction" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Proposition</label>
          <input className={inputCls} value={form.proposition} onChange={setStr('proposition')}
            placeholder="Souhaitez-vous un bon de réduction ?" />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            disabled={!valid}
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

export default CadeauParamModal;