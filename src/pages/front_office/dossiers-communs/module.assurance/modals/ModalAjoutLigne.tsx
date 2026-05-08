import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  createAssuranceProspectionLigne,
  fetchAssuranceProspections,
  clearCreateError,
} from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';

/* ── atoms locaux ── */
const Spinner = ({ size = 5 }: { size?: number }) => (
  <svg className={`animate-spin h-${size} w-${size} text-gray-400`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 transition text-lg leading-none">×</button>
      </div>
      <div className="px-5 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <input {...props} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder:text-gray-300" />
  </div>
);

const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <select {...props} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition">
      {children}
    </select>
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const isActif = status === 'ACTIF';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
      isActif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {status}
    </span>
  );
};

/* ── types ── */
export interface LigneModalData {
  enteteId:      string;
  numeroDos:     string;
  fournisseurId: string;
}

interface Props {
  data:         LigneModalData;
  prestationId: string;
  onClose:      () => void;
}

/* ── composant ── */
const ModalAjoutLigne = ({ data, prestationId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { creating, createError } = useSelector((s: RootState) => s.assuranceProspection);
  const { params, docs }          = useSelector((s: RootState) => s.assuranceParams);

  const [form, setForm] = React.useState({
    assuranceParamsId: '',
    dateDepart:        '',
    dateRetour:        '',
    duree:             '',
    tauxChange:        '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleDateChange = (k: 'dateDepart' | 'dateRetour', v: string) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (next.dateDepart && next.dateRetour) {
        const diff = Math.round(
          (new Date(next.dateRetour).getTime() - new Date(next.dateDepart).getTime()) / (1000 * 60 * 60 * 24)
        );
        next.duree = diff > 0 ? String(diff) : '';
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearCreateError());
    const res = await dispatch(createAssuranceProspectionLigne({
      assuranceProspectionEnteteId: data.enteteId,
      assuranceParamsId:            form.assuranceParamsId,
      dateDepart:                   new Date(form.dateDepart).toISOString(),
      dateRetour:                   new Date(form.dateRetour).toISOString(),
      duree:                        Number(form.duree),
      tauxChange:                   Number(form.tauxChange),
    }));
    if (createAssuranceProspectionLigne.fulfilled.match(res)) {
      onClose();
      dispatch(fetchAssuranceProspections(prestationId));
    }
  };

  const filteredParams  = params.filter(p => p.fournisseur.id === data.fournisseurId);
  const selectedParam   = params.find(p => p.id === form.assuranceParamsId);

  return (
    <Modal title={`Nouvelle ligne — ${data.numeroDos}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">

        {/* ── Sélection zone ── */}
        <Select label="Zone de destination" value={form.assuranceParamsId} onChange={e => set('assuranceParamsId', e.target.value)} required>
          <option value="">
            {filteredParams.length === 0 ? '— Aucun paramètre configuré pour ce fournisseur —' : '— Choisir la zone —'}
          </option>
          {filteredParams.map(p => (
            <option key={p.id} value={p.id}>{p.zoneDestination} ({p.fournisseur.libelle})</option>
          ))}
        </Select>

        {/* ── Récap paramètre sélectionné ── */}
        {selectedParam && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">

            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{selectedParam.zoneDestination}</h4>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">
                  {selectedParam.fournisseur.libelle} • {selectedParam.fournisseur.code}
                </p>
              </div>
              <Badge status={selectedParam.status} />
            </div>

            <div className="p-4 space-y-5">

              {/* Documents */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Documents requis</span>
                  <div className="h-px flex-1 bg-indigo-100/50" />
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                    {selectedParam.assuranceDocParams?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedParam.assuranceDocParams?.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">Aucun document</p>
                  ) : selectedParam.assuranceDocParams?.map(docParam => {
                    const docInfo = docs.find(d => d.id === docParam.assuranceDocId);
                    return (
                      <div key={docParam.id} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-[10px] font-semibold text-slate-600">
                        📄 {docInfo?.document ?? docParam.assuranceDocId.slice(0, 8) + '…'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tarifs plein */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Grille tarifaire (Plein)</span>
                  <div className="h-px flex-1 bg-amber-100/50" />
                </div>
                {!selectedParam.assuranceTarifPlein?.length ? (
                  <p className="text-[10px] text-gray-400 italic">Aucun tarif plein</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-amber-200/60 shadow-sm bg-white">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-amber-50/80 text-amber-800 font-bold border-b border-amber-100">
                          <th className="px-3 py-2 text-left">Période (j)</th>
                          <th className="px-3 py-2 text-left">Devise</th>
                          <th className="px-3 py-2 text-right">Net assureur</th>
                          <th className="px-3 py-2 text-right">Com.</th>
                          <th className="px-3 py-2 text-right">Total devise</th>
                          <th className="px-3 py-2 text-right text-indigo-700">Total (Ar)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {selectedParam.assuranceTarifPlein.map(t => (
                          <tr key={t.id} className="hover:bg-amber-50/30 transition-colors tabular-nums">
                            <td className="px-3 py-1.5 font-bold text-slate-600">{t.borneInf}–{t.borneSup}</td>
                            <td className="px-3 py-1.5 text-slate-400 font-mono uppercase">{t.devise}</td>
                            <td className="px-3 py-1.5 text-right">{t.prixAssureurDevise.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right text-amber-600 font-medium">{t.commissionDevise.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right font-bold">{t.prixClientDevise.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right font-black text-indigo-600">{t.prixClientAriary.toLocaleString()} Ar</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tarifs réduits */}
              {!!selectedParam.assuranceTarifReduit?.length && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Réductions par âge</span>
                    <div className="h-px flex-1 bg-violet-100/50" />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-violet-200/60 shadow-sm bg-white">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-violet-50/80 text-violet-800 font-bold border-b border-violet-100">
                          <th className="px-3 py-2 text-left">Âge (ans)</th>
                          <th className="px-3 py-2 text-left">Taux appliqué</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-violet-50">
                        {selectedParam.assuranceTarifReduit.map(t => (
                          <tr key={t.id} className="hover:bg-violet-50/30 transition-colors">
                            <td className="px-3 py-1.5 font-bold text-slate-600">{t.borneInf}–{t.borneSup} ans</td>
                            <td className="px-3 py-1.5 text-sm font-black text-violet-600">{(t.tauxApplique * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Dates + Durée + Taux ── */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date de départ"    type="date"   value={form.dateDepart}  onChange={e => handleDateChange('dateDepart',  e.target.value)} required />
          <Input label="Date de retour"    type="date"   value={form.dateRetour}  onChange={e => handleDateChange('dateRetour',  e.target.value)} required />
          <Input label="Durée (jours)"     type="number" value={form.duree}       onChange={e => set('duree',       e.target.value)} required />
          <Input label="Taux de change (Ar)" type="number" value={form.tauxChange} onChange={e => set('tauxChange', e.target.value)} required />
        </div>

        {/* ── Erreur ── */}
        {createError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
            <span className="text-red-500">⚠️</span>
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-700">{createError}</p>
              <button
                type="button"
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                onClick={() => navigate('/dossiers-communs/assurance/parametres', { state: { targetTab: 'tarifPlein' } })}
              >
                Mettre à jour les bornes tarifaires
              </button>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            disabled={creating || !form.assuranceParamsId}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {creating ? <Spinner size={3} /> : null}
            {creating ? 'Ajout en cours...' : 'Valider et ajouter la ligne'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default ModalAjoutLigne;