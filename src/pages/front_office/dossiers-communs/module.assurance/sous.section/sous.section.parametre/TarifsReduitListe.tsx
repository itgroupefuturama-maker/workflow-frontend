import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceTarifsReduit, createAssuranceTarifReduit,
} from '../../../../../../app/front_office/parametre_assurance/assuranceParamsSlice';
import { Spinner, EmptyState, Th, Td, Input, Select, Modal, SubmitBtn, TableHeader } from '../../components/atoms';
import { fmtDate } from '../../utils/formatters';

const useAppDispatch = () => useDispatch<AppDispatch>();

const TarifsReduitListe = () => {
  const dispatch = useAppDispatch();
  const { tarifsReduit, params, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceParams);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ borneInf: '', borneSup: '', tauxApplique: '', assuranceParamsId: '' });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(createAssuranceTarifReduit({
      borneInf: +form.borneInf, borneSup: +form.borneSup,
      tauxApplique: +form.tauxApplique,
      assuranceParamsId: form.assuranceParamsId,
    }));
    if (createAssuranceTarifReduit.fulfilled.match(res)) {
      setOpen(false);
      setForm({ borneInf: '', borneSup: '', tauxApplique: '', assuranceParamsId: '' });
      dispatch(fetchAssuranceTarifsReduit());
    }
  };

  return (
    <>
      <TableHeader title="Tarifs réduits" count={tarifsReduit.length} onAdd={() => setOpen(true)} />
      {error && <p className="text-sm text-red-500 mb-3">⚠️ {error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr><Th>Borne (Age)</Th><Th>Zone · Fournisseur</Th><Th>Taux appliqué</Th><Th>Créé le</Th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : tarifsReduit.length === 0 ? (
              <EmptyState label="Aucun tarif réduit trouvé." />
            ) : tarifsReduit.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <Td><span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-semibold">{t.borneInf} – {t.borneSup} Ans</span></Td>
                <Td>
                  <div>
                    <p className="font-medium text-gray-800">{t.assuranceParams?.zoneDestination ?? '—'}</p>
                    <p className="text-xs text-gray-400">{t.assuranceParams?.fournisseur.libelle ?? '—'}</p>
                  </div>
                </Td>
                <Td><span className="text-sm font-bold text-violet-600">{(t.tauxApplique * 100).toFixed(0)}%</span></Td>
                <Td className="text-gray-400 text-xs">{fmtDate(t.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Nouveau tarif réduit" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Paramètre assurance" value={form.assuranceParamsId} onChange={e => set('assuranceParamsId', e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {params.map((p) => <option key={p.id} value={p.id}>{p.zoneDestination} · {p.fournisseur.libelle}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Borne inf (Age)" type="number" placeholder="1" value={form.borneInf} onChange={e => set('borneInf', e.target.value)} required />
              <Input label="Borne sup (Age)" type="number" placeholder="30" value={form.borneSup} onChange={e => set('borneSup', e.target.value)} required />
            </div>
            <Input label="Taux appliqué (ex: 0.1 pour 10%)" type="number" step="0.01" placeholder="0.10" value={form.tauxApplique} onChange={e => set('tauxApplique', e.target.value)} required />
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2"><SubmitBtn loading={creating} label="Créer le tarif réduit" /></div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default TarifsReduitListe;