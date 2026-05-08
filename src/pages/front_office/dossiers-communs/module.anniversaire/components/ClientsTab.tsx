import { EyeIcon, RotateCcwIcon, SearchIcon, MessageSquareIcon, CheckSquareIcon, XIcon, SendIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AnnivClient } from '../types';
import ModalResetMiles from './ModalResetMiles';
import PanneauMilesClient from './PanneauMilesClient';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchAnnivClients, sendGroupSms } from '../../../../../app/front_office/paramatre_anniversaire/annivClientsSlice';

/* ── styles inchangés ───────────────────────────────────────────────────── */
const statusMsgStyle: Record<string, { bg: string; dot: string; label: string }> = {
  ACHEVE:   { bg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500', label: 'Envoyé'     },
  INACHEVE: { bg: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200',    dot: 'bg-amber-400',   label: 'Non envoyé' },
  ECHOUE:   { bg: 'bg-red-50    text-red-600    ring-1 ring-red-200',      dot: 'bg-red-500',     label: 'Échoué'     },
};

const typeClientStyle: Record<string, string> = {
  BRONZE: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  SILVER: 'bg-slate-100 text-slate-600  ring-1 ring-slate-200',
  GOLD:   'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
};

const today      = () => new Date().toISOString().split('T')[0];
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };

type ResetModal =
  | { open: false }
  | { open: true; mode: 'single'; client: AnnivClient }
  | { open: true; mode: 'all' };

/* ── Status badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const s = statusMsgStyle[status];
  if (!s) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
};

/* ── Modal confirmation groupe SMS ─────────────────────────────────────── */
const ModalConfirmGroupSms = ({
  count, loading, onConfirm, onClose,
}: {
  count: number; loading: boolean;
  onConfirm: () => void; onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
            <MessageSquareIcon size={16} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-black text-gray-900">Envoi groupe SMS</h3>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
          <XIcon size={15} className="text-gray-400" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Vous êtes sur le point d'envoyer un SMS d'anniversaire à{' '}
          <span className="font-black text-indigo-600">{count} client{count > 1 ? 's' : ''}</span>.
        </p>
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
          <span className="text-amber-500 text-xs mt-0.5">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">
            Cette action est irréversible. Les SMS seront envoyés immédiatement.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm shadow-indigo-200"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <SendIcon size={12} strokeWidth={2.5} />
          }
          {loading ? 'Envoi…' : 'Confirmer l\'envoi'}
        </button>
      </div>
    </div>
  </div>
);

/* ── Main component ─────────────────────────────────────────────────────── */
const ClientsTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((s: RootState) => s.annivClients);

  const [startDate,      setStartDate]      = useState(monthStart());
  const [endDate,        setEndDate]        = useState(today());
  const [selectedClient, setSelectedClient] = useState<AnnivClient | null>(null);
  const [panneauOpen,    setPanneauOpen]    = useState(false);
  const [resetModal,     setResetModal]     = useState<ResetModal>({ open: false });

  /* ── Groupe SMS state ─────────────────────────────────────────────────── */
  const [groupMode,      setGroupMode]      = useState(false);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [confirmOpen,    setConfirmOpen]    = useState(false);

  useEffect(() => {
    dispatch(fetchAnnivClients({ startDate, endDate }));
  }, [dispatch, startDate, endDate]);

  const handleSearch = () => dispatch(fetchAnnivClients({ startDate, endDate }));

  const handleOpenPanneau = (client: AnnivClient) => {
    if (selectedClient?.id === client.id && panneauOpen) { setPanneauOpen(false); return; }
    setSelectedClient(client);
    setPanneauOpen(true);
  };

  const handleClosePanneau = () => { setPanneauOpen(false); setSelectedClient(null); };
  const handleResetSuccess = () => dispatch(fetchAnnivClients({ startDate, endDate }));

  /* ── Groupe SMS handlers ──────────────────────────────────────────────── */
  const toggleGroupMode = () => {
    setGroupMode((prev) => {
      if (prev) setSelectedIds(new Set()); // reset sélection en quittant
      return !prev;
    });
  };

  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  const toggleSelectAll = () =>
    setSelectedIds(isAllSelected ? new Set() : new Set(items.map((i) => i.id)));

  const handleConfirmSend = async () => {
    const result = await dispatch(sendGroupSms([...selectedIds]));
    if (sendGroupSms.fulfilled.match(result)) {
      setConfirmOpen(false);
      setGroupMode(false);
      setSelectedIds(new Set());
      dispatch(fetchAnnivClients({ startDate, endDate }));
    }
  };

  return (
    <div className="mt-4 space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtres date */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Du</span>
              <input
                type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>
            <span className="text-gray-300">–</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Au</span>
              <input
                type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>
            <button
              onClick={handleSearch} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 rounded-lg transition-colors shadow-sm"
            >
              <SearchIcon size={11} strokeWidth={2} />
              {loading ? 'Chargement…' : 'Rechercher'}
            </button>
          </div>

          {/* Bouton Sélectionner tout — visible uniquement en groupMode */}
          {groupMode && (
            <button
              onClick={toggleSelectAll}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm
                ${isAllSelected
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                }`}
            >
              <CheckSquareIcon size={12} strokeWidth={2} />
              {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>

        {/* Boutons droite */}
        <div className="flex items-center gap-2">

          {/* Compteur sélection + bouton envoyer — visibles en groupMode */}
          {groupMode && (
            <>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold
                  text-white bg-indigo-600 hover:bg-indigo-700
                  disabled:opacity-40 disabled:cursor-not-allowed
                  rounded-xl border border-indigo-700 transition-all shadow-sm shadow-indigo-200"
              >
                <SendIcon size={12} strokeWidth={2.5} />
                Envoyer ({selectedIds.size})
              </button>
            </>
          )}

          {/* Envoyer groupe SMS — toggle */}
          <button
            onClick={toggleGroupMode}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm
              ${groupMode
                ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
              }`}
          >
            {groupMode
              ? <><XIcon size={12} strokeWidth={2.5} /> Annuler</>
              : <><MessageSquareIcon size={12} strokeWidth={2} /> Envoyer groupe SMS</>
            }
          </button>

          {/* Reset global */}
          <button
            onClick={() => setResetModal({ open: true, mode: 'all' })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shadow-sm"
          >
            <RotateCcwIcon size={12} strokeWidth={2} />
            Réinitialiser tout
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Layout liste + panneau ───────────────────────────────────────── */}
      <div className="flex gap-4 items-start min-w-0">

        {/* Tableau */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {/* Colonne checkbox — visible uniquement en groupMode */}
                    {groupMode && <th className="px-4 py-3 w-10" />}
                    {[
                      'Client', 'Type', 'Date', 'Cadeau',
                      'Solde miles', 'Msg anniv.', 'Envoi msg', 'Msg cadeau',
                      'Envoi cadeau', '',
                    ].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={groupMode ? 11 : 10} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <SearchIcon size={18} className="text-gray-300" />
                          </div>
                          <span className="text-xs">Aucun client anniversaire sur cette période</span>
                        </div>
                      </td>
                    </tr>
                  ) : items.map(item => {
                    const info = item.clientBeneficiaire.clientbeneficiaireInfo[0];
                    const nom  = info ? `${info.nom} ${info.prenom}` : item.clientBeneficiaire.libelle;
                    const isSelected  = selectedClient?.id === item.id && panneauOpen;
                    const isChecked   = selectedIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        onClick={groupMode ? () => toggleId(item.id) : undefined}
                        className={`transition-colors group
                          ${groupMode ? 'cursor-pointer' : ''}
                          ${isChecked  ? 'bg-indigo-50/70'  : ''}
                          ${isSelected && !isChecked ? 'bg-indigo-50/60' : ''}
                          ${!isChecked && !isSelected ? 'hover:bg-gray-50/70' : ''}
                        `}
                      >
                        {/* Checkbox */}
                        {groupMode && (
                          <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleId(item.id)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                            />
                          </td>
                        )}

                        {/* Client */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 whitespace-nowrap">{nom}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.clientBeneficiaire.code}</p>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeClientStyle[item.clientBeneficiaire.typeClient] ?? 'bg-gray-100 text-gray-500'}`}>
                            {item.clientBeneficiaire.typeClient}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </td>

                        {/* Cadeau */}
                        <td className="px-4 py-3 text-xs text-gray-700">{item?.cadeau?.cadeau}</td>

                        {/* Solde miles */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-800 tabular-nums">
                            {item.soldeMiles.toLocaleString('fr-FR')}
                          </span>
                        </td>

                        {/* Msg anniv */}
                        <td className="px-4 py-3">
                          <StatusBadge status={item.statusMessageAnnif} />
                        </td>

                        {/* Envoi msg */}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {item.dateEnvoiMessage
                            ? new Date(item.dateEnvoiMessage).toLocaleString('fr-FR')
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Msg cadeau */}
                        <td className="px-4 py-3">
                          <StatusBadge status={item.statusMessageCadeau} />
                        </td>

                        {/* Envoi cadeau */}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {item.dateEnvoiCadeau
                            ? new Date(item.dateEnvoiCadeau).toLocaleString('fr-FR')
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">

                            <button
                              onClick={() => setResetModal({ open: true, mode: 'single', client: item })}
                              title="Réinitialiser le solde miles"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                                text-red-500 bg-red-50 border border-red-100
                                hover:bg-red-100 hover:text-red-600 hover:border-red-200
                                transition-all duration-150"
                            >
                              <RotateCcwIcon size={11} strokeWidth={2.5} />
                              Réinitialiser
                            </button>

                            <button
                              disabled={item.statusMessageCadeau === 'ACHEVE'}
                              onClick={() => handleOpenPanneau(item)}
                              title="Envoyer cadeau"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                                border transition-all duration-150
                                text-indigo-500 bg-indigo-50 border-indigo-100
                                hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-200
                                disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <EyeIcon size={11} strokeWidth={2.5} />
                              Envoyer Cadeaux
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panneau */}
        {panneauOpen && selectedClient && (
          <PanneauMilesClient
            client={selectedClient}
            isOpen={panneauOpen}
            onClose={handleClosePanneau}
          />
        )}
      </div>

      {/* Modal confirmation groupe SMS */}
      {confirmOpen && (
        <ModalConfirmGroupSms
          count={selectedIds.size}
          loading={loading}
          onConfirm={handleConfirmSend}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {/* Modals reset */}
      {resetModal.open && resetModal.mode === 'single' && (
        <ModalResetMiles
          mode="single"
          client={resetModal.client}
          onClose={() => setResetModal({ open: false })}
          onSuccess={handleResetSuccess}
        />
      )}
      {resetModal.open && resetModal.mode === 'all' && (
        <ModalResetMiles
          mode="all"
          onClose={() => setResetModal({ open: false })}
          onSuccess={handleResetSuccess}
        />
      )}
    </div>
  );
};

export default ClientsTab;