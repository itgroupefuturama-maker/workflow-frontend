import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../../../app/store';
import TabContainer from '../../../../../layouts/TabContainer';
import { createProspectionEntete, fetchProspectionEntetes, type VisaProspectionLigne } from '../../../../../app/front_office/parametre_visa/prospectionEnteteVisaSlice';
import CreateProspectionLigneModal from '../components/CreateProspectionLigneModal';
import CreateDevisModal from '../components/CreateDevisModal';
import { fetchVisaEntetes, type VisaEntete } from '../../../../../app/front_office/parametre_visa/visaEnteteSlice';

const PageViewHotel = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'visa',        label: 'Listes des visa' },
  ];

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'prospection');

  const [ligneModalEnteteId, setLigneModalEnteteId] = useState<string | null>(null);

  // ── Sélecteurs ─────────────────────────────────────────────────────────────
  const dossierActif = useSelector((state: RootState) => state.dossierCommun.currentClientFactureId);

  const prestationId = dossierActif?.dossierCommunColab
    ?.find((colab) => colab.module?.nom?.toLowerCase() === 'visa')
    ?.prestation?.[0]?.id ?? '';

    console.log(`prestation ${prestationId}`);
    

  const { data: prospections, loading, creating, error } =
    useSelector((s: RootState) => s.visaProspectionEntete);

  const [devisModalEntete, setDevisModalEntete] = useState<{
    id: string;
    lignes: VisaProspectionLigne[];
  } | null>(null);

  const { data: visaEntetes, loading: visaLoading, error: visaError } =
    useSelector((s: RootState) => s.visaEntete);

  // ── Fetch à l'ouverture ────────────────────────────────────────────────────
  useEffect(() => {
    if (prestationId) {
      dispatch(fetchProspectionEntetes(prestationId));
      dispatch(fetchVisaEntetes(prestationId));
    }
  }, [prestationId, dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  // ── Création d'une nouvelle prospection ────────────────────────────────────
  const handleCreate = async () => {
    if (!prestationId) return;
    await dispatch(createProspectionEntete(prestationId));
  };

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      CREER:    'bg-blue-100 text-blue-700',
      VALIDER:  'bg-green-100 text-green-700',
      ANNULER:  'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>

      {/* ── Onglet Prospection ── */}
      {activeTab === 'prospection' && (
        <div className="min-h-screen bg-neutral-50 p-4 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Prospections</h2>
            <button
              onClick={handleCreate}
              disabled={creating || !prestationId}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Création...
                </>
              ) : '+ Nouvelle prospection'}
            </button>
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
          {!loading && prospections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
              <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Aucune prospection pour ce dossier</p>
            </div>
          )}

          {/* Cards */}
          {!loading && prospections.map((entete) => {
            const dossier = entete.prestation.dossierCommunColab.dossierCommun;
            return (
              <div key={entete.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* En-tête de la card */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-800">
                      {entete.prestation.numeroDos}
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        Réf. {dossier.referenceTravelPlaner}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">{dossier.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Bouton ligne */}
                    <button
                      onClick={() => setLigneModalEnteteId(entete.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                    >
                      + Ligne
                    </button>

                    {/* Bouton devis */}
                    <button
                      onClick={() => setDevisModalEntete({ id: entete.id, lignes: entete.visaProspectionLigne })}
                      className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 flex items-center gap-1"
                    >
                      📄 Devis
                    </button>
                    <button
                    onClick={() => navigate(`/dossiers-communs/visa/details/${entete.id}`)}
                    className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 flex items-center gap-1"
                    >
                      voir detail
                    </button>
                  </div>
                </div>

                {/* Lignes de prospection */}
                {entete.visaProspectionLigne.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400 italic">Aucune ligne de prospection</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          {['Nb', 'Départ', 'Retour', 'État visa', 'Pièce', 'PU consulat (Ar)', 'PU client (Ar)', 'Devise', 'Taux'].map(h => (
                            <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {entete.visaProspectionLigne.map((ligne) => (
                          <tr key={ligne.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-indigo-600">{ligne.nombre}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {new Date(ligne.dateDepart).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {new Date(ligne.dateRetour).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={ligne.etatVisa} /></td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold ${ligne.etatPiece ? 'text-green-600' : 'text-orange-500'}`}>
                                {ligne.etatPiece ? '✓ Complet' : '✗ Incomplet'}
                              </span>
                            </td>
                            <td className="px-4 py-3">{ligne.puConsulatAriary.toLocaleString('fr-FR')} Ar</td>
                            <td className="px-4 py-3">{ligne.puClientAriary.toLocaleString('fr-FR')} Ar</td>
                            <td className="px-4 py-3 font-mono">{ligne.devise}</td>
                            <td className="px-4 py-3">{ligne.tauxEchange.toLocaleString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* ── Onglet Visa ── */}
      {activeTab === 'visa' && (
        <div className="min-h-screen bg-neutral-50 p-4 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Visa</h2>
          </div>

          {/* Erreur */}
          {visaError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              ⚠️ {visaError}
            </div>
          )}

          {/* Loading */}
          {visaLoading && (
            <div className="flex justify-center py-12 text-gray-400">
              <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Chargement...
            </div>
          )}

          {/* Liste vide */}
          {!visaLoading && visaEntetes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
              <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Aucun visa pour ce dossier</p>
            </div>
          )}

          {/* Cards visa */}
          {!visaLoading && visaEntetes.map((entete: VisaEntete) => {
            const prestation = entete.visaProspectionEntete.prestation;

            return (
              <div key={entete.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* ── Header card ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-800">
                      {prestation.numeroDos}
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        ID: {entete.id.slice(-8)}
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

                {/* ── Lignes visa ── */}
                {entete.visaLigne.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400 italic">Aucune ligne visa</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          {[
                            'Réf.',
                            'Pays',
                            'Type',
                            'Nb',
                            'Départ',
                            'Retour',
                            'Consulat',
                            'PU client (Ar)',
                            'Devise',
                            'Statut ligne',
                            'Statut visa',
                          ].map(h => (
                            <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {entete.visaLigne.map((ligne) => {
                          const vp = ligne.visaProspectionLigne;
                          return (
                            <tr key={ligne.id} className="hover:bg-gray-50">

                              {/* Référence */}
                              <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                                {ligne.referenceLine}
                              </td>

                              {/* Pays */}
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {vp.visaParams.pays.pays}
                              </td>

                              {/* Type visa */}
                              <td className="px-4 py-3 text-gray-500 capitalize">
                                {vp.visaParams.visaType.nom}
                                <span className="ml-1 text-xs text-gray-400">
                                  · {vp.visaParams.visaEntree.entree}
                                  · {vp.visaParams.visaDuree.duree}j
                                </span>
                              </td>

                              {/* Nombre */}
                              <td className="px-4 py-3 font-semibold text-center">
                                {vp.nombre}
                              </td>

                              {/* Départ */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {new Date(vp.dateDepart).toLocaleDateString('fr-FR')}
                              </td>

                              {/* Retour */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {new Date(vp.dateRetour).toLocaleDateString('fr-FR')}
                              </td>

                              {/* Consulat */}
                              <td className="px-4 py-3 capitalize text-gray-600">
                                {vp.consulat.nom}
                              </td>

                              {/* PU client */}
                              <td className="px-4 py-3 font-semibold text-indigo-700">
                                {(vp.puClientAriary * vp.nombre).toLocaleString('fr-FR')} Ar
                              </td>

                              {/* Devise */}
                              <td className="px-4 py-3 font-mono text-gray-500">
                                {vp.devise}
                              </td>

                              {/* Statut ligne */}
                              <td className="px-4 py-3">
                                <StatusBadge status={ligne.statusLigne} />
                              </td>

                              {/* Statut visa */}
                              <td className="px-4 py-3">
                                <StatusBadge status={ligne.statusVisa} />
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Totaux */}
                      {entete.visaLigne.length > 0 && (
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
                      )}
                    </table>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}

      {ligneModalEnteteId && (
        <CreateProspectionLigneModal
          enteteId={ligneModalEnteteId}
          prestationId={prestationId}
          onClose={() => setLigneModalEnteteId(null)}
        />
      )}

      {devisModalEntete && (
      <CreateDevisModal
        enteteId={devisModalEntete.id}
        prestationId={prestationId}
        lignes={devisModalEntete.lignes}
        onClose={() => setDevisModalEntete(null)}
      />
    )}

    </TabContainer>
  );
};

export default PageViewHotel;