import { useState } from 'react';
import { FiAlertTriangle, FiEdit3, FiRepeat, FiX } from 'react-icons/fi';
import type { BilletLigne } from '../../../../../../app/front_office/billetSlice';
import { useEscapeKey } from '../../../../../../hooks/useEscapeKey';
import { messageRenvoiOdoo, peutMettreAJourResa } from './utils/billetStatuts';

export type ChoixModification = 'RESA' | 'REPROG';

interface ModifierLigneModalProps {
  ligne: BilletLigne;
  billet: { statut?: string } | null | undefined;
  onClose: () => void;
  onContinuer: (choix: ChoixModification) => void;
}

// « Modifier » une ligne : mettre à jour la réservation (même ligne, sans frais) ou modifier avec conditions
// (reprogrammation : la ligne est annulée et remplacée). Deux effets très différents, d'où le choix explicite.
export default function ModifierLigneModal({ ligne, billet, onClose, onContinuer }: ModifierLigneModalProps) {
  const resaPossible = peutMettreAJourResa(billet, ligne);
  const [choix, setChoix] = useState<ChoixModification | null>(resaPossible ? null : 'REPROG');
  const avertissement = messageRenvoiOdoo(billet);
  const ref = ligne.referenceLine || 'cette ligne';

  useEscapeKey(true, onClose);

  const options: { id: ChoixModification; icon: typeof FiEdit3; titre: string; lignes: string[]; desactive?: string }[] = [
    {
      id: 'RESA',
      icon: FiEdit3,
      titre: 'Mettre à jour la réservation',
      lignes: [
        'Corriger la réservation en cours : passagers, prix, PNR, pièce jointe.',
        `La ligne ${ref} est modifiée telle quelle, sans frais ni nouvelle ligne.`,
        'Possible tant que les numéros de billet ne sont pas saisis.',
      ],
      desactive: resaPossible ? undefined : 'Numéros de billet déjà saisis : utilisez la modification avec conditions',
    },
    {
      id: 'REPROG',
      icon: FiRepeat,
      titre: 'Modifier avec conditions (reprogrammation)',
      lignes: [
        'Changement de date, de vol ou de classe, avec frais éventuels (pénalité, service, surclassement…).',
        `${ref} est annulée et remplacée par une nouvelle ligne.`,
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[120] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modifier-ligne-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="modifier-ligne-title" className="text-base font-bold text-slate-900">
            Modifier la ligne {ligne.referenceLine}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full">
            <FiX size={18} />
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-3">
          {options.map(({ id, icon: Icon, titre, lignes, desactive }) => {
            const actif = choix === id;
            return (
              <label
                key={id}
                title={desactive}
                className={`flex gap-3 p-3 rounded-xl border transition-all ${
                  desactive
                    ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                    : actif
                      ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200 cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="choix-modification"
                  className="mt-1 accent-indigo-600"
                  checked={actif}
                  disabled={!!desactive}
                  onChange={() => setChoix(id)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Icon size={14} className="text-indigo-600" />
                    {titre}
                  </p>
                  {lignes.map((t) => (
                    <p key={t} className="text-xs text-slate-500 mt-0.5">{t}</p>
                  ))}
                  {desactive && <p className="text-xs text-amber-700 mt-1">{desactive}</p>}
                </div>
              </label>
            );
          })}

          {avertissement && (
            <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <FiAlertTriangle className="shrink-0 mt-0.5" size={14} />
              <span>{avertissement}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-white rounded-xl border border-slate-200"
          >
            Annuler
          </button>
          <button
            onClick={() => choix && onContinuer(choix)}
            disabled={!choix}
            className="px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
