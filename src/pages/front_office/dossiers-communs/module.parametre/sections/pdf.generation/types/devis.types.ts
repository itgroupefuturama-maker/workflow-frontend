// ─── Type exact de votre API Devis ──────────────────────────────────
// ─── Type d'un item dans la LISTE des devis (/devis?enteteId=...) ────
// Structure différente du devis individuel !
export interface DevisListItem {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  totalGeneral: number;
  statut: string;
  url: string | null;
  urlPdfCom: string | null;
  prospectionEnteteId: string;
  rasionAnnulationId: string | null;
  data: {
    entete: {
      id: string;
      credit: string;
      typeVol: string;
      numeroEntete: string;
      commissionPropose: number;
      commissionAppliquer: number;
      fournisseur: {
        id: string;
        code: string;
        libelle: string;
        status: string;
        dateActivation: string;
        dateDesactivation: string | null;
      };
      prestation: {
        id: string;
        numeroDos: string;
        status: string;
      };
    };
    lignes: DevisLigne[];
    totalGeneral: number;
    exigencesVoyage: DevisExigence[];
  };
  prospectionEntete: {
    id: string;
    numeroEntete: string;
    credit: string;
    typeVol: string;
    commissionPropose: number;
    commissionAppliquer: number;
    fournisseur: {
      id: string;
      code: string;
      libelle: string;
      status: string;
      dateActivation: string;
      dateDesactivation: string | null;
    };
    prestation: {
      id: string;
      numeroDos: string;
      status: string;
    };
  };
  prospectionLigne: DevisLigne[];
}

// ─── Réponse de la LISTE ─────────────────────────────────────────────
export interface DevisListApiResponse {
  success: boolean;
  data: DevisListItem[];
}

// ─── Réponse d'un devis INDIVIDUEL (/devis/:id) ──────────────────────
export interface DevisApiResponse {
  success: boolean;
  data: DevisListItem; // même structure, juste un seul item
}

export interface DevisLigne {
  id: string;
  numeroDosRef: string;
  numeroVol: string;
  avion: string;
  itineraire: string;
  classe: string;
  typePassager: string;
  nombre: number;
  dateHeureDepart: string;
  dateHeureArrive: string;
  dureeVol: string;
  dureeEscale: string;
  conditionModif: string | null;
  conditionAnnul: string | null;
  devise: string;
  tauxEchange: number;
  puBilletCompagnieDevise: number;
  puServiceCompagnieDevise: number;
  puPenaliteCompagnieDevise: number;
  montantBilletCompagnieAriary: number;
  montantServiceCompagnieAriary: number;
  
  montantBilletClientAriary: number;
  montantServiceClientAriary: number;
  montantBilletClientDevise: number;
  montantServiceClientDevise: number;
  montantPenaliteClientAriary: number;
  montantPenaliteClientDevise: number;
  commissionEnDevise: number;
  commissionEnAriary: number;
  modePaiement: string;
  destinationVoyage: {
    ville: string;
    pays: {
      pays: string;
      paysVoyage: {
        exigenceVoyage: DevisExigence;
      }[];
    };
  };
  serviceProspectionLigne: {
    valeur: string;
    serviceSpecifique: {
      code: string;
      libelle: string;
      type: string | null;
      typeService: string;
    };
  }[];
}

export interface DevisExigence {
  id: string;
  type: string;
  description: string;
  perimetre: string;
}

