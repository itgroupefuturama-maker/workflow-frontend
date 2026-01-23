import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'; // ← Important pour l'ID dans l'URL
import {
  createClientFacture,
  updateClientFacture,
  addBeneficiaireToClientFacture,
  removeBeneficiaireFromClientFacture,
  fetchClientFactures,
  assignUserToClientFacture,
} from '../../../app/back_office/clientFacturesSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import { FiArrowLeft, FiTrash2, FiSearch, FiUserPlus ,FiLoader, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRef } from 'react';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ClientFactureFormPage = () => {
  const { id } = useParams<{ id?: string }>(); // Si id présent → édition, sinon → création
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: clients } = useSelector((state: RootState) => state.clientFactures);
  const { data: allBeneficiaires } = useSelector((state: RootState) => state.clientBeneficiaires);
  const { data: users } = useSelector((state: RootState) => state.users);

  const isEdit = !!id;
  const currentClient = clients.find(c => c.id === id);

  // On précise que la référence contiendra un HTMLDivElement
  const scrollAssocRef = useRef<HTMLDivElement>(null);
  const scrollAvailRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [searchTerm, setSearchTerm] = useState('');
  // Juste après les autres states
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: 'CLT-001',
    libelle: '',
    profilRisque: 'FAIBLE' as 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE',
    tauxBase: 0,
    volDomestique: 3,
    volRegional: 2,
    longCourrier: 1,
    auComptant: 0,
    credit15jrs: 0.5,
    credit30jrs: 1,
    credit60jrs: 2,
    credit90jrs: 3,
    statut: 'ACTIF' as 'ACTIF' | 'INACTIF'
  });

  const hasChanges = useMemo(() => {
    if (!isEdit || !currentClient) return true; // En mode création, on considère qu'il y a toujours un changement

    const responsableChanged =
      (currentClient.user?.id || null) !== (selectedUserId || null);
    // On compare les champs clés pour voir s'il y a une différence
    return (
      formData.code !== currentClient.code ||
      formData.libelle !== currentClient.libelle ||
      formData.profilRisque !== currentClient.profilRisque ||
      formData.tauxBase !== currentClient.tauxBase ||
      formData.volDomestique !== currentClient.volDomestique ||
      formData.volRegional !== currentClient.volRegional ||
      formData.longCourrier !== currentClient.longCourrier ||
      formData.auComptant !== currentClient.auComptant ||
      formData.credit15jrs !== currentClient.credit15jrs ||
      formData.credit30jrs !== currentClient.credit30jrs ||
      formData.credit60jrs !== currentClient.credit60jrs ||
      formData.credit90jrs !== currentClient.credit90jrs ||
      formData.statut !== currentClient.statut ||
      responsableChanged
    );
  }, [formData, currentClient, isEdit, selectedUserId]);

  // Validation pour empêcher d'enregistrer si le libellé est vide
  const isFormInvalid = !formData.libelle.trim() || !formData.code.trim();

  // Chargement des données si édition
  useEffect(() => {
    if (isEdit && currentClient) {
      setFormData({
        code: currentClient.code,
        libelle: currentClient.libelle,
        profilRisque: currentClient.profilRisque,
        tauxBase: currentClient.tauxBase,
        volDomestique: currentClient.volDomestique,
        volRegional: currentClient.volRegional,
        longCourrier: currentClient.longCourrier,
        auComptant: currentClient.auComptant,
        credit15jrs: currentClient.credit15jrs,
        credit30jrs: currentClient.credit30jrs,
        credit60jrs: currentClient.credit60jrs,
        credit90jrs: currentClient.credit90jrs,
        statut: currentClient.statut
      });
      if (currentClient.user?.id) {
        setSelectedUserId(currentClient.user.id);
      }
    }
  }, [isEdit, currentClient]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    try {
      if (isEdit && currentClient) {
        // 1. Mise à jour des infos principales
        await dispatch(updateClientFacture({ id, ...formData }));

        // 2. Assignation du responsable (seulement si changé)
        const currentResponsibleId = currentClient.user?.id || null;
        if (selectedUserId !== currentResponsibleId) {
          if (selectedUserId) {
            // Assigner un nouvel utilisateur
            await dispatch(assignUserToClientFacture({ id: id!, userId: selectedUserId }));
          } else {
            // Optionnel : si tu veux pouvoir "retirer" le responsable
            // (si ton API le permet, sinon ignore cette partie)
            // await dispatch(removeUserFromClientFacture({ id: id! }));
          }
        }

        setMessage({ text: 'Client facturé mis à jour avec succès !', isError: false });
      } else {
        // Création → le responsable pourra être assigné après
        await dispatch(createClientFacture({ ...formData, dateApplication: new Date().toISOString() }));
        setMessage({ text: 'Client facturé créé avec succès !', isError: false });
      }

      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setMessage({ text: 'Erreur lors de l’enregistrement.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBeneficiaire = async (beneficiaireId: string) => {
    if (isEdit) {
      setIsSubmitting(true);
      const result = await dispatch(addBeneficiaireToClientFacture({ id: id!, beneficiaireId }));
      if (addBeneficiaireToClientFacture.fulfilled.match(result)) {
        setMessage({ text: 'Bénéficiaire ajouté !', isError: false });
        setTimeout(() => setMessage({ text: '', isError: false }), 2000);
      }
      await dispatch(fetchClientFactures());
      setIsSubmitting(false);
    }
  };

  const handleRemoveBeneficiaire = async (beneficiaireId: string) => {
    if (isEdit) {
      setIsSubmitting(true);
      const result = await dispatch(removeBeneficiaireFromClientFacture({ id: id!, beneficiaireId }));
      if (removeBeneficiaireFromClientFacture.fulfilled.match(result)) {
        setMessage({ text: 'Bénéficiaire supprimé !', isError: false });
        setTimeout(() => setMessage({ text: '', isError: false }), 2000);
      }
      await dispatch(fetchClientFactures());
      setIsSubmitting(false);
    }
  };

  const availableBeneficiaires = useMemo(() => {
    return allBeneficiaires.filter(ben =>
      !currentClient?.beneficiaires.some(l => l.clientBeneficiaireId === ben.id) &&
      (ben.libelle.toLowerCase().includes(searchTerm.toLowerCase()) || ben.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allBeneficiaires, currentClient, searchTerm]);

  const ScrollIndicator = ({ listRef }: { listRef: React.RefObject<HTMLDivElement | null> }) => {
    const scroll = (direction: 'up' | 'down') => {
      // Le point d'interrogation gère la sécurité si listRef.current est null
      listRef.current?.scrollBy({ 
        top: direction === 'up' ? -100 : 100, 
        behavior: 'smooth' 
      });
    };

    return (
      <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
        <button 
          type="button" 
          onClick={() => scroll('up')} 
          className="p-1 hover:bg-white hover:shadow-sm rounded text-indigo-600 transition-all"
        >
          <FiChevronUp size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => scroll('down')} 
          className="p-1 hover:bg-white hover:shadow-sm rounded text-indigo-600 transition-all"
        >
          <FiChevronDown size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header avec retour */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl hover:bg-gray-200 transition-all">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-900">
            {isEdit ? 'Modifier le Client Facturé' : 'Nouveau Client Facturé'}
          </h2>
          <p className="text-gray-500 italic">Configurez les paramètres et bénéficiaires associés</p>
        </div>
      </div>

      {message.text && (
        <div className={`fixed top-20 right-20 z-100 p-8 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {message.isError ? <FiTrash2 /> : <FiUserPlus />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Colonne principale : Formulaire */}
        <div className="lg:col-span-8 space-y-8">
          {/* Identité & Risque */}
          <section className="bg-white shadow-sm border border-gray-100 p-8">
            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6">Identité & Risque</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Code</label>
                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-black" required />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Libellé</label>
                <input type="text" value={formData.libelle} onChange={e => setFormData({ ...formData, libelle: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-black" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Profil Risque</label>
                <select value={formData.profilRisque} onChange={e => setFormData({ ...formData, profilRisque: e.target.value as any })} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium">
                  <option value="FAIBLE">FAIBLE</option>
                  <option value="MOYEN">MOYEN</option>
                  <option value="ELEVE">ELEVE</option>
                  <option value="TRES_ELEVE">TRES ELEVE</option>
                </select>
              </div>
            </div>
          </section>

          {/* Conditions commerciales */}
          <section className="bg-white shadow-sm border border-gray-100 p-8">
            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6">Conditions Commerciales</h4>
            <div className="grid grid-cols-3 gap-6">
              {[
                { id: 'tauxBase', label: 'Taux Base (%)' },
                { id: 'volDomestique', label: 'Vol Domestique (%)' },
                { id: 'volRegional', label: 'Vol Régional (%)' },
                { id: 'longCourrier', label: 'Long Courrier (%)' },
                { id: 'auComptant', label: 'Au Comptant (%)' },
                { id: 'credit15jrs', label: 'Crédit 15j (%)' },
                { id: 'credit30jrs', label: 'Crédit 30j (%)' },
                { id: 'credit60jrs', label: 'Crédit 60j (%)' },
                { id: 'credit90jrs', label: 'Crédit 90j (%)' },
              ].map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">{field.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData as any)[field.id]} // Ici on utilise field.id qui correspond exactement à formData
                    onChange={e => setFormData({ ...formData, [field.id]: parseFloat(e.target.value) || 0 })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Responsable */}
          <section className="bg-white shadow-sm border border-gray-100 p-8">
            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6">
              Responsable du client
            </h4>

            <div className="relative">
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium focus:border-indigo-500 outline-none appearance-none"
                disabled={isSubmitting}
              >
                <option value="">-- Sélectionner un responsable --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} • {user.email} • {user.departement || 'N/A'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <FiChevronDown className="text-gray-400" />
              </div>
            </div>

            {/* Aperçu du responsable sélectionné (optionnel mais sympa) */}
            {selectedUserId && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                    {users.find(u => u.id === selectedUserId)?.prenom?.[0]}
                    {users.find(u => u.id === selectedUserId)?.nom?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {users.find(u => u.id === selectedUserId)?.prenom}{' '}
                      {users.find(u => u.id === selectedUserId)?.nom}
                    </p>
                    <p className="text-xs text-gray-600">
                      {users.find(u => u.id === selectedUserId)?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {users.find(u => u.id === selectedUserId)?.departement}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Colonne droite : Bénéficiaires */}
        <div className="lg:col-span-4">
          <div className="bg-white shadow-sm border border-gray-100 p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Bénéficiaires Associés</h4>
            {/* Flèches pour la liste 1 */}
            {currentClient?.beneficiaires && currentClient.beneficiaires.length > 3 && <ScrollIndicator listRef={scrollAssocRef} />}
          </div>

          {isEdit ? (
            <>
              {/* Liste 1 : Associés */}
              <div 
                ref={scrollAssocRef} 
                className="flex-1 space-y-3 mb-6 overflow-y-auto max-h-96 custom-scrollbar scroll-smooth"
              >
                {currentClient?.beneficiaires.map(link => (
                  <div key={link.clientBeneficiaireId} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-300 rounded-xl">
                    <div>
                      <p className="font-bold text-sm">{link.clientBeneficiaire?.libelle}</p>
                      <p className="text-xs text-gray-500">{link.clientBeneficiaire?.code}</p>
                    </div>
                    <button onClick={() => handleRemoveBeneficiaire(link.clientBeneficiaireId)} className="text-red-500 hover:text-red-700 p-2">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
                {(!currentClient || currentClient.beneficiaires.length === 0) && (
                  <p className="text-center text-gray-400 italic py-8">Aucun bénéficiaire</p>
                )}
              </div>

              {/* Liste 2 : Disponibles */}
              <div className="border-t border-gray-300 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Disponibles</p>
                  {/* Flèches pour la liste 2 */}
                  {availableBeneficiaires.length > 3 && (
                    <ScrollIndicator listRef={scrollAvailRef} />
                  )}
                </div>
                
                <div className="relative mb-4">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div 
                  ref={scrollAvailRef} 
                  className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar scroll-smooth"
                >
                  {availableBeneficiaires.map(ben => (
                    <button
                      key={ben.id}
                      onClick={() => handleAddBeneficiaire(ben.id)}
                      className="w-full text-left p-4 hover:bg-indigo-50 flex justify-between items-center rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                    >
                      <div>
                        <p className="font-medium text-sm">{ben.libelle}</p>
                        <p className="text-xs text-gray-500">{ben.code}</p>
                      </div>
                      <FiUserPlus className="text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>
            </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center py-12 text-gray-500 italic">
                Les bénéficiaires pourront être ajoutés après la création du client.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Boutons fixes en bas */}
      <div className="mt-6 p-6">
        <div className="max-w-[1600px] mx-auto flex justify-end gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="px-8 py-4 border border-gray-300 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (isEdit && !hasChanges) || isFormInvalid}
            className={`px-12 py-4 rounded-2xl font-black shadow-lg flex items-center gap-3 uppercase text-xs tracking-widest transition-all duration-300 ${
              (isEdit && !hasChanges) || isFormInvalid
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-200'
            }`}
          >
            {isSubmitting ? (
              <FiLoader className="animate-spin" />
            ) : isEdit ? (
              hasChanges ? 'Enregistrer les modifications' : 'Aucun changement'
            ) : (
              'Créer le client'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientFactureFormPage;