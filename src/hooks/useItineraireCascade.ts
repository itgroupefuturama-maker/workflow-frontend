import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../service/Axios';

export interface PaysOption {
  id: string;
  pays: string;
}

export interface VilleOption {
  id: string;
  code: string;
  ville: string;
  pays?: PaysOption;
}

export interface ItineraireOption {
  id: string;
  libelle: string;
  villeArriveeId: string;
  villeArrivee: VilleOption;
}

interface ItineraireVoyageIds {
  paysDepartId: string;
  villeDepartId: string;
  paysArriveeId: string;
  villeArriveeId: string;
}

// Cascade de saisie Pays départ → Ville départ → Pays arrivée → Ville arrivée (voir
// FRONTEND_PROMPT_ITINERAIRE.md). Chaque étape ne propose que ce qui mène à au moins un
// itinéraire ACTIF — l'utilisateur ne peut donc pas tomber sur une combinaison inexistante.
export function useItineraireCascade() {
  const [paysDepartOptions, setPaysDepartOptions] = useState<PaysOption[]>([]);
  const [villeDepartOptions, setVilleDepartOptions] = useState<VilleOption[]>([]);
  const [paysArriveeOptions, setPaysArriveeOptions] = useState<PaysOption[]>([]);
  const [villeArriveeOptions, setVilleArriveeOptions] = useState<ItineraireOption[]>([]);

  const [paysDepartId, setPaysDepartIdState] = useState('');
  const [villeDepartId, setVilleDepartIdState] = useState('');
  const [paysArriveeId, setPaysArriveeIdState] = useState('');
  const [itineraireId, setItineraireIdState] = useState('');

  const [loading, setLoading] = useState({
    paysDepart: false,
    villeDepart: false,
    paysArrivee: false,
    villeArrivee: false,
  });
  const setLoadingKey = (key: keyof typeof loading, value: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: value }));

  const loadPaysDepart = useCallback(async () => {
    setLoadingKey('paysDepart', true);
    try {
      const res = await axios.get('/itineraire/options/pays-depart');
      setPaysDepartOptions(res.data?.data ?? []);
    } finally {
      setLoadingKey('paysDepart', false);
    }
  }, []);

  // Chargé une fois au montage — identique pour toute la session.
  useEffect(() => {
    loadPaysDepart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVillesDepart = useCallback(async (forPaysId: string) => {
    setLoadingKey('villeDepart', true);
    try {
      const res = await axios.get('/itineraire/options/villes-depart', { params: { paysId: forPaysId } });
      const villes: VilleOption[] = res.data?.data ?? [];
      setVilleDepartOptions(villes);
      return villes;
    } finally {
      setLoadingKey('villeDepart', false);
    }
  }, []);

  const loadPaysArrivee = useCallback(async (forVilleDepartId: string) => {
    setLoadingKey('paysArrivee', true);
    try {
      const res = await axios.get('/itineraire/options/pays-arrivee', { params: { villeDepartId: forVilleDepartId } });
      const pays: PaysOption[] = res.data?.data ?? [];
      setPaysArriveeOptions(pays);
      return pays;
    } finally {
      setLoadingKey('paysArrivee', false);
    }
  }, []);

  const loadVillesArrivee = useCallback(async (forVilleDepartId: string, forPaysArriveeId: string) => {
    setLoadingKey('villeArrivee', true);
    try {
      const res = await axios.get('/itineraire/options/villes-arrivee', {
        params: { villeDepartId: forVilleDepartId, paysArriveeId: forPaysArriveeId },
      });
      const itineraires: ItineraireOption[] = res.data?.data ?? [];
      setVilleArriveeOptions(itineraires);
      return itineraires;
    } finally {
      setLoadingKey('villeArrivee', false);
    }
  }, []);

  const selectPaysDepart = useCallback((value: string) => {
    setPaysDepartIdState(value);
    setVilleDepartIdState('');
    setPaysArriveeIdState('');
    setItineraireIdState('');
    setVilleDepartOptions([]);
    setPaysArriveeOptions([]);
    setVilleArriveeOptions([]);
    if (value) loadVillesDepart(value);
  }, [loadVillesDepart]);

  const selectVilleDepart = useCallback((value: string) => {
    setVilleDepartIdState(value);
    setPaysArriveeIdState('');
    setItineraireIdState('');
    setPaysArriveeOptions([]);
    setVilleArriveeOptions([]);
    if (value) loadPaysArrivee(value);
  }, [loadPaysArrivee]);

  const selectPaysArrivee = useCallback((value: string) => {
    setPaysArriveeIdState(value);
    setItineraireIdState('');
    setVilleArriveeOptions([]);
    if (value && villeDepartId) loadVillesArrivee(villeDepartId, value);
  }, [villeDepartId, loadVillesArrivee]);

  const selectItineraire = useCallback((value: string) => {
    setItineraireIdState(value);
  }, []);

  const reset = useCallback(() => {
    setPaysDepartIdState('');
    setVilleDepartIdState('');
    setPaysArriveeIdState('');
    setItineraireIdState('');
    setVilleDepartOptions([]);
    setPaysArriveeOptions([]);
    setVilleArriveeOptions([]);
  }, []);

  // Pré-remplissage quand on connaît déjà les 4 ids (édition future via ligne.itineraireVoyage).
  const presetFromItineraireVoyage = useCallback(async (ids: ItineraireVoyageIds) => {
    setPaysDepartIdState(ids.paysDepartId);
    setVilleDepartIdState(ids.villeDepartId);
    setPaysArriveeIdState(ids.paysArriveeId);
    const [, , itineraires] = await Promise.all([
      loadVillesDepart(ids.paysDepartId),
      loadPaysArrivee(ids.villeDepartId),
      loadVillesArrivee(ids.villeDepartId, ids.paysArriveeId),
    ]);
    const match = itineraires.find((it) => it.villeArriveeId === ids.villeArriveeId);
    setItineraireIdState(match?.id ?? '');
  }, [loadVillesDepart, loadPaysArrivee, loadVillesArrivee]);

  // Pré-remplissage depuis une suggestion de recherche (on ne connaît que departId/destinationId,
  // pas les pays) : résout l'itinéraire complet via /itineraire/lookup puis délègue au preset ci-dessus.
  const presetFromIds = useCallback(async (forVilleDepartId: string, forVilleArriveeId: string) => {
    if (!forVilleDepartId || !forVilleArriveeId) return;
    try {
      const res = await axios.get('/itineraire/lookup', {
        params: { villeDepartId: forVilleDepartId, villeArriveeId: forVilleArriveeId },
      });
      const found = res.data?.data;
      if (found) {
        await presetFromItineraireVoyage({
          paysDepartId: found.paysDepartId,
          villeDepartId: found.villeDepartId,
          paysArriveeId: found.paysArriveeId,
          villeArriveeId: found.villeArriveeId,
        });
      }
    } catch {
      // 404 : aucun itinéraire actif pour cette combinaison — cascade laissée vide,
      // l'utilisateur la refera manuellement.
    }
  }, [presetFromItineraireVoyage]);

  const selectedItineraire = useMemo(
    () => villeArriveeOptions.find((it) => it.id === itineraireId) ?? null,
    [villeArriveeOptions, itineraireId]
  );

  return {
    paysDepartOptions, villeDepartOptions, paysArriveeOptions, villeArriveeOptions,
    paysDepartId, villeDepartId, paysArriveeId, itineraireId, selectedItineraire,
    loading,
    selectPaysDepart, selectVilleDepart, selectPaysArrivee, selectItineraire,
    presetFromItineraireVoyage, presetFromIds,
    reset,
  };
}

export type ItineraireCascade = ReturnType<typeof useItineraireCascade>;
