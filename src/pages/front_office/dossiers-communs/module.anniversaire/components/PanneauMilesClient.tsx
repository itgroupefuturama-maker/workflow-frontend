import { XIcon, TrendingUpIcon, PackageIcon, SendIcon, GiftIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import type { AnnivClient } from '../types';
import { clearMilesTransactions, fetchMilesTransactions } from '../../../../../app/front_office/paramatre_anniversaire/milesTransactionSlice';
import ModalSendMessage from './ModalSendMessage';
import ModalSendCadeau from './ModalSendCadeau';

interface Props {
  client: AnnivClient | null;
  isOpen: boolean;
  onClose: () => void;
}

const moduleColor: Record<string, string> = {
  ticketing: 'bg-blue-100 text-blue-700',
  hotel:     'bg-purple-100 text-purple-700',
  default:   'bg-gray-100 text-gray-500',
};

const typeClientStyle: Record<string, string> = {
  GOLD:   'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  SILVER: 'bg-slate-100 text-slate-600  ring-1 ring-slate-200',
  BRONZE: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

const PanneauMilesClient = ({ client, isOpen, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((s: RootState) => s.milesTransaction);

  const [showSendModal,   setShowSendModal]   = useState(false);
  const [showCadeauModal, setShowCadeauModal] = useState(false);

  useEffect(() => {
    if (isOpen && client) dispatch(fetchMilesTransactions(client.clientBeneficiaireId));
    if (!isOpen)          dispatch(clearMilesTransactions());
  }, [isOpen, client, dispatch]);

  const info         = client?.clientBeneficiaire?.clientbeneficiaireInfo?.[0];
  const nom          = info ? `${info.nom} ${info.prenom}` : client?.clientBeneficiaire?.libelle ?? '—';
  const soldeCourant = items[0]?.soldeMiles ?? client?.soldeMiles ?? 0;

  if (!isOpen || !client) return null;

  return (
    <>
      {/*
        ─── PANNEAU INLINE ───────────────────────────────────────────────────
        On n'utilise plus `fixed`. Le panneau vit dans le flex-row du parent
        (ClientsTab) et prend exactement la place qui lui est allouée.
        La hauteur suit le contenu de la liste grâce à `self-stretch` +
        `sticky top-0` pour rester visible au scroll.
      */}
      {/* <div className="w-full h-full flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"> */}
      <div className="w-80 xl:w-96 shrink-0 flex flex-col border-l bg-white 
                rounded-2xl border border-gray-200 shadow-sm overflow-hidden self-stretch">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Historiques miles</p>
            <h3 className="text-sm font-semibold text-gray-900">{nom}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={15} strokeWidth={1.5} className="text-gray-400" />
          </button>
        </div>

        {/* ── Solde + actions ─────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Solde actuel</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {soldeCourant.toLocaleString('fr-FR')}
                <span className="text-xs font-normal text-gray-400 ml-1">miles</span>
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              typeClientStyle[client.clientBeneficiaire.typeClient] ?? 'bg-gray-100 text-gray-500'
            }`}>
              {client.clientBeneficiaire.typeClient}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSendModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium
                         bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm"
            >
              <SendIcon size={12} strokeWidth={2} />
              Envoyer message
            </button>
            <button
              onClick={() => setShowCadeauModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium
                         border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <GiftIcon size={12} strokeWidth={2} />
              Envoyer cadeau
            </button>
          </div>
        </div>

        {/* ── Liste transactions ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-xs">Chargement…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-4 my-3 flex items-center gap-2 px-3 py-2.5
                            bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <PackageIcon size={18} className="text-gray-300" />
              </div>
              <p className="text-xs">Aucune transaction</p>
            </div>
          )}

          {!loading && items.map(tx => (
            <div key={tx.id} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
              <div className="flex items-start justify-between gap-3">

                {/* Icône + description */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                    tx.gainMiles > 0 ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    {tx.gainMiles > 0
                      ? <TrendingUpIcon size={14} strokeWidth={1.5} className="text-emerald-600" />
                      : <PackageIcon    size={14} strokeWidth={1.5} className="text-gray-400"    />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-800 leading-snug">{tx.description}</p>
                    {tx.numeroCommande && (
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{tx.numeroCommande}</p>
                    )}
                    {tx.module && (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        moduleColor[tx.module.nom] ?? moduleColor.default
                      }`}>
                        {tx.module.nom}
                      </span>
                    )}
                  </div>
                </div>

                {/* Miles + date */}
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold tabular-nums ${
                    tx.gainMiles > 0 ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {tx.gainMiles > 0 ? '+' : ''}{tx.gainMiles.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(tx.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Montant + solde après */}
              {tx.montantCommande !== null && (
                <div className="mt-2.5 ml-11 flex items-center gap-4">
                  <div>
                    <p className="text-[11px] text-gray-400">Montant commande</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {tx.montantCommande.toLocaleString('fr-FR')} Ar
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Solde après</p>
                    <p className="text-xs font-semibold text-gray-700 tabular-nums">
                      {tx.soldeMiles.toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400 text-center">
            {items.length} transaction{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modals */}
      {showSendModal && (
        <ModalSendMessage
          client={client}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setShowSendModal(false)}
        />
      )}
      {showCadeauModal && (
        <ModalSendCadeau
          client={client}
          onClose={() => setShowCadeauModal(false)}
          onSuccess={() => setShowCadeauModal(false)}
        />
      )}
    </>
  );
};

export default PanneauMilesClient;