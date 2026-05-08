import { Gift, MessageSquare, PencilIcon, PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  createCadeauParam, createMessageParam,
  updateCadeauParam, updateMessageParam,
} from '../../../../../app/front_office/paramatre_anniversaire/annivParamsSlice';
import type { CadeauParamPayload, MessageParamPayload } from '../types';
import CadeauParamModal from './CadeauParamModal';
import MessageParamModal from './MessageParamModal';

const statusStyle: Record<'ACTIF' | 'INACTIF', string> = {
  ACTIF:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  INACTIF: 'bg-gray-100 text-gray-400 ring-1 ring-gray-200',
};

type Tab = 'messages' | 'cadeaux';
type MsgModal = { open: false } | { open: true; id?: string; data: MessageParamPayload };
type CdoModal = { open: false } | { open: true; id?: string; data: CadeauParamPayload  };

const MSG_EMPTY: MessageParamPayload = { messageAnnif: '', messageCadeau: '' };
const CDO_EMPTY: CadeauParamPayload  = { milesSup: 0, milesInf: 0, cadeau: '', proposition: '' };

const ParamsTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { messageParams, cadeauParams, loading } = useSelector((s: RootState) => s.annivParams);

  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [msgModal, setMsgModal] = useState<MsgModal>({ open: false });
  const [cdoModal, setCdoModal] = useState<CdoModal>({ open: false });

  const handleSaveMsg = async (id: string | undefined, data: MessageParamPayload) => {
    if (id) await dispatch(updateMessageParam({ id, payload: data }));
    else    await dispatch(createMessageParam(data));
    setMsgModal({ open: false });
  };

  const handleSaveCdo = async (id: string | undefined, data: CadeauParamPayload) => {
    if (id) await dispatch(updateCadeauParam({ id, payload: data }));
    else    await dispatch(createCadeauParam(data));
    setCdoModal({ open: false });
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: 'messages',
      label: 'Messages',
      icon: <MessageSquare size={14} strokeWidth={1.5} />,
      count: messageParams.length,
    },
    {
      key: 'cadeaux',
      label: 'Cadeaux',
      icon: <Gift size={14} strokeWidth={1.5} />,
      count: cadeauParams.length,
    },
  ];

  return (
    <div className="mt-4 space-y-4">

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            {tab.icon}
            {tab.label}
            <span className={`
              inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold
              ${activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Messages tab ── */}
      {activeTab === 'messages' && (
        <Section
          title="Paramètres de messages"
          description="Messages envoyés lors des anniversaires et remises de cadeaux"
          onAdd={() => setMsgModal({ open: true, data: MSG_EMPTY })}
        >
          {/* ✅ Plus de <table> ici, juste thead + tbody */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Message anniversaire', 'Message cadeau', 'Statut', 'Créé le', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messageParams.length === 0 && !loading ? (
              <EmptyRow colSpan={5} label="Aucun paramètre de message configuré" />
            ) : messageParams.map(mp => (
              <tr key={mp.id} className="hover:bg-gray-50/70 transition-colors group">
                <td className="px-4 py-3 max-w-[220px]">
                  <span className="truncate block text-gray-800" title={mp.messageAnnif}>{mp.messageAnnif}</span>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <span className="truncate block text-gray-500 text-xs" title={mp.messageCadeau}>{mp.messageCadeau}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={mp.status} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(mp.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <EditButton onClick={() => setMsgModal({ open: true, id: mp.id, data: { messageAnnif: mp.messageAnnif, messageCadeau: mp.messageCadeau } })} />
                </td>
              </tr>
            ))}
          </tbody>
        </Section>
      )}

      {/* ── Cadeaux tab ── */}
      {activeTab === 'cadeaux' && (
        <Section
          title="Paramètres de cadeaux"
          description="Règles d'attribution des cadeaux selon les tranches de miles"
          onAdd={() => setCdoModal({ open: true, data: CDO_EMPTY })}
        >
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Cadeau', 'Tranche de miles', 'Proposition', 'Statut', 'Créé le', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cadeauParams.length === 0 && !loading ? (
              <EmptyRow colSpan={6} label="Aucun paramètre de cadeau configuré" />
            ) : cadeauParams.map(cp => (
              <tr key={cp.id} className="hover:bg-gray-50/70 transition-colors group">
                <td className="px-4 py-3 font-medium text-gray-800">{cp.cadeau}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                    {cp.milesInf.toLocaleString('fr-FR')}
                    <span className="text-gray-400">→</span>
                    {cp.milesSup.toLocaleString('fr-FR')}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  <span className="truncate block text-gray-500 text-xs" title={cp.proposition}>{cp.proposition}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={cp.status} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(cp.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <EditButton onClick={() => setCdoModal({ open: true, id: cp.id, data: { milesSup: cp.milesSup, milesInf: cp.milesInf, cadeau: cp.cadeau, proposition: cp.proposition } })} />
                </td>
              </tr>
            ))}
          </tbody>
        </Section>
      )}

      {/* Modals */}
      {msgModal.open && (
        <MessageParamModal
          initial={msgModal.id ? { ...msgModal.data, id: msgModal.id } : undefined}
          onClose={() => setMsgModal({ open: false })}
          onSave={handleSaveMsg}
        />
      )}
      {cdoModal.open && (
        <CadeauParamModal
          initial={cdoModal.id ? { ...cdoModal.data, id: cdoModal.id } : undefined}
          onClose={() => setCdoModal({ open: false })}
          onSave={handleSaveCdo}
        />
      )}
    </div>
  );
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const Section = ({
  title,
  description,
  onAdd,
  children,
}: {
  title: string;
  description?: string;
  onAdd: () => void;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm"
      >
        <PlusIcon size={13} strokeWidth={2} />
        Nouveau
      </button>
    </div>
    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: 'ACTIF' | 'INACTIF' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[status]}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    {status}
  </span>
);

const EditButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
  >
    <PencilIcon size={13} strokeWidth={1.5} />
  </button>
);

const EmptyRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400 text-xs">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <PlusIcon size={16} className="text-gray-400" />
        </div>
        {label}
      </div>
    </td>
  </tr>
);

export default ParamsTab;