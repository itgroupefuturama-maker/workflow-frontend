import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  itemLabel?: string; // ex. "dossier", "client" — accord singulier/pluriel dans le résumé
}

const DEFAULT_LIMIT_OPTIONS = [10, 25, 50, 100];

// Pied de tableau générique : résumé + sélecteur de limite + navigation de pages.
// Extrait du pattern déjà utilisé dans PageControle.tsx (module.controle), pour le
// réutiliser sur tous les écrans migrés vers la pagination serveur.
export default function Pagination({
  meta,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_LIMIT_OPTIONS,
  itemLabel = 'entrée',
}: PaginationProps) {
  const { page, totalPages, total, limit } = meta;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
      <div className="flex items-center gap-3">
        <span>
          Page <span className="font-semibold text-gray-700">{totalPages === 0 ? 0 : page}</span> sur{' '}
          <span className="font-semibold text-gray-700">{totalPages}</span>
          {' '}— {total} {itemLabel}{total > 1 ? 's' : ''} au total
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Lignes :</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-7 pl-2 pr-6 text-xs border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {limitOptions.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          title="Première page"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <FiChevronLeft size={13} />
        </button>

        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="h-7 w-7 flex items-center justify-center text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={[
                'h-7 w-7 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors',
                page === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <FiChevronRight size={13} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          title="Dernière page"
        >
          »
        </button>
      </div>
    </div>
  );
}
