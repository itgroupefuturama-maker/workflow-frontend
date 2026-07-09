import { useState, useMemo } from 'react';
import { FiX, FiDownload, FiEye, FiChevronDown, FiChevronRight, FiPlus, FiImage } from 'react-icons/fi';
import { normalizeDevisToEntete, type HotelPdfInput, type HotelProspectionEnteteItem } from '../../module.pdf/pdf.generation/types/hotel.types';
import type { HotelPdfSelection } from '../../module.pdf/pdf.generation/types/hotel.types';
import type { PdfAudience, PdfDesignId } from '../../module.pdf/pdf.generation/types/pdf-design.types';
import { PDF_DESIGNS } from '../../module.pdf/pdf.generation/config/pdf-designs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  input: HotelPdfInput;
  onGenerate: (selection: HotelPdfSelection[], audience: PdfAudience, designId: PdfDesignId) => void;
  onPreview:  (selection: HotelPdfSelection[], audience: PdfAudience, designId: PdfDesignId) => void;
  loading: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Compression image côté client — évite des PDF de plusieurs dizaines
// de Mo. Redimensionne à 900px de large max, ré-encode en JPEG q=0.8.
// ─────────────────────────────────────────────────────────────────────
const MAX_IMAGES_PER_BENCH = 3;
const MAX_IMAGE_WIDTH = 900;

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas non supporté'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ModalHotelPdfSelector: React.FC<Props> = ({
  isOpen, onClose, input, onGenerate, onPreview, loading
}) => {
  const entete: HotelProspectionEnteteItem = useMemo(() => {
    if (input.mode === 'devis') {
      return normalizeDevisToEntete(input.devis);
    }
    return input.entete;
  }, [input]);

  const [selectedBenchIds, setSelectedBenchIds] = useState<Set<string>>(
    () => new Set(entete?.benchmarkingEntete?.map((b) => b.id) ?? [])
  );

  const [selectedLigneIds, setSelectedLigneIds] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(
      entete.benchmarkingEntete.map((b) => [
        b.id,
        new Set(b.benchmarkingLigne.map((l) => l.id))
      ])
    )
  );

  const [selectedDeviseIds, setSelectedDeviseIds] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(
      entete.benchmarkingEntete.flatMap((b) =>
        b.benchmarkingLigne.map((l) => [
          l.id,
          new Set(l.deviseHotel.map((dv) => dv.id))
        ])
      )
    )
  );

  // ── Images par benchmarking — upload local, non persisté ──────────
  const [benchImages, setBenchImages] = useState<Record<string, string[]>>({});
  const [imageError, setImageError] = useState<string | null>(null);

  const handleImageUpload = async (benchId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);

    const current = benchImages[benchId] ?? [];
    const remaining = MAX_IMAGES_PER_BENCH - current.length;
    if (remaining <= 0) {
      setImageError(`Maximum ${MAX_IMAGES_PER_BENCH} photos par benchmarking`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    try {
      const resized = await Promise.all(filesToProcess.map(resizeImageFile));
      setBenchImages((prev) => ({
        ...prev,
        [benchId]: [...(prev[benchId] ?? []), ...resized],
      }));
    } catch {
      setImageError('Impossible de charger cette image');
    }
  };

  const removeImage = (benchId: string, index: number) => {
    setBenchImages((prev) => ({
      ...prev,
      [benchId]: (prev[benchId] ?? []).filter((_, i) => i !== index),
    }));
  };

  const [expandedBenchId, setExpandedBenchId] = useState<string | null>(
    entete.benchmarkingEntete[0]?.id ?? null
  );
  const [expandedLigneId, setExpandedLigneId] = useState<string | null>(null);

  const [audience, setAudience] = useState<PdfAudience>('client');
  const [designId, setDesignId] = useState<PdfDesignId>('classique');

  const toggleBench = (id: string) => {
    setSelectedBenchIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLigne = (benchId: string, ligneId: string) => {
    setSelectedLigneIds((prev) => {
      const set = new Set(prev[benchId] ?? []);
      set.has(ligneId) ? set.delete(ligneId) : set.add(ligneId);
      return { ...prev, [benchId]: set };
    });
  };

  const toggleAllLignes = (benchId: string, ligneIds: string[]) => {
    setSelectedLigneIds((prev) => {
      const current = prev[benchId] ?? new Set();
      const allSelected = ligneIds.every((id) => current.has(id));
      return { ...prev, [benchId]: allSelected ? new Set() : new Set(ligneIds) };
    });
  };

  const toggleDevise = (ligneId: string, deviseId: string) => {
    setSelectedDeviseIds((prev) => {
      const set = new Set(prev[ligneId] ?? []);
      set.has(deviseId) ? set.delete(deviseId) : set.add(deviseId);
      return { ...prev, [ligneId]: set };
    });
  };

  const toggleAllDevises = (ligneId: string, deviseIds: string[]) => {
    setSelectedDeviseIds((prev) => {
      const current = prev[ligneId] ?? new Set();
      const allSelected = deviseIds.every((id) => current.has(id));
      return { ...prev, [ligneId]: allSelected ? new Set() : new Set(deviseIds) };
    });
  };

  const buildSelection = (): HotelPdfSelection[] =>
    entete.benchmarkingEntete
      .filter((b) => selectedBenchIds.has(b.id))
      .map((b) => ({
        benchmarkingEnteteId: b.id,
        lignes: b.benchmarkingLigne
          .filter((l) => selectedLigneIds[b.id]?.has(l.id))
          .map((l) => ({
            ligneId: l.id,
            deviseIds: l.deviseHotel
              .filter((dv) => selectedDeviseIds[l.id]?.has(dv.id))
              .map((dv) => dv.id),
          }))
          .filter((l) => l.deviseIds.length > 0),
        images: benchImages[b.id] ?? [],
      }))
      .filter((s) => s.lignes.length > 0);

  const selectionCount = useMemo(
    () => buildSelection().length,
    [selectedBenchIds, selectedLigneIds, selectedDeviseIds, benchImages]
  );
  const isValid = selectionCount > 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">
              Générer un PDF — {entete.numeroEntete}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {entete.fournisseur.libelle} • {entete.prestation.numeroDos}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
            <FiX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
                Version
              </label>
              <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                {(['client', 'direction'] as PdfAudience[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                      audience === a
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {audience === 'direction' && (
                <p className="text-[10px] text-amber-600 mt-1">Inclut commissions et marges</p>
              )}
            </div>

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
          </div>

          <div className="border-t border-neutral-100" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                Contenu à inclure
              </span>
              <span className="text-xs text-neutral-400">
                {selectedBenchIds.size} / {entete.benchmarkingEntete.length} benchmarking(s)
              </span>
            </div>

            {imageError && (
              <p className="text-[10px] text-red-500 mb-2">{imageError}</p>
            )}

            <div className="space-y-2">
              {entete.benchmarkingEntete.map((bench) => {
                const isBenchChecked = selectedBenchIds.has(bench.id);
                const isBenchExpanded = expandedBenchId === bench.id;
                const ligneIds = bench.benchmarkingLigne.map((l) => l.id);
                const selectedLignesCount = ligneIds.filter((id) =>
                  selectedLigneIds[bench.id]?.has(id)
                ).length;
                const images = benchImages[bench.id] ?? [];

                return (
                  <div
                    key={bench.id}
                    className={`rounded-xl border transition-colors ${
                      isBenchChecked ? 'border-neutral-300 bg-white' : 'border-neutral-100 bg-neutral-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isBenchChecked}
                        onChange={() => toggleBench(bench.id)}
                        className="w-4 h-4 rounded accent-neutral-800 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-neutral-800">{bench.numero}</span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(bench.du)} → {formatDate(bench.au)}
                          </span>
                          <span className="text-xs text-neutral-400">• {bench.nuite} nuit(s)</span>
                          <span className="text-xs text-neutral-400">• {bench.ville}</span>
                          {images.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                              <FiImage size={10} /> {images.length}
                            </span>
                          )}
                        </div>
                        {isBenchChecked && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {selectedLignesCount} / {ligneIds.length} ligne(s)
                          </p>
                        )}
                      </div>
                      {isBenchChecked && bench.benchmarkingLigne.length > 0 && (
                        <button
                          onClick={() => setExpandedBenchId(isBenchExpanded ? null : bench.id)}
                          className="p-1 rounded hover:bg-neutral-100 text-neutral-400"
                        >
                          {isBenchExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                        </button>
                      )}
                    </div>

                    {isBenchChecked && isBenchExpanded && (
                      <div className="border-t border-neutral-100 px-4 py-3 space-y-3 bg-neutral-50 rounded-b-xl">

                        {/* ── Upload photos hôtel ── */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                              Photos de l'hôtel
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {images.length} / {MAX_IMAGES_PER_BENCH}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {images.map((img, i) => (
                              <div
                                key={i}
                                className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 group"
                              >
                                <img src={img} className="w-full h-full object-cover" alt={`Photo ${i + 1}`} />
                                <button
                                  onClick={() => removeImage(bench.id, i)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60
                                    text-white text-[10px] flex items-center justify-center leading-none
                                    opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {images.length < MAX_IMAGES_PER_BENCH && (
                              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-300
                                flex items-center justify-center cursor-pointer hover:border-neutral-400
                                text-neutral-400 hover:text-neutral-600 transition-colors">
                                <FiPlus size={16} />
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(bench.id, e.target.files)}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {bench.benchmarkingLigne.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                                Lignes / Plateformes
                              </span>
                              <button
                                onClick={() => toggleAllLignes(bench.id, ligneIds)}
                                className="text-[10px] text-neutral-500 hover:text-neutral-800 underline"
                              >
                                {selectedLignesCount === ligneIds.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                              </button>
                            </div>

                            <div className="space-y-2">
                              {bench.benchmarkingLigne.map((ligne) => {
                                const isLigneChecked = selectedLigneIds[bench.id]?.has(ligne.id) ?? false;
                                const isLigneExpanded = expandedLigneId === ligne.id;
                                const dvIds = ligne.deviseHotel.map((dv) => dv.id);
                                const selectedDvCount = dvIds.filter((id) =>
                                  selectedDeviseIds[ligne.id]?.has(id)
                                ).length;

                                return (
                                  <div
                                    key={ligne.id}
                                    className={`rounded-lg border transition-colors ${
                                      isLigneChecked ? 'border-neutral-300 bg-white' : 'border-neutral-100 bg-neutral-100'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 p-3">
                                      <input
                                        type="checkbox"
                                        checked={isLigneChecked}
                                        onChange={() => toggleLigne(bench.id, ligne.id)}
                                        className="w-3.5 h-3.5 mt-0.5 rounded accent-neutral-800 cursor-pointer"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-medium text-neutral-800">{ligne.hotel}</span>
                                          <span className={`text-[10px]  px-1.5 py-0.5 rounded ${ligne.plateforme.nom === 'client' ? 'text-white bg-blue-400' : 'text-neutral-500 bg-neutral-100'}`}>
                                            {ligne.plateforme.nom}
                                          </span>
                                          {ligne.isBenchMark && (
                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                              ★ Benchmark
                                            </span>
                                          )}
                                          {ligne.isRefundable && (
                                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                              Remboursable
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[10px] text-neutral-500">
                                            {ligne.typeChambre.type} • {ligne.nombreChambre} ch.
                                          </span>
                                          {isLigneChecked && ligne.deviseHotel.length > 0 && (
                                            <span className="text-[10px] text-neutral-400">
                                              {selectedDvCount} / {dvIds.length} devise(s)
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {isLigneChecked && ligne.deviseHotel.length > 0 && (
                                        <button
                                          onClick={() => setExpandedLigneId(isLigneExpanded ? null : ligne.id)}
                                          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 shrink-0"
                                        >
                                          {isLigneExpanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
                                        </button>
                                      )}
                                    </div>

                                    {isLigneChecked && isLigneExpanded && ligne.deviseHotel.length > 0 && (
                                      <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50 rounded-b-lg space-y-1.5">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                                            Devises
                                          </span>
                                          <button
                                            onClick={() => toggleAllDevises(ligne.id, dvIds)}
                                            className="text-[10px] text-neutral-500 hover:text-neutral-800 underline"
                                          >
                                            {selectedDvCount === dvIds.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                          </button>
                                        </div>

                                        {ligne.deviseHotel.map((dv) => {
                                          const isDvChecked = selectedDeviseIds[ligne.id]?.has(dv.id) ?? false;

                                          return (
                                            <label
                                              key={dv.id}
                                              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                                isDvChecked
                                                  ? 'border-neutral-300 bg-white'
                                                  : 'border-neutral-100 bg-neutral-100'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isDvChecked}
                                                onChange={() => toggleDevise(ligne.id, dv.id)}
                                                className="w-3 h-3 rounded accent-neutral-800 cursor-pointer"
                                              />
                                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                {dv.devise.devise}
                                              </span>
                                              <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-[10px] text-neutral-500">
                                                  Taux : {dv.tauxChange.toLocaleString('fr-FR')}
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                  {dv.nuiteDevise.toLocaleString('fr-FR')} {dv.devise.devise} / nuit
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                  → {dv.nuiteAriary.toLocaleString('fr-FR')} Ar / nuit
                                                </span>
                                                <span className="text-[10px] font-medium text-neutral-800">
                                                  Total : {dv.montantAriary.toLocaleString('fr-FR')} Ar
                                                </span>
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
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
          <p className="text-xs text-neutral-500">
            {isValid
              ? `${selectionCount} benchmarking(s) • version ${audience}`
              : <span className="text-red-500">Sélectionnez au moins une devise</span>
            }
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800"
            >
              Annuler
            </button>

            <button
              onClick={() => isValid && onPreview(buildSelection(), audience, designId)}
              disabled={!isValid || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-300
                bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiEye size={13} />
              Aperçu
            </button>

            <button
              onClick={() => isValid && onGenerate(buildSelection(), audience, designId)}
              disabled={!isValid || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900
                text-xs font-medium text-white hover:bg-neutral-800
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