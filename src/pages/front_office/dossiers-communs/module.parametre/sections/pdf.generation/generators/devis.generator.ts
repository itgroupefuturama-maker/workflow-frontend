import jsPDF from 'jspdf';
import type { DevisListItem } from '../types/devis.types';
import type { PdfDesign } from '../types/pdf-design.types';
import type { PdfAudience } from '../types/pdf-design.types';
import {
  Cursor, checkPage, drawWatermark, drawSeparator, drawSectionTitle,
  drawHeader, drawTable, drawKeyValues, drawFooter, fmt,
  MARGIN, CONTENT_W, setColor,
} from '../lib/pdf-base';

export function generateDevisPdf(
  devis: DevisListItem,
  design: PdfDesign,
  audience: PdfAudience = 'client',   // ← nouveau paramètre
  logo?: string,
  stamp?: string,
  filename?: string,
  options?: { returnDoc?: boolean } 
) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const cur  = new Cursor();
  const ent  = devis.prospectionEntete;
  const lignes = devis.prospectionLigne?.length
    ? devis.prospectionLigne
    : devis.data?.lignes ?? [];
  const exigences = devis.data?.exigencesVoyage ?? [];
  const isDirection = audience === 'direction';

  drawWatermark(doc, design);

  // ── Titre différent selon l'audience ─────────────────────────────
  const docTitle = isDirection ? 'DEVIS — USAGE INTERNE' : 'DEVIS DE VOYAGE';
  drawHeader(doc, cur, docTitle, design, logo);

  // ── Références ────────────────────────────────────────────────────
  const baseRefs = [
    { label: 'N° Dossier',  value: ent?.numeroEntete ?? devis.data?.entete?.numeroEntete ?? '—' },
    { label: 'N° Devis',    value: devis.reference },
    { label: 'Date',        value: fmt.date(devis.createdAt) },
    { label: 'Fournisseur', value: ent?.fournisseur?.libelle ?? '—' },
    { label: 'Type vol',    value: fmt.replace_(ent?.typeVol ?? '—') },
    { label: 'Statut',      value: fmt.replace_(devis.statut) },
  ];

  // Direction : on ajoute les infos commission
  const directionRefs = [
    { label: 'Commission proposée', value: `${ent?.commissionPropose ?? '—'} %` },
    { label: 'Commission appliquée',value: `${ent?.commissionAppliquer ?? '—'} %` },
    { label: 'Mode paiement',       value: lignes[0] ? fmt.replace_(lignes[0].modePaiement ?? '—') : '—' },
  ];

  drawKeyValues(doc, cur, isDirection
    ? [...baseRefs, ...directionRefs]
    : baseRefs
  );
  drawSeparator(doc, cur);

  // ── Itinéraire ────────────────────────────────────────────────────
  if (lignes.length > 0) {
    drawSectionTitle(doc, cur, 'ITINÉRAIRE', design);
    drawTable(doc, cur, design,
      [
        { label: 'Réf.',        width: 22 },
        { label: 'Vol',         width: 18 },
        { label: 'Itinéraire',  width: 38 },
        { label: 'Avion',       width: 18 },
        { label: 'Passager',    width: 16 },
        { label: 'Date',        width: 20 },
        { label: 'Départ',      width: 12 },
        { label: 'Arrivée',     width: 12 },
        { label: 'Durée',       width: 12 },
        { label: 'Dest.',       width: 16 },
      ],
      lignes.map(l => [
        l.numeroDosRef ?? '—',
        l.numeroVol ?? '—',
        l.itineraire ?? '—',
        l.avion ?? '—',
        `${l.nombre ?? 1} ${l.typePassager ?? '—'}`,
        fmt.date(l.dateHeureDepart),
        fmt.time(l.dateHeureDepart),
        fmt.time(l.dateHeureArrive),
        l.dureeVol ?? '—',
        l.destinationVoyage?.pays?.pays ?? l.destinationVoyage?.ville ?? '—',
      ]),
    );
  }

  // ── Tarification ─────────────────────────────────────────────────
  if (lignes.length > 0) {
    if (isDirection) {
      // Direction : tableau complet avec colonnes compagnie + client + commission
      drawSectionTitle(doc, cur, 'TARIFICATION DÉTAILLÉE', design);
      drawTable(doc, cur, design,
        [
          { label: 'Classe',        width: 16 },
          { label: 'Devise',        width: 12 },
          { label: 'Taux',          width: 14 },
          { label: 'PU Cie Billet', width: 22 },
          { label: 'PU Cie Serv.',  width: 22 },
          { label: 'PU Cli Billet', width: 22 },
          { label: 'PU Cli Serv.',  width: 22 },
          { label: 'Commission',    width: 22 },
          { label: 'Total Cli Ar',  width: 22, align: 'right' },
        ],
        lignes.map(l => [
          l.classe ?? '—',
          l.devise ?? '—',
          fmt.number(l.tauxEchange ?? 0, 0),
          fmt.number(l.puBilletCompagnieDevise ?? 0),
          fmt.number(l.puServiceCompagnieDevise ?? 0),
          fmt.number(l.montantBilletClientDevise ?? 0),
          fmt.number(l.montantServiceClientDevise ?? 0),
          `${fmt.number(l.commissionEnDevise ?? 0)} ${l.devise ?? ''}`,
          fmt.ariary(l.montantBilletClientAriary + l.montantServiceClientAriary),
        ]),
      );

      // Direction : tableau récap compagnie vs client
      drawSectionTitle(doc, cur, 'RÉCAPITULATIF COMPAGNIE vs CLIENT', design);
      drawTable(doc, cur, design,
        [
          { label: 'Ligne',         width: 28 },
          { label: 'Mt Cie Billet', width: 30 },
          { label: 'Mt Cie Serv.',  width: 30 },
          { label: 'Mt Cli Billet', width: 30 },
          { label: 'Mt Cli Serv.',  width: 30 },
          { label: 'Marge Ar',      width: 26, align: 'right' },
        ],
        lignes.map(l => {
          const margeBillet  = (l.montantBilletClientAriary  ?? 0) - (l.montantBilletCompagnieAriary  ?? 0);
          const margeService = (l.montantServiceClientAriary ?? 0) - (l.montantServiceCompagnieAriary ?? 0);
          return [
            l.numeroDosRef ?? '—',
            fmt.ariary(l.montantBilletCompagnieAriary ?? 0),
            fmt.ariary(l.montantServiceCompagnieAriary ?? 0),
            fmt.ariary(l.montantBilletClientAriary ?? 0),
            fmt.ariary(l.montantServiceClientAriary ?? 0),
            fmt.ariary(margeBillet + margeService),
          ];
        }),
      );

      // Direction : total commission
      const totalCommission = lignes.reduce((sum, l) => sum + (l.commissionEnAriary ?? 0), 0);
      const totalMarge = lignes.reduce((sum, l) => {
        const margeBillet  = (l.montantBilletClientAriary  ?? 0) - (l.montantBilletCompagnieAriary  ?? 0);
        const margeService = (l.montantServiceClientAriary ?? 0) - (l.montantServiceCompagnieAriary ?? 0);
        return sum + margeBillet + margeService;
      }, 0);

      drawSectionTitle(doc, cur, 'SYNTHÈSE FINANCIÈRE', design);
      drawKeyValues(doc, cur, [
        { label: 'Total commission',   value: fmt.ariary(totalCommission) },
        { label: 'Marge totale',       value: fmt.ariary(totalMarge) },
        { label: 'Total facturation',  value: fmt.ariary(devis.totalGeneral) },
      ]);
      drawSeparator(doc, cur);

    } else {
      // Client : tableau simple sans les colonnes compagnie ni commission
      drawSectionTitle(doc, cur, 'CONDITIONS TARIFAIRES', design);
      drawTable(doc, cur, design,
        [
          { label: 'Classe',      width: 20 },
          { label: 'Type',        width: 16 },
          { label: 'Nb',          width: 10 },
          { label: 'Devise',      width: 14 },
          { label: 'Taux',        width: 16 },
          { label: 'PU Billet',   width: 22 },
          { label: 'PU Service',  width: 22 },
          { label: 'Mt Billet Ar',width: 28, align: 'right' },
          { label: 'Mt Serv. Ar', width: 26, align: 'right' },
        ],
        lignes.map(l => [
          l.classe ?? '—',
          l.typePassager ?? '—',
          String(l.nombre ?? 1),
          l.devise ?? '—',
          fmt.number(l.tauxEchange ?? 0, 0),
          fmt.number(l.puBilletCompagnieDevise ?? 0),
          fmt.number(l.puServiceCompagnieDevise ?? 0),
          fmt.ariary(l.montantBilletClientAriary ?? 0),
          fmt.ariary(l.montantServiceClientAriary ?? 0),
        ]),
      );
    }
  }

  // ── Services (client uniquement) ─────────────────────────────────
  // La direction voit déjà tout dans les tableaux tarifaires
  if (!isDirection) {
    const services = lignes[0]?.serviceProspectionLigne ?? [];
    if (services.length > 0) {
      drawSectionTitle(doc, cur, 'SERVICES', design);
      checkPage(doc, cur, 24, design);
      const colW = CONTENT_W / Math.min(services.length, 9);
      doc.setFontSize(7.5);
      services.forEach((s, i) => {
        const cx = MARGIN + i * colW;
        const isOui = s.valeur === 'true';
        const valDisplay = s.valeur === 'true' ? 'Oui'
          : s.valeur === 'false' ? 'Non'
          : s.valeur;
        doc.setFont('helvetica', 'normal');
        setColor(doc, [90, 90, 90], 'text');
        doc.text(s.serviceSpecifique?.libelle ?? '—', cx, cur.y);
        setColor(doc, isOui ? [34, 130, 84] : s.valeur === 'false' ? [180, 30, 30] : [80, 80, 180], 'text');
        doc.setFont('helvetica', 'bold');
        doc.text(valDisplay, cx, cur.y + 7);
      });
      cur.move(18);
      drawSeparator(doc, cur);
    }
  }

  // ── Services direction (toutes les lignes, format tableau) ────────
  if (isDirection) {
    const allServices = lignes.flatMap(l =>
      (l.serviceProspectionLigne ?? []).map(s => ({
        ligne: l.numeroDosRef ?? '—',
        libelle: s.serviceSpecifique?.libelle ?? '—',
        type: s.serviceSpecifique?.type ?? '—',
        valeur: s.valeur === 'true' ? 'Oui' : s.valeur === 'false' ? 'Non' : s.valeur,
      }))
    );
    if (allServices.length > 0) {
      drawSectionTitle(doc, cur, 'DÉTAIL DES SERVICES', design);
      drawTable(doc, cur, design,
        [
          { label: 'Ligne',   width: 30 },
          { label: 'Service', width: 60 },
          { label: 'Type',    width: 40 },
          { label: 'Valeur',  width: 44 },
        ],
        allServices.map(s => [s.ligne, s.libelle, s.type, s.valeur]),
      );
    }
  }

  // ── Exigences (client uniquement) ────────────────────────────────
  if (!isDirection && exigences.length > 0) {
    drawSectionTitle(doc, cur, 'EXIGENCES DE VOYAGE', design);
    doc.setFontSize(7.5);
    exigences.forEach(e => {
      checkPage(doc, cur, 7, design);
      doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30], 'text');
      doc.text(e.type, MARGIN, cur.y);
      doc.setFont('helvetica', 'normal'); setColor(doc, [60, 60, 60], 'text');
      doc.text(e.description, MARGIN + 42, cur.y);
      doc.text(e.perimetre, MARGIN + 120, cur.y);
      cur.move(7);
    });
    cur.move(6);
  }

  // ── Footer ────────────────────────────────────────────────────────
  const totalLabel = isDirection ? 'TOTAL FACTURATION :' : 'TOTAL GÉNÉRAL :';
  const note = isDirection
    ? `Document confidentiel — Usage interne uniquement — ${fmt.date(new Date().toISOString())}`
    : `Réf. ${devis.reference} — ${fmt.replace_(devis.statut)} — Généré le ${fmt.date(new Date().toISOString())}`;

  drawFooter(doc, cur, totalLabel, fmt.ariary(devis.totalGeneral), note, design, stamp);

  if (options?.returnDoc) return doc;
  doc.save(filename ?? `${devis.reference}${isDirection ? '_direction' : ''}.pdf`);
}