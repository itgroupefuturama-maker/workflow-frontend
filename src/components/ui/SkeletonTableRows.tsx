import Skeleton from './Skeleton';

interface SkeletonTableRowsProps {
  columns: number;
  rows?: number;
}

// Lignes de table factices affichées pendant le chargement, à la place d'un spinner qui masque
// tout le tableau — garde les en-têtes visibles et donne une idée de la structure des données.
export default function SkeletonTableRows({ columns, rows = 6 }: SkeletonTableRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-3.5 w-full max-w-[110px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
