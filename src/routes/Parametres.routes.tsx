import { lazy } from "react";
import { Route } from "react-router-dom";

const Utilisateur = lazy(() => import("../pages/parametres/Utilisateur"));
const Profile = lazy(() => import("../pages/parametres/Profil"));
const Autorisation = lazy(() => import("../pages/parametres/Autorisation"));
const TypeTransaction = lazy(() => import("../pages/parametres/Type_transaction"));
const Transaction = lazy(() => import("../pages/parametres/Transaction"));
const Privilege = lazy(() => import("../pages/parametres/Privilege"));
const Module = lazy(() => import("../pages/parametres/Module"));
const Commission = lazy(() => import("../pages/parametres/Commission"));
const Numerotation = lazy(() => import("../pages/parametres/Numerotation"));
const Modele = lazy(() => import("../pages/parametres/Modele"));
const Miles = lazy(() => import("../pages/parametres/Miles"));
const Piece = lazy(() => import("../pages/parametres/Piece"));
const ClientBeneficiaire = lazy(() => import("../pages/parametres/Client.Beneficiaire"));
const ClientFacture = lazy(() => import("../pages/parametres/Client.Facture"));
const DevisTransaction = lazy(() => import("../pages/parametres/Devis.Transaction"));
const ClientFactureForm = lazy(() => import("../pages/parametres/client.facture/ClientFactureForm"));
const Categorie = lazy(() => import("../pages/parametres/Categorie"));
const Article = lazy(() => import("../pages/parametres/Article"));
const ClientBeneficiaireForm = lazy(() => import("../pages/parametres/client.beneficaire/ClientBeneficiaireForm"));
const ClientBeneficiaireInfosForm = lazy(() => import("../pages/parametres/client.beneficaire/ClientBeneficiaireInfosForm"));
const Fournisseur = lazy(() => import("../pages/parametres/Fournisseur"));
const ProfilFormPage = lazy(() => import("../pages/parametres/profil.user/ProfilForm"));

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
