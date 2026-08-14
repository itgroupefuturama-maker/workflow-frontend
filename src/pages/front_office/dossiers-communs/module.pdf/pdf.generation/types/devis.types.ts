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
  // Non garantis par devisSlice.Devis (non lus par le générateur PDF ; prospectionLigne
  // est de toute façon utilisé avec repli sur data.lignes, voir devis.generator.ts) :
  rasionAnnulationId?: string | null;
  data: {
    entete: {
      id: string;
      credit: string;
      typeVol: string;
      numeroEntete: string;
      // Selon la source, l'API sérialise ces deux champs en number ou en string
      // (devisSlice.Entete les type en string, devisSlice.Devis.prospectionEntete en number) ;
      // seulement affichés (interpolés dans un template string), jamais utilisés en arithmétique :
      commissionPropose: number | string;
      commissionAppliquer: number | string;
      fournisseur: {
        id: string;
        code: string;
        libelle: string;
        // Non garantis par devisSlice.Entete.fournisseur (non lus par le générateur PDF) :
        status?: string;
        dateActivation?: string;
        dateDesactivation?: string | null;
      };
      prestation: {
        id: string;
        numeroDos: string;
        status: string;
      };
    };
    lignes: DevisLigne[];
    totalGeneral: number;
    // Non garanti par devisSlice.Devis.data (déjà lu avec repli `?? []` dans devis.generator.ts) :
    exigencesVoyage?: DevisExigence[];
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
      // Non garantis par devisSlice.Devis.prospectionEntete.fournisseur (non lus par le générateur PDF) :
      status?: string;
      dateActivation?: string;
      dateDesactivation?: string | null;
    };
    prestation: {
      id: string;
      numeroDos: string;
      status: string;
    };
  };
  prospectionLigne?: DevisLigne[];
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
  // Nullable en pratique (cf. devisSlice.Ligne) ; toujours lus avec repli dans devis.generator.ts :
  avion: string | null;
  itineraire: string | null;
  classe: string;
  typePassager: string;
  nombre: number;
  dateHeureDepart: string;
  dateHeureArrive: string | null;
  dureeVol: string | null;
  dureeEscale: string | null;
  aeroportDepart: string | null;
  aeroportArrivee: string | null;
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
  // Non garantis par devisSlice.Ligne (toujours lus avec chaînage optionnel + repli
  // dans devis.generator.ts, ex. l.destinationVoyage?.pays?.pays ?? l.destinationVoyage?.ville ?? '-') :
  modePaiement?: string;
  destinationVoyage?: {
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
    // Optionnel (cf. devisSlice.ServiceProspectionLigne) ; toujours lu avec `?.` dans devis.generator.ts :
    serviceSpecifique?: {
      code: string;
      libelle: string;
      type: string | null;
      // Non garanti par devisSlice.ServiceSpecifique (non lu par le générateur PDF) :
      typeService?: string;
    };
  }[];
}

export interface DevisExigence {
  id: string;
  type: string;
  description: string;
  perimetre: string;
}

