import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchClientFormByVisaAbstract,
  resetClientForm,
  createClientForm,
  createClientBeneficiairePerson,
  type ClientBeneficiaireForm,
  type ClientBeneficiairePerson,
  type CreateClientFormPayload,
  type CreateClientBeneficiairePersonPayload,
  type UserDocument,
  uploadDocumentPj,
} from '../../../../../../app/portail_client/clientFormSlice';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import TabContainer from '../../../../../../layouts/TabContainer';
import { VisaHeader } from '../../components/VisaHeader';
import { API_URL_PORTAIL } from '../../../../../../service/env';

// ── Utilitaires ─────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const [datePart] = iso.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
};

// ── Composants de base ──────────────────────────────────────────────

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-slate-800 font-medium">{value || '—'}</span>
  </div>
);

const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
    <span className="text-base">{icon}</span>
    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
  </div>
);

const InputField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}> = ({ label, name, value, onChange, type = 'text', required = false, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
      >
        <option value="">— Sélectionner —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
      />
    )}
  </div>
);

// ── Carte d'une personne liée (conjoint, enfant…) ───────────────────

const PersonCard: React.FC<{ person: ClientBeneficiairePerson }> = ({ person }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
      {person.prenom?.[0]}{person.nom?.[0]}
    </div>
    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <Field label="Nom" value={person.nom} />
      <Field label="Prénom" value={person.prenom} />
      <Field label="Sexe" value={person.sexe === 'M' ? 'Masculin' : 'Féminin'} />
      <Field label="Type" value={person.typePerson} />
      <Field label="Date de naissance" value={formatDate(person.dateNaissance)} />
      <Field label="Lieu de naissance" value={person.lieuNaissance} />
      <Field label="Nationalité" value={person.nationalite} />
      <Field label="État civil" value={person.etatCivil} />
      <Field label="Numéro" value={person.numero} />
      <Field label="Email" value={person.email} />
      <Field label="Adresse" value={person.adresse} />
      <Field label="Pays de résidence" value={person.paysResidence} />
    </div>
  </div>
);

// ── Formulaire ajout de personne ────────────────────────────────────

const EMPTY_PERSON = {
  nom: '', prenom: '', sexe: '', dateNaissance: '', lieuNaissance: '',
  nationalite: '', etatCivil: '', numero: '', email: '',
  adresse: '', paysResidence: '', typePerson: '',
};

