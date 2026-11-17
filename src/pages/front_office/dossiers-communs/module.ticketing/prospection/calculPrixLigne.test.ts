import { describe, expect, it } from 'vitest';
import { calculerPrixLigne } from './calculPrixLigne';

const base = {
  nombre: 1, tauxEchange: 5100, commissionPct: 70,
  puBilletCieDevise: 320, puServiceCieDevise: 50, puPenaliteCieDevise: 0,
  modeSaisieTaxe: 'POURCENTAGE', tauxTaxe: 10,
};

describe('calculerPrixLigne', () => {
  it('applique commission + taxe sur billet et service (cas DOSTIC_16_1_1)', () => {
    const r = calculerPrixLigne(base);
    expect(r.mtBilletClientDevise).toBeCloseTo(576);
    expect(r.mtServiceClientDevise).toBeCloseTo(90);
    expect(r.mtBilletClientAriary).toBeCloseTo(2_937_600);
    expect(r.mtServiceClientAriary).toBeCloseTo(459_000);
    expect(r.montantTaxeDevise).toBeCloseTo(37);
    expect(r.montantTaxeAriary).toBeCloseTo(188_700);
    expect(r.commissionEnDevise).toBeCloseTo(259);
    expect(r.commissionEnAriary).toBeCloseTo(1_320_900);
  });

  it('commission sur le prix compagnie, jamais sur le prix client (cas 60 %)', () => {
    const r = calculerPrixLigne({ ...base, commissionPct: 60, tauxTaxe: 0, puBilletCieDevise: 1400, puServiceCieDevise: 200 });
    expect(r.mtBilletClientDevise).toBeCloseTo(2240);
    expect(r.mtServiceClientDevise).toBeCloseTo(320);
    expect(r.commissionEnDevise).toBeCloseTo(960);
    expect(r.commissionEnAriary).toBeCloseTo(4_896_000);
  });

  it('multiplie tout par le nombre, taxe comprise', () => {
    const r = calculerPrixLigne({ ...base, nombre: 2 });
    expect(r.mtBilletClientDevise).toBeCloseTo(1152);
    expect(r.mtServiceClientDevise).toBeCloseTo(180);
    expect(r.montantTaxeDevise).toBeCloseTo(74);
    expect(r.commissionEnDevise).toBeCloseTo(518);
  });

  it('pas de taxe sur la pénalité', () => {
    const r = calculerPrixLigne({ ...base, puPenaliteCieDevise: 100 });
    expect(r.mtPenaliteClientDevise).toBeCloseTo(170);
    expect(r.montantTaxeDevise).toBeCloseTo(37);
    expect(r.commissionEnDevise).toBeCloseTo(329);
  });

  it('mode « Saisir prix » : le montant pour 1 billet donne le taux', () => {
    const r = calculerPrixLigne({ ...base, modeSaisieTaxe: 'MONTANT', tauxTaxe: 0, montantTaxeBilletUnitaireDevise: 32 });
    expect(r.tauxTaxe).toBeCloseTo(10);
    expect(r.mtServiceClientDevise).toBeCloseTo(90);
  });
});
