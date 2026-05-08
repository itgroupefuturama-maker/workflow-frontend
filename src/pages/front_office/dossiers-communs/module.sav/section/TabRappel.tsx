import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  fetchSavRappels,
  envoyerRappel,
  reenvoyerRappel,
} from '../../../../../app/front_office/parametre_sav/savRappelSlice';
import type { SavRappel } from '../../../../../app/front_office/parametre_sav/savRappelSlice';

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

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, colorClass }: { label: string; value: number; colorClass: string }) => (
  <div className="flex-1 min-w-[140px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
  </div>
);

// ─── Modale Envoi ─────────────────────────────────────────────────────────────

function ModalEnvoi({
  item,
  onClose,
  onConfirm,
  isSending,
}: {
  item: SavRappel;
  onClose: () => void;
  onConfirm: (texte: string, numeroEnvoie: string) => void;
  isSending: boolean;
}) {
  const [texte, setTexte] = useState(item.texte);
  const [numeroType, setNumeroType] = useState<'beneficiaire' | 'facture' | 'libre'>('beneficiaire');
  const [numeroLibre, setNumeroLibre] = useState('');

  function cleanNumero(raw: string): string {
    // 1. Supprime tout sauf les chiffres
    let digits = raw.replace(/[^\d]/g, '');

    // 2. Si commence par 261 (indicatif Madagascar via +261), on retire les 3 premiers
    if (digits.startsWith('261')) {
      digits = digits.slice(3);
    }

    // 3. Supprime le 0 initial (format local 0XX XXX XXX → XX XXX XXX)
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // 4. Sécurité : garde les 9 derniers chiffres
    if (digits.length > 9) {
      digits = digits.slice(-9);
    }

    return digits;
  }

  const numeroFinal =
    numeroType === 'beneficiaire'
      ? cleanNumero(item.whatsappBeneficiaire)
      : numeroType === 'facture'
      ? cleanNumero(item.whatsappFacture)
      : cleanNumero(numeroLibre);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Envoyer le rappel</h3>
            <p className="text-xs text-slate-400 mt-0.5">{item.clientBeneficiaire.libelle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Texte */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Message à envoyer
            </label>
            <textarea
              value={texte}
              onChange={e => setTexte(e.target.value)}
              rows={6}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 font-mono focus:ring-4 focus:ring-slate-900/5 outline-none transition-all resize-none"
            />
          </div>

          {/* Numéro */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
              Numéro destinataire
            </label>
            <div className="flex gap-2 mb-3">
              {[
                { key: 'beneficiaire', label: 'Bénéficiaire', value: item.whatsappBeneficiaire },
                { key: 'facture',      label: 'Facturé',      value: item.whatsappFacture },
                { key: 'libre',        label: 'Libre',        value: '' },
              ].map(opt => (
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
                onChange={e => setNumeroLibre(e.target.value)}
                placeholder="Ex: +261 34 00 000 00"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
              />
            )}

            {numeroType === 'libre' && numeroLibre && (
              <p className="mt-1.5 text-[11px] text-slate-400 font-mono">
                Numéro formaté : <span className="text-slate-700 font-bold">{cleanNumero(numeroLibre)}</span>
              </p>
            )}

            {/* Récap numéro sélectionné */}
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
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(texte, numeroFinal)}
            disabled={isSending || !numeroFinal.trim() || !texte.trim()}
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

// ─── Modale Renvoi ────────────────────────────────────────────────────────────

function ModalReenvoi({
  item,
  templateRerappel,
  onClose,
  onConfirm,
  isResending,
}: {
  item: SavRappel;
  templateRerappel: string;
  onClose: () => void;
  onConfirm: (texteReenvoie: string, numeroEnvoie: string) => void;
  isResending: boolean;
}) {
  const [texte, setTexte] = useState(templateRerappel || item.texteReenvoie || '');
  const [numeroType, setNumeroType] = useState<'beneficiaire' | 'facture' | 'libre'>('beneficiaire');
  const [numeroLibre, setNumeroLibre] = useState('');

  function cleanNumero(raw: string): string {
    // 1. Supprime tout sauf les chiffres
    let digits = raw.replace(/[^\d]/g, '');

    // 2. Si commence par 261 (indicatif Madagascar via +261), on retire les 3 premiers
    if (digits.startsWith('261')) {
      digits = digits.slice(3);
    }

    // 3. Supprime le 0 initial (format local 0XX XXX XXX → XX XXX XXX)
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // 4. Sécurité : garde les 9 derniers chiffres
    if (digits.length > 9) {
      digits = digits.slice(-9);
    }

    return digits;
  }

  const numeroFinal =
    numeroType === 'beneficiaire'
      ? cleanNumero(item.whatsappBeneficiaire)
      : numeroType === 'facture'
      ? cleanNumero(item.whatsappFacture)
      : cleanNumero(numeroLibre);

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Renvoyer le rappel</h3>
            <p className="text-xs text-slate-400 mt-0.5">{item.clientBeneficiaire.libelle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* Historique envoi précédent */}
        <div className="mx-6 mt-5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <p className="text-[11px] font-bold text-emerald-700 uppercase mb-1">Envoi initial</p>
          <p className="text-xs text-emerald-600 font-mono">
            {new Date(item.dateEnvoie).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })} — {item.numeroEnvoie}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Texte */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Message de renvoi
            </label>
            <textarea
              value={texte}
              onChange={e => setTexte(e.target.value)}
              rows={6}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 font-mono focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
            />
          </div>

          {/* Numéro */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
              Numéro destinataire
            </label>
            <div className="flex gap-2 mb-3">
              {[
                { key: 'beneficiaire', label: 'Bénéficiaire', value: item.whatsappBeneficiaire },
                { key: 'facture',      label: 'Facturé',      value: item.whatsappFacture },
                { key: 'libre',        label: 'Libre',        value: '' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setNumeroType(opt.key as any)}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-all ${
                    numeroType === opt.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                  {opt.value && (
                    <span className={`block text-[10px] mt-0.5 font-mono ${
                      numeroType === opt.key ? 'text-indigo-200' : 'text-slate-400'
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
                onChange={e => setNumeroLibre(e.target.value)}
                placeholder="Ex: +261 34 00 000 00"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(texte, numeroFinal)}
            disabled={isResending || !numeroFinal.trim() || !texte.trim()}
            className="text-sm px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isResending && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Confirmer le renvoi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TabRappel() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, sending, resending } = useSelector((state: RootState) => state.savRappel);

  // On récupère le premier template rerappel depuis le store savParams
  const templateRerappel = useSelector(
    (state: RootState) => state.savParams.templatesRerappel[0]?.texte ?? ''
  );

  const [modalEnvoi, setModalEnvoi] = useState<SavRappel | null>(null);
  const [modalReenvoi, setModalReenvoi] = useState<SavRappel | null>(null);

  useEffect(() => {
    dispatch(fetchSavRappels());
  }, [dispatch]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleConfirmEnvoi = async (texte: string, numeroEnvoie: string) => {
    if (!modalEnvoi) return;
    await dispatch(envoyerRappel({
      id: modalEnvoi.id,
      texte,
      status: 'ACHEVE',
      dateEnvoie: new Date().toISOString(),
      numeroEnvoie: Number(numeroEnvoie), // ← conversion string → number
    }));
    setModalEnvoi(null);
  };

  // handleConfirmReenvoi
  const handleConfirmReenvoi = async (texteReenvoie: string, numeroEnvoie: string) => {
    if (!modalReenvoi) return;
    await dispatch(reenvoyerRappel({
      id: modalReenvoi.id,
      texteReenvoie,
      dateReenvoie: new Date().toISOString(),
      numeroEnvoie: Number(numeroEnvoie), // ← conversion string → number
    }));
    setModalReenvoi(null);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = {
    total:   items.length,
    acheves: items.filter(i => i.status === 'ACHEVE').length,
    attente: items.filter(i => i.status === 'INACHEVE').length,
    inactif: items.filter(i => i.status === 'INACTIF').length,
  };

  return (
    <div className="max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="my-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SAV Rappel</h1>
        <p className="text-slate-500 text-sm mt-1">Suivi des rappels et relances clients. Le systeme récupère la liste automatiquement 3 jours avant la date de vol du client Bénéficiaire</p>
        <div className="flex gap-4 mt-6">
          <StatCard label="Total"      value={stats.total}   colorClass="text-slate-900" />
          <StatCard label="Achevés"    value={stats.acheves} colorClass="text-emerald-600" />
          <StatCard label="En attente" value={stats.attente} colorClass="text-amber-600" />
          <StatCard label="Inactifs"   value={stats.inactif} colorClass="text-slate-400" />
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 justify-between items-center">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input
              className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
              placeholder="Rechercher une référence ou un client..."
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <button className="text-sm px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            Filtres ▾
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Client</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Numéros</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Résa</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Message</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Date envoi</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Renvoi</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">N° envoi</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-left">Statut</th>
                <th className="px-3 py-2.5 text-[11px] font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(row => {
                const isAcheve    = row.status === 'ACHEVE';
                const isSending   = sending   === row.id;
                const isResending = resending === row.id;

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">

                    {/* Client */}
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] font-medium text-slate-900 truncate max-w-[130px]">
                        {row.clientBeneficiaire.libelle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.clientBeneficiaire.code}</div>
                    </td>

                    {/* Numéros bénéf + facture */}
                    <td className="px-3 py-2.5">
                      <div className="text-[11px] text-slate-600 font-mono truncate max-w-[100px]"
                        title={row.whatsappBeneficiaire}>
                        {row.whatsappBeneficiaire || <span className="text-slate-300">—</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[100px] mt-0.5"
                        title={row.whatsappFacture}>
                        {row.whatsappFacture || <span className="text-slate-300">—</span>}
                      </div>
                    </td>

                    {/* Résa */}
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-600
                        border border-slate-200 rounded-md px-1.5 py-0.5 inline-block">
                        {row.billetLigne.reservation}
                      </span>
                    </td>

                    {/* Message + date rappel */}
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] text-slate-500 truncate max-w-[140px]" title={row.texte}>
                        {row.texte.split('\n')[0]}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(row.dateRappel).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </td>

                    {/* Date envoi */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.dateEnvoie ? (
                        <>
                          <div className="text-[10px] text-slate-400">Envoi</div>
                          <div className="text-[11px] text-slate-700 font-medium">
                            {new Date(row.dateEnvoie).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Message renvoi + date renvoi */}
                    <td className="px-3 py-2.5">
                      {row.texteReenvoie ? (
                        <>
                          <p className="text-[11px] text-slate-500 truncate max-w-[130px]"
                            title={row.texteReenvoie}>
                            {row.texteReenvoie}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.dateReenvoie
                              ? new Date(row.dateReenvoie).toLocaleDateString('fr-FR', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })
                              : '—'}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Numéro envoi */}
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-mono text-slate-500">
                        {row.numeroEnvoie || <span className="text-slate-300">—</span>}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border
                        ${statusStyles[row.status]}`}>
                        {statusLabel[row.status]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex gap-1.5 justify-end">
                        {!isAcheve && (
                          <button
                            onClick={() => setModalEnvoi(row)}
                            disabled={isSending}
                            className="text-[10px] px-2.5 py-1 rounded-full border border-green-200
                              bg-green-50 text-green-800 font-medium hover:bg-green-100
                              disabled:opacity-50 flex items-center gap-1 transition-colors"
                          >
                            {isSending && (
                              <span className="w-2.5 h-2.5 border border-green-700
                                border-t-transparent rounded-full animate-spin" />
                            )}
                            Envoyer
                          </button>
                        )}
                        <button
                          onClick={() => isAcheve ? setModalReenvoi(row) : undefined}
                          disabled={!isAcheve || isResending || row.texteReenvoie !== null}
                          title={!isAcheve ? 'Disponible uniquement après le premier envoi' : ''}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-medium border
                            flex items-center gap-1 transition-colors
                            ${isAcheve
                              ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                              : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                            } disabled:opacity-60`}
                        >
                          {isResending && (
                            <span className="w-2.5 h-2.5 border border-current
                              border-t-transparent rounded-full animate-spin" />
                          )}
                          Renvoyer
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading && (
          <div className="py-20 text-center">
            <div className="text-3xl mb-2">📁</div>
            <p className="text-slate-400 text-sm font-medium">Aucun rappel à traiter pour le moment.</p>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalEnvoi && (
        <ModalEnvoi
          item={modalEnvoi}
          onClose={() => setModalEnvoi(null)}
          onConfirm={handleConfirmEnvoi}
          isSending={sending === modalEnvoi.id}
        />
      )}
      {modalReenvoi && (
        <ModalReenvoi
          item={modalReenvoi}
          templateRerappel={templateRerappel}
          onClose={() => setModalReenvoi(null)}
          onConfirm={handleConfirmReenvoi}
          isResending={resending === modalReenvoi.id}
        />
      )}
    </div>
  );
}