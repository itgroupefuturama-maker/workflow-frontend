// src/components/modals/ItineraireModal.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchPays } from '../../app/front_office/parametre_ticketing/paysSlice';
import {
  createItineraire,
  updateItineraire,
  fetchVillesByPays,
  type Itineraire,
} from '../../app/front_office/parametre_ticketing/itineraireSlice';
import Button from '../ui/Button';

const useAppDispatch = () => useDispatch<AppDispatch>();

interface ItineraireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingItineraire: Itineraire | null;
}

export default function ItineraireModal({ isOpen, onClose, onSaved, editingItineraire }: ItineraireModalProps) {
  const dispatch = useAppDispatch();
  const isEdit = !!editingItineraire;

  const { items: paysList, loading: paysLoading } = useSelector((state: RootState) => state.pays);
  const { villesByPaysId, villesLoading, creating, updating, error: reduxError } = useSelector(
    (state: RootState) => state.itineraire
  );

  const [paysDepartId, setPaysDepartId] = useState('');
  const [villeDepartId, setVilleDepartId] = useState('');
  const [paysArriveeId, setPaysArriveeId] = useState('');
  const [villeArriveeId, setVilleArriveeId] = useState('');
  const [libelle, setLibelle] = useState('');
  const [statut, setStatut] = useState<'ACTIF' | 'INACTIF'>('ACTIF');
  const [localError, setLocalError] = useState<string | null>(null);

  const saving = creating || updating;

  // Pays chargés une fois à l'ouverture si besoin
  useEffect(() => {
    if (isOpen && paysList.length === 0 && !paysLoading) {
      dispatch(fetchPays());
    }
  }, [isOpen, paysList.length, paysLoading, dispatch]);

  // Pré-remplissage en édition (et chargement des villes des 2 pays concernés)
  useEffect(() => {
    if (!isOpen) return;
    setLocalError(null);

    if (editingItineraire) {
      setPaysDepartId(editingItineraire.paysDepartId);
      setVilleDepartId(editingItineraire.villeDepartId);
      setPaysArriveeId(editingItineraire.paysArriveeId);
      setVilleArriveeId(editingItineraire.villeArriveeId);
      setLibelle(editingItineraire.libelle);
      setStatut(editingItineraire.statut);
      if (!villesByPaysId[editingItineraire.paysDepartId]) {
        dispatch(fetchVillesByPays(editingItineraire.paysDepartId));
      }
      if (!villesByPaysId[editingItineraire.paysArriveeId]) {
        dispatch(fetchVillesByPays(editingItineraire.paysArriveeId));
      }
    } else {
      setPaysDepartId('');
      setVilleDepartId('');
      setPaysArriveeId('');
      setVilleArriveeId('');
      setLibelle('');
      setStatut('ACTIF');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingItineraire]);

  const villesDepart = useMemo(() => villesByPaysId[paysDepartId] ?? [], [villesByPaysId, paysDepartId]);
  const villesArrivee = useMemo(() => villesByPaysId[paysArriveeId] ?? [], [villesByPaysId, paysArriveeId]);

  const handlePaysDepartChange = (value: string) => {
    setPaysDepartId(value);
    setVilleDepartId('');
    setLocalError(null);
    if (value && !villesByPaysId[value]) dispatch(fetchVillesByPays(value));
  };

  const handlePaysArriveeChange = (value: string) => {
    setPaysArriveeId(value);
    setVilleArriveeId('');
    setLocalError(null);
    if (value && !villesByPaysId[value]) dispatch(fetchVillesByPays(value));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!villeDepartId || !villeArriveeId) {
      setLocalError('Veuillez sélectionner une ville de départ et une ville d\'arrivée.');
      return;
    }
    if (villeDepartId === villeArriveeId) {
      setLocalError('Le départ et l\'arrivée doivent être différents.');
      return;
    }

    const payload = {
      villeDepartId,
      villeArriveeId,
      libelle: libelle.trim() || undefined,
      statut,
    };

    const resultAction = isEdit
      ? await dispatch(updateItineraire({ id: editingItineraire!.id, ...payload }))
      : await dispatch(createItineraire(payload));

    const succeeded = isEdit
      ? updateItineraire.fulfilled.match(resultAction)
      : createItineraire.fulfilled.match(resultAction);

    if (succeeded) {
      onSaved();
      onClose();
    } else {
      setLocalError((resultAction as any).payload as string);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-1">{isEdit ? "Modifier l'itinéraire" : 'Nouvel itinéraire'}</h2>
        {isEdit && (
          <p className="text-xs text-slate-400 mb-5">
            Changer les villes est refusé si cet itinéraire est déjà utilisé par une ligne — il faudra le
            désactiver et en créer un nouveau.
          </p>
        )}
        {!isEdit && <div className="mb-5" />}

        {(localError || reduxError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {localError || reduxError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pays de départ *</label>
              <select
                value={paysDepartId}
                onChange={(e) => handlePaysDepartChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Sélectionner --</option>
                {paysList.map((p) => (
                  <option key={p.id} value={p.id}>{p.pays}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville de départ *</label>
              <select
                value={villeDepartId}
                onChange={(e) => { setVilleDepartId(e.target.value); setLocalError(null); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!paysDepartId}
                required
              >
                <option value="">
                  {!paysDepartId ? 'Choisir un pays d\'abord' : villesLoading ? 'Chargement...' : '-- Sélectionner --'}
                </option>
                {villesDepart.map((v) => (
                  <option key={v.id} value={v.id}>{v.ville}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pays d'arrivée *</label>
              <select
                value={paysArriveeId}
                onChange={(e) => handlePaysArriveeChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Sélectionner --</option>
                {paysList.map((p) => (
                  <option key={p.id} value={p.id}>{p.pays}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville d'arrivée *</label>
              <select
                value={villeArriveeId}
                onChange={(e) => { setVilleArriveeId(e.target.value); setLocalError(null); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!paysArriveeId}
                required
              >
                <option value="">
                  {!paysArriveeId ? 'Choisir un pays d\'abord' : villesLoading ? 'Chargement...' : '-- Sélectionner --'}
                </option>
                {villesArrivee.map((v) => (
                  <option key={v.id} value={v.id}>{v.ville}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Libellé <span className="text-slate-400 font-normal">(facultatif — auto-généré sinon)</span>
            </label>
            <input
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="ex: Antananarivo - Paris"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as 'ACTIF' | 'INACTIF')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
