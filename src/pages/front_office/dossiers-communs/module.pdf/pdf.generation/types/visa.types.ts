// Types réexportés depuis le slice, source unique de vérité pour la forme
// des données de devis visa (évite la duplication avec visaDevisSlice.ts).
export type {
  VisaDevisDetail,
} from '../../../../../../app/front_office/parametre_visa/visaDevisSlice';

export type VisaProspectionLigne =
  import('../../../../../../app/front_office/parametre_visa/visaDevisSlice').VisaDevisDetail['visaProspectionLignes'][number];
