import { Route } from "react-router-dom";
import Utilisateur from "../pages/parametres/Utilisateur";
import Profile from "../pages/parametres/Profil";
import Autorisation from "../pages/parametres/Autorisation";
import TypeTransaction from "../pages/parametres/Type_transaction";
import Transaction from "../pages/parametres/Transaction";
import Privilege from "../pages/parametres/Privilege";
import Module from "../pages/parametres/Module";
import Commission from "../pages/parametres/Commission";
import Numerotation from "../pages/parametres/Numerotation";
import Modele from "../pages/parametres/Modele";
import Miles from "../pages/parametres/Miles";
import Piece from "../pages/parametres/Piece";
import ClientBeneficiaire from "../pages/parametres/Client.Beneficiaire";
import ClientFacture from "../pages/parametres/Client.Facture";
import DevisTransaction from "../pages/parametres/Devis.Transaction";
import ClientFactureForm from "../pages/parametres/client.facture/ClientFactureForm";
import Categorie from "../pages/parametres/Categorie";
import Article from "../pages/parametres/Article";
import ClientBeneficiaireForm from "../pages/parametres/client.beneficaire/ClientBeneficiaireForm";
import ClientBeneficiaireInfosForm from "../pages/parametres/client.beneficaire/ClientBeneficiaireInfosForm";
import Fournisseur from "../pages/parametres/Fournisseur";
import ProfilFormPage from "../pages/parametres/profil.user/ProfilForm";

export function parametresRoutes() {
  return [
    <Route key="privilege" path="privilege" element={<Privilege />} />,
    <Route key="utilisateur" path="utilisateur" element={<Utilisateur />} />,
    <Route key="profil" path="profil" element={<Profile />} />,
    <Route key="autorisation" path="autorisation" element={<Autorisation />} />,
    <Route key="type-transaction" path="type-transaction" element={<TypeTransaction />} />,
    <Route key="transaction" path="transaction" element={<Transaction />} />,
    <Route key="module" path="module" element={<Module />} />,
    <Route key="commission" path="commission" element={<Commission />} />,
    <Route key="numerotation" path="numerotation" element={<Numerotation />} />,
    <Route key="modele" path="modele" element={<Modele />} />,
    <Route key="miles" path="miles" element={<Miles />} />,
    <Route key="piece" path="piece" element={<Piece />} />,

    // Liste Client Bénéficiaire (une seule fois !)
    <Route key="client-beneficiaire-list" path="client-beneficiaire" element={<ClientBeneficiaire />} />,

    // Édition + infos complémentaires (nested)
    <Route key="client-beneficiaire-edit" path="client-beneficiaire/:id" element={<ClientBeneficiaireForm />} />,
    <Route key="client-beneficiaire-infos" path="client-beneficiaire/:id/infos" element={<ClientBeneficiaireInfosForm />} />,

    <Route key="client-facture-list" path="client-facture" element={<ClientFacture />} />,
    <Route key="client-facture-nouveau" path="client-facture/nouveau" element={<ClientFactureForm />} />,
    <Route key="client-facture-edit" path="client-facture/:id" element={<ClientFactureForm />} />,

    <Route key="devis-transaction" path="devis-transaction" element={<DevisTransaction />} />,
    <Route key="categorie" path="categorie" element={<Categorie />} />,
    <Route key="article" path="article" element={<Article />} />,
    <Route key="fournisseur" path="fournisseur" element={<Fournisseur />} />,
    <Route key="profil-form" path="profil/:id" element={<ProfilFormPage />} />,
  ];
}