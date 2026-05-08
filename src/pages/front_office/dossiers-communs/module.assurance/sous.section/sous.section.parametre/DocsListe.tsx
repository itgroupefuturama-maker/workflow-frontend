import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceDocs, fetchAssuranceParams,
  createAssuranceDoc, linkDocToParams,
} from '../../../../../../app/front_office/parametre_assurance/assuranceParamsSlice';
import { Spinner, EmptyState, Th, Td, Input, Select, Modal, SubmitBtn } from '../../components/atoms';
import { fmtDate } from '../../utils/formatters';

const useAppDispatch = () => useDispatch<AppDispatch>();

const DocsListe = () => {
  const dispatch = useAppDispatch();
  const { docs, params, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceParams);

  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate, setFormCreate] = useState({ codeDoc: '', document: '' });

  const [openLink, setOpenLink] = useState(false);
  const [formLink, setFormLink] = useState({ assuranceDocId: '', assuranceParamsId: '' });

  const setC = (k: string, v: string) => setFormCreate(p => ({ ...p, [k]: v }));
  const setL = (k: string, v: string) => setFormLink(p => ({ ...p, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(createAssuranceDoc(formCreate));
    if (createAssuranceDoc.fulfilled.match(res)) {
      setOpenCreate(false);
      setFormCreate({ codeDoc: '', document: '' });
      dispatch(fetchAssuranceDocs());
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(linkDocToParams(formLink));
    if (linkDocToParams.fulfilled.match(res)) {
      setOpenLink(false);
      setFormLink({ assuranceDocId: '', assuranceParamsId: '' });
      dispatch(fetchAssuranceParams());
      dispatch(fetchAssuranceDocs());
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">Documents requis</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{docs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenLink(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg transition shadow-sm">
            🔗 Relier à un paramètre
          </button>
          <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm">
            + Ajouter
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">⚠️ {error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr><Th>Code</Th><Th>Document</Th><Th>Créé le</Th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : docs.length === 0 ? (
              <EmptyState label="Aucun document trouvé." />
            ) : docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition">
                <Td><span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{doc.codeDoc}</span></Td>
                <Td><span className="font-medium text-gray-900">📄 {doc.document}</span></Td>
                <Td className="text-gray-400 text-xs">{fmtDate(doc.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openCreate && (
        <Modal title="Nouveau document" onClose={() => setOpenCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Code document" placeholder="ex: DOC001" value={formCreate.codeDoc} onChange={e => setC('codeDoc', e.target.value)} required />
            <Input label="Nom du document" placeholder="ex: Passport copy" value={formCreate.document} onChange={e => setC('document', e.target.value)} required />
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2"><SubmitBtn loading={creating} label="Créer le document" /></div>
          </form>
        </Modal>
      )}

      {openLink && (
        <Modal title="Relier un document à un paramètre" onClose={() => setOpenLink(false)}>
          <form onSubmit={handleLink} className="space-y-4">
            <Select label="Document" value={formLink.assuranceDocId} onChange={e => setL('assuranceDocId', e.target.value)} required>
              <option value="">— Sélectionner un document —</option>
              {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.document} ({doc.codeDoc})</option>)}
            </Select>
            <Select label="Paramètre assurance" value={formLink.assuranceParamsId} onChange={e => setL('assuranceParamsId', e.target.value)} required>
              <option value="">— Sélectionner un paramètre —</option>
              {params.map((p) => <option key={p.id} value={p.id}>{p.zoneDestination} · {p.fournisseur.libelle}</option>)}
            </Select>
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2"><SubmitBtn loading={creating} label="Relier" /></div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default DocsListe;