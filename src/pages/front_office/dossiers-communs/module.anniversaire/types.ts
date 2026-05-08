export interface MessageParam {
  id: string;
  messageAnnif: string;
  messageCadeau: string;
  status: 'ACTIF' | 'INACTIF';
  createdAt: string;
  updatedAt: string;
}

export interface CadeauParam {
  id: string;
  milesSup: number;
  milesInf: number;
  cadeau: string;
  proposition: string;
  status: 'ACTIF' | 'INACTIF';
  createdAt: string;
  updatedAt: string;
}

export type MessageParamPayload = Pick<MessageParam, 'messageAnnif' | 'messageCadeau'>;
export type CadeauParamPayload  = Pick<CadeauParam,  'milesSup' | 'milesInf' | 'cadeau' | 'proposition'>;

export interface ClientBeneficiaireInfo {
  id: string;
  nom: string;
  prenom: string;
  nationalite: string;
  document: string;
  referenceDoc: string;
  typeDoc: string;
  dateDelivranceDoc: string;
  dateValiditeDoc: string;
  dateNaissance: string;
  clientType: string | null;
  whatsapp: string | null;
  tel: string;
  clientbeneficiaireId: string;
  clientBeneficiaireFormId: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBeneficiaire {
  id: string;
  code: string;
  libelle: string;
  statut: string;
  dateApplication: string;
  dateCreation: string;
  updatedAt: string;
  typeClient: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  clientbeneficiaireInfo: ClientBeneficiaireInfo[];
}

export interface AnnivClient {
  id: string;
  date: string;
  statusMessageAnnif: 'ACHEVE' | 'EN_ATTENTE' | 'ECHOUE' | string;
  statusMessageCadeau: 'ACHEVE' | 'EN_ATTENTE' | 'ECHOUE' | string;
  messageAnnif: string;
  messageCadeau: string;
  dateEnvoiMessage: string;
  dateEnvoiCadeau: string;
  cadeauId: string;
  clientBeneficiaireId: string;
  createdAt: string;
  updatedAt: string;
  clientBeneficiaire: ClientBeneficiaire;
  cadeau: CadeauParam;
  soldeMiles: number;
}

export type TabId = 'clients' | 'params';