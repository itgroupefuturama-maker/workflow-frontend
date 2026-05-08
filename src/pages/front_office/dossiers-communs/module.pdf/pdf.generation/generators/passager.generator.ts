import jsPDF from 'jspdf';
import type { PdfDesign } from '../types/pdf-design.types';
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
  makeLayout,
} from '../lib/pdf-base';
import type { Passager } from '../../../../../../app/front_office/parametre_liste_passager/passagerListeSlice';

export interface PassagerPdfFilters {
  startDate: string;
  endDate: string;
  nom?: string;
  pnr?: string;
  owner?: string;
  numeroVol?: string;
  typeVol?: string;
  status?: string;
  villeDepart?: string;
  villeArrivee?: string;
}

export const generatePassagerPdf = (
  passagers: Passager[],
  filters: PassagerPdfFilters,
  design: PdfDesign,
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean }
): jsPDF | void => {
  const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const cursor = new Cursor();
  const layout = makeLayout('landscape'); // ← layout paysage

  drawWatermark(doc, design, layout);
  drawHeader(doc, cursor, 'LISTE DES PASSAGERS', design, logo, layout);

  drawSectionTitle(doc, cursor, 'PARAMÈTRES DE LA LISTE', design, layout);

  const filterPairs: { label: string; value: string }[] = [
    { label: 'Période',   value: `${filters.startDate} → ${filters.endDate}` },
    { label: 'Résultats', value: `${passagers.length} passager(s)` },
  ];
  if (filters.nom)         filterPairs.push({ label: 'Passager',       value: filters.nom });
  if (filters.pnr)         filterPairs.push({ label: 'PNR',            value: filters.pnr });
  if (filters.owner)       filterPairs.push({ label: 'Owner',          value: filters.owner });
  if (filters.numeroVol)   filterPairs.push({ label: 'N° Vol',         value: filters.numeroVol });
  if (filters.typeVol)     filterPairs.push({ label: 'Type vol',       value: filters.typeVol });
  if (filters.status)      filterPairs.push({ label: 'Statut',         value: filters.status });
  if (filters.villeDepart)   filterPairs.push({ label: 'Ville départ',  value: filters.villeDepart });
  if (filters.villeArrivee)  filterPairs.push({ label: 'Ville arrivée', value: filters.villeArrivee });

  drawKeyValues(doc, cursor, filterPairs, layout);
  drawSeparator(doc, cursor, layout);
  drawSectionTitle(doc, cursor, 'PASSAGERS', design, layout);

  if (passagers.length === 0) {
    drawKeyValues(doc, cursor, [
      { label: 'Résultat', value: 'Aucun passager trouvé pour ces critères.' },
    ], layout);
  } else {
    drawTable(doc, cursor, design,
      [
        { label: 'Date départ',  width: 24 },
        { label: 'H. départ',    width: 18 },
        { label: 'H. arrivée',   width: 18 },
        { label: 'Passager',     width: 38 },
        { label: 'PNR',          width: 24 },
        { label: 'Owner',        width: 24 },
        { label: 'N° Vol',       width: 22 },
        { label: 'Itinéraire',   width: 56 },
        { label: 'Type',         width: 20 },
        { label: 'Statut',       width: 17, align: 'right' },
      ],
      passagers.map((p) => [
        new Date(p.dateDepart).toLocaleDateString('fr-FR'),
        p.heureDepart ?? '—',
        p.heureArrive ?? '—',
        p.nom         ?? '—',
        p.pnr         ?? '—',
        p.owner       ?? '—',
        p.numeroVol   ?? '—',
        p.itineraire  ?? '—',
        p.typeVol     ?? '—',
        p.status      ?? '—',
      ]),
      layout  // ← passer le layout
    );
  }

  drawFooter(
    doc, cursor,
    'TOTAL PASSAGERS :',
    String(passagers.length),
    `Exporté le ${fmt.date(new Date().toISOString())} — Période : ${filters.startDate} → ${filters.endDate}`,
    design,
    stamp,
    layout  // ← passer le layout
  );

  if (options?.returnDoc) return doc;
  doc.save(filename ?? `liste-passagers-${filters.startDate}-${filters.endDate}.pdf`);
};