// lib/generators/attestation.generator.ts

import jsPDF from 'jspdf';
import type { PdfDesign } from '../types/pdf-design.types';
import type {
  AttestationEnteteItem,
  AttestationLigne,
  AttestationPassager,
  AttestationPdfSelection,
  AttestationPdfMode,
  ClientBeneficiaireInfo,
} from '../types/attestation.types';
import {
  Cursor,
  drawHeader,
  drawFooter,
  drawSectionTitle,
  drawSeparator,
  drawKeyValues,
  drawTable,
  drawWatermark,
  fmt,
} from '../lib/pdf-base';

export const generateAttestationPdf = (
  data: AttestationEnteteItem[],
  selection: AttestationPdfSelection[],
  mode: AttestationPdfMode,
  design: PdfDesign,
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cursor = new Cursor();

  drawWatermark(doc, design);
  drawHeader(doc, cursor, 'ATTESTATION DE VOYAGE', design, logo);

  // Filtrer entêtes + lignes selon la sélection
  const selectedEntetes = data
    .filter((e) => selection.some((s) => s.enteteId === e.id))
    .map((e) => {
      const sel = selection.find((s) => s.enteteId === e.id)!;
      return {
        ...e,
        attestationLigne: e.attestationLigne.filter((l) =>
          sel.ligneIds.includes(l.id)
        ),
      };
    })
    .filter((e) => e.attestationLigne.length > 0);

  if (mode === 'par_entete') {
    _renderParEntete(doc, cursor, design, selectedEntetes);
  } else {
    _renderParPassager(doc, cursor, design, selectedEntetes);
  }

  // ── Total ────────────────────────────────────────────────────────
  const total = selectedEntetes.reduce((sum, e) =>
    sum + e.puAriary * e.attestationLigne.length, 0
  );

  drawFooter(
    doc, cursor,
    'TOTAL ATTESTATION :',
    fmt.ariary(total),
    `Généré le ${fmt.date(new Date().toISOString())}`,
    design,
    stamp
  );

  if (options?.returnDoc) return doc;
  doc.save(filename ?? `attestation-voyage.pdf`);
};

// ─────────────────────────────────────────────────────────────────────
// MODE 1 — Par entête : ATT-1 → lignes → passagers
// ─────────────────────────────────────────────────────────────────────

function _renderParEntete(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  entetes: AttestationEnteteItem[]
): void {
  entetes.forEach((entete, index) => {
    if (index > 0) drawSeparator(doc, cursor);

    drawSectionTitle(doc, cursor, `Entête ${entete.numeroEntete}`, design);

    drawKeyValues(doc, cursor, [
      { label: 'N° Entête',     value: entete.numeroEntete },
      { label: 'Dossier',       value: entete.prestation.numeroDos },
      { label: 'Fournisseur',   value: `${entete.fournisseur.libelle} (${entete.fournisseur.code})` },
      { label: 'Prix unitaire', value: fmt.ariary(entete.puAriary) },
      { label: 'Commission',    value: fmt.ariary(entete.totalCommission) },
      { label: 'Date création', value: fmt.date(entete.createdAt) },
    ]);

    entete.attestationLigne.forEach((ligne) => {
      _drawLigneBlock(doc, cursor, design, ligne, entete.puAriary);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────
// MODE 2 — Par passager : Kol Tsiory → toutes ses lignes
// ─────────────────────────────────────────────────────────────────────

function _renderParPassager(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  entetes: AttestationEnteteItem[]
): void {
  // Regrouper toutes les lignes par clientbeneficiaireInfo.id
  type LigneAvecContexte = {
    ligne: AttestationLigne;
    enteteNumero: string;
    puAriary: number;
    passager: AttestationPassager;
  };

  const parPassager = new Map<string, {
    info: ClientBeneficiaireInfo;
    lignes: LigneAvecContexte[];
  }>();

  entetes.forEach((entete) => {
    entete.attestationLigne.forEach((ligne) => {
      ligne.attestationPassager.forEach((passager) => {
        const clientId = passager.clientbeneficiaireInfo.id;
        if (!parPassager.has(clientId)) {
          parPassager.set(clientId, {
            info: passager.clientbeneficiaireInfo,
            lignes: [],
          });
        }
        parPassager.get(clientId)!.lignes.push({
          ligne,
          enteteNumero: entete.numeroEntete,
          puAriary: entete.puAriary,
          passager,
        });
      });
    });
  });

  let isFirst = true;
  parPassager.forEach(({ info, lignes }) => {
    if (!isFirst) drawSeparator(doc, cursor);
    isFirst = false;

    // ── Bloc passager ────────────────────────────────────────────
    drawSectionTitle(
      doc, cursor,
      `${info.nom} ${info.prenom}`,
      design
    );

    drawKeyValues(doc, cursor, [
      { label: 'Nationalité',       value: info.nationalite },
      { label: 'Type document',     value: fmt.replace_(info.typeDoc) },
      { label: 'N° document',       value: info.referenceDoc },
      { label: 'Date délivrance',   value: fmt.date(info.dateDelivranceDoc) },
      { label: 'Date validité',     value: fmt.date(info.dateValiditeDoc) },
      { label: 'Téléphone',         value: info.tel },
    ]);

    // ── Tableau récap des attestations de ce passager ────────────
    drawSectionTitle(doc, cursor, 'Attestations', design);
    drawTable(doc, cursor, design,
      [
        { label: 'Entête',      width: 18 },
        { label: 'Réf.',        width: 22 },
        { label: 'N° Vol',      width: 22 },
        { label: 'Itinéraire',  width: 46 },
        { label: 'Classe',      width: 18 },
        { label: 'Départ',      width: 22 },
        { label: 'Arrivée',     width: 22 },
      ],
      lignes.map(({ ligne, enteteNumero }) => [
        enteteNumero,
        ligne.numeroDosRef,
        ligne.numeroVol,
        ligne.itineraire,
        fmt.replace_(ligne.classe),
        fmt.date(ligne.dateHeureDepart),
        fmt.date(ligne.dateHeureArrive),
      ])
    );

    // Total pour ce passager
    const totalPassager = lignes.reduce((sum, { puAriary }) => sum + puAriary, 0);
    drawKeyValues(doc, cursor, [
      { label: 'Nb attestations', value: String(lignes.length) },
      { label: 'Total',           value: fmt.ariary(totalPassager) },
    ]);
  });
}

// ─────────────────────────────────────────────────────────────────────
// Bloc ligne + passagers (mode par_entete)
// ─────────────────────────────────────────────────────────────────────

function _drawLigneBlock(
  doc: jsPDF,
  cursor: Cursor,
  design: PdfDesign,
  ligne: AttestationLigne,
  puAriary: number
): void {
  drawSectionTitle(
    doc, cursor,
    `${ligne.numeroDosRef}  —  ${ligne.numeroVol}`,
    design
  );

  drawKeyValues(doc, cursor, [
    { label: 'Itinéraire',    value: ligne.itineraire },
    { label: 'Avion',         value: ligne.avion },
    { label: 'Classe',        value: fmt.replace_(ligne.classe) },
    { label: 'Type passager', value: fmt.replace_(ligne.typePassager) },
    { label: 'Départ',        value: fmt.datetime(ligne.dateHeureDepart) },
    { label: 'Arrivée',       value: fmt.datetime(ligne.dateHeureArrive) },
    { label: 'Durée vol',     value: ligne.dureeVol },
    { label: 'Durée escale',  value: ligne.dureeEscale },
    { label: 'N° réservation',value: ligne.numeroReservation },
    { label: 'Prix unitaire', value: fmt.ariary(puAriary) },
  ]);

  // Passagers de cette ligne
  if (ligne.attestationPassager.length > 0) {
    drawTable(doc, cursor, design,
      [
        { label: 'Nom',          width: 28 },
        { label: 'Prénom',       width: 28 },
        { label: 'Nationalité',  width: 26 },
        { label: 'Type doc',     width: 22 },
        { label: 'N° doc',       width: 24 },
        { label: 'Délivrance',   width: 22 },
        { label: 'Validité',     width: 20 },
      ],
      ligne.attestationPassager.map((p) => {
        const c = p.clientbeneficiaireInfo;
        return [
          c.nom,
          c.prenom,
          c.nationalite,
          fmt.replace_(c.typeDoc),
          c.referenceDoc,
          fmt.date(c.dateDelivranceDoc),
          fmt.date(c.dateValiditeDoc),
        ];
      })
    );
  }
}