import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchAssuranceTarifsPlein, createAssuranceTarifPlein,
} from '../../../../../../app/front_office/parametre_assurance/assuranceParamsSlice';
import { Spinner, EmptyState, Th, Td, Input, Select, Modal, SubmitBtn, TableHeader } from '../../components/atoms';
import { fmtDate, fmtNum } from '../../utils/formatters';

const useAppDispatch = () => useDispatch<AppDispatch>();

const TarifsPleinListe = () => {
  const dispatch = useAppDispatch();
  const { tarifsPlein, params, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceParams);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    borneInf: '', borneSup: '', devise: 'EUR', assuranceParamsId: '',
    prixAssureurDevise: '', commissionDevise: '', prixClientDevise: '',
    prixAssureurAriary: '', commissionAriary: '', prixClientAriary: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(createAssuranceTarifPlein({
      borneInf: +form.borneInf, borneSup: +form.borneSup,
      prixAssureurDevise: +form.prixAssureurDevise, commissionDevise: +form.commissionDevise,
      prixClientDevise: +form.prixClientDevise, prixAssureurAriary: +form.prixAssureurAriary,
      commissionAriary: +form.commissionAriary, prixClientAriary: +form.prixClientAriary,
      devise: form.devise, assuranceParamsId: form.assuranceParamsId,
    }));
    if (createAssuranceTarifPlein.fulfilled.match(res)) {
      setOpen(false);
      setForm({ borneInf: '', borneSup: '', devise: 'EUR', assuranceParamsId: '', prixAssureurDevise: '', commissionDevise: '', prixClientDevise: '', prixAssureurAriary: '', commissionAriary: '', prixClientAriary: '' });
      dispatch(fetchAssuranceTarifsPlein());
    }
  };

  return (
    <>
      <TableHeader title="Tarifs plein" count={tarifsPlein.length} onAdd={() => setOpen(true)} />
      {error && <p className="text-sm text-red-500 mb-3">⚠️ {error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Borne (jours)</Th><Th>Zone · Fournisseur</Th><Th>Devise</Th>
              <Th>Prix assureur</Th><Th>Commission</Th><Th>Prix client</Th>
              <Th>Prix client (Ar)</Th><Th>Créé le</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : tarifsPlein.length === 0 ? (
              <EmptyState label="Aucun tarif plein trouvé." />
            ) : tarifsPlein.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <Td><span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">{t.borneInf} – {t.borneSup} j</span></Td>
                <Td>
                  <div>
                    <p className="font-medium text-gray-800">{t.assuranceParams?.zoneDestination ?? '—'}</p>
                    <p className="text-xs text-gray-400">{t.assuranceParams?.fournisseur.libelle ?? '—'}</p>
                  </div>
                </Td>
                <Td><span className="font-mono font-semibold text-gray-700">{t.devise}</span></Td>
                <Td>{fmtNum(t.prixAssureurDevise)} {t.devise}</Td>
                <Td><span className="text-amber-600 font-semibold">{fmtNum(t.commissionDevise)} {t.devise}</span></Td>
                <Td><span className="text-indigo-700 font-bold">{fmtNum(t.prixClientDevise)} {t.devise}</span></Td>
                <Td><span className="text-indigo-700 font-bold">{fmtNum(t.prixClientAriary)} Ar</span></Td>
                <Td className="text-gray-400 text-xs">{fmtDate(t.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Nouveau tarif plein" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Paramètre assurance" value={form.assuranceParamsId} onChange={e => set('assuranceParamsId', e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {params.map((p) => <option key={p.id} value={p.id}>{p.zoneDestination} · {p.fournisseur.libelle}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Borne inf (jours)" type="number" placeholder="1" value={form.borneInf} onChange={e => set('borneInf', e.target.value)} required />
              <Input label="Borne sup (jours)" type="number" placeholder="30" value={form.borneSup} onChange={e => set('borneSup', e.target.value)} required />
            </div>
            <Input label="Devise" placeholder="EUR" value={form.devise} onChange={e => set('devise', e.target.value)} required />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Prix assureur (devise)" type="number" placeholder="100" value={form.prixAssureurDevise} onChange={e => set('prixAssureurDevise', e.target.value)} required />
              <Input label="Commission (devise)" type="number" placeholder="10" value={form.commissionDevise} onChange={e => set('commissionDevise', e.target.value)} required />
              <Input label="Prix client (devise)" type="number" placeholder="110" value={form.prixClientDevise} onChange={e => set('prixClientDevise', e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Prix assureur (Ar)" type="number" placeholder="500000" value={form.prixAssureurAriary} onChange={e => set('prixAssureurAriary', e.target.value)} required />
              <Input label="Commission (Ar)" type="number" placeholder="50000" value={form.commissionAriary} onChange={e => set('commissionAriary', e.target.value)} required />
              <Input label="Prix client (Ar)" type="number" placeholder="550000" value={form.prixClientAriary} onChange={e => set('prixClientAriary', e.target.value)} required />
            </div>
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2"><SubmitBtn loading={creating} label="Créer le tarif" /></div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default TarifsPleinListe;