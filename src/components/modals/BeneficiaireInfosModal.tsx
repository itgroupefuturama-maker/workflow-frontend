import type { ClientBeneficiaireInfo } from "../../app/portail_client/clientBeneficiaireInfosSlice";
import { FiX, FiUser, FiFileText, FiPhone } from 'react-icons/fi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  infos: ClientBeneficiaireInfo[];
  beneficiaireName: string;
  loading?: boolean;
  error?: string | null;
}

const BeneficiaireInfosModal: React.FC<Props> = ({
  isOpen,
  onClose,
  infos,
  beneficiaireName,
  loading = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-200 bg-linear-to-r from-indigo-50 to-purple-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Informations des passagers
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Bénéficiaire : <span className="font-semibold">{beneficiaireName}</span>
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-3 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Chargement des informations...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <FiX className="text-red-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Erreur de chargement</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : infos.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aucune information disponible
              </h3>
              <p className="text-slate-500">
                Aucune information n'a été enregistrée pour ce bénéficiaire
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {infos.map((info, index) => (
                <div
                  key={info.id}
                  className="border-2 border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-all"
                >
                  {/* HEADER DE LA CARTE */}
                  <div className="bg-linear-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {info.prenom} {info.nom}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Passager #{index + 1}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        info.clientType === 'ADULTE' 
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : info.clientType === 'ENFANT'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : info.clientType === 'BEBE'
                          ? 'bg-pink-100 text-pink-700 border-pink-200'
                          : 'bg-purple-100 text-purple-700 border-purple-200'
                      }`}>
                        {info.clientType}
                      </span>
                    </div>
                  </div>

                  {/* CONTENU DE LA CARTE */}
                  <div className="p-6 bg-white">
                    {/* SECTION IDENTITÉ */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <FiFileText className="text-indigo-600" size={16} />
                        Informations d'identité
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                            Prénom
                          </label>
                          <p className="text-sm font-semibold text-slate-900">
                            {info.prenom}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                            Nom
                          </label>
                          <p className="text-sm font-semibold text-slate-900">
                            {info.nom}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                            Nationalité
                          </label>
                          <p className="text-sm font-semibold text-slate-900">
                            {info.nationalite}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION DOCUMENTS */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <FiFileText className="text-purple-600" size={16} />
                        Documents de voyage
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Document principal */}
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                              <FiFileText className="text-purple-600" size={18} />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900 mb-1">
                                {info.typeDoc === 'PASSEPORT' ? 'Passeport' : 'Laissez-passer'}
                              </h5>
                              <p className="text-sm text-slate-600 font-mono">
                                {info.referenceDoc}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-slate-500 block mb-1">
                                Délivrance
                              </label>
                              <p className="text-sm font-medium text-slate-900">
                                {info.dateDelivranceDoc 
                                  ? new Date(info.dateDelivranceDoc).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : '—'}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 block mb-1">
                                Expiration
                              </label>
                              <p className={`text-sm font-medium ${
                                info.dateValiditeDoc && new Date(info.dateValiditeDoc) < new Date()
                                  ? 'text-red-600'
                                  : 'text-slate-900'
                              }`}>
                                {info.dateValiditeDoc 
                                  ? new Date(info.dateValiditeDoc).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : '—'}
                                {info.dateValiditeDoc && new Date(info.dateValiditeDoc) < new Date() && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                    Expiré
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {info.document && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <a
                                href={info.document}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                <FiFileText size={14} />
                                Voir le document
                              </a>
                            </div>
                          )}
                        </div>

                        {info.referenceCin && (
                          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                <FiFileText className="text-blue-600" size={18} />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-slate-900 mb-1">
                                  Carte d'identité nationale
                                </h5>
                                <p className="text-sm text-slate-600 font-mono">
                                  {info.referenceCin}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">
                                  Délivrance
                                </label>
                                <p className="text-sm font-medium text-slate-900">
                                  {info.dateDelivranceCin 
                                    ? new Date(info.dateDelivranceCin).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">
                                  Expiration
                                </label>
                                <p className={`text-sm font-medium ${
                                  info.dateValiditeCin && new Date(info.dateValiditeCin) < new Date()
                                    ? 'text-red-600'
                                    : 'text-slate-900'
                                }`}>
                                  {info.dateValiditeCin 
                                    ? new Date(info.dateValiditeCin).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : '—'}
                                  {info.dateValiditeCin && new Date(info.dateValiditeCin) < new Date() && (
                                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                      Expirée
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {info.cin && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <a
                                  href={info.cin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  <FiFileText size={14} />
                                  Voir la CIN
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <FiPhone className="text-emerald-600" size={16} />
                        Informations de contact
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                            Téléphone
                          </label>
                          {info.tel ? (
                            <a 
                              href={`tel:${info.tel}`}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                            >
                              <FiPhone size={14} />
                              {info.tel}
                            </a>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Non renseigné</p>
                          )}
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                            WhatsApp
                          </label>
                          {info.whatsapp ? (
                            <a 
                              href={`https://wa.me/${info.whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              {info.whatsapp}
                            </a>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Non renseigné</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION MÉTADONNÉES */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="text-slate-500 font-medium block mb-1">
                            ID Système
                          </label>
                          <p className="text-slate-900 font-mono">
                            {info.id}
                          </p>
                        </div>
                        <div>
                          <label className="text-slate-500 font-medium block mb-1">
                            Créé le
                          </label>
                          <p className="text-slate-900">
                            {new Date(info.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="text-slate-500 font-medium block mb-1">
                            Dernière modification
                          </label>
                          <p className="text-slate-900">
                            {new Date(info.updatedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            {infos.length} passager(s) enregistré(s)
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeneficiaireInfosModal;