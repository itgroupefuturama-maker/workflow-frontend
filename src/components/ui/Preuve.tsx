// src/components/ui/Preuve.tsx
//
// Pièces jointes « preuve » (images ou PDF) : champ de saisie avec aperçu + miniature cliquable.
// Règles backend (FRONTEND_PROMPT_DEUX_PREUVES_RESERVATION.md) : PNG, JPG, WEBP ou PDF, 5 Mo max par fichier.

import { useEffect, useMemo } from 'react';
import { FiFileText, FiUploadCloud, FiX } from 'react-icons/fi';
import { API_URL } from '../../service/env';

import { PREUVE_ACCEPT, estPdf, validerFichierPreuve } from './preuveFichier';

// ─── Champ de saisie ────────────────────────────────────────

interface ChampPreuveProps {
  /** Libellé utilisé dans les messages d'erreur, ex. « La preuve d'acceptation du client » */
  libelleErreur: string;
  /** Texte du bouton quand aucun fichier n'est choisi */
  placeholder: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Chemin d'une preuve déjà enregistrée (mise à jour d'une réservation) */
  existant?: string | null;
  /** Appelé quand le fichier choisi est refusé (format / taille) */
  onErreur: (message: string) => void;
  /** Mise en évidence quand le champ obligatoire est vide */
  enErreur?: boolean;
}

export function ChampPreuve({ libelleErreur, placeholder, file, onChange, existant, onErreur, enErreur }: ChampPreuveProps) {
  const apercu = useMemo(() => (file && !estPdf(file.type || file.name) ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu); }, [apercu]);

  const choisir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    e.target.value = ''; // permet de re-choisir le même fichier
    if (!f) return;
    const erreur = validerFichierPreuve(f, libelleErreur);
    if (erreur) { onErreur(erreur); return; }
    onChange(f);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5">
        {apercu ? (
          <img src={apercu} alt="Aperçu" className="h-14 w-14 shrink-0 rounded border border-slate-200 object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-slate-200 bg-red-50 text-red-600">
            <FiFileText size={22} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
          <p className="text-xs text-slate-500">{Math.round(file.size / 1024)} Ko</p>
        </div>
        <label className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          Remplacer
          <input type="file" accept={PREUVE_ACCEPT} className="hidden" onChange={choisir} />
        </label>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Retirer le fichier"
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <FiX size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      {existant && (
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <MiniaturePreuve chemin={existant} libelle="Preuve enregistrée" taille="sm" />
          <span>Une preuve est déjà enregistrée. Ajoutez un fichier uniquement pour la remplacer.</span>
        </div>
      )}
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-white px-4 py-3 transition-colors hover:bg-slate-50 ${
          enErreur ? 'border-red-400 bg-red-50/40' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <FiUploadCloud className={`shrink-0 ${enErreur ? 'text-red-400' : 'text-slate-400'}`} size={20} />
        <span className="text-sm text-slate-700">{placeholder}</span>
        <span className="ml-auto hidden text-xs text-slate-400 sm:inline">PNG, JPG, WEBP, PDF – 5 Mo max</span>
        <input type="file" accept={PREUVE_ACCEPT} className="hidden" onChange={choisir} />
      </label>
    </div>
  );
}

// ─── Miniature (lecture) ─────────────────────────────────────

export function MiniaturePreuve({
  chemin, libelle, taille = 'md',
}: { chemin?: string | null; libelle: string; taille?: 'sm' | 'md' }) {
  if (!chemin) return <span className="text-sm italic text-slate-400">—</span>;
  const url = `${API_URL}/${chemin}`;
  const dims = taille === 'sm' ? 'h-8 w-10' : 'h-10 w-16';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={libelle} className="inline-block">
      {estPdf(chemin) ? (
        <span className={`${dims} flex items-center justify-center gap-1 rounded border border-slate-200 bg-red-50 text-[10px] font-bold text-red-600 hover:opacity-80`}>
          <FiFileText size={14} /> PDF
        </span>
      ) : (
        <img src={url} alt={libelle} className={`${dims} cursor-pointer rounded border border-slate-200 object-cover transition-opacity hover:opacity-80`} />
      )}
    </a>
  );
}
