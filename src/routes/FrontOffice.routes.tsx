import { Navigate, Route } from "react-router-dom";
import HomePage from "../pages/front_office/HomePage";
import DossierCommunForm from "../pages/front_office/dossiers-communs/DossierCommunForm";
import DossierCommunDetail from "../pages/front_office/dossiers-communs/DossierCommunDetail";
import DossierCommunManage from "../pages/front_office/dossiers-communs/DossierCommunManage";
import PrestationDetail from "../pages/front_office/dossiers-communs/PrestationDetail";
import ToDoList from "../pages/front_office/dossiers-communs/todolist/ToDoList";
import Prospection from "../pages/front_office/dossiers-communs/prospection/Prospection";
import ParametreTicketing from "../pages/front_office/dossiers-communs/ticketing.sous.module/ParamétreTicketing";
import Devis from "../pages/front_office/dossiers-communs/ticketing.sous.module/Devis";
import Billet from "../pages/front_office/dossiers-communs/ticketing.sous.module/Billet";
import AccueilView from "../pages/front_office/dossiers-communs/ticketing.sous.module/SousMenuPrestation/AccueilView";
import ParametreView from "../pages/front_office/dossiers-communs/ticketing.sous.module/SousMenuPrestation/ParametreView";
import PageView from "../pages/front_office/dossiers-communs/ticketing.sous.module/SousMenuPrestation/PageView";
import DossierCommun from "../pages/front_office/dossiers-communs/module.dossier.commun/DossierCommun";
import TicketingPage from "../pages/front_office/dossiers-communs/module.ticketing/ticketing";
import Attestation from "../pages/front_office/dossiers-communs/module.attestation.voyage/Attestation";
import AttestationListPage from "../pages/front_office/dossiers-communs/module.attestation.voyage/PageAttestationList";
import PageViewAttestation from "../pages/front_office/dossiers-communs/module.attestation.voyage/SousMenuPrestation/PageView";
import DetailAttestation from "../pages/front_office/dossiers-communs/module.attestation.voyage/SousMenuPrestation/DetailAttestation";
import Parametre from "../pages/front_office/dossiers-communs/module.parametre/Parametre";
import HomePageHotel from "../pages/front_office/dossiers-communs/module.hotel/HomePage.hotel";
import PageViewHotel from "../pages/front_office/dossiers-communs/module.hotel/sous.section/PageViewHotel";
import ParametreViewHotel from "../pages/front_office/dossiers-communs/module.hotel/sous.section/ParametreViewHotel";
import AccueilViewHotel from "../pages/front_office/dossiers-communs/module.hotel/sous.section/AccueilViewHotel";

export function frontOfficeRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="dossiers-communs" element={<DossierCommun />} />
      <Route path="dossiers-communs/todolist" element={<ToDoList />} />
      <Route path="dossiers-communs/ticketing/list" element={<TicketingPage />} />
      <Route path="dossiers-communs/nouveau" element={<DossierCommunForm />} />
      {/* Plus de route imbriquée pour prestation */}
      <Route path="dossiers-communs/dossier-detail" element={<DossierCommunDetail />} />
      <Route path="dossiers-communs/:id/gerer" element={<DossierCommunManage />} />
      <Route path="dossiers-communs/:prestationId" element={<PrestationDetail />}>
        {/* Les routes enfants s'affichent à l'endroit où tu mettrais <Outlet /> dans PrestationDetail */}
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView />} />
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
      <Route path="dossiers-communs/ticketing/parametres" element={<ParametreTicketing />} />
      <Route path="dossiers-communs/attestation" element={<Attestation />} >
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView />} />
        <Route path="parametres/:module" element={<ParametreView />} />
        <Route path="pages" element={<PageViewAttestation />} />
        <Route path="details" element={<DetailAttestation />} />
      </Route>
      <Route path="dossiers-communs/attestation/list" element={<AttestationListPage />} />
      <Route path="dossiers-communs/parametre" element={<Parametre />} />
      <Route path="dossiers-communs/hotel" element={<HomePageHotel />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilViewHotel />} />
        <Route path="parametres" element={<ParametreViewHotel />} />
        <Route path="pages" element={<PageViewHotel />} />
      </Route>
    </>
  );
}