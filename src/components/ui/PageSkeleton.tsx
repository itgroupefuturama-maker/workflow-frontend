import Skeleton from './Skeleton';

// Squelette générique pour une page de détail (fiche devis/réservation/passager...) pendant son
// chargement initial, à la place d'un spinner qui laisse la page blanche ou vide.
export default function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-9 w-64" />
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
