// src/components/modals/EmissionModal.tsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiFileText, FiTrash2 } from 'react-icons/fi';
import { toast } from '../Toast/toast';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { API_URL } from '../../service/env';

interface PassagerEmission {
  billetId: string;           // ID du billet (de la table billet)
  infoId: string;             // clientbeneficiaireInfoId
  nomComplet: string;
  numeroBillet: string;
  pjBillet: File | null;
  // PDF déjà envoyé (chemin serveur) : affiché pendant son rechargement, ou en lien s'il n'a pas pu être rechargé
  pjExistant: string | null;
}

interface EmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  ligne: any;
  numeroBillet?: string;      // plus vraiment utilisé car multi
  // Requête en cours : bouton d'envoi bloqué (évite le double envoi)
  loading?: boolean;
}

// Formatage des montants (séparateur de milliers, "—" si vide)
const fmt = (value: any, suffix = '') => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  const txt = isNaN(n) ? String(value) : n.toLocaleString('fr-FR');
  return suffix ? `${txt} ${suffix}` : txt;
};

const EmissionModal: React.FC<EmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligne,
  loading = false,
}) => {
  // Correction (ligne déjà CLOTURER) : on repart de la saisie précédente (taux, numéros, PDF)
  const tauxInitial = (l: any) => l?.emissionTauxChange || l?.resaTauxEchange || 4850;
  const [tauxChange, setTauxChange] = useState<number | ''>(tauxInitial(ligne));
  const [passagers, setPassagers] = useState<PassagerEmission[]>([]);

  useEffect(() => {
    if (!isOpen || !ligne?.billet?.length) return;
    let active = true;

    setTauxChange(tauxInitial(ligne));
    setPassagers(
      ligne.billet.map((b: any) => {
        const info = b.clientbeneficiaireInfo;
        const nom = `${info.prenom || ''} ${info.nom || ''}`.trim() || 'Passager inconnu';
        return {
          billetId: b.id,
          infoId: info.id,
          nomComplet: nom,
          numeroBillet: b.numeroBillet ?? '',
          pjBillet: null,
          pjExistant: b.pjBillet ?? null,
        };
      })
    );

    // Les PDF déjà envoyés sont rechargés en File : la route attend un fichier par passager, ils repartent
    // tels quels si l'agent ne les remplace pas
    ligne.billet.forEach(async (b: any) => {
      if (!b.pjBillet) return;
      try {
        const res = await fetch(`${API_URL}/${b.pjBillet}`, { credentials: 'include' });
        if (!res.ok) return;
        const blob = await res.blob();
        const nomFichier = String(b.pjBillet).split('/').pop() || `billet-${b.id}.pdf`;
        const file = new File([blob], nomFichier, { type: blob.type || 'application/pdf' });
        if (!active) return;
        // Ne remplace pas un fichier choisi entre-temps par l'agent
        setPassagers(prev => prev.map(p => (p.billetId === b.id && !p.pjBillet ? { ...p, pjBillet: file } : p)));
      } catch {
        // Fichier introuvable : l'agent devra le joindre à nouveau (le lien reste affiché)
      }
    });

    return () => {
      active = false;
    };
  }, [isOpen, ligne]);

  // Fermeture avec la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  const updatePassager = (index: number, patch: Partial<PassagerEmission>) => {
    setPassagers(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removePassager = (index: number) => {
    setPassagers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (passagers.length === 0) {
      toast.warning('Aucun passager à émettre');
      return;
    }

    if (!tauxChange || Number(tauxChange) <= 0) {
      toast.warning('Veuillez saisir un taux de change valide');
      return;
    }

    const hasMissing = passagers.some(p => !p.numeroBillet.trim() || !p.pjBillet);
    if (hasMissing) {
      toast.warning('Chaque passager doit avoir un numéro de billet ET son e-billet compagnie (PDF)');
      return;
    }

    const data = {
      emissionTauxChange: Number(tauxChange),
      billets: passagers.map(p => ({
        billetId: p.billetId,
        numeroBillet: p.numeroBillet.trim(),
      })),
      pjBillets: passagers.map(p => p.pjBillet),
    };

    onSubmit(data);
  };

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const pl = ligne?.prospectionLigne || {};
  const completed = passagers.filter(p => p.numeroBillet.trim() && p.pjBillet).length;

  const tarifRows = [
    {
      label: 'Billet',
      values: [
        fmt(pl.montantBilletCompagnieDevise),
        fmt(pl.montantBilletCompagnieAriary, 'Ar'),
        fmt(pl.montantBilletClientDevise),
        fmt(pl.montantBilletClientAriary, 'Ar'),
      ],
    },
    {
      label: 'Service',
      values: [
        fmt(pl.montantServiceCompagnieDevise),
        fmt(pl.montantServiceCompagnieAriary, 'Ar'),
        fmt(pl.montantServiceClientDevise),
        fmt(pl.montantServiceClientAriary, 'Ar'),
      ],
    },
    {
      label: 'Pénalité',
      values: [
        fmt(pl.montantPenaliteCompagnieDevise),
        fmt(pl.montantPenaliteCompagnieAriary, 'Ar'),
        fmt(pl.montantPenaliteClientDevise),
        fmt(pl.montantPenaliteClientAriary, 'Ar'),
      ],
    },
  ];

  const inputClass =
    'w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emission-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="emission-modal-title" className="text-lg font-semibold text-slate-900">
              {ligne?.statut === 'CLOTURER' ? 'Corriger les numéros de billet' : 'Émission des billets'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Itinéraire : <span className="font-medium text-slate-700">{pl.itineraire || '—'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="-mr-2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Fermer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* Informations tarifaires */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Informations tarifaires</h3>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th rowSpan={2} className="px-4 py-2 text-left font-medium align-bottom border-b border-slate-200" />
                    <th colSpan={2} className="px-4 pt-2 pb-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 border-l border-slate-200">
                      Compagnie
                    </th>
                    <th colSpan={2} className="px-4 pt-2 pb-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 border-l border-slate-200">
                      Client
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                    <th className="px-4 pb-2 text-right font-medium border-l border-slate-200">Devise</th>
                    <th className="px-4 pb-2 text-right font-medium">Ariary</th>
                    <th className="px-4 pb-2 text-right font-medium border-l border-slate-200">Devise</th>
                    <th className="px-4 pb-2 text-right font-medium">Ariary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tarifRows.map(row => (
                    <tr key={row.label}>
                      <td className="px-4 py-2.5 text-slate-600">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className={`px-4 py-2.5 text-right tabular-nums font-medium text-slate-900 ${
                            i % 2 === 0 ? 'border-l border-slate-200' : ''
                          }`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Taux de change */}
          <section>
            <label htmlFor="taux-change" className="mb-1.5 block text-sm font-medium text-slate-700">
              Taux de change <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-xs">
              <input
                id="taux-change"
                type="number"
                step="1"
                min="0"
                value={tauxChange}
                onChange={e => setTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${inputClass} pr-10 tabular-nums`}
                placeholder="Ex : 4500"
                required
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                Ar
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Valeur d'une unité de devise en Ariary.</p>
          </section>

          {/* Passagers */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Passagers <span className="ml-1 font-normal text-slate-500">({passagers.length})</span>
              </h3>
              {passagers.length > 0 && (
                <span className="text-xs text-slate-500">
                  {completed}/{passagers.length} complété{completed > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {passagers.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                Aucun passager associé à cette ligne
              </div>
            ) : (
              <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
                {passagers.map((p, index) => (
                  <div key={p.billetId} className="p-4">
                    {/* Ligne passager */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{p.nomComplet}</p>
                          <p className="font-mono text-xs text-slate-400">Réf. {p.billetId.slice(-8)}</p>
                        </div>
                      </div>
                      {passagers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassager(index)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          Retirer
                        </button>
                      )}
                    </div>

                    {/* Champs */}
                    <div className="grid grid-cols-1 gap-3 pl-10 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`numero-${p.billetId}`}
                          className="mb-1.5 block text-xs font-medium text-slate-600"
                        >
                          Numéro de billet <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`numero-${p.billetId}`}
                          type="text"
                          value={p.numeroBillet}
                          onChange={e => updatePassager(index, { numeroBillet: e.target.value })}
                          placeholder="Ex : TKT-2026-001"
                          className={inputClass}
                          required
                        />
                      </div>

                      <div>
                        <span className="mb-1.5 block text-xs font-medium text-slate-600">
                          E-billet compagnie (PDF) <span className="text-red-500">*</span>
                        </span>
                        <span className="-mt-1 mb-1.5 block text-[11px] text-slate-400">
                          Le billet électronique émis par la compagnie pour ce passager
                        </span>

                        {p.pjBillet ? (
                          <div className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3">
                            <FiFileText className="shrink-0 text-slate-500" size={16} />
                            <span className="flex-1 truncate text-sm text-slate-700" title={p.pjBillet.name}>
                              {p.pjBillet.name}
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {(p.pjBillet.size / 1024).toFixed(0)} Ko
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePassager(index, { pjBillet: null, pjExistant: null })}
                              className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              aria-label="Supprimer le fichier"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        ) : p.pjExistant ? (
                          <div className="flex h-10 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3">
                            <FiFileText className="shrink-0 text-amber-600" size={16} />
                            <a
                              href={`${API_URL}/${p.pjExistant}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 truncate text-sm text-amber-800 underline"
                              title="PDF déjà envoyé : à joindre à nouveau s'il ne se recharge pas"
                            >
                              {p.pjExistant.split('/').pop()}
                            </a>
                            <label className="shrink-0 cursor-pointer rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
                              Remplacer
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) updatePassager(index, { pjBillet: file });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600">
                            <FiUpload size={15} />
                            Choisir un fichier PDF
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) updatePassager(index, { pjBillet: file });
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <p className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Champs obligatoires
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={passagers.length === 0 || loading}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {loading ? 'Enregistrement…' : ligne?.statut === 'CLOTURER' ? 'Enregistrer la correction' : "Confirmer l'émission"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmissionModal;