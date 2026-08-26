import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const HomePage = lazy(() => import("../pages/front_office/HomePage"));
const DossierCommunForm = lazy(() => import("../pages/front_office/dossiers-communs/module.dossier.commun/DossierCommunForm"));
const DossierCommunDetail = lazy(() => import("../pages/front_office/dossiers-communs/module.dossier.commun/DossierCommunDetail"));
const DossierCommunManage = lazy(() => import("../pages/front_office/dossiers-communs/module.dossier.commun/DossierCommunManage"));

const ToDoList = lazy(() => import("../pages/front_office/dossiers-communs/todolist/ToDoList"));
const Prospection = lazy(() => import("../pages/front_office/dossiers-communs/module.ticketing/prospection/Prospection"));
// import ParametreTicketing from "../pages/front_office/dossiers-communs/module.ticketing/ticketing.sous.module/ParamétreTicketing";
const Devis = lazy(() => import("../pages/front_office/dossiers-communs/module.ticketing/ticketing.sous.module/Devis"));
const Billet = lazy(() => import("../pages/front_office/dossiers-communs/module.ticketing/ticketing.sous.module/Billet"));
const ParametreView = lazy(() => import("../pages/front_office/dossiers-communs/module.ticketing/ticketing.sous.module/SousMenuPrestation/ParametreView"));
const PageView = lazy(() => import("../pages/front_office/dossiers-communs/module.ticketing/ticketing.sous.module/SousMenuPrestation/PageView"));
const DossierCommun = lazy(() => import("../pages/front_office/dossiers-communs/module.dossier.commun/DossierCommun"));
const Attestation = lazy(() => import("../pages/front_office/dossiers-communs/module.attestation.voyage/Attestation"));
const PageViewAttestation = lazy(() => import("../pages/front_office/dossiers-communs/module.attestation.voyage/SousMenuPrestation/PageView"));
const DetailAttestation = lazy(() => import("../pages/front_office/dossiers-communs/module.attestation.voyage/SousMenuPrestation/DetailAttestation"));
const Parametre = lazy(() => import("../pages/front_office/dossiers-communs/module.parametre/Parametre"));
const NotificationsPage = lazy(() => import("../pages/front_office/dossiers-communs/module.parametre/sections/Notifications"));
const HomePageHotel = lazy(() => import("../pages/front_office/dossiers-communs/module.hotel/HomePage.hotel"));
const PageViewHotel = lazy(() => import("../pages/front_office/dossiers-communs/module.hotel/sous.section/PageViewHotel"));
const ParametreViewHotel = lazy(() => import("../pages/front_office/dossiers-communs/module.hotel/sous.section/ParametreViewHotel"));
const ListeDossierByModule = lazy(() => import("../pages/front_office/dossiers-communs/ListeDossierByModule"));
const BenchmarkingDetailPage = lazy(() => import("../pages/front_office/dossiers-communs/module.hotel/sous.section/sous.section.page/BenchmarkingDetailPage"));
const HotelReservationDetail = lazy(() => import("../pages/front_office/dossiers-communs/module.hotel/sous.section/sous.section.page/HotelReservationDetail"));
const PageHotelDevis = lazy(() => import("../pages/front_office/dossiers-communs/module.hotel/sous.section/sous.section.page/PageHotelDevis"));
const HomePageTicketing = lazy(() => import("../pages/front_office/dossiers-communs/module.ticketing/ticketing"));
const HomePageVisa = lazy(() => import("../pages/front_office/dossiers-communs/module.visa/HomePage.visa"));
const ParametreViewVisa = lazy(() => import("../pages/front_office/dossiers-communs/module.visa/sous.section/ParametreViewVisa"));
const PageViewVisa = lazy(() => import("../pages/front_office/dossiers-communs/module.visa/sous.section/PageViewVisa"));
const PageDetailProspection = lazy(() => import("../pages/front_office/dossiers-communs/module.visa/sous.section/sous.section.page/PageDetailProspection"));
const PageDetailVisa = lazy(() => import("../pages/front_office/dossiers-communs/module.visa/sous.section/sous.section.page/PageDetailVisa"));
const HomePageAssurance = lazy(() => import("../pages/front_office/dossiers-communs/module.assurance/HomePage.assurance"));
const ParametreViewAssurance = lazy(() => import("../pages/front_office/dossiers-communs/module.assurance/sous.section/ParametreViewAssurance"));
const PageViewAssurance = lazy(() => import("../pages/front_office/dossiers-communs/module.assurance/sous.section/PageViewAssurance"));
const PageDetailPassager = lazy(() => import("../pages/front_office/dossiers-communs/module.visa/sous.section/sous.section.page/PageDetailPassager"));
const PageDetailProspectionAssurance = lazy(() => import("../pages/front_office/dossiers-communs/module.assurance/sous.section/sous.section.page/PageDetailProspectionAssurance"));
const PageDetailAssurance = lazy(() => import("../pages/front_office/dossiers-communs/module.assurance/sous.section/sous.section.page/PageDetailAssurance"));
const PageDetailPassagerAssurance = lazy(() => import("../pages/front_office/dossiers-communs/module.assurance/sous.section/sous.section.page/PageDetailPassagerAssurance"));
const HomePageBaseDonnee = lazy(() => import("../pages/front_office/dossiers-communs/module.base.donnee/HomePageBaseDonnee"));
const PageDetailClient = lazy(() => import("../pages/front_office/dossiers-communs/module.base.donnee/sous.section/PageDetailClient"));
const SpecificationClient = lazy(() => import("../pages/front_office/dossiers-communs/module.dossier.commun/specification.client/specificationClient"));
// import PageFormulairePassager from "../pages/front_office/dossiers-communs/module.visa/sous.section/sous.section.page/PageFormulairePassager";
const ParametrePdf = lazy(() => import("../pages/front_office/dossiers-communs/module.pdf/Parametre.pdf"));
const ParametreCommentaire = lazy(() => import("../pages/front_office/dossiers-communs/module.commentaire/Parametre.commentaire"));
const ParametreUtilisateur = lazy(() => import("../pages/front_office/dossiers-communs/module.utilisateur/Parametre.utilisateur"));
// import PageFormulairePassagerAssurance from "../pages/front_office/dossiers-communs/module.assurance/components/PageFormulairePassagerAssurance";
const ClientInfoPage = lazy(() => import("../pages/front_office/dossiers-communs/module.portail.client/ClientInfoPage"));
const PageSAV = lazy(() => import("../pages/front_office/dossiers-communs/module.sav/PageSAV"));
const ColorSettingsPage = lazy(() => import("../pages/front_office/dossiers-communs/module.theme/ColorSettingsPage"));
const PageAnniversaire = lazy(() => import("../pages/front_office/dossiers-communs/module.anniversaire/PageAnniversaire"));
const PageListePassage = lazy(() => import("../pages/front_office/dossiers-communs/module.liste.passage/PageListePassage"));
const PageMilesCompagnie = lazy(() => import("../pages/front_office/dossiers-communs/module.miles.compagnie/PageMilesCompagnie"));
const AllClientBeneficiairePage = lazy(() => import("../pages/front_office/dossiers-communs/module.client.beneficiaire/PageAllClientBeneficiaire"));
const PageProfilage = lazy(() => import("../pages/front_office/dossiers-communs/module.profilage/PageProfilage"));
const PageBaseConnaissance = lazy(() => import("../pages/front_office/dossiers-communs/module.base.connaissance/PageBaseConnaissance"));
const PagePassport = lazy(() => import("../pages/front_office/dossiers-communs/module.passport/PagePassport"));
const ClientBeneficiaireInfosForm = lazy(() => import("../pages/parametres/client.beneficaire/ClientBeneficiaireInfosForm"));
const PageControle = lazy(() => import("../pages/front_office/dossiers-communs/module.controle/PageControle"));
const PageResultatStats = lazy(() => import("../pages/front_office/dossiers-communs/module.resultat.stats/PageResultatStats"));
const PageTableauBord = lazy(() => import("../pages/front_office/dossiers-communs/module.tableau.bord/PageTableauBord"));
const PageEtatVente = lazy(() => import("../pages/front_office/dossiers-communs/module.etat.vente/PageEtatVente"));
const PageResultatStatDossierCommun = lazy(() => import("../pages/front_office/dossiers-communs/module.resultat.stats/PageResultatStatDossierCommun"));
const AccueilView = lazy(() => import("../pages/front_office/dossiers-communs/module.tableau.bord/AccueilView"));

export function frontOfficeRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="dossiers-communs" element={<DossierCommun />} />
      <Route path="dossiers-communs/liste-by-module/:module" element={<ListeDossierByModule />} />
      <Route path="dossiers-communs/todolist" element={<ToDoList />} />
      <Route path="dossiers-communs/specification-client/:id" element={<SpecificationClient />} />

      <Route path="dossiers-communs/client-beneficiaire/:id/infos" element={<ClientBeneficiaireInfosForm />} />

      <Route path="dossiers-communs/parametrePdf" element={<ParametrePdf />} />
      <Route path="dossiers-communs/parametreCommentaire" element={<ParametreCommentaire />} />
      <Route path="dossiers-communs/parametreUtilisateur" element={<ParametreUtilisateur />} />

      <Route path="dossiers-communs/pageResultatStatDossierCommun" element={<PageResultatStatDossierCommun />} />
      <Route path="/dashboard/stats/:numDosCommun" element={<PageResultatStats />} />
      <Route path="dossiers-communs/pageTableauBord" element={<PageTableauBord />} />
      <Route path="dossiers-communs/pageEtatVente" element={<PageEtatVente />} />

      <Route path="dossiers-communs/pageAnniversaire" element={<PageAnniversaire />} />
      <Route path="dossiers-communs/pageListePassage" element={<PageListePassage />} />
      <Route path="dossiers-communs/pageMilesCompagnie" element={<PageMilesCompagnie />} />
      <Route path="dossiers-communs/AllClientBeneficiairePage" element={<AllClientBeneficiairePage />} />
      <Route path="dossiers-communs/pageProfilage" element={<PageProfilage />} />

      {/* <Route path="dossiers-communs/ticketing/list" element={<TicketingPage />} /> */}
      <Route path="dossiers-communs/nouveau" element={<DossierCommunForm />} />
      {/* Plus de route imbriquée pour prestation */}
      <Route path="dossiers-communs/dossier-detail" element={<DossierCommunDetail />} />
      <Route path="dossiers-communs/:id/gerer" element={<DossierCommunManage />} />

      <Route path="dossiers-communs/pageSAV" element={<PageSAV />} />

      <Route path="/dossiers-communs/couleurs" element={<ColorSettingsPage />} />

      <Route path="/dossiers-communs/base-connaissance" element={<PageBaseConnaissance />} />

      <Route path="/dossiers-communs/pagePassport" element={<PagePassport />} />

      <Route path="/dossiers-communs/pageControle" element={<PageControle />} />

      <Route path="dossiers-communs/ticketing" element={<HomePageTicketing />}>
        {/* Les routes enfants s'affichent à l'endroit où tu mettrais <Outlet /> dans PrestationDetail */}
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView module="ticketing"/>} />
        <Route path="parametres/:module" element={<ParametreView />} />
        <Route path="pages">
          <Route index element={<PageView />} />
          <Route path="prospection/:enteteId" element={<Prospection />} />
          <Route path="devis/:enteteId" element={<Devis />} />
          {/* Maintenant Billet est un enfant de PrestationDetail -> Pages */}
          <Route path="billet/:enteteId" element={<Billet />} />
        </Route>
      </Route>

      {/* <Route path="dossiers-communs/:prestationId/prospection/:enteteId" element={<Prospection />} /> */}
      {/* <Route path="dossiers-communs/ticketing/parametres" element={<ParametreTicketing />} /> */}
      <Route path="dossiers-communs/attestation" element={<Attestation />} >
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView module="attestation"/>} />
        <Route path="parametres/:module" element={<ParametreView />} />
        <Route path="pages" element={<PageViewAttestation />} />
        <Route path="details" element={<DetailAttestation />} />
      </Route>

      <Route path="dossiers-communs/parametre" element={<Parametre />} />
      <Route path="dossiers-communs/notifications" element={<NotificationsPage />} />
      <Route path="dossiers-communs/hotel" element={<HomePageHotel />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView module="hotel"/>} />
        <Route path="parametres" element={<ParametreViewHotel />} />
        <Route path="pages" element={<PageViewHotel />} />
        <Route path="details" element={<BenchmarkingDetailPage />} />
        <Route path="detailsHotel/:enteteId" element={<HotelReservationDetail />} />
        <Route path="devishotel/:enteteId" element={<PageHotelDevis />} />
      </Route>

      <Route path="dossiers-communs/visa" element={<HomePageVisa />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView module="visa"/>} />
        <Route path="parametres" element={<ParametreViewVisa />} />
        <Route path="pages" element={<PageViewVisa />} />
        <Route path="details/:enteteId" element={<PageDetailProspection />} />
        <Route path="visa-detail/:visaEnteteId" element={<PageDetailVisa />} />
        <Route path="passager/:passagerId" element={<PageDetailPassager />} />
        {/* <Route path="formulaire-passager/:passagerId" element={<PageFormulairePassager />} /> */}
        <Route path="client-info/:userId" element={<ClientInfoPage />} />
      </Route>

      <Route path="dossiers-communs/assurance" element={<HomePageAssurance />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView module="assurance"/>} />
        <Route path="parametres" element={<ParametreViewAssurance />} />
        <Route path="pages" element={<PageViewAssurance />} />
        <Route path="detailsProspection/:enteteId" element={<PageDetailProspectionAssurance />} />
        <Route path="detailsAssurance/:ligneId" element={<PageDetailAssurance />} />
        <Route path="passager/:passagerId" element={<PageDetailPassagerAssurance />} />
        {/* <Route path="formulaire-passager/:passagerId" element={<PageFormulairePassagerAssurance />} /> */}
        <Route path="client-info/:userId" element={<ClientInfoPage />} />
      </Route>

      <Route path="dossiers-communs/base-donnee" element={<HomePageBaseDonnee />}/>
      <Route path="dossiers-communs/base-donnee/details/:clientId" element={<PageDetailClient />} />

    </>
  );
}
