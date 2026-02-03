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

export function frontOfficeRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="dossiers-communs" element={<DossierCommun />} />
      <Route path="dossiers-communs/todolist" element={<ToDoList />} />
      <Route path="dossiers-communs/ticketing" element={<TicketingPage />} />
      <Route path="dossiers-communs/nouveau" element={<DossierCommunForm />} />
      {/* Plus de route imbriquée pour prestation */}
      <Route path="dossiers-communs/dossier-detail" element={<DossierCommunDetail />} />
      <Route path="dossiers-communs/:id/gerer" element={<DossierCommunManage />} />
      <Route path="dossiers-communs/:prestationId" element={<PrestationDetail />}>
        {/* Les routes enfants s'affichent à l'endroit où tu mettrais <Outlet /> dans PrestationDetail */}
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<AccueilView />} />
        <Route path="parametres" element={<ParametreView />} />
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
      {/* <Route path="dossiers-communs/ticketing/devis/:enteteId" element={<Devis />} /> */}
      {/* <Route path="dossiers-communs/ticketing/billet/:enteteId" element={<Billet />} /> */}
    </>
  );
}