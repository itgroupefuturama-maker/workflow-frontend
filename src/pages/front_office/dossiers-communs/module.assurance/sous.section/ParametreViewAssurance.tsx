import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import TabContainer from '../../../../../layouts/TabContainer';
import type { AppDispatch, RootState } from '../../../../../app/store';
import RaisonAnnulationListe from '../../module.ticketing/ticketing.sous.module/SousMenuPrestation/RaisonAnnulationListe';
import {
  fetchAssuranceParams, fetchAssuranceDocs, fetchAssuranceTarifsPlein, fetchAssuranceTarifsReduit,
  createAssuranceParams, createAssuranceDoc, createAssuranceTarifPlein, createAssuranceTarifReduit,
  linkDocToParams,
} from '../../../../../app/front_office/parametre_assurance/assuranceParamsSlice';
import React from 'react';

const useAppDispatch = () => useDispatch<AppDispatch>();

/* ─────────────────────── helpers ─────────────────────── */

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtNum = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('fr-FR') : '—';

/* ─────────────────────── atoms ───────────────────────── */

const Badge = ({ status }: { status: string }) => {
  const isActif = status === 'ACTIF';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
      isActif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {status}
    </span>
  );
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const EmptyState = ({ label }: { label: string }) => (
  <tr><td colSpan={99} className="text-center py-10 text-sm text-gray-400 italic">{label}</td></tr>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
    {children}
  </th>
);
const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
    {children}
  </td>
);

/* ── Input générique ── */
const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition placeholder:text-gray-300"
    />
  </div>
);

/* ── Select générique ── */
const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    <select
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
    >
      {children}
    </select>
  </div>
);

/* ── Modal wrapper ── */
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 transition text-lg leading-none">×</button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  </div>
);

/* ── Bouton submit ── */
const SubmitBtn = ({ loading, label }: { loading: boolean; label: string }) => (
  <button
    type="submit"
    disabled={loading}
    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
  >
    {loading ? <Spinner /> : null}
    {loading ? 'Enregistrement…' : label}
  </button>
);

/* ── Table header avec bouton ajouter ── */
const TableHeader = ({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{count}</span>
    </div>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
    >
      + Ajouter
    </button>
  </div>
);

/* ─────────────────────── onglet Params ─────────────────────── */

const ParamsListe = () => {
  const dispatch = useAppDispatch();
  const { params,docs, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceParams);
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
    <>
      <TableHeader title="Paramètres assurance" count={params.length} onAdd={() => setOpen(true)} />
      {error && <p className="text-sm text-red-500 mb-3">⚠️ {error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <Th></Th>
              <Th>Zone destination</Th>
              <Th>Fournisseur</Th>
              <Th>Date application</Th>
              <Th>Statut</Th>
              <Th>Créé le</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : params.length === 0 ? (
              <EmptyState label="Aucun paramètre trouvé." />
            ) : params.map((p) => (
              <React.Fragment key={p.id}>
                {/* ── Ligne principale ── */}
                <tr
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => toggleExpand(p.id)}
                >
                  <Td>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${expanded[p.id] ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Td>
                  <Td><span className="font-semibold text-gray-900">{p.zoneDestination}</span></Td>
                  <Td>
                    <div>
                      <p className="font-medium text-gray-800">{p.fournisseur.libelle}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.fournisseur.code}</p>
                    </div>
                  </Td>
                  <Td>{fmtDate(p.dateApplication)}</Td>
                  <Td><Badge status={p.status} /></Td>
                  <Td className="text-gray-400 text-xs">{fmtDate(p.createdAt)}</Td>
                </tr>

                {/* ── Ligne expandée ── */}
                {expanded[p.id] && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4 space-y-4 border-b border-gray-100">

                      {/* Documents */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Documents requis</p>
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                            {p.assuranceDocParams?.length ?? 0}
                          </span>
                        </div>
                        {!p.assuranceDocParams || p.assuranceDocParams.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Aucun document</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {p.assuranceDocParams.map((docParam) => {
                              // ← on cherche le doc correspondant dans la liste docs du store
                              const docInfo = docs.find((d) => d.id === docParam.assuranceDocId);
                              return (
                                <div key={docParam.id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                                  <span className="text-sm">📄</span>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-800">
                                      {docInfo?.document ?? <span className="italic text-gray-400">Document inconnu</span>}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-mono">
                                      {docInfo?.codeDoc ?? docParam.assuranceDocId.slice(0, 8) + '…'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Tarifs plein */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Tarifs plein</p>
                          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                            {p.assuranceTarifPlein?.length ?? 0}
                          </span>
                        </div>
                        {!p.assuranceTarifPlein || p.assuranceTarifPlein.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Aucun tarif plein</p>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-amber-50">
                                  <th className="px-3 py-2 text-left font-semibold text-amber-600">Borne (j)</th>
                                  <th className="px-3 py-2 text-left font-semibold text-amber-600">Devise</th>
                                  <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix assureur</th>
                                  <th className="px-3 py-2 text-right font-semibold text-amber-600">Commission</th>
                                  <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix client</th>
                                  <th className="px-3 py-2 text-right font-semibold text-amber-600">Prix client (Ar)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.assuranceTarifPlein.map((t) => (
                                  <tr key={t.id} className="bg-white border-t border-gray-100">
                                    <td className="px-3 py-2">
                                      <span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">
                                        {t.borneInf} – {t.borneSup}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 font-mono font-semibold text-gray-700">{t.devise}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">{fmtNum(t.prixAssureurDevise)}</td>
                                    <td className="px-3 py-2 text-right text-amber-600 font-semibold">{fmtNum(t.commissionDevise)}</td>
                                    <td className="px-3 py-2 text-right text-indigo-700 font-bold">{fmtNum(t.prixClientDevise)}</td>
                                    <td className="px-3 py-2 text-right text-indigo-700 font-bold">{fmtNum(t.prixClientAriary)} Ar</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Tarifs réduit */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Tarifs réduits</p>
                          <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                            {p.assuranceTarifReduit?.length ?? 0}
                          </span>
                        </div>
                        {!p.assuranceTarifReduit || p.assuranceTarifReduit.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Aucun tarif réduit</p>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-violet-50">
                                  <th className="px-3 py-2 text-left font-semibold text-violet-600">Borne (j)</th>
                                  <th className="px-3 py-2 text-left font-semibold text-violet-600">Taux appliqué</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.assuranceTarifReduit.map((t) => (
                                  <tr key={t.id} className="bg-white border-t border-gray-100">
                                    <td className="px-3 py-2">
                                      <span className="font-mono bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-semibold">
                                        {t.borneInf} – {t.borneSup}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className="text-lg font-bold text-violet-600">
                                        {(t.tauxApplique * 100).toFixed(0)}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Nouveau paramètre assurance" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Fournisseur" value={form.fournisseurId} onChange={e => set('fournisseurId', e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {fournisseurs?.map((f: any) => (
                <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
              ))}
            </Select>
            <Input label="Zone de destination" placeholder="ex: Europe" value={form.zoneDestination} onChange={e => set('zoneDestination', e.target.value)} required />
            <Select label="Statut" value={form.status} onChange={e => set('status', e.target.value)} required>
              <option value="ACTIF">ACTIF</option>
              <option value="INACTIF">INACTIF</option>
            </Select>
            <Input label="Date d'application" type="datetime-local" value={form.dateApplication} onChange={e => set('dateApplication', e.target.value)} required />
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2">
              <SubmitBtn loading={creating} label="Créer le paramètre" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

/* ─────────────────────── onglet Docs ─────────────────────── */

const DocsListe = () => {
  const dispatch = useAppDispatch();
  const { docs, params, loading, creating, error, createError } = useSelector((s: RootState) => s.assuranceParams);

  // modal création doc
  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate, setFormCreate] = useState({ codeDoc: '', document: '' });

  // modal liaison doc → params
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
      dispatch(fetchAssuranceParams()); // re-fetch params pour voir le doc lié
      dispatch(fetchAssuranceDocs());
    }
  };

  return (
    <>
      {/* ── Header avec 2 boutons ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">Documents requis</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{docs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenLink(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg transition shadow-sm"
          >
            🔗 Relier à un paramètre
          </button>
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">⚠️ {error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Document</Th>
              <Th>Créé le</Th>
            </tr>
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

      {/* ── Modal création ── */}
      {openCreate && (
        <Modal title="Nouveau document" onClose={() => setOpenCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Code document" placeholder="ex: DOC001" value={formCreate.codeDoc} onChange={e => setC('codeDoc', e.target.value)} required />
            <Input label="Nom du document" placeholder="ex: Passport copy" value={formCreate.document} onChange={e => setC('document', e.target.value)} required />
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2">
              <SubmitBtn loading={creating} label="Créer le document" />
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal liaison ── */}
      {openLink && (
        <Modal title="Relier un document à un paramètre" onClose={() => setOpenLink(false)}>
          <form onSubmit={handleLink} className="space-y-4">
            <Select label="Document" value={formLink.assuranceDocId} onChange={e => setL('assuranceDocId', e.target.value)} required>
              <option value="">— Sélectionner un document —</option>
              {docs.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.document} ({doc.codeDoc})</option>
              ))}
            </Select>
            <Select label="Paramètre assurance" value={formLink.assuranceParamsId} onChange={e => setL('assuranceParamsId', e.target.value)} required>
              <option value="">— Sélectionner un paramètre —</option>
              {params.map((p) => (
                <option key={p.id} value={p.id}>{p.zoneDestination} · {p.fournisseur.libelle}</option>
              ))}
            </Select>
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2">
              <SubmitBtn loading={creating} label="Relier" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

/* ─────────────────────── onglet Tarif Plein ─────────────────────── */

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
              <Th>Borne (jours)</Th>
              <Th>Zone · Fournisseur</Th>
              <Th>Devise</Th>
              <Th>Prix assureur</Th>
              <Th>Commission</Th>
              <Th>Prix client</Th>
              <Th>Prix client (Ar)</Th>
              <Th>Créé le</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : tarifsPlein.length === 0 ? (
              <EmptyState label="Aucun tarif plein trouvé." />
            ) : tarifsPlein.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <Td>
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                    {t.borneInf} – {t.borneSup} j
                  </span>
                </Td>
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
              {params.map((p) => (
                <option key={p.id} value={p.id}>{p.zoneDestination} · {p.fournisseur.libelle}</option>
              ))}
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
            <div className="flex justify-end pt-2">
              <SubmitBtn loading={creating} label="Créer le tarif" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

/* ─────────────────────── onglet Tarif Réduit ─────────────────────── */

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
            <tr>
              <Th>Borne (Age)</Th>
              <Th>Zone · Fournisseur</Th>
              <Th>Taux appliqué</Th>
              <Th>Créé le</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : tarifsReduit.length === 0 ? (
              <EmptyState label="Aucun tarif réduit trouvé." />
            ) : tarifsReduit.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <Td>
                  <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-semibold">
                    {t.borneInf} – {t.borneSup} Ans
                  </span>
                </Td>
                <Td>
                  <div>
                    <p className="font-medium text-gray-800">{t.assuranceParams?.zoneDestination ?? '—'}</p>
                    <p className="text-xs text-gray-400">{t.assuranceParams?.fournisseur.libelle ?? '—'}</p>
                  </div>
                </Td>
                <Td>
                  <span className="text-2xl font-bold text-violet-600">
                    {(t.tauxApplique * 100).toFixed(0)}%
                  </span>
                </Td>
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
              {params.map((p) => (
                <option key={p.id} value={p.id}>{p.zoneDestination} · {p.fournisseur.libelle}</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Borne inf (Age)" type="number" placeholder="1" value={form.borneInf} onChange={e => set('borneInf', e.target.value)} required />
              <Input label="Borne sup (Age)" type="number" placeholder="30" value={form.borneSup} onChange={e => set('borneSup', e.target.value)} required />
            </div>
            <Input label="Taux appliqué (ex: 0.1 pour 10%)" type="number" step="0.01" placeholder="0.10" value={form.tauxApplique} onChange={e => set('tauxApplique', e.target.value)} required />
            {createError && <p className="text-xs text-red-500">⚠️ {createError}</p>}
            <div className="flex justify-end pt-2">
              <SubmitBtn loading={creating} label="Créer le tarif réduit" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

/* ─────────────────────── page principale ─────────────────────── */

const ParametreViewVisa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'params');

  const tabs = [
    { id: 'params',                label: 'Paramètre' },
    { id: 'docs',                  label: 'Document' },
    { id: 'tarifPlein',            label: 'Tarif Plein' },
    { id: 'tarifReduit',           label: 'Tarif Réduit' },
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
  ];

  useEffect(() => {
    if (location.state?.targetTab) {
      const t = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(t);
    }
  }, [location.state?.targetTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // ← Réécrit location.state sans changer l'URL
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, targetTab: tab },
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} >
        <div className="space-y-8 py-2 px-4">
          {activeTab === 'params'                && <ParamsListe />}
          {activeTab === 'docs'                  && <DocsListe />}
          {activeTab === 'tarifPlein'            && <TarifsPleinListe />}
          {activeTab === 'tarifReduit'           && <TarifsReduitListe />}
          {activeTab === 'listeRaisonAnnulation' && <RaisonAnnulationListe />}
        </div>
      </TabContainer>
    </div>
  );
};

export default ParametreViewVisa;