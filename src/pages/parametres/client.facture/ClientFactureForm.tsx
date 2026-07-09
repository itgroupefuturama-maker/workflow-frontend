import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createClientFacture,
  updateClientFacture,
  addBeneficiaireToClientFacture,
  removeBeneficiaireFromClientFacture,
  fetchClientFactures,
  assignUserToClientFacture,
} from '../../../app/back_office/clientFacturesSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import { FiArrowLeft, FiTrash2, FiSearch, FiUserPlus, FiLoader, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRef } from 'react';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ClientFactureFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: clients } = useSelector((state: RootState) => state.clientFactures);
  const { data: allBeneficiaires } = useSelector((state: RootState) => state.clientBeneficiaires);
  const { data: users } = useSelector((state: RootState) => state.users);

  const isEdit = !!id;
  const currentClient = clients.find(c => c.id === id);

  const scrollAssocRef = useRef<HTMLDivElement>(null);
  const scrollAvailRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: 'CLT-001',
    libelle: '',
    profilRisque: 'FAIBLE' as 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE',
    creditdefault: 'CREDIT_0' as 'CREDIT_0' | 'CREDIT_15' | 'CREDIT_30' | 'CREDIT_60' | 'CREDIT_90',
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
    if (!isEdit || !currentClient) return true;

    const responsableChanged = (currentClient.user?.id || null) !== (selectedUserId || null);
    return (
      formData.code !== currentClient.code ||
      formData.libelle !== currentClient.libelle ||
      formData.profilRisque !== currentClient.profilRisque ||
      formData.creditdefault !== currentClient.creditdefault ||
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

  const isFormInvalid = !formData.libelle.trim() || !formData.code.trim();

  useEffect(() => {
    if (isEdit && currentClient) {
      setFormData({
        code: currentClient.code,
        libelle: currentClient.libelle,
        profilRisque: currentClient.profilRisque,
        creditdefault: currentClient.creditdefault,
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
        await dispatch(updateClientFacture({ id, ...formData }));

        const currentResponsibleId = currentClient.user?.id || null;
        if (selectedUserId !== currentResponsibleId) {
          if (selectedUserId) {
            await dispatch(assignUserToClientFacture({ id: id!, userId: selectedUserId }));
          }
        }

        setMessage({ text: 'Client facturé mis à jour avec succès !', isError: false });
      } else {
        await dispatch(createClientFacture({ ...formData, dateApplication: new Date().toISOString() }));
        setMessage({ text: 'Client facturé créé avec succès !', isError: false });
      }

      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setMessage({ text: 'Erreur lors de l\'enregistrement.', isError: true });
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
      listRef.current?.scrollBy({ 
        top: direction === 'up' ? -100 : 100, 
        behavior: 'smooth' 
      });
    };

    return (
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => scroll('up')} 
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          title="Défiler vers le haut"
        >
          <FiChevronUp size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => scroll('down')} 
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          title="Défiler vers le bas"
        >
          <FiChevronDown size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Retour"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEdit ? 'Modifier le client' : 'Nouveau client'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Configurez les paramètres et bénéficiaires</p>
          </div>
        </div>
      </div>

      {/* Message de notification */}
      {message.text && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.isError 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message.isError ? <FiTrash2 size={18} /> : <FiUserPlus size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale : Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section : Identité */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-6">Identité du client</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                    <input 
                      type="text" 
                      value={formData.code} 
                      onChange={e => setFormData({ ...formData, code: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="CLT-001"
                      required
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom & Prenom (Libellé)</label>
                    <input 
                      type="text" 
                      value={formData.libelle} 
                      onChange={e => setFormData({ ...formData, libelle: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Nom du client"
                      required 
                    />
                  </div>
                {/* </div> */}

                {/* <div className="grid grid-cols-2 gap-4"> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profil de risque</label>
                    <select 
                      value={formData.profilRisque} 
                      onChange={e => setFormData({ ...formData, profilRisque: e.target.value as any })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      <option value="FAIBLE">Faible</option>
                      <option value="MOYEN">Moyen</option>
                      <option value="ELEVE">Élevé</option>
                      <option value="TRES_ELEVE">Très élevé</option>
                    </select>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select 
                      value={formData.statut} 
                      onChange={e => setFormData({ ...formData, statut: e.target.value as any })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif</option>
                    </select>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Section : Configuration commerciale */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-6">Configuration commerciale</h2>
              <div className="space-y-4">
                
                {/* Taux et crédit par défaut */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taux de base (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tauxBase}
                      onChange={e => setFormData({ ...formData, tauxBase: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Crédit par défaut</label>
                    <select 
                      value={formData.creditdefault} 
                      onChange={e => setFormData({ ...formData, creditdefault: e.target.value as any })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      <option value="CREDIT_0">Au comptant (0j)</option>
                      <option value="CREDIT_15">Crédit 15 jours</option>
                      <option value="CREDIT_30">Crédit 30 jours</option>
                      <option value="CREDIT_60">Crédit 60 jours</option>
                      <option value="CREDIT_90">Crédit 90 jours</option>
                    </select>
                  </div>
                </div>

                {/* Tarification par type de transport */}
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase mb-4">Tarification par type de transport</p>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { id: 'volDomestique', label: 'Vol domestique' },
                      { id: 'volRegional', label: 'Vol régional' },
                      { id: 'longCourrier', label: 'Long courrier' },
                      { id: 'auComptant', label: 'Au comptant' },
                    ].map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{field.label} (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={(formData as any)[field.id]}
                          onChange={e => setFormData({ ...formData, [field.id]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditions de crédit */}
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase mb-4">Conditions de crédit</p>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { id: 'credit15jrs', label: 'Crédit 15j' },
                      { id: 'credit30jrs', label: 'Crédit 30j' },
                      { id: 'credit60jrs', label: 'Crédit 60j' },
                      { id: 'credit90jrs', label: 'Crédit 90j' },
                    ].map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{field.label} (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={(formData as any)[field.id]}
                          onChange={e => setFormData({ ...formData, [field.id]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section : Responsable */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-6">Responsable du client</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sélectionner un responsable</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value || null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="">-- Pas de responsable assigné --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} • {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {users.find(u => u.id === selectedUserId)?.prenom?.[0]}
                      {users.find(u => u.id === selectedUserId)?.nom?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {users.find(u => u.id === selectedUserId)?.prenom}{' '}
                        {users.find(u => u.id === selectedUserId)?.nom}
                      </p>
                      <p className="text-xs text-gray-600">
                        {users.find(u => u.id === selectedUserId)?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite : Bénéficiaires */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-semibold text-gray-900">Bénéficiaires</h2>
                {currentClient?.beneficiaires && currentClient.beneficiaires.length > 3 && (
                  <ScrollIndicator listRef={scrollAssocRef} />
                )}
              </div>

              {isEdit ? (
                <>
                  {/* Liste des bénéficiaires associés */}
                  <div 
                    ref={scrollAssocRef} 
                    className="flex-1 space-y-2 mb-6 overflow-y-auto max-h-72 pr-2"
                  >
                    {currentClient?.beneficiaires.map(link => (
                      <div key={link.clientBeneficiaireId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 truncate">{link.clientBeneficiaire?.libelle}</p>
                          <p className="text-xs text-gray-500">{link.clientBeneficiaire?.code}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveBeneficiaire(link.clientBeneficiaireId)} 
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
                          title="Supprimer"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!currentClient || currentClient.beneficiaires.length === 0) && (
                      <p className="text-center text-gray-400 text-sm py-6">Aucun bénéficiaire</p>
                    )}
                  </div>

                  {/* Ajouter des bénéficiaires */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-gray-600 uppercase mb-3">Ajouter des bénéficiaires</p>
                    
                    <div className="relative mb-3">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div 
                      ref={scrollAvailRef} 
                      className="space-y-2 max-h-64 overflow-y-auto pr-2"
                    >
                      {availableBeneficiaires.map(ben => (
                        <button
                          key={ben.id}
                          onClick={() => handleAddBeneficiaire(ben.id)}
                          className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 flex justify-between items-center gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-900 truncate">{ben.libelle}</p>
                            <p className="text-xs text-gray-500">{ben.code}</p>
                          </div>
                          <FiUserPlus className="text-blue-600 flex-shrink-0" size={16} />
                        </button>
                      ))}
                      {availableBeneficiaires.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">
                          {searchTerm ? 'Aucun résultat' : 'Tous les bénéficiaires sont associés'}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center text-center py-12 text-gray-400">
                  <p className="text-sm">Les bénéficiaires pourront être ajoutés après la création du client</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action en bas */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-end gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (isEdit && !hasChanges) || isFormInvalid}
            className={`px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
              (isEdit && !hasChanges) || isFormInvalid
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <FiLoader className="animate-spin" size={18} />
            ) : isEdit ? (
              hasChanges ? 'Enregistrer' : 'Aucun changement'
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