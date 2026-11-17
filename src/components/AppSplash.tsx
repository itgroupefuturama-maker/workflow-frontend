import logo from '../assets/logo.jpg';

/**
 * Écran de démarrage de l'application (rechargement F5, premier chargement).
 * Fond clair, logo et fine barre de progression. Il n'apparaît qu'après 150 ms :
 * si le chargement est plus rapide, l'utilisateur ne voit aucun flash.
 */
export default function AppSplash() {
  return (
    <div
      role="status"
      aria-label="Chargement de l'application"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-100 opacity-0 animate-[splash-in_200ms_ease-out_150ms_forwards]"
    >
      <img src={logo} alt="" className="h-14 w-14 rounded-2xl shadow-sm ring-1 ring-slate-200" />
      <p className="mt-4 text-sm font-semibold tracking-wide text-slate-700">Al Bouraq Travel</p>
      <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-1/3 rounded-full bg-indigo-500 animate-[splash-bar_1.1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
