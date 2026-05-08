import { ChevronRight, X } from "lucide-react";
import type { ClientBeneficiaireForm, ClientFormPayload } from "../../../../../app/portail_client/clientFormSlice";

interface Props {
  shared: ClientBeneficiaireForm[];
  onClose: () => void;
  onStartFresh: () => void;
  onChoose: (data: Partial<ClientFormPayload>, persons: any[]) => void;
}

const ChoicePopup = ({ shared, onClose, onStartFresh, onChoose }: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Réutiliser des données existantes ?</h2>
            <p className="text-sm text-gray-400 mt-1">
              Nous avons trouvé des informations enregistrées. Choisissez un dossier pour pré-remplir votre formulaire.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition ml-4 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Document","Référence","Date de délivrance","Date de validité","Nom complet", "Nationalité", "Date de naissance", "Créé le", "Personnes liées", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shared.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
                      {s.typeDoc || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
                      {s.referenceDoc || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
                      {s.dateDelivranceDoc?.split('T')[0] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
                      {s.dateValiditeDoc?.split('T')[0] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {s.prenom?.[0]}{s.nom?.[0]}
                      </div>
                      <span className="font-semibold text-gray-800">{s.prenom} {s.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.nationalite || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.dateNaissance ? new Date(s.dateNaissance).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.clientBeneficiairePerson?.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {s.clientBeneficiairePerson.map((p) => (
                          <span key={p.id} className="text-xs text-gray-600 flex items-center gap-1">
                            {p.typePerson === 'CONJOINT' ? '💍' : '👶'} {p.prenom} {p.nom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Aucune</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onChoose(
                        {
                          nom:                  s.nom,
                          prenom:               s.prenom,
                          sexe:                 s.sexe,
                          dateNaissance:        s.dateNaissance?.split('T')[0] ?? '',
                          lieuNaissance:        s.lieuNaissance,
                          nationalite:          s.nationalite,
                          etatCivil:            s.etatCivil,
                          numero:               s.numero,
                          email:                s.email,
                          adresse:              s.adresse,
                          paysResidence:        s.paysResidence,
                          nomContactUrgence:    s.nomContactUrgence,
                          prenomContactUrgence: s.prenomContactUrgence,
                          numeroContactUrgence: s.numeroContactUrgence,
                          emailContactUrgence:  s.emailContactUrgence,
                          professionActuelle:   s.professionActuelle,
                          nomEmployeur:         s.nomEmployeur,
                          numeroTelephone:      s.numeroTelephone,
                          emailProfessionnel:   s.emailProfessionnel,
                          adresseProfessionnel: s.adresseProfessionnel,
                          etablissement:        s.etablissement,
                          diplome:              s.diplome,
                          referenceDoc:         s.referenceDoc,
                          typeDoc:              s.typeDoc,
                          dateDelivranceDoc:    s.dateDelivranceDoc?.split('T')[0] ?? '',
                          dateValiditeDoc:      s.dateValiditeDoc?.split('T')[0] ?? '',
                        },
                        s.clientBeneficiairePerson ?? []
                      )}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                    >
                      <ChevronRight size={13} /> Choisir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={onStartFresh}
            className="text-sm text-gray-500 hover:text-gray-800 transition font-medium"
          >
            Commencer à zéro
          </button>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition">
            Annuler
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChoicePopup;