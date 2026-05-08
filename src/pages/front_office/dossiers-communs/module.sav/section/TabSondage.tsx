import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchSavSondages, updateSavSondageStatus } from '../../../../../app/front_office/parametre_sav/savSondageSlice';
import type { SavSondage } from '../../../../../app/front_office/parametre_sav/savSondageSlice';

// ─── Styles ───────────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  INACHEVE: 'bg-amber-50 text-amber-700 border-amber-100',
  ACHEVE:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  INACTIF:  'bg-slate-50 text-slate-600 border-slate-100',
};

const statusLabel: Record<string, string> = {
  INACHEVE: 'Non Envoyé',
  ACHEVE:   'Envoyé',
  INACTIF:  'Inactif',
};

const typeClientStyles: Record<string, string> = {
  GOLD:     'text-amber-600 font-semibold',
  SILVER:   'text-slate-500 font-semibold',
  STANDARD: 'text-blue-600 font-semibold',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanNumero(raw: string): string {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('261')) digits = digits.slice(3);
  if (digits.startsWith('0'))   digits = digits.slice(1);
  if (digits.length > 9)        digits = digits.slice(-9);
  return digits;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, subValue }: { label: string; value: string | number; subValue?: string }) => (
  <div className="flex-1 min-w-[150px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {subValue && <span className="text-xs text-slate-400">{subValue}</span>}
    </div>
  </div>
);

// ─── ModalEnvoiSondage ────────────────────────────────────────────────────────

