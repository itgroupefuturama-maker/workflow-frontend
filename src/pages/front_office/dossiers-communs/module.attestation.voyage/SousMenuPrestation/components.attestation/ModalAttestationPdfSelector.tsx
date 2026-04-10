import { useState, useMemo } from 'react';
import { FiX, FiDownload, FiEye, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import type { AttestationEnteteItem, AttestationPdfMode, AttestationPdfSelection } from '../../../module.parametre/sections/pdf.generation/types/attestation.types';
import type { PdfDesignId } from '../../../module.parametre/sections/pdf.generation/types/pdf-design.types';
import { PDF_DESIGNS } from '../../../module.parametre/sections/pdf.generation/config/pdf-designs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entetes: AttestationEnteteItem[];        // toute la liste items du slice
  onGenerate: (selection: AttestationPdfSelection[], designId: PdfDesignId, mode: AttestationPdfMode) => void;
  onPreview:  (selection: AttestationPdfSelection[], designId: PdfDesignId, mode: AttestationPdfMode) => void;
  loading: boolean;
}

export const ModalAttestationPdfSelector: React.FC<Props> = ({
  isOpen, onClose, entetes, onGenerate, onPreview, loading
}) => {
  // Niveau 1 — entêtes cochées
  const [selectedEnteteIds, setSelectedEnteteIds] = useState<Set<string>>(
    () => new Set(entetes.map((e) => e.id))
  );

  // Niveau 2 — lignes cochées par entête
  const [selectedLigneIds, setSelectedLigneIds] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(
      entetes.map((e) => [e.id, new Set(e.attestationLigne.map((l) => l.id))])
    )
  );

  // Entête dépliée (cascade)
  const [expandedEnteteId, setExpandedEnteteId] = useState<string | null>(
    entetes[0]?.id ?? null
  );

  // Design
  const [designId, setDesignId] = useState<PdfDesignId>('classique');
  const [mode, setMode] = useState<AttestationPdfMode>('par_entete');

  // ── Helpers ──────────────────────────────────────────────────────
  const toggleEntete = (id: string) => {
    setSelectedEnteteIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLigne = (enteteId: string, ligneId: string) => {
    setSelectedLigneIds((prev) => {
      const set = new Set(prev[enteteId] ?? []);
      set.has(ligneId) ? set.delete(ligneId) : set.add(ligneId);
      return { ...prev, [enteteId]: set };
    });
  };

  const toggleAllLignes = (enteteId: string, ligneIds: string[]) => {
    setSelectedLigneIds((prev) => {
      const current = prev[enteteId] ?? new Set();
      const allSelected = ligneIds.every((id) => current.has(id));
      return { ...prev, [enteteId]: allSelected ? new Set() : new Set(ligneIds) };
    });
  };

  // ── Sélection finale ─────────────────────────────────────────────
  const buildSelection = (): AttestationPdfSelection[] =>
    entetes
      .filter((e) => selectedEnteteIds.has(e.id))
      .map((e) => ({
        enteteId: e.id,
        ligneIds: e.attestationLigne
          .filter((l) => selectedLigneIds[e.id]?.has(l.id))
          .map((l) => l.id),
      }))
      .filter((s) => s.ligneIds.length > 0);

  const selectionCount = useMemo(
    () => buildSelection().reduce((sum, s) => sum + s.ligneIds.length, 0),
    [selectedEnteteIds, selectedLigneIds]
  );
  const isValid = selectionCount > 0;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">
              Générer un PDF — Attestation de voyage
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {entetes.length} entête(s) disponible(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* ── Corps ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Design */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
              Design
            </label>
            <div className="flex gap-2">
              {Object.values(PDF_DESIGNS).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesignId(d.id as PdfDesignId)}
                  title={d.label}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
                    designId === d.id
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.preview }} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
                Mode d'affichage
            </label>
            <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                <button
                onClick={() => setMode('par_entete')}
                className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                    mode === 'par_entete'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                >
                Par entête
                </button>
                <button
                onClick={() => setMode('par_passager')}
                className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                    mode === 'par_passager'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                >
                Par passager
                </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
                {mode === 'par_entete'
                ? 'ATT-1 → lignes → passagers de chaque ligne'
                : 'Kol Tsiory → toutes ses attestations regroupées'
                }
            </p>
            </div>

          <div className="border-t border-neutral-100" />

          {/* Niveau 1 : Entêtes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                Entêtes à inclure
              </span>
              <span className="text-xs text-neutral-400">
                {selectionCount} ligne(s) sélectionnée(s)
              </span>
            </div>

            <div className="space-y-2">
              {entetes.map((entete) => {
                const isChecked  = selectedEnteteIds.has(entete.id);
                const isExpanded = expandedEnteteId === entete.id;
                const ligneIds   = entete.attestationLigne.map((l) => l.id);
                const selectedCount = ligneIds.filter((id) =>
                  selectedLigneIds[entete.id]?.has(id)
                ).length;

                return (
                  <div
                    key={entete.id}
                    className={`rounded-xl border transition-colors ${
                      isChecked
                        ? 'border-neutral-300 bg-white'
                        : 'border-neutral-100 bg-neutral-50 opacity-60'
                    }`}
                  >
                    {/* Ligne entête */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEntete(entete.id)}
                        className="w-4 h-4 rounded accent-neutral-800 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-neutral-800">
                            {entete.numeroEntete}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {entete.prestation.numeroDos}
                          </span>
                          <span className="text-xs text-neutral-400">
                            • {entete.fournisseur.libelle}
                          </span>
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {entete.puAriary.toLocaleString('fr-FR')} Ar/u
                          </span>
                        </div>
                        {isChecked && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {selectedCount} / {ligneIds.length} ligne(s)
                          </p>
                        )}
                      </div>

                      {isChecked && ligneIds.length > 0 && (
                        <button
                          onClick={() => setExpandedEnteteId(isExpanded ? null : entete.id)}
                          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 transition-colors"
                        >
                          {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                        </button>
                      )}
                    </div>

                    {/* Niveau 2 : Lignes */}
                    {isChecked && isExpanded && ligneIds.length > 0 && (
                      <div className="border-t border-neutral-100 px-4 py-3 space-y-2 bg-neutral-50 rounded-b-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                            Lignes d'attestation
                          </span>
                          <button
                            onClick={() => toggleAllLignes(entete.id, ligneIds)}
                            className="text-[10px] text-neutral-500 hover:text-neutral-800 underline"
                          >
                            {selectedCount === ligneIds.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </button>
                        </div>

                        {entete.attestationLigne.map((ligne) => {
                          const isLigneChecked = selectedLigneIds[entete.id]?.has(ligne.id) ?? false;

                          return (
                            <label
                              key={ligne.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isLigneChecked
                                  ? 'border-neutral-300 bg-white'
                                  : 'border-neutral-100 bg-neutral-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isLigneChecked}
                                onChange={() => toggleLigne(entete.id, ligne.id)}
                                className="w-3.5 h-3.5 mt-0.5 rounded accent-neutral-800 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium text-neutral-800">
                                    {ligne.numeroDosRef}
                                  </span>
                                  <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    {ligne.numeroVol}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    ligne.statusLigne === 'INITIALE'
                                      ? 'text-blue-600 bg-blue-50'
                                      : 'text-neutral-600 bg-neutral-100'
                                  }`}>
                                    {ligne.statusLigne}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-1">
                                  {ligne.itineraire}
                                </p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-[10px] text-neutral-400">
                                    {ligne.typePassager} • {ligne.classe}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    Départ : {fmt(ligne.dateHeureDepart)}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    {ligne.avion}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer actions ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
          <p className="text-xs text-neutral-500">
            {isValid
              ? `${selectionCount} ligne(s) sélectionnée(s)`
              : <span className="text-red-500">Sélectionnez au moins une ligne</span>
            }
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Annuler
            </button>

            <button
              onClick={() => isValid && onPreview(buildSelection(), designId, mode)}
              disabled={!isValid || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-300
                bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiEye size={13} />
              Aperçu
            </button>

            <button
              onClick={() => isValid && onGenerate(buildSelection(), designId, mode)}
              disabled={!isValid || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600
                text-xs font-medium text-white hover:bg-indigo-700
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiDownload size={13} />
              {loading ? 'Génération…' : 'Télécharger'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};