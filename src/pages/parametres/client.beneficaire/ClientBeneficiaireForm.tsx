import { useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  updateClientBeneficiaire,
  fetchClientBeneficiaires,
} from '../../../app/back_office/clientBeneficiairesSlice';
import {
  addBeneficiaireToClientFacture,
  removeBeneficiaireFromClientFacture,
} from '../../../app/back_office/clientFacturesSlice';
import type { RootState, AppDispatch } from '../../../app/store';
import { FiArrowLeft, FiTrash2, FiSearch, FiPlus, FiLoader, FiChevronUp, FiChevronDown, FiUserPlus, FiCheck} from 'react-icons/fi';

const useAppDispatch = () => useDispatch<AppDispatch>();

const ScrollIndicator = ({ listRef }: { listRef: React.RefObject<HTMLDivElement | null> }) => {
    const scroll = (direction: 'up' | 'down') => {
      listRef.current?.scrollBy({ 
        top: direction === 'up' ? -120 : 120, 
        behavior: 'smooth' 
      });
    };

    return (
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
        <button type="button" onClick={() => scroll('up')} className="p-1 hover:bg-white hover:shadow-sm rounded text-indigo-600 transition-all">
          <FiChevronUp size={14} />
        </button>
        <button type="button" onClick={() => scroll('down')} className="p-1 hover:bg-white hover:shadow-sm rounded text-indigo-600 transition-all">
          <FiChevronDown size={14} />
        </button>
      </div>
    );
  };

const ClientBeneficiaireFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: beneficiaires } = useSelector((state: RootState) => state.clientBeneficiaires);
  const { data: clientFactures } = useSelector((state: RootState) => state.clientFactures);

  const scrollAssocRef = useRef<HTMLDivElement>(null);
  const scrollAvailRef = useRef<HTMLDivElement>(null);

  const currentBeneficiaire = beneficiaires.find(b => b.id === id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [searchFacture, setSearchFacture] = useState('');

  const [libelle, setLibelle] = useState(currentBeneficiaire?.libelle ?? '');

  const [statut, setStatut] = useState<'ACTIF' | 'INACTIF'>(
    (currentBeneficiaire?.statut as 'ACTIF' | 'INACTIF') ?? 'ACTIF'
  );

  const isFormInvalid = !libelle.trim();

  const handleSubmit = async () => {
    if (!currentBeneficiaire) return;

    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    const result = await dispatch(updateClientBeneficiaire({
      id: currentBeneficiaire.id,
      libelle,
      statut
    }));

    if (updateClientBeneficiaire.fulfilled.match(result)) {
      setMessage({ text: 'Modifications enregistrées avec succès !', isError: false });
      setTimeout(() => navigate(-1), 1500);
    } else {
      setMessage({ text: 'Erreur lors de la sauvegarde.', isError: true });
    }
    setIsSubmitting(false);
  };

  const handleAddClientFacture = async (clientFactureId: string) => {
    setIsSubmitting(true);
    const result = await dispatch(addBeneficiaireToClientFacture({
      id: clientFactureId,
      beneficiaireId: id!
    }));
    
    if (addBeneficiaireToClientFacture.fulfilled.match(result)) {
      setMessage({ text: 'Association réussie !', isError: false });
      // On efface le message après 2 secondes pour ne pas polluer l'écran
      setTimeout(() => setMessage({ text: '', isError: false }), 2000);
    }
    
    await dispatch(fetchClientBeneficiaires());
    setIsSubmitting(false);
  };

  const handleRemoveClientFacture = async (clientFactureId: string) => {
    setIsSubmitting(true);

    const result = await dispatch(removeBeneficiaireFromClientFacture({
      id: clientFactureId,
      beneficiaireId: id!
    }));
    
    if (removeBeneficiaireFromClientFacture.fulfilled.match(result)) {
      setMessage({ text: 'Association supprimée !', isError: false });
      // On efface le message après 2 secondes pour ne pas polluer l'écran
      setTimeout(() => setMessage({ text: '', isError: false }), 2000);
    }
    await dispatch(removeBeneficiaireFromClientFacture({
      id: clientFactureId,
      beneficiaireId: id!
    }));
    await dispatch(fetchClientBeneficiaires());
    setIsSubmitting(false);
  };


  const hasChanges = useMemo(() => {
    if (!currentBeneficiaire) return false;
    return libelle !== currentBeneficiaire.libelle || statut !== currentBeneficiaire.statut;
  }, [libelle, statut, currentBeneficiaire]);

  const availableClientFactures = useMemo(() => {
    const linkedIds = currentBeneficiaire?.factures.map(f => f.clientFacture.id) || [];
    return clientFactures.filter(cf =>
      !linkedIds.includes(cf.id) &&
      (cf.libelle.toLowerCase().includes(searchFacture.toLowerCase()) ||
       cf.code.toLowerCase().includes(searchFacture.toLowerCase()))
    );
  }, [clientFactures, currentBeneficiaire, searchFacture]);

  if (!currentBeneficiaire) {
    return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 px-6">
      <div className="max-w-[1400px] mx-auto pt-8">
        
        {/* Header épuré */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all text-gray-500 hover:text-indigo-600"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {currentBeneficiaire.libelle}
                </h1>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-mono rounded border border-gray-200">
                  ID: {currentBeneficiaire.code}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-medium">Édition du bénéficiaire et des associations clients</p>
            </div>
          </div>

          {/* Bouton secondaire flottant */}
          <button
            onClick={() => navigate(`infos`, { state: { libelle: currentBeneficiaire.libelle } })}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-sm"
          >
            <FiUserPlus size={16} />
            Infos Complémentaires
          </button>
        </div>

        {message.text && (
          <div className={`fixed top-8 right-8 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-5 duration-300 ${
            message.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <div className={`p-2 rounded-lg ${message.isError ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {message.isError ? <FiTrash2 /> : <FiUserPlus />}
            </div>
            <span className="text-sm font-bold pr-4">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Colonne GAUCHE : Configuration */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Paramètres Généraux</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Libellé du bénéficiaire</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={libelle}
                      onChange={(e) => setLibelle(e.target.value.toUpperCase())}
                      className={`w-full px-4 py-3 bg-gray-50/50 border rounded-lg text-sm font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none ${
                        !libelle ? 'border-red-200' : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="EX: CLIENT NOM"
                    />
                    {!libelle && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">REQUIS</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Statut du compte</label>
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-lg font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  >
                    <option value="ACTIF text-emerald-600">● ACTIF</option>
                    <option value="INACTIF text-gray-400">○ INACTIF</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Validation Card */}
            <section className="bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 p-6 text-white">
              <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">Actions de sauvegarde</h4>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !hasChanges || isFormInvalid}
                className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                  hasChanges && !isFormInvalid
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-500/50 text-indigo-200 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {hasChanges ? 'Enregistrer les modifications' : 'Aucun changement'}
              </button>
              {!hasChanges && !isSubmitting && (
                <p className="text-[10px] text-center mt-3 opacity-60 font-medium italic">Modifiez un champ pour activer la sauvegarde</p>
              )}
            </section>
          </div>

          {/* Colonne DROITE : Associations */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-h-[600px] overflow-hidden">
              
              {/* Header Liste 1 */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Clients Facturés Associés</h4>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Éléments actuellement reliés à ce bénéficiaire</p>
                </div>
                {currentBeneficiaire.factures.length > 3 && <ScrollIndicator listRef={scrollAssocRef} />}
              </div>

              {/* Liste 1 : Associés */}
              <div 
                ref={scrollAssocRef}
                className="p-6 flex-1 space-y-3 overflow-y-auto max-h-[350px] custom-scrollbar"
              >
                {currentBeneficiaire.factures.map((f) => (
                  <div key={f.clientFacture.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 text-[10px] font-bold">CF</div>
                      <div>
                        <p className="font-bold text-sm text-gray-800 leading-tight">{f.clientFacture.libelle}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-tighter">Code: {f.clientFacture.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveClientFacture(f.clientFacture.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Dissocier"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
                {currentBeneficiaire.factures.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <p className="text-xs text-gray-400 font-medium italic">Aucun client facturé associé pour le moment</p>
                  </div>
                )}
              </div>

              {/* Zone de recherche & Ajout */}
              <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rechercher & Ajouter</span>
                  {availableClientFactures.length > 3 && <ScrollIndicator listRef={scrollAvailRef} />}
                </div>

                <div className="relative mb-6 shadow-sm">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tapez le nom d'un client facturé..."
                    value={searchFacture}
                    onChange={(e) => setSearchFacture(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>

                {/* Liste 2 : Disponibles */}
                <div 
                  ref={scrollAvailRef}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar"
                >
                  {availableClientFactures.map((cf) => (
                    <button
                      key={cf.id}
                      onClick={() => handleAddClientFacture(cf.id)}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-white transition-all group"
                    >
                      <div className="text-left overflow-hidden">
                        <p className="font-bold text-xs text-gray-700 truncate">{cf.libelle}</p>
                        <p className="text-[9px] text-gray-400 font-mono">{cf.code}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                        <FiPlus size={14} />
                      </div>
                    </button>
                  ))}
                  {availableClientFactures.length === 0 && searchFacture && (
                    <div className="col-span-2 py-8 text-center text-xs text-gray-400 italic">Aucun résultat trouvé</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBeneficiaireFormPage;