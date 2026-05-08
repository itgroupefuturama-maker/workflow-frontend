import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { createAssuranceParams, fetchAssuranceParams } from '../../../../../../app/front_office/parametre_assurance/assuranceParamsSlice';
import { Badge, EmptyState, Input, Modal, Select, Spinner, SubmitBtn, TableHeader, Td, Th } from '../../components/atoms';
import { fmtDate, fmtNum } from '../../utils/formatters';
import { ChevronDown, Globe, Shield, Calendar, Layers, FileText, TrendingDown } from 'lucide-react';

const ParamsListe = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { params, docs, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceParams);
  const { data: fournisseurs } = useSelector((s: RootState) => s.fournisseurs);
  
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ fournisseurId: '', zoneDestination: '', status: 'ACTIF', dateApplication: '' });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(createAssuranceParams({
      ...form,
      dateApplication: new Date(form.dateApplication).toISOString(),
    }));
    if (createAssuranceParams.fulfilled.match(res)) {
      setOpen(false);
      setForm({ fournisseurId: '', zoneDestination: '', status: 'ACTIF', dateApplication: '' });
      dispatch(fetchAssuranceParams());
    }
  };

  return (
    <div className="space-y-4">
      <TableHeader 
        title="Configuration des Assurances" 
        subtitle="Gérez vos grilles tarifaires et documents requis par zone"
        count={params.length} 
        onAdd={() => setOpen(true)} 
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          <Shield size={16} /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <Th className="w-10"></Th>
              <Th>Zone & Destination</Th>
              <Th>Fournisseur</Th>
              <Th>Date d'application</Th>
              <Th>Statut</Th>
              <Th className="text-right pr-6">Création</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-20 text-center"><Spinner /></td></tr>
            ) : params.length === 0 ? (
              <tr><td colSpan={6}><EmptyState label="Aucun paramètre configuré." /></td></tr>
            ) : params.map((p) => {
              const isExpanded = expanded[p.id];
              return (
                <React.Fragment key={p.id}>
                  {/* Ligne Principale */}
                  <tr 
                    onClick={() => toggleExpand(p.id)}
                    className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                  >
                    <Td className="text-center">
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                          <Globe size={16} />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight">{p.zoneDestination}</span>
                      </div>
                    </Td>
                    <Td>
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{p.fournisseur.libelle}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{p.fournisseur.code}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">{fmtDate(p.dateApplication)}</span>
                      </div>
                    </Td>
                    <Td><Badge status={p.status} /></Td>
                    <Td className="text-right pr-6 text-[11px] font-medium text-slate-400 uppercase italic">
                      {fmtDate(p.createdAt)}
                    </Td>
                  </tr>

                  {/* Ligne de Détails (Extensible) */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0 bg-slate-50/50">
                        <div className="px-10 py-6 grid grid-cols-1 gap-6 border-b border-indigo-100/50">
                          
                          {/* 1. Documents */}
                          <section>
                            <header className="flex items-center gap-2 mb-3">
                              <FileText size={14} className="text-indigo-500" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Documents Requis</h4>
                              <div className="h-px flex-1 bg-indigo-100" />
                            </header>
                            <div className="flex flex-wrap gap-2">
                              {p.assuranceDocParams?.map((dp) => {
                                const doc = docs.find(d => d.id === dp.assuranceDocId);
                                return (
                                  <div key={dp.id} className="flex flex-col p-2 bg-white border border-indigo-100 rounded-lg shadow-xs min-w-[140px]">
                                    <span className="text-[11px] font-bold text-slate-800 leading-tight">{doc?.document || 'Doc. Inconnu'}</span>
                                    <span className="text-[9px] font-mono text-indigo-400 uppercase">{doc?.codeDoc || '---'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </section>

                          {/* 2. Tarifs Pleins */}
                          <section>
                            <header className="flex items-center gap-2 mb-3">
                              <Layers size={14} className="text-amber-500" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Grille Tarifaire (Plein)</h4>
                              <div className="h-px flex-1 bg-amber-100" />
                            </header>
                            <div className="overflow-hidden bg-white border border-amber-100 rounded-xl">
                              <table className="w-full text-[11px]">
                                <thead className="bg-amber-50 text-amber-700 font-bold uppercase text-[9px]">
                                  <tr>
                                    <th className="px-4 py-2">Durée (jours)</th>
                                    <th className="px-4 py-2">Devise</th>
                                    <th className="px-4 py-2 text-right">Net Assureur</th>
                                    <th className="px-4 py-2 text-right">Commission</th>
                                    <th className="px-4 py-2 text-right bg-amber-100/50 text-amber-900 font-black italic">Total Client</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-50">
                                  {p.assuranceTarifPlein?.map((t) => (
                                    <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                                      <td className="px-4 py-2">
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-mono font-bold">
                                          {t.borneInf} - {t.borneSup}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 font-bold text-slate-500 uppercase">{t.devise}</td>
                                      <td className="px-4 py-2 text-right tabular-nums">{fmtNum(t.prixAssureurDevise)}</td>
                                      <td className="px-4 py-2 text-right tabular-nums font-semibold text-amber-600">{fmtNum(t.commissionDevise)}</td>
                                      <td className="px-4 py-2 text-right tabular-nums bg-indigo-50/30">
                                        <div className="font-black text-indigo-700">{fmtNum(t.prixClientDevise)} {t.devise}</div>
                                        <div className="text-[9px] text-slate-400">{fmtNum(t.prixClientAriary)} Ar</div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>

                          {/* 3. Tarifs Réduits */}
                          {p.assuranceTarifReduit?.length > 0 && (
                            <section>
                              <header className="flex items-center gap-2 mb-3">
                                <TrendingDown size={14} className="text-violet-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-500">Conditions de Réduction</h4>
                                <div className="h-px flex-1 bg-violet-100" />
                              </header>
                              <div className="flex flex-wrap gap-4">
                                {p.assuranceTarifReduit.map((t) => (
                                  <div key={t.id} className="flex items-center gap-3 p-3 bg-white border border-violet-100 rounded-xl shadow-xs">
                                    <div className="text-center px-2 py-1 bg-violet-50 rounded-lg">
                                      <p className="text-[9px] font-bold text-violet-400 uppercase">Ages</p>
                                      <p className="text-xs font-black text-violet-700">{t.borneInf} à {t.borneSup} Ans</p>
                                    </div>
                                    <div className="h-8 w-px bg-slate-100" />
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Taux Appliqué</p>
                                      <p className="text-sm font-black text-violet-600">{(t.tauxApplique * 100).toFixed(0)}%</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de création stylisé */}
      {open && (
        <Modal title="Nouveau Paramètre" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-5 p-2">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Fournisseur" value={form.fournisseurId} onChange={e => set('fournisseurId', e.target.value)} required>
                <option value="">Sélectionner...</option>
                {fournisseurs?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
                ))}
              </Select>
              <Select label="Statut" value={form.status} onChange={e => set('status', e.target.value)} required>
                <option value="ACTIF">ACTIF</option>
                <option value="INACTIF">INACTIF</option>
              </Select>
            </div>
            <Input label="Zone Destination" placeholder="ex: Europe / Schengen" value={form.zoneDestination} onChange={e => set('zoneDestination', e.target.value)} required />
            <Input label="Date de mise en application" type="datetime-local" value={form.dateApplication} onChange={e => set('dateApplication', e.target.value)} required />
            
            {createError && (
              <div className="p-3 bg-red-50 text-red-600 text-[11px] rounded-lg font-medium border border-red-100">
                ⚠️ {createError}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <SubmitBtn loading={creating} label="Enregistrer le paramètre" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ParamsListe;