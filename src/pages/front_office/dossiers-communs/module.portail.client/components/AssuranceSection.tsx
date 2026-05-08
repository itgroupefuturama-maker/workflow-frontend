import { Briefcase, Plus, User } from "lucide-react";
import type { ClientAssurance, ClientAssuranceForm } from "../../../../../app/portail_client/clientFormSlice";

const InfoField = ({ label, value }: { label: string; value: string | undefined | null }) => (
  <div>
    <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
  </div>
);

const AssuranceSection = ({
  assurance,
  forms,
  onAdd,  
}: {
  assurance?: ClientAssurance;
  forms: ClientAssuranceForm[];
  onAdd: () => void; 
}) => {
  const lastForm = forms.at(-1);

   if (!lastForm) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <User size={28} className="text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Dossier incomplet</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          Aucun formulaire d'assurance renseigné pour le moment.
        </p>
        <button
          onClick={onAdd}                    // ← ici
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
        >
          <Plus size={15} /> Compléter mon dossier
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Infos assurance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Briefcase size={14} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Détails de l'assurance</h3>
            <p className="text-xs text-gray-400">Informations sur la couverture</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-3 gap-x-8 gap-y-5">
          <InfoField label="Assureur"          value={assurance?.assureur} />
          <InfoField label="Zone de destination" value={assurance?.zoneDestination} />
          <InfoField label="Destination"       value={assurance?.destination || '—'} />
        </div>
      </div>

      {/* Infos assuré */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <User size={14} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Informations de l'assuré</h3>
            <p className="text-xs text-gray-400">Données personnelles du bénéficiaire</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-3 gap-x-8 gap-y-5">
          <InfoField label="Prénom"            value={lastForm.prenom} />
          <InfoField label="Nom"               value={lastForm.nom} />
          <InfoField label="Date de naissance" value={new Date(lastForm.dateNaissance).toLocaleDateString('fr-FR')} />
          <InfoField label="Téléphone"         value={lastForm.numero} />
          <InfoField label="Email"             value={lastForm.email} />
          <InfoField label="N° Passport"       value={lastForm.numeroPassport} />
          <div className="col-span-3">
            <InfoField label="Adresse" value={lastForm.adresse} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssuranceSection;