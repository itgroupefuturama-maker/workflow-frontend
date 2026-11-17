// HistoriquePiecesJointes.tsx
//
// Historique des fichiers d'une ligne billet (GET /billet/ligne/:id/pieces-jointes) :
// e-billets, preuve d'achat, preuves de résa — fichiers remplacés compris.

import { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import axios from '../../../../../../service/Axios';
import { useEscapeKey } from '../../../../../../hooks/useEscapeKey';
import { MiniaturePreuve } from '../../../../../../components/ui/Preuve';

type TypePieceJointe = 'E_BILLET' | 'PREUVE_ACHAT' | 'PREUVE_RESA' | 'PREUVE_ACCEPTATION_CLIENT';

interface PieceJointe {
  id: string;
  type: TypePieceJointe;
  billetId: string | null;
  chemin: string;
  nomOriginal: string;
  tailleOctets: number;
  actif: boolean;
  remplaceParId: string | null;
  creePar: { nom: string; prenom: string } | null;
  createdAt: string;
}

const LIBELLE_TYPE: Record<TypePieceJointe, string> = {
  E_BILLET: 'E-billet compagnie',
  PREUVE_ACHAT: "Preuve d'achat",
  PREUVE_RESA: 'Capture n° résa',
  PREUVE_ACCEPTATION_CLIENT: 'Acceptation client',
};

interface Props {
  ligneId: string;
  referenceLine?: string;
  /** billetId → nom du passager, pour les e-billets */
  nomsPassagers: Record<string, string>;
  onClose: () => void;
}

export default function HistoriquePiecesJointes({ ligneId, referenceLine, nomsPassagers, onClose }: Props) {
  useEscapeKey(true, onClose);
  const [pieces, setPieces] = useState<PieceJointe[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    axios.get(`/billet/ligne/${ligneId}/pieces-jointes`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (actif) setPieces(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (actif) setErreur(err.response?.data?.message || "Impossible de charger l'historique des fichiers");
      });
    return () => { actif = false; };
  }, [ligneId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Historique des fichiers"
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <History size={16} className="text-slate-500" />
            Historique des fichiers {referenceLine && <span className="font-mono text-slate-500">· {referenceLine}</span>}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {erreur ? (
            <p className="px-5 py-8 text-center text-sm text-red-600">{erreur}</p>
          ) : pieces === null ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Chargement…</p>
          ) : pieces.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Aucun fichier pour cette ligne</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Fichier</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">Ajouté par</th>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pieces.map((pj) => (
                  <tr key={pj.id} className={pj.actif ? '' : 'text-slate-400'}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <MiniaturePreuve chemin={pj.chemin} libelle={pj.nomOriginal} taille="sm" />
                        <span className="max-w-[180px] truncate" title={pj.nomOriginal}>{pj.nomOriginal}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {LIBELLE_TYPE[pj.type] ?? pj.type}
                      {pj.billetId && nomsPassagers[pj.billetId] && (
                        <span className="block text-[11px] text-slate-400">{nomsPassagers[pj.billetId]}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{pj.creePar ? `${pj.creePar.prenom} ${pj.creePar.nom}` : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {new Date(pj.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-2">
                      {pj.actif
                        ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">En vigueur</span>
                        : <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">Remplacé</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
