// src/pages/front_office/dossiers-communs/module.ticketing/prospection/vuesPrix.ts
//
// Choix des prix affichés sur la page « Détail de la prospection »
// (Prospection / Résa / Émission, sélection libre) + chargement des lignes billet
// liées à chaque ligne de prospection (pour afficher les prix de résa et d'émission).

import { useEffect, useMemo, useState } from 'react';
import axios from '../../../../../service/Axios';
import type { BilletLigne } from '../../../../../app/front_office/billetSlice';
import type { ProspectionLigne } from '../../../../../app/front_office/prospectionsLignesSlice';
import { estLigneFrais, estTerminee } from '../ticketing.sous.module/components.billet/utils/billetStatuts';

// ─── Vues de prix ─────────────────────────────────────────────

export type VuePrix = 'PROSPECTION' | 'RESA' | 'EMISSION';

export const VUES_PRIX: { id: VuePrix; label: string }[] = [
  { id: 'PROSPECTION', label: 'Prospection' },
  { id: 'RESA', label: 'Résa' },
  { id: 'EMISSION', label: 'Émission' },
];

const lireVues = (cle: string, parDefaut: VuePrix[]): VuePrix[] => {
  try {
    const brut = JSON.parse(localStorage.getItem(cle) || 'null');
    if (Array.isArray(brut)) {
      const valides = brut.filter((v): v is VuePrix => VUES_PRIX.some((x) => x.id === v));
      if (valides.length) return valides;
    }
  } catch { /* stockage indisponible : on garde la valeur par défaut */ }
  return parDefaut;
};

/**
 * Vues sélectionnées (au moins une), mémorisées dans le navigateur de l'agent.
 * `cle` sépare le choix de chaque écran (prospection, billet).
 */
export function useVuesPrix(cle = 'prospection.vuesPrix', parDefaut: VuePrix[] = ['PROSPECTION']) {
  const [vues, setVuesState] = useState<VuePrix[]>(() => lireVues(cle, parDefaut));

  const setVues = (next: VuePrix[]) => {
    const propre = next.length ? next : parDefaut;
    setVuesState(propre);
    try { localStorage.setItem(cle, JSON.stringify(propre)); } catch { /* ignore */ }
  };

  const afficher = useMemo(
    () => ({
      PROSPECTION: vues.includes('PROSPECTION'),
      RESA: vues.includes('RESA'),
      EMISSION: vues.includes('EMISSION'),
    }),
    [vues]
  );

  return { vues, setVues, afficher };
}

// ─── Lignes billet par ligne de prospection ──────────────────

export interface BilletLigneLiee {
  /** Ligne billet « courante » (active, la plus récente) */
  principale: BilletLigne;
  /** Toutes les lignes billet issues de cette ligne de prospection (reprogrammations, frais…) */
  toutes: BilletLigne[];
}

const date = (l: BilletLigne) => new Date(l.updatedAt || l.createdAt || 0).getTime();

/** Regroupe les lignes billet par prospectionLigneId et choisit la ligne courante. */
export function indexerParProspectionLigne(lignes: BilletLigne[]): Map<string, BilletLigneLiee> {
  const groupes = new Map<string, BilletLigne[]>();
  for (const l of lignes) {
    if (!l?.prospectionLigneId) continue;
    const g = groupes.get(l.prospectionLigneId) ?? [];
    g.push(l);
    groupes.set(l.prospectionLigneId, g);
  }

  const res = new Map<string, BilletLigneLiee>();
  groupes.forEach((toutes, id) => {
    const triees = [...toutes].sort((a, b) => date(b) - date(a));
    // Priorité : ligne active (ni annulée/remplacée, ni ligne de frais), sinon la plus récente
    const principale = triees.find((l) => !estTerminee(l) && !estLigneFrais(l)) ?? triees[0];
    res.set(id, { principale, toutes: triees });
  });
  return res;
}

/** La ligne a-t-elle été réservée ? */
export const aResa = (b?: BilletLigne | null) =>
  !!b && (!!b.reservation || (b.statut !== 'CREER' && Number(b.resaTauxEchange) > 0));

/** La ligne a-t-elle été émise (prix d'émission saisis) ? */
export const aEmission = (b?: BilletLigne | null) => !!b && Number(b.emissionTauxChange) > 0;

/**
 * Charge les lignes billet liées aux lignes de prospection affichées.
 *
 * Aujourd'hui GET /prospections/entetes/:id ne renvoie pas les lignes billet : on appelle donc
 * GET /billet/entete/:devisId/devis pour chaque devis transformé en billet.
 * Quand le backend inclura `billetEntete[].billetLigne` (voir BACKEND_DONNEES_MANQUANTES.md),
 * passer ces lignes via `lignesDejaChargees` : aucun appel supplémentaire ne sera fait.
 */
export function useBilletLignesParProspection(
  lignes: ProspectionLigne[],
  options: { actif?: boolean; lignesDejaChargees?: BilletLigne[] | null } = {}
) {
  const { actif = true, lignesDejaChargees } = options;

  // Devis transformés en billet (ligne.devis.billetEnteteId) ou, à défaut, tout devis connu
  const devisIds = useMemo(() => {
    const ids = new Set<string>();
    for (const l of lignes ?? []) {
      const devis: any = (l as any).devis;
      if (!l.devisId) continue;
      if (devis && !devis.billetEnteteId) continue; // devis pas encore transformé en billet
      ids.add(l.devisId);
    }
    return [...ids].sort();
  }, [lignes]);
  const cle = devisIds.join('|');

  const [etat, setEtat] = useState<{
    parLigne: Map<string, BilletLigneLiee>;
    loading: boolean;
    error: string | null;
  }>({ parLigne: new Map(), loading: false, error: null });

  useEffect(() => {
    if (lignesDejaChargees) {
      setEtat({ parLigne: indexerParProspectionLigne(lignesDejaChargees), loading: false, error: null });
      return;
    }
    if (!actif || devisIds.length === 0) {
      setEtat({ parLigne: new Map(), loading: false, error: null });
      return;
    }

    let annule = false;
    setEtat((s) => ({ ...s, loading: true, error: null }));

    Promise.allSettled(devisIds.map((id) => axios.get(`/billet/entete/${id}/devis`))).then((resultats) => {
      if (annule) return;
      const toutes: BilletLigne[] = [];
      let erreur: string | null = null;

      resultats.forEach((r) => {
        if (r.status === 'fulfilled') {
          const d = r.value.data?.data ?? r.value.data;
          if (Array.isArray(d?.billetLigne)) toutes.push(...d.billetLigne);
        } else {
          // 404 = devis pas (encore) transformé en billet : ce n'est pas une erreur
          const status = (r.reason as any)?.response?.status;
          if (status !== 404) erreur = "Les prix de résa / d'émission n'ont pas pu être chargés";
        }
      });

      setEtat({ parLigne: indexerParProspectionLigne(toutes), loading: false, error: erreur });
    });

    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, actif, lignesDejaChargees]);

  return etat;
}
