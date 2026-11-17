/**
 * Indicateur de chargement d'une page à l'intérieur de l'application (sous la barre du haut).
 * Apparaît après 150 ms seulement, pour éviter un flash quand la page charge vite.
 */
export default function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex items-center justify-center w-full h-full min-h-[200px] py-16 opacity-0 animate-[splash-in_200ms_ease-out_150ms_forwards]"
    >
      <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}
