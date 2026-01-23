import { Route } from "react-router-dom";
import HomePage from "../pages/front_office/HomePage";
import DossierCommunForm from "../pages/front_office/dossiers-communs/DossierCommunForm";
import DossierCommunDetail from "../pages/front_office/dossiers-communs/DossierCommunDetail";
import DossierCommunManage from "../pages/front_office/dossiers-communs/DossierCommunManage";
import PrestationDetail from "../pages/front_office/dossiers-communs/PrestationDetail";
import ToDoList from "../pages/front_office/dossiers-communs/todolist/ToDoList";
import Prospection from "../pages/front_office/dossiers-communs/prospection/Prospection";
import ParametreTicketing from "../pages/front_office/dossiers-communs/ticketing.sous.module/ParamétreTicketing";
import Devis from "../pages/front_office/dossiers-communs/ticketing.sous.module/Devis";

export function frontOfficeRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="dossiers-communs/nouveau" element={<DossierCommunForm />} />
      
      {/* Plus de route imbriquée pour prestation */}
      <Route path="dossiers-communs/:id" element={<DossierCommunDetail />} />
      <Route path="dossiers-communs/:id/gerer" element={<DossierCommunManage />} />
      <Route path="prestations/:prestationId" element={<PrestationDetail />} />
      <Route path="dossiers-communs/prestations/todolist" element={<ToDoList />} />
      <Route path="prestations/:prestationId/prospection/:enteteId" element={<Prospection />} />
      <Route path="dossiers-communs/ticketing/parametres" element={<ParametreTicketing />} />
      <Route path="dossiers-communs/ticketing/devis/:enteteId" element={<Devis />} />
    </>
  );
}