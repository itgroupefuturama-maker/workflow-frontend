import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../app/store';
import type { VisaEntete } from '../../../../../app/front_office/parametre_visa/visaEnteteSlice';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

const VisaTab = () => {
  const { data: visaEntetes, loading, error } =
    useSelector((s: RootState) => s.visaEntete);
    const navigate = useNavigate();


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Visa</h2>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Chargement...
        </div>
      )}

      {/* Liste vide */}
      {!loading && visaEntetes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
          <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Aucun visa pour ce dossier</p>
        </div>
      )}

      {/* Cards */}
      {!loading && visaEntetes.map((entete: VisaEntete) => {
        const prestation = entete.visaProspectionEntete.prestation;

        return (
          <div
            key={entete.id}
            onClick={() => navigate(`/dossiers-communs/visa/visa-detail/${entete.id}`)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
            >
            {/* Header card */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {prestation.numeroDos}
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    ID: {entete.id}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  Créé le {new Date(entete.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={entete.statut} />
                <StatusBadge status={entete.statutEntete} />
              </div>
            </div>

            {/* Lignes */}
            {entete.visaLigne.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400 italic">Aucune ligne visa</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      {['Réf.', 'Pays', 'Type', 'Nb', 'Départ', 'Retour', 'Consulat', 'PU client (Ar)', 'Devise', 'Statut ligne', 'Statut visa'].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entete.visaLigne.map((ligne) => {
                      const vp = ligne.visaProspectionLigne;
                      return (
                        <tr key={ligne.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{ligne.referenceLine}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{vp.visaParams.pays.pays}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">
                            {vp.visaParams.visaType.nom}
                            <span className="ml-1 text-xs text-gray-400">
                              · {vp.visaParams.visaEntree.entree} · {vp.visaParams.visaDuree.duree}j
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-center">{vp.nombre}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(vp.dateDepart).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(vp.dateRetour).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-3 capitalize text-gray-600">{vp.consulat.nom}</td>
                          <td className="px-4 py-3 font-semibold text-indigo-700">
                            {(vp.puClientAriary * vp.nombre).toLocaleString('fr-FR')} Ar
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-500">{vp.devise}</td>
                          <td className="px-4 py-3"><StatusBadge status={ligne.statusLigne} /></td>
                          <td className="px-4 py-3"><StatusBadge status={ligne.statusVisa} /></td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Totaux */}
                  <tfoot className="bg-indigo-50">
                    <tr>
                      <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-indigo-600 uppercase">
                        Total ({entete.visaLigne.reduce((s, l) => s + l.visaProspectionLigne.nombre, 0)} pers.)
                      </td>
                      <td className="px-4 py-2 font-bold text-indigo-700">
                        {entete.visaLigne
                          .reduce((s, l) => s + l.visaProspectionLigne.puClientAriary * l.visaProspectionLigne.nombre, 0)
                          .toLocaleString('fr-FR')} Ar
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VisaTab;