function ModalEnvoiSondage({
  item,
  liensSondage,
  onClose,
  onConfirm,
  isSending,
}: {
  item: SavSondage;
  liensSondage: { id: string; statut: string; lienSondage: string; texte: string }[];
  onClose: () => void;
  onConfirm: (lienSondageId: string, numeroEnvoie: string) => void;
  isSending: boolean;
}) {
  const [selectedLienId, setSelectedLienId] = useState(item.lienSondageId);
  const [numeroType, setNumeroType]          = useState<'beneficiaire' | 'facture' | 'libre'>('beneficiaire');
  const [numeroLibre, setNumeroLibre]        = useState('');

  const numeroFinal =
    numeroType === 'beneficiaire'
      ? cleanNumero(item.whatsappBeneficiaire ?? '')
      : numeroType === 'facture'
      ? cleanNumero(item.whatsappFacture ?? '')
      : cleanNumero(numeroLibre);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Envoyer le sondage</h3>
            <p className="text-xs text-slate-400 mt-0.5">{item.clientBeneficiaire.libelle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Choix du lien sondage */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Lien sondage à envoyer
            </label>
            <div className="flex flex-col gap-2">
              {liensSondage
              .filter((l) => l.statut === 'ACTIF')
              .map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLienId(l.id)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selectedLienId === l.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <span className="font-medium block truncate">{l.texte || 'Sondage sans titre'}</span>
                  <span className={`text-[11px] font-mono block truncate mt-0.5 ${
                    selectedLienId === l.id ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    {l.lienSondage}
                  </span>
                </button>
              ))}
              {liensSondage.length === 0 && (
                <p className="text-sm text-slate-400 italic">Aucun lien sondage disponible.</p>
              )}
            </div>
          </div>

          {/* Numéro destinataire */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
              Numéro destinataire
            </label>
            <div className="flex gap-2 mb-3">
              {[
                { key: 'beneficiaire', label: 'Bénéficiaire', value: item.whatsappBeneficiaire ?? '' },
                { key: 'facture',      label: 'Facturé',      value: item.whatsappFacture ?? '' },
                { key: 'libre',        label: 'Libre',        value: '' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setNumeroType(opt.key as any)}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-all ${
                    numeroType === opt.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                  {opt.value && (
                    <span className={`block text-[10px] mt-0.5 font-mono ${
                      numeroType === opt.key ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      {opt.value}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {numeroType === 'libre' && (
              <input
                type="text"
                value={numeroLibre}
                onChange={(e) => setNumeroLibre(e.target.value)}
                placeholder="Ex: +261 34 00 000 00"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
              />
            )}

            {numeroType === 'libre' && numeroLibre && (
              <p className="mt-1.5 text-[11px] text-slate-400 font-mono">
                Numéro formaté : <span className="text-slate-700 font-bold">{cleanNumero(numeroLibre)}</span>
              </p>
            )}

            {numeroFinal && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-xs">Envoi vers :</span>
                <span className="text-slate-900 text-xs font-mono font-bold">{numeroFinal}</span>
              </div>
            )}

            {numeroFinal && numeroFinal.length !== 9 && (
              <p className="mt-1.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                ⚠️ Le numéro formaté fait {numeroFinal.length} chiffres au lieu de 9 — vérifiez la saisie.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(selectedLienId, numeroFinal)}
            disabled={isSending || !numeroFinal.trim() || !selectedLienId || numeroFinal.length !== 9}
            className="text-sm px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSending && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Confirmer l'envoi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────────────────────

export default function TabSondage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.savSondage);
  const { liensSondage } = useSelector((state: RootState) => state.savParams);

  const [modalItem, setModalItem]   = useState<SavSondage | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSavSondages());
  }, [dispatch]);

  const handleConfirmEnvoi = async (lienSondageId: string, numeroEnvoie: string) => {
    if (!modalItem) return;
    setUpdatingId(modalItem.id);
    await dispatch(updateSavSondageStatus({
      id:                   modalItem.id,
      status:               'ACHEVE',
      lienSondageId,
      clientBeneficiaireId: modalItem.clientBeneficiaireId,
      numeroEnvoie,
    }));
    setUpdatingId(null);
    setModalItem(null);
  };

  const total   = items.length;
  const acheves = items.filter((i) => i.status === 'ACHEVE').length;
  const taux    = total > 0 ? Math.round((acheves / total) * 100) : 0;

  return (
    <div className="max-w-[1600px] mx-auto bg-slate-50 min-h-screen">

      {/* Header & Stats */}
      <div className="my-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SAV Sondage</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gérez et suivez les retours clients en temps réel. Le système récupère la liste automatiquement après 15 jours de la date de vol du client Bénéficiaire.
        </p>
        <div className="flex gap-4 mt-6">
          <MetricCard label="Total Sondages" value={total} />
          <MetricCard label="Répondus"       value={acheves} subValue={`(${taux}%)`} />
          <MetricCard label="En attente"     value={total - acheves} />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-slate-600">Client</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Sondage</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Date Rappel</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Date Envoi</th>
                <th className="px-4 py-3 font-semibold text-slate-600">N° Envoi</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Statut</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row) => {
                const isAcheve  = row.status === 'ACHEVE';
                const isSending = updatingId === row.id;

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{row.clientBeneficiaire.libelle}</div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-tighter font-mono">
                        {row.clientBeneficiaire.code}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[11px] ${typeClientStyles[row.clientBeneficiaire.typeClient] ?? ''}`}>
                        ● {row.clientBeneficiaire.typeClient}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-[200px]">
                      <a href={row.lienSondage.lienSondage} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline block truncate font-medium">
                        {row.lienSondage.texte || 'Lien du sondage'}
                      </a>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(row.dateRappel).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {row.updatedAt && isAcheve
                        ? new Date(row.updatedAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : <span className="text-slate-300">—</span>
                      }
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[11px] font-mono text-slate-500">
                        {row.numeroEnvoie || <span className="text-slate-300">—</span>}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusStyles[row.status]}`}>
                        {statusLabel[row.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => !isAcheve && setModalItem(row)}
                        disabled={isAcheve || isSending}
                        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium
                          transition-all duration-200 active:scale-95 disabled:opacity-50 select-none
                          bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100`}
                      >
                        <span>Envoyer</span>
                        {isSending && (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading && (
          <div className="py-20 text-center">
            <p className="text-slate-400 text-sm font-medium">Aucun résultat trouvé.</p>
          </div>
        )}
      </div>

      {/* Modale */}
      {modalItem && (
        <ModalEnvoiSondage
          item={modalItem}
          liensSondage={liensSondage}
          onClose={() => setModalItem(null)}
          onConfirm={handleConfirmEnvoi}
          isSending={updatingId === modalItem.id}
        />
      )}
    </div>
  );
}