const FormulairePerson: React.FC<{
  passagerId: string;
  formId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ passagerId, formId, onSuccess, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { creatingPerson, createPersonError } = useSelector(
    (state: RootState) => state.clientForm
  );
  const [form, setForm] = useState(EMPTY_PERSON);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateClientBeneficiairePersonPayload = {
      userId: passagerId,
      clientBeneficiaireFormId: formId,
      ...form,
    };
    const result = await dispatch(createClientBeneficiairePerson(payload));
    if (createClientBeneficiairePerson.fulfilled.match(result)) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 border-b border-indigo-200">
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span className="text-sm font-bold text-indigo-700 uppercase tracking-wider">
            Ajouter une personne liée
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-indigo-400 hover:text-indigo-700 text-xs px-2 py-1 rounded hover:bg-indigo-100 transition"
        >
          ✕ Annuler
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Identité */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Identité</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InputField label="Nom" name="nom" value={form.nom} onChange={handleChange} required />
            <InputField label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required />
            <InputField
              label="Sexe" name="sexe" value={form.sexe} onChange={handleChange} required
              options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
            />
            <InputField
              label="Type de personne" name="typePerson" value={form.typePerson} onChange={handleChange} required
              options={[
                { value: 'CONJOINT', label: 'Conjoint(e)' },
                { value: 'ENFANT', label: 'Enfant' },
                { value: 'PARENT', label: 'Parent' },
                { value: 'AUTRE', label: 'Autre' },
              ]}
            />
            <InputField label="Date de naissance" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} type="date" required />
            <InputField label="Lieu de naissance" name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} />
            <InputField label="Nationalité" name="nationalite" value={form.nationalite} onChange={handleChange} />
            <InputField
              label="État civil" name="etatCivil" value={form.etatCivil} onChange={handleChange}
              options={[
                { value: 'Célibataire', label: 'Célibataire' },
                { value: 'Marié(e)', label: 'Marié(e)' },
                { value: 'Divorcé(e)', label: 'Divorcé(e)' },
                { value: 'Veuf/Veuve', label: 'Veuf/Veuve' },
              ]}
            />
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Contact</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InputField label="Numéro" name="numero" value={form.numero} onChange={handleChange} />
            <InputField label="Email" name="email" value={form.email} onChange={handleChange} type="email" required />
            <InputField label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
            <InputField label="Pays de résidence" name="paysResidence" value={form.paysResidence} onChange={handleChange} />
          </div>
        </div>

        {/* Erreur */}
        {createPersonError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {createPersonError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={creatingPerson}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              creatingPerson
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            {creatingPerson ? 'Enregistrement...' : 'Enregistrer la personne'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ── Affichage bénéficiaire + personnes liées ────────────────────────

const BeneficiaireCard: React.FC<{
  form: ClientBeneficiaireForm;
  passagerId: string;
  onPersonAdded: () => void;
}> = ({ form, passagerId, onPersonAdded }) => {
  const [showPersonForm, setShowPersonForm] = useState(false);

  const handlePersonSuccess = () => {
    setShowPersonForm(false);
    onPersonAdded();
  };

  return (
    <div className="space-y-4">
      {/* Identité */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="👤" title="Identité" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Nom" value={form.nom} />
          <Field label="Prénom" value={form.prenom} />
          <Field label="Sexe" value={form.sexe === 'M' ? 'Masculin' : 'Féminin'} />
          <Field label="Date de naissance" value={formatDate(form.dateNaissance)} />
          <Field label="Lieu de naissance" value={form.lieuNaissance} />
          <Field label="Nationalité" value={form.nationalite} />
          <Field label="État civil" value={form.etatCivil} />
          <Field label="Pays de résidence" value={form.paysResidence} />
          <Field label="Adresse" value={form.adresse} />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="📞" title="Contact" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Numéro" value={form.numero} />
          <Field label="Email" value={form.email} />
          <Field label="Téléphone" value={form.numeroTelephone} />
        </div>
      </div>

      {/* Contact d'urgence */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="🚨" title="Contact d'urgence" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Nom" value={form.nomContactUrgence} />
          <Field label="Prénom" value={form.prenomContactUrgence} />
          <Field label="Numéro" value={form.numeroContactUrgence} />
          <Field label="Email" value={form.emailContactUrgence} />
        </div>
      </div>

      {/* Profession */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="💼" title="Profession" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Profession" value={form.professionActuelle} />
          <Field label="Employeur" value={form.nomEmployeur} />
          <Field label="Email professionnel" value={form.emailProfessionnel} />
          <Field label="Adresse professionnelle" value={form.adresseProfessionnel} />
          <Field label="Établissement" value={form.etablissement} />
          <Field label="Diplôme" value={form.diplome} />
        </div>
      </div>

      {/* Document d'identité */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="🪪" title="Document d'identité" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Type de document" value={form.typeDoc} />
          <Field label="Référence" value={form.referenceDoc} />
          <Field label="Date de délivrance" value={formatDate(form.dateDelivranceDoc)} />
          <Field label="Date de validité" value={formatDate(form.dateValiditeDoc)} />
        </div>
      </div>

      {/* ── Personnes liées ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header section personnes */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-base">👥</span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Personnes liées
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {form.clientBeneficiairePerson?.length ?? 0}
            </span>
          </div>
          {!showPersonForm && (
            <button
              onClick={() => setShowPersonForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              + Ajouter une personne
            </button>
          )}
        </div>

        <div className="p-5 space-y-3">
          {/* Formulaire d'ajout */}
          {showPersonForm && (
            <FormulairePerson
              passagerId={passagerId}
              formId={form.id}
              onSuccess={handlePersonSuccess}
              onCancel={() => setShowPersonForm(false)}
            />
          )}

          {/* Liste des personnes */}
          {form.clientBeneficiairePerson?.length > 0 ? (
            form.clientBeneficiairePerson.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))
          ) : (
            !showPersonForm && (
              <div className="text-center text-slate-400 italic py-6 text-sm">
                Aucune personne liée pour le moment
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ── Formulaire de création du bénéficiaire principal ────────────────

const EMPTY_FORM = {
  nom: '', prenom: '', sexe: '', dateNaissance: '', lieuNaissance: '',
  nationalite: '', etatCivil: '', numero: '', email: '', adresse: '',
  paysResidence: '', nomContactUrgence: '', prenomContactUrgence: '',
  numeroContactUrgence: '', emailContactUrgence: '', professionActuelle: '',
  nomEmployeur: '', numeroTelephone: '', emailProfessionnel: '',
  adresseProfessionnel: '', etablissement: '', diplome: '', referenceDoc: '',
  typeDoc: '', dateDelivranceDoc: '', dateValiditeDoc: '',
};

const FormulaireCreation: React.FC<{
  userId: string;
  onSuccess: () => void;
}> = ({ userId, onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { creating, createError } = useSelector((state: RootState) => state.clientForm);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateClientFormPayload = { userId, ...form };
    const result = await dispatch(createClientForm(payload));
    if (createClientForm.fulfilled.match(result)) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="👤" title="Identité" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <InputField label="Nom" name="nom" value={form.nom} onChange={handleChange} required />
          <InputField label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required />
          <InputField label="Sexe" name="sexe" value={form.sexe} onChange={handleChange} required
            options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} />
          <InputField label="Date de naissance" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} type="date" required />
          <InputField label="Lieu de naissance" name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} />
          <InputField label="Nationalité" name="nationalite" value={form.nationalite} onChange={handleChange} />
          <InputField label="État civil" name="etatCivil" value={form.etatCivil} onChange={handleChange}
            options={[
              { value: 'Célibataire', label: 'Célibataire' },
              { value: 'Marié(e)', label: 'Marié(e)' },
              { value: 'Divorcé(e)', label: 'Divorcé(e)' },
              { value: 'Veuf/Veuve', label: 'Veuf/Veuve' },
            ]} />
          <InputField label="Pays de résidence" name="paysResidence" value={form.paysResidence} onChange={handleChange} />
          <InputField label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="📞" title="Contact" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <InputField label="Numéro" name="numero" value={form.numero} onChange={handleChange} />
          <InputField label="Email" name="email" value={form.email} onChange={handleChange} type="email" required />
          <InputField label="Téléphone" name="numeroTelephone" value={form.numeroTelephone} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="🚨" title="Contact d'urgence" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <InputField label="Nom" name="nomContactUrgence" value={form.nomContactUrgence} onChange={handleChange} />
          <InputField label="Prénom" name="prenomContactUrgence" value={form.prenomContactUrgence} onChange={handleChange} />
          <InputField label="Numéro" name="numeroContactUrgence" value={form.numeroContactUrgence} onChange={handleChange} />
          <InputField label="Email" name="emailContactUrgence" value={form.emailContactUrgence} onChange={handleChange} type="email" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="💼" title="Profession" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <InputField label="Profession actuelle" name="professionActuelle" value={form.professionActuelle} onChange={handleChange} />
          <InputField label="Nom de l'employeur" name="nomEmployeur" value={form.nomEmployeur} onChange={handleChange} />
          <InputField label="Email professionnel" name="emailProfessionnel" value={form.emailProfessionnel} onChange={handleChange} type="email" />
          <InputField label="Adresse professionnelle" name="adresseProfessionnel" value={form.adresseProfessionnel} onChange={handleChange} />
          <InputField label="Établissement" name="etablissement" value={form.etablissement} onChange={handleChange} />
          <InputField label="Diplôme" name="diplome" value={form.diplome} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <SectionTitle icon="🪪" title="Document d'identité" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <InputField label="Type de document" name="typeDoc" value={form.typeDoc} onChange={handleChange} required
            options={[
              { value: 'PASSEPORT', label: 'Passeport' },
              { value: 'CNI', label: "Carte nationale d'identité" },
              { value: 'TITRE_SEJOUR', label: 'Titre de séjour' },
            ]} />
          <InputField label="Référence" name="referenceDoc" value={form.referenceDoc} onChange={handleChange} required />
          <InputField label="Date de délivrance" name="dateDelivranceDoc" value={form.dateDelivranceDoc} onChange={handleChange} type="date" required />
          <InputField label="Date de validité" name="dateValiditeDoc" value={form.dateValiditeDoc} onChange={handleChange} type="date" required />
        </div>
      </div>

      {createError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {createError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={creating}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            creating
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
          }`}
        >
          {creating ? 'Enregistrement...' : 'Enregistrer le formulaire'}
        </button>
      </div>
    </form>
  );
};

const DocumentsRequis: React.FC<{
  documents: UserDocument[];
}> = ({ documents }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { uploadingDocId, uploadError } = useSelector(
    (state: RootState) => state.clientForm
  );

  // ref par doc pour ouvrir le file picker
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification type PDF
    if (file.type !== 'application/pdf') {
      alert('Seuls les fichiers PDF sont acceptés.');
      e.target.value = '';
      return;
    }

    // Vérification taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 5 Mo.');
      e.target.value = '';
      return;
    }

    await dispatch(uploadDocumentPj({ documentId, file }));
    // Reset input pour permettre re-upload du même fichier
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <SectionTitle icon="📄" title="Documents requis" />
      <div className="space-y-3">
        {documents.map((doc) => {
          const isUploading = uploadingDocId === doc.id;
          const hasPj = !!doc.pj;

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {/* Infos doc */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                  hasPj ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-500'
                }`}>
                  {hasPj ? '✅' : '📎'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {doc.nomDoc}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.status === 'CREER'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {doc.status}
                    </span>
                    {hasPj && (
                      <span className="text-xs text-slate-400 italic truncate max-w-[200px]">
                        {doc.pj}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action droite */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {/* Lien vers le fichier existant */}
                {hasPj && (
                  <a
                    href={`${API_URL_PORTAIL}${doc.pj}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                  >
                    👁 Voir le PDF
                  </a>
                )}

                {/* Input file caché */}
                <input
                  ref={(el) => { inputRefs.current[doc.id] = el; }}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, doc.id)}
                />

                {/* Bouton upload */}
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[doc.id]?.click()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    isUploading
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : hasPj
                        ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
                      Envoi...
                    </>
                  ) : hasPj ? (
                    '🔄 Remplacer'
                  ) : (
                    '⬆ Joindre un PDF'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Erreur globale upload */}
      {uploadError && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-lg">
          {uploadError}
        </div>
      )}
    </div>
  );
};

// ── Page principale ─────────────────────────────────────────────────

const PageFormulairePassager = () => {
  const { passagerId } = useParams<{ passagerId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();

  console.log(`id ${passagerId}`);
  

  const { data, loading, error } = useSelector(
    (state: RootState) => state.clientForm
  );

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'visa');
  const [showForm, setShowForm] = useState(false);

  const tabs = [
    { id: 'prospection', label: 'Listes des prospections' },
    { id: 'visa', label: 'Listes des visa' },
  ];

  const handleTabChange = (id: string) => {
    if (id === 'prospection') {
      navigate(`/dossiers-communs/visa/pages`, { state: { targetTab: 'prospection' } });
    } else {
      setActiveTab(id);
    }
  };

  useEffect(() => {
    if (passagerId) dispatch(fetchClientFormByVisaAbstract(passagerId));
    return () => { dispatch(resetClientForm()); };
  }, [passagerId, dispatch]);

  const reload = () => {
    if (passagerId) dispatch(fetchClientFormByVisaAbstract(passagerId));
  };

  const handleCreateSuccess = () => {
    setShowForm(false);
    reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 animate-pulse">
        Chargement du formulaire...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error || 'Aucune donnée disponible'}
      </div>
    );
  }

  const isVisa = data.userType === 'VISA';
  const isAssurance = data.userType === 'ASSURANCE';
  const form = data.selectedClientBeneficiaireForm;
  const numeroDos = location.state?.numeroDos ?? null;
  const hasForm = !!form;

  return (
    <div className="h-full flex flex-col min-h-0">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange}>
        <div className="py-2 px-4 space-y-4">

            <VisaHeader numerovisa={numeroDos} nomPassager={data.nom} navigate={navigate} isDetail={true} isPassager={true}/>

            {/* En-tête */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        Formulaire passager
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                        {hasForm ? `${form.nom} ${form.prenom}` : data.nom}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Compte : {data.nom}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        isVisa ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {data.userType}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        data.isValidate ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {data.isValidate ? 'Validé' : 'Non validé'}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        data.actif ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {data.actif ? 'Actif' : 'Inactif'}
                        </span>
                        {!showForm && !hasForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                        >
                            + Remplir le formulaire
                        </button>
                        )}
                        {showForm && (
                        <button
                            onClick={() => setShowForm(false)}
                            className="mt-2 px-4 py-2 border border-slate-300 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
                        >
                            ✕ Annuler
                        </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Formulaire de création bénéficiaire */}
            {showForm && (
                <FormulaireCreation userId={data.id} onSuccess={handleCreateSuccess} />
            )}

            {/* ── Bloc VISA ── */}
            {!showForm && isVisa && data.visa && (
                <div className="space-y-4">
                <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                    <SectionTitle icon="🛂" title="Informations visa" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Type de visa" value={data.visa.visaType} />
                    <Field label="Description" value={data.visa.visaDescription} />
                    <Field label="Pays" value={data.visa.pays} />
                    </div>
                </div>

                {data.userDocument.length > 0 && (
                    <DocumentsRequis documents={data.userDocument} />
                )}

                {form ? (
                    <BeneficiaireCard
                    form={form}
                    passagerId={passagerId!}
                    onPersonAdded={reload}
                    />
                ) : (
                    <div className="text-center text-slate-400 italic py-8 bg-white rounded-xl border border-dashed border-slate-300">
                    Aucun formulaire bénéficiaire renseigné —
                    <button
                        onClick={() => setShowForm(true)}
                        className="ml-2 text-indigo-600 font-medium underline hover:text-indigo-800"
                    >
                        Remplir maintenant
                    </button>
                    </div>
                )}
                </div>
            )}

            {/* ── Bloc ASSURANCE ── */}
            {!showForm && isAssurance && (
                <div className="space-y-4">
                {data.assurance ? (
                    <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
                    <SectionTitle icon="🛡️" title="Informations assurance" />
                    <pre className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg overflow-auto">
                        {JSON.stringify(data.assurance, null, 2)}
                    </pre>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 italic py-8">
                    Aucune donnée assurance disponible
                    </div>
                )}
                {form && (
                    <BeneficiaireCard
                    form={form}
                    passagerId={passagerId!}
                    onPersonAdded={reload}
                    />
                )}
                </div>
            )}

            {/* Type non reconnu */}
            {!showForm && !isVisa && !isAssurance && (
                <div className="text-center text-slate-400 italic py-12">
                Type non reconnu : <strong>{data.userType}</strong>
                </div>
            )}

            </div>
        </TabContainer>
    </div>
  );
};

export default PageFormulairePassager;