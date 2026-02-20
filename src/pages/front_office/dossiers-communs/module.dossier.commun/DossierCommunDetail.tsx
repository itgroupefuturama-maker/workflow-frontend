import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiEdit, FiFileText, FiPackage, FiPhone, FiUser, FiCheckCircle } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../app/store";
import { useEffect, useState } from "react";
import { fetchClientFactureById } from "../../../../app/back_office/clientFacturesSlice";
import { fetchClientBeneficiaireInfos } from "../../../../app/portail_client/clientBeneficiaireInfosSlice";
import BeneficiaireInfosModal from "../../../../components/modals/BeneficiaireInfosModal";

export default function DossierCommunDetail() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const dossierId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.id
  );

  const { data: dossiers } = useSelector((state: RootState) => state.dossierCommun);
  const dossier = dossiers.find((d) => String(d.id) === dossierId || String(d.numero) === dossierId);
  const user = useSelector((state: RootState) => state.auth.user);

  const { current: clientFacture, error: cfError } = useSelector(
    (state: RootState) => state.clientFactures
  );

  const clientFactureId = useSelector(
    (state: RootState) => state.dossierCommun.currentClientFactureId?.clientfacture?.id
  );

  const {
    list: beneficiaireInfosList,
    loadingList: infosLoading,
    error: infosError,
  } = useSelector((state: RootState) => state.clientBeneficiaireInfos);

  useEffect(() => {
    if (clientFactureId) {
      dispatch(fetchClientFactureById(clientFactureId));
    }
  }, [clientFactureId, dispatch]);

  const beneficiaires = clientFacture?.beneficiaires || [];

  const [selectedPrestationId, setSelectedPrestationId] = useState<string | null>(() => {
    const firstActiveColab = dossier?.dossierCommunColab?.find(colab =>
      colab.status === "CREER" && 
      colab.prestation?.some(p => p.status === "CREER")
    );
    
    const firstPrest = firstActiveColab?.prestation?.find(p => p.status === "CREER");
    return firstPrest ? firstPrest.id : null;
  });

  const modulesAccessibles = user?.profiles
    ?.filter(p => p.status === 'ACTIF')
    ?.flatMap(p => p.profile.modules.map(m => m.module.nom)) || [];

  if (selectedPrestationId === null) {
    for (const colab of dossier?.dossierCommunColab || []) {
      if (colab.status === "CREER" && colab.prestation && colab.prestation.length > 0) {
        const firstActivePrest = colab.prestation.find(p => p.status === "CREER");
        if (firstActivePrest) {
          // setTimeout(() => {
            setSelectedPrestationId(firstActivePrest.id);
          // }, 0);
          break;
        }
      }
    }
  }

  const [infosModalOpen, setInfosModalOpen] = useState(false);
  const [selectedBenefName, setSelectedBenefName] = useState<string>('');
  const [selectedBenefId, setSelectedBenefId] = useState<string | null>(null);

  const handleShowBeneficiaireInfos = (benefId: string, libelle: string) => {
    setSelectedBenefId(benefId);
    setSelectedBenefName(libelle);
    setInfosModalOpen(true);
    dispatch(fetchClientBeneficiaireInfos(benefId));
  };

  if (!dossier) {
    return <div className="p-20 text-center text-gray-500">Dossier introuvable</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group"
              >
                <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Retour</span>
              </button>
              
              <div className="h-6 w-px bg-slate-200"></div>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">{dossier.numero}</h1>
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    dossier.status === 'ANNULER' 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {dossier.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/dossiers-communs/${dossier.numero}/gerer`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              <FiEdit size={18} />
              Gérer le dossier
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* SECTION INFORMATIONS GÉNÉRALES */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiFileText className="text-indigo-600" size={20} />
            Informations générales
          </h2>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <FiFileText className="text-slate-400" size={16} />
                      Description
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{dossier.description || "Aucune description"}</p>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <FiUser className="text-slate-400" size={16} />
                      Client facturé
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {dossier.clientfacture?.libelle || "—"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Code: {dossier.clientfacture?.code || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <FiPhone className="text-slate-400" size={16} />
                      Contact principal
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium text-slate-700">
                        {dossier.contactPrincipal || "Non renseigné"}
                      </p>
                      {dossier.whatsapp && (
                        <a 
                          href={`https://wa.me/${dossier.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          {dossier.whatsapp}
                        </a>
                      )}
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <FiCalendar className="text-slate-400" size={16} />
                      Date de création
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">
                      {new Date(dossier.createdAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION BÉNÉFICIAIRES */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiUser className="text-indigo-600" size={20} />
            Clients bénéficiaires ({beneficiaires.length})
          </h2>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {cfError ? (
              <div className="p-6 bg-red-50 text-red-700 text-sm">{cfError}</div>
            ) : beneficiaires.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUser className="text-slate-400" size={24} />
                </div>
                <p className="text-slate-500 font-medium">Aucun bénéficiaire associé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Libellé
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {beneficiaires.map((link) => (
                      <tr
                        key={link.clientBeneficiaireId}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-slate-600">
                            {link.clientBeneficiaire.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {link.clientBeneficiaire.libelle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                            link.clientBeneficiaire.statut === 'ACTIF' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              link.clientBeneficiaire.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}></span>
                            {link.clientBeneficiaire.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleShowBeneficiaireInfos(link.clientBeneficiaireId, link.clientBeneficiaire.libelle)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            Voir détails
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SECTION PRESTATIONS */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiPackage className="text-indigo-600" size={20} />
            Prestations assignées
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {(() => {
              const prestations = dossier.dossierCommunColab
                ?.filter((colab) => {
                  const isCreated = colab.status === "CREER";
                  const isAssignedToMe = modulesAccessibles.some(
                    (mod) =>
                      mod === colab.module.nom &&
                      user?.prenom === colab.user.prenom &&
                      user?.nom === colab.user.nom
                  );
                  return isCreated && isAssignedToMe;
                })
                .flatMap((colab) =>
                  colab.prestation?.map((prest) => ({
                    ...prest,
                    moduleName: colab.module.nom,
                    userName: `${colab.user.prenom} ${colab.user.nom}`
                  }))
                ) || [];

              if (prestations.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiPackage className="text-slate-400" size={24} />
                    </div>
                    <p className="text-slate-500 font-medium">Aucune prestation active</p>
                    <p className="text-slate-400 text-sm mt-1">Les prestations apparaîtront ici une fois assignées</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Module
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Numéro Dossier
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Assigné à
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Date création
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Statut
                        </th>
                        {/* <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Actions
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prestations.map((prest) => (
                        <tr
                          key={prest.id}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/dossiers-communs/${prest.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <FiPackage className="text-indigo-600" size={16} />
                              </div>
                              <span className="text-sm font-semibold text-slate-900">
                                {prest.moduleName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-slate-600">
                              {prest.numeroDos}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                                <FiUser className="text-slate-600" size={12} />
                              </div>
                              <span className="text-sm text-slate-700">
                                {prest.userName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <FiCalendar className="text-slate-400" size={14} />
                              {prest.createdAt
                                ? new Date(prest.createdAt).toLocaleDateString('fr-FR')
                                : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <FiCheckCircle className="mr-1.5" size={12} />
                              Active
                            </span>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dossiers-communs/${prest.moduleName}/${prest.id}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              Ouvrir
                              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                            </button>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* MODAL BÉNÉFICIAIRE */}
      {selectedBenefId && (
        <BeneficiaireInfosModal
          isOpen={infosModalOpen}
          onClose={() => setInfosModalOpen(false)}
          infos={beneficiaireInfosList}
          beneficiaireName={selectedBenefName}
          loading={infosLoading}
          error={infosError}
        />
      )}
    </div>
  );
}