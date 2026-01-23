import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiCheckSquare, FiX } from 'react-icons/fi';
import type { AppDispatch, RootState } from '../../../../app/store';
import { fetchProspectionLignes, createProspectionLigne } from '../../../../app/front_office/prospectionsLignesSlice';
import axios from '../../../../service/Axios';
import { fetchDestinations } from '../../../../app/front_office/parametre_ticketing/destinationSlice';
import { fetchPays } from '../../../../app/front_office/parametre_ticketing/paysSlice'; // ← ajouté

export default function ProspectionDetail() {
    const { enteteId } = useParams<{ enteteId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    // Récupérer l'entête (depuis la liste globale si déjà chargée)
    const entete = useSelector((state: RootState) =>
        state.prospectionsEntetes.items.find(e => e.id === enteteId)
    );

    const { items: destinations, loading: loadingDest } = useSelector((state: RootState) => state.destination);
   const { items: pays, loading: loadingPays } = useSelector((state: RootState) => state.pays);
    // Mode sélection + lignes choisies pour le devis
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedLigneIds, setSelectedLigneIds] = useState<string[]>([]);

    // Récupérer les lignes
    const {
        items: lignes,
        loading: loadingLignes,
        error: errorLignes,
    } = useSelector((state: RootState) => state.prospectionsLignes);

    // Services / spécifiques (dynamiques depuis le store)
    const {
      items: servicesDisponibles,
      loading: loadingServices,
      error: errorServices,
    } = useSelector((state: RootState) => state.serviceSpecifique);

    const loading = loadingLignes || loadingServices || loadingDest || loadingPays;;

    useEffect(() => {
      if (enteteId) {
        dispatch(fetchProspectionLignes(enteteId));
      }
      if (destinations.length === 0) {
        dispatch(fetchDestinations());
      }
      if (pays.length === 0) {
        dispatch(fetchPays());
      }
    }, [enteteId, dispatch]);

    // Ajouter une nouvelle ligne vide en mode édition
    const [newLine, setNewLine] = useState<any>(null); // une seule nouvelle ligne à la fois

    // Fonction pour ajouter une ligne vide au tableau
    const handleAddNewLine = () => {
      if (newLine) return;

      // Initialisation dynamique avec TOUS les services existants
      const initialServiceValues = servicesDisponibles.map((s) => ({
        serviceSpecifiqueId: s.id,
        valeur: '', // vide → à remplir par l'utilisateur
      }));

      setNewLine({
        tempId: Date.now(),
        departId: '',
        destinationId: '',
        numeroVol: '',
        avion: '',
        itineraire: '',
        classe: 'ECONOMIE',
        typePassager: 'ADULTE',
        dateHeureDepart: '',
        dateHeureArrive: '',
        dureeVol: '',
        dureeEscale: '',
        puBilletCompagnieDevise: 0,
        puServiceCompagnieDevise: 0,
        puPenaliteCompagnieDevise: 0,
        devise: 'EUR',
        tauxEchange: 4900,
        montantBilletCompagnieDevise: 0,
        montantServiceCompagnieDevise: 0,
        montantPenaliteCompagnieDevise: 0,
        montantBilletClientDevise: 0,
        montantServiceClientDevise: 0,
        montantPenaliteClientDevise: 0,
        serviceValues: initialServiceValues,
        isSaving: false,
      });
    };

    // Ajouter cette fonction pour mettre à jour automatiquement l'itinéraire
    const updateItineraireAuto = (updatedLine: any) => {
      const depart = destinations.find(d => d.id === updatedLine.departId);
      const dest = destinations.find(d => d.id === updatedLine.destinationId);

      let newItineraire = '';
      if (depart && dest) {
        newItineraire = `${depart?.ville || depart?.code || '?'} → ${dest?.ville || dest?.code || '?'}`;
        // Variante plus lisible : `${depart.ville} (${depart.code}) → ${dest.ville} (${dest.code})`
      } else if (depart) {
        newItineraire = `${depart.ville} - ?`;
      } else if (dest) {
        newItineraire = `? - ${dest.ville}`;
      }

      return {
        ...updatedLine,
        itineraire: newItineraire,
      };
    };


    // Modifier updateNewLineField pour gérer l'auto-mise à jour
    const updateNewLineField = (field: string, value: any) => {
      setNewLine(prev => {
        let updated = { ...prev, [field]: value };

        // Si on modifie departId ou destinationId → recalculer itinéraire
        if (field === 'departId' || field === 'destinationId') {
          updated = updateItineraireAuto(updated);
        }

        return updated;
      });
    };

    // Mise à jour d'un service spécifique
    const updateServiceValue = (index: number, newValeur: string) => {
      setNewLine((prev: any) => {
        const newValues = [...prev.serviceValues];
        newValues[index] = { ...newValues[index], valeur: newValeur.trim() };
        return { ...prev, serviceValues: newValues };
      });
    };

    // Enregistrer la nouvelle ligne
    const handleSaveNewLine = async () => {
      if (!newLine || !enteteId) return;

      if (!newLine.departId || !newLine.destinationId) {
        alert("Veuillez sélectionner un aéroport de départ et une destination");
        return;
      }

      if (!newLine.numeroVol.trim() || !newLine.itineraire.trim() || !newLine.dateHeureDepart) {
        alert("Veuillez remplir : numéro vol, itinéraire et date de départ");
        return;
      }

      setNewLine((prev: any) => ({ ...prev, isSaving: true }));

      try {
        const payload = {
          prospectionEnteteId: enteteId,
          departId: newLine.departId,
          destinationId: newLine.destinationId,
          numeroVol: newLine.numeroVol.trim(),
          avion: newLine.avion.trim() || null,
          itineraire: newLine.itineraire.trim() || null,
          classe: newLine.classe,
          typePassager: newLine.typePassager,
          dateHeureDepart: new Date(newLine.dateHeureDepart).toISOString(),
          dateHeureArrive: newLine.dateHeureArrive ? new Date(newLine.dateHeureArrive).toISOString() : null,
          dureeVol: newLine.dureeVol.trim() || null,
          dureeEscale: newLine.dureeEscale.trim() || null,
          devise: newLine.devise,
          tauxEchange: Number(newLine.tauxEchange) || 4900,

          puBilletCompagnieDevise: Number(newLine.puBilletCompagnieDevise) || 0,
          puServiceCompagnieDevise: Number(newLine.puServiceCompagnieDevise) || 0,
          puPenaliteCompagnieDevise: Number(newLine.puPenaliteCompagnieDevise) || 0,

          montantBilletCompagnieDevise: Number(newLine.montantBilletCompagnieDevise) || 0,
          montantServiceCompagnieDevise: Number(newLine.montantServiceCompagnieDevise) || 0,
          montantPenaliteCompagnieDevise: Number(newLine.montantPenaliteCompagnieDevise) || 0,

          montantBilletClientDevise: Number(newLine.montantBilletClientDevise) || 0,
          montantServiceClientDevise: Number(newLine.montantServiceClientDevise) || 0,
          montantPenaliteClientDevise: Number(newLine.montantPenaliteClientDevise) || 0,

          services: newLine.serviceValues.map((s: any) => ({
            serviceSpecifiqueId: s.serviceSpecifiqueId,
            valeur: s.valeur.trim() || 'false',
          })),
        };

        await dispatch(createProspectionLigne(payload)).unwrap();
        dispatch(fetchProspectionLignes(enteteId));
        setNewLine(null);
      } catch (err: any) {
        alert("Erreur création : " + (err?.message || "voir console"));
        console.error(err);
        setNewLine((prev: any) => ({ ...prev, isSaving: false }));
      }
    };

    const toggleSelectionMode = () => {
      setSelectionMode(!selectionMode);
      if (selectionMode) {
        // On quitte le mode → reset
        setSelectedLigneIds([]);
      }
    };

    const toggleLigneSelection = (ligneId: string) => {
      setSelectedLigneIds(prev => 
        prev.includes(ligneId)
          ? prev.filter(id => id !== ligneId)
          : [...prev, ligneId]
      );
    };

    const isAllSelected = lignes.length > 0 && selectedLigneIds.length === lignes.length;

    const toggleSelectAll = () => {
      if (isAllSelected) {
        setSelectedLigneIds([]);
      } else {
        setSelectedLigneIds(lignes.map(l => l.id));
      }
    };

    const handleCreateDevis = async () => {
      if (selectedLigneIds.length === 0) return;

      if (!window.confirm(`Créer un devis avec ${selectedLigneIds.length} ligne(s) ?`)) {
        return;
      }

      try {
        const payload = {
          prospectionEnteteId: enteteId,
          prospectionLigneIds: selectedLigneIds,
        };

        const response = await axios.post('/devis', payload);

        if (response.data?.success) {
          alert('Devis créé avec succès !');
          // Option A : reset sélection
          setSelectedLigneIds([]);
          setSelectionMode(false);

          // Option B : rediriger vers la page des devis (si tu as une route)
          navigate(`/dossiers-communs/ticketing/devis/${enteteId}`);

          // Option C : recharger les entêtes ou autre slice si besoin
          // dispatch(fetchProspectionEntetes()); // si tu as ce thunk
        } else {
          alert('Réponse invalide du serveur');
        }
      } catch (err: any) {
        console.error(err);
        alert('Erreur lors de la création du devis : ' + (err.response?.data?.message || err.message));
      }
    };

    // Annuler la création
    const handleCancelNewLine = () => {
    setNewLine(null);
    };

   // ─── Guards ───────────────────────────────────────────────────
    if (!enteteId) {
      return <div className="p-8 text-center text-red-600">ID entête manquant</div>;
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    if (errorLignes || errorServices) {
      return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
          {errorLignes}
        </div>
      );
    }

    if (!entete) {
      return (
        <div className="p-8 text-center text-amber-700 bg-amber-50 rounded-xl">
          Entête non trouvé dans le store. Veuillez recharger la liste des entêtes.
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <header className="mb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-slate-600 hover:text-slate-900 mb-8 font-medium"
        >
          <FiArrowLeft size={20} />
          Retour aux entêtes
        </button>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Entête de prospection : {entete?.numeroEntete}
          </h1>
          <p className="text-slate-600 mb-6">
            Prestation : {entete.prestation?.numeroDos || entete.prestationId || '—'}
          </p>

          {/* Infos principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="text-xs uppercase text-slate-500 font-semibold">Fournisseur</label>
              <p className="text-lg font-medium">
                {entete.fournisseur?.libelle || entete.fournisseurId || '—'}
              </p>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500 font-semibold">Type de vol</label>
              <p className="text-lg font-medium">{entete?.typeVol}</p>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500 font-semibold">Crédit</label>
              <p className="text-lg font-medium">{entete?.credit}</p>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500 font-semibold">Commission proposée</label>
              <p className="text-lg font-medium">{entete?.commissionPropose} %</p>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-500 font-semibold">Commission appliquée</label>
              <p className="text-lg font-medium">{entete?.commissionAppliquer} %</p>
            </div>
          </div>
        </div>
      </header>

      {/* Liste des lignes */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-3">
            Lignes de prospection
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(`/dossiers-communs/ticketing/devis/${enteteId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus size={16} />
              Voir les listes de devis
            </button>
            <button
              onClick={handleAddNewLine}
              disabled={!!newLine || loadingLignes || selectionMode}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus size={16} />
              Ajouter une ligne
            </button>

            {selectionMode ? (
              <>
                <button
                  onClick={toggleSelectionMode}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <FiX size={16} />
                  Annuler sélection
                </button>

                <button
                  onClick={handleCreateDevis}
                  disabled={selectedLigneIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCheckSquare size={16} />
                  Créer Devis ({selectedLigneIds.length})
                </button>
              </>
            ) : (
              <button
                onClick={toggleSelectionMode}
                disabled={lignes.length === 0 || !!newLine || loadingLignes}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheckSquare size={16} />
                Sélectionner pour devis
              </button>
            )}
          </div>
        </div>

        {loadingLignes ? (
          <div className="p-12 text-center text-slate-500 bg-slate-50 animate-pulse">
            Chargement des lignes...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {selectionMode && (
                    <th className="px-4 py-4 text-center w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Dos Ref</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Numéro de vol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Avion</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Départ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Itinéraire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type passager</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date / Départ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date / Arrivée</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Durée vol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Durée escale</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">PU Billet Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">PU Service Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">PU Pénalité Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Devise</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Taux change</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Billet Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Service Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Pénalité Cie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Billet Cie en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Service Cie en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Pénalité Cie en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Billet Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Service Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Pénalité Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Billet Client en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Service Client en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mt Pénalité Client en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Commission en Devise</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Commission en Ariary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Services & Spécifiques</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Lignes existantes */}
                {Array.isArray(lignes) && lignes.length > 0 ? (
                  lignes.map((ligne) => (
                    <tr key={ligne.id} className="hover:bg-indigo-50/30 transition-colors">
                      {selectionMode && (
                        <td className="px-4 py-4 text-center w-10">
                          <input
                            type="checkbox"
                            checked={selectedLigneIds.includes(ligne.id)}
                            onChange={() => toggleLigneSelection(ligne.id)}
                            className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{ligne.numeroDosRef || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{ligne.numeroVol || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.avion || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{'—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{'—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.itineraire || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.classe || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.typePassager || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ligne.dateHeureDepart
                          ? new Date(ligne.dateHeureDepart).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ligne.dateHeureArrive
                          ? new Date(ligne.dateHeureArrive).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeVol || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.dureeEscale || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ligne.puBilletCompagnieDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ligne.puServiceCompagnieDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ligne.puPenaliteCompagnieDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ligne.devise || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ligne.tauxEchange?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-700">
                        {ligne.montantBilletCompagnieDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantServiceCompagnieDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantPenaliteCompagnieDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantBilletCompagnieAriary?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantServiceCompagnieAriary?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantPenaliteCompagnieAriary?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantBilletClientDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantServiceClientDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantPenaliteClientDevise?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantBilletClientAriary?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantServiceClientAriary?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.montantPenaliteClientAriary?.toLocaleString('fr-FR') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.commissionEnDevise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                        {ligne.commissionEnAriary?.toLocaleString('fr-FR') || '—'}
                      </td>

                      {/* Nouvelle colonne : Services & Spécifiques */}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {ligne.serviceProspectionLigne?.length > 0 ? (
                            ligne.serviceProspectionLigne.map((service) => {
                              const label = service.serviceSpecifique?.libelle || service.serviceSpecifiqueId.slice(0, 8);
                              const value = service.valeur;
                              return (
                                <span
                                  key={service.id}
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium `}
                                  title={`${label} = ${value}`}
                                >
                                  {label} {value}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic">Aucun service</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400">
                        —
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={31} className="px-6 py-10 text-center text-slate-500">
                      {loadingLignes ? 'Chargement des lignes...' : 'Aucune ligne trouvée'}
                    </td>
                  </tr>
                )}

                {/* Nouvelle ligne en cours de saisie */}
                {newLine && (
                  <tr className="bg-indigo-50/50 border-t-2 border-indigo-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">(nouveau)</td>

                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={newLine.numeroVol}
                        onChange={(e) => updateNewLineField('numeroVol', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                        placeholder="MD-003"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={newLine.avion}
                        onChange={(e) => updateNewLineField('avion', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm"
                        placeholder="Boeing 737"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <select
                        value={newLine.departId}
                        onChange={e => updateNewLineField('departId', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm bg-white"
                        required
                      >
                        <option value="">— Sélectionner départ —</option>
                        {destinations.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.code} – {d.ville}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-3">
                      <select
                        value={newLine.destinationId}
                        onChange={e => updateNewLineField('destinationId', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm bg-white"
                        required
                      >
                        <option value="">— Sélectionner destination —</option>
                        {destinations.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.code} – {d.ville}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* <td className="px-6 py-3">
                      <input
                        type="text"
                        value={newLine.itineraire}
                        onChange={(e) => updateNewLineField('itineraire', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm"
                        placeholder="TNR - CDG"
                      />
                    </td> */}

                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 border border-indigo-300 rounded bg-white/80 text-sm">
                        {newLine.departId && destinations.find(d => d.id === newLine.departId) ? (
                          <span className="font-medium">
                            {destinations.find(d => d.id === newLine.departId)?.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">Départ ?</span>
                        )}
                        <span className="text-slate-500">→</span>
                        {newLine.destinationId && destinations.find(d => d.id === newLine.destinationId) ? (
                          <span className="font-medium">
                            {destinations.find(d => d.id === newLine.destinationId)?.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">Destination ?</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <select
                        value={newLine.classe}
                        onChange={(e) => updateNewLineField('classe', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm bg-white"
                      >
                        <option value="ECONOMIE">Économie</option>
                        <option value="BUSINESS">Business</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="PREMIERE">Première</option>
                      </select>
                    </td>

                    <td className="px-6 py-3">
                      <select
                        value={newLine.typePassager}
                        onChange={(e) => updateNewLineField('typePassager', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm bg-white"
                      >
                        <option value="ADULTE">Adulte</option>
                        <option value="ENFANT">Enfant</option>
                        <option value="BEBE">Bébé</option>
                      </select>
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="datetime-local"
                        value={newLine.dateHeureDepart}
                        onChange={(e) => updateNewLineField('dateHeureDepart', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="datetime-local"
                        value={newLine.dateHeureArrive}
                        onChange={(e) => updateNewLineField('dateHeureArrive', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={newLine.dureeVol}
                        onChange={(e) => updateNewLineField('dureeVol', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm"
                        placeholder="12h00"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={newLine.dureeEscale}
                        onChange={(e) => updateNewLineField('dureeEscale', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm"
                        placeholder="2h00"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.puBilletCompagnieDevise}
                        onChange={(e) => updateNewLineField('puBilletCompagnieDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.puServiceCompagnieDevise}
                        onChange={(e) => updateNewLineField('puServiceCompagnieDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.puPenaliteCompagnieDevise}
                        onChange={(e) => updateNewLineField('puPenaliteCompagnieDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <select
                        value={newLine.devise}
                        onChange={(e) => updateNewLineField('devise', e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm bg-white"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="MGA">MGA</option>
                      </select>
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="1"
                        value={newLine.tauxEchange}
                        onChange={(e) => updateNewLineField('tauxEchange', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.montantBilletCompagnieDevise}
                        onChange={(e) => updateNewLineField('montantBilletCompagnieDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right font-medium"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.montantServiceCompagnieDevise}
                        onChange={(e) => updateNewLineField('montantServiceCompagnieDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right font-medium"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.montantPenaliteCompagnieDevise}
                        onChange={(e) => updateNewLineField('montantPenaliteCompagnieDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right font-medium"
                      />
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.montantBilletClientDevise}
                        onChange={(e) => updateNewLineField('montantBilletClientDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right font-medium text-emerald-700"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.montantServiceClientDevise}
                        onChange={(e) => updateNewLineField('montantServiceClientDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right font-medium text-indigo-700"
                      />
                    </td>

                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={newLine.montantPenaliteClientDevise}
                        onChange={(e) => updateNewLineField('montantPenaliteClientDevise', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-300 rounded text-sm text-right font-medium text-indigo-700"
                      />
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-3">
                      -
                    </td>

                    <td className="px-6 py-4">
                      {servicesDisponibles.length === 0 ? (
                        <div className="text-amber-600 py-2">Aucun service disponible</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          {servicesDisponibles.map((svc, idx) => {
                            const current = newLine.serviceValues[idx];
                            // Détection simple booléen (à affiner selon tes règles)
                            const isBoolean =
                              svc.type === 'SERVICE' &&
                              !svc.libelle.toLowerCase().includes('bagage') &&
                              !svc.libelle.toLowerCase().includes('supplément');

                            return (
                              <div key={svc.id} className="flex flex-col gap-1 p-2 bg-white/60 rounded">
                                <label className="text-xs font-medium text-slate-700">
                                  {svc.libelle} <span className="text-slate-400">({svc.code})</span>
                                </label>
                                {isBoolean ? (
                                  <label className="inline-flex items-center mt-1">
                                    <input
                                      type="checkbox"
                                      checked={current.valeur === 'true'}
                                      onChange={(e) => updateServiceValue(idx, e.target.checked ? 'true' : 'false')}
                                      className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-slate-700">Activé</span>
                                  </label>
                                ) : (
                                  <input
                                    type="text"
                                    value={current.valeur}
                                    onChange={(e) => updateServiceValue(idx, e.target.value)}
                                    placeholder={svc.libelle.includes('Bagage') ? 'ex: 23Kg' : 'valeur'}
                                    className="mt-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-indigo-400 focus:border-indigo-400"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handleSaveNewLine}
                          disabled={newLine.isSaving}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Enregistrer cette ligne"
                        >
                          Enregistrer
                        </button>

                        <button
                          onClick={handleCancelNewLine}
                          disabled={newLine.isSaving}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Annuler"
